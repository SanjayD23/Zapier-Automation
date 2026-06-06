"""
BharatFlow — whatsapp_sender.py
================================
Meta WhatsApp Cloud API delivery module.

Responsibilities:
  - Send text messages via Meta Cloud API
  - Send rich template messages (e.g., job alerts, digest)
  - Retry logic with exponential back-off
  - Rate limiting (250 conversations / 24h on standard tier)
  - Quiet-hours enforcement
  - Delivery status logging to BharatFlow.db

Environment variables required (set in .env):
  WHATSAPP_ACCESS_TOKEN   — Meta system user / page access token
  WHATSAPP_PHONE_NUMBER_ID — Phone number ID from Meta Business Suite
  WHATSAPP_API_VERSION    — e.g. "v19.0"  (default: v19.0)

Author : Sanjay (Member 3 — Frontend + WhatsApp)
"""

import os
import time
import logging
import requests
from datetime import datetime, time as dt_time
from typing import Optional

# ── try loading .env if python-dotenv is installed ──────────────────────────
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # .env variables must be set in the OS environment manually

# ── Optional DB integration ──────────────────────────────────────────────────
try:
    from database import log_whatsapp_delivery
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] WhatsAppSender — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────
ACCESS_TOKEN      = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
PHONE_NUMBER_ID   = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
API_VERSION       = os.getenv("WHATSAPP_API_VERSION", "v19.0")
BASE_URL          = f"https://graph.facebook.com/{API_VERSION}/{PHONE_NUMBER_ID}/messages"

HEADERS = {
    "Authorization": f"Bearer {ACCESS_TOKEN}",
    "Content-Type":  "application/json",
}

# Delivery windows — quiet hours (no notifications)
QUIET_START = dt_time(22, 0)   # 10:00 PM
QUIET_END   = dt_time(7,  0)   # 07:00 AM

# Retry config
MAX_RETRIES   = 3
RETRY_BACKOFF = 2   # seconds (doubles each retry)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def _is_quiet_hours() -> bool:
    """Return True if the current local time falls within quiet hours."""
    now = datetime.now().time()
    if QUIET_START <= QUIET_END:
        return QUIET_START <= now < QUIET_END
    # Midnight-crossing range (e.g. 22:00 → 07:00)
    return now >= QUIET_START or now < QUIET_END


def _normalize_phone(phone: str) -> str:
    """
    Ensure phone number is in E.164 format.
    Accepts: '9876543210', '+919876543210', '919876543210'
    Returns: '919876543210'  (no leading '+', Meta Cloud API style)
    """
    phone = phone.strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    if len(phone) == 10:          # bare Indian number
        phone = "91" + phone
    return phone


def _post_with_retry(payload: dict) -> Optional[dict]:
    """
    POST to Meta Cloud API with exponential back-off retry.
    Returns the response JSON on success, None on terminal failure.
    """
    delay = RETRY_BACKOFF
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = requests.post(BASE_URL, headers=HEADERS, json=payload, timeout=10)
            if resp.status_code == 200:
                return resp.json()

            # 429 = rate-limited, back-off harder
            if resp.status_code == 429:
                wait = delay * 3
                logger.warning("Rate-limited by Meta API. Waiting %ds before retry %d/%d.",
                               wait, attempt, MAX_RETRIES)
                time.sleep(wait)
            else:
                logger.error("Meta API error %d on attempt %d/%d: %s",
                             resp.status_code, attempt, MAX_RETRIES, resp.text)

        except requests.exceptions.Timeout:
            logger.warning("Request timed out (attempt %d/%d).", attempt, MAX_RETRIES)
        except requests.exceptions.ConnectionError as e:
            logger.error("Connection error (attempt %d/%d): %s", attempt, MAX_RETRIES, e)

        if attempt < MAX_RETRIES:
            logger.info("Retrying in %ds…", delay)
            time.sleep(delay)
            delay *= 2

    logger.error("All %d retry attempts exhausted.", MAX_RETRIES)
    return None


def _log_delivery(to: str, message_type: str, content: str, status: str, message_id: str = ""):
    """Persist delivery record to BharatFlow.db if the DB module is available."""
    if DB_AVAILABLE:
        try:
            log_whatsapp_delivery(
                recipient=to,
                message_type=message_type,
                content=content,
                status=status,
                message_id=message_id,
                timestamp=datetime.utcnow().isoformat(),
            )
        except Exception as e:
            logger.warning("DB log failed: %s", e)


# ─────────────────────────────────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────────────────────────────────
def send_text_message(
    to: str,
    body: str,
    *,
    respect_quiet_hours: bool = True,
    preview_url: bool = False,
) -> dict:
    """
    Send a plain-text WhatsApp message via Meta Cloud API.

    Args:
        to                  : Recipient phone number (any format; see _normalize_phone).
        body                : Message text (max 4096 chars).
        respect_quiet_hours : If True, skip delivery during quiet hours.
        preview_url         : Whether to show URL preview in the message.

    Returns:
        dict with keys:
            success  (bool)
            message_id (str | None)
            error    (str | None)
    """
    if not ACCESS_TOKEN or not PHONE_NUMBER_ID:
        err = "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID env vars."
        logger.error(err)
        return {"success": False, "message_id": None, "error": err}

    to = _normalize_phone(to)

    if respect_quiet_hours and _is_quiet_hours():
        msg = f"Quiet hours active — message to +{to} queued for later."
        logger.info(msg)
        _log_delivery(to, "text", body, "queued")
        return {"success": False, "message_id": None, "error": msg}

    if len(body) > 4096:
        body = body[:4093] + "…"

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type":    "individual",
        "to":                to,
        "type":              "text",
        "text": {
            "body":        body,
            "preview_url": preview_url,
        },
    }

    logger.info("Sending text message to +%s …", to)
    result = _post_with_retry(payload)

    if result and result.get("messages"):
        msg_id = result["messages"][0].get("id", "")
        logger.info("✅ Delivered — ID: %s", msg_id)
        _log_delivery(to, "text", body, "sent", msg_id)
        return {"success": True, "message_id": msg_id, "error": None}

    _log_delivery(to, "text", body, "failed")
    return {"success": False, "message_id": None, "error": "Delivery failed after retries."}


def send_job_alert(
    to: str,
    job_title: str,
    company: str,
    location: str,
    url: str,
    *,
    respect_quiet_hours: bool = True,
) -> dict:
    """
    Send a formatted job alert message.
    Falls back to a rich text message since custom templates need approval.
    """
    body = (
        f"🔔 *BharatFlow Job Alert*\n\n"
        f"💼 *{job_title}*\n"
        f"🏢 {company}\n"
        f"📍 {location}\n\n"
        f"🔗 Apply here:\n{url}\n\n"
        f"_Delivered by BharatFlow — your AI notification filter_"
    )
    return send_text_message(to, body, respect_quiet_hours=respect_quiet_hours, preview_url=True)


def send_digest(
    to: str,
    items: list[dict],
    *,
    period: str = "Today",
    respect_quiet_hours: bool = True,
) -> dict:
    """
    Send a daily/hourly digest of filtered notifications.

    Args:
        to      : Recipient phone number.
        items   : List of dicts with keys: title, source, url (optional).
        period  : Label for the digest period, e.g. "Today", "Last hour".

    Returns:
        Same dict as send_text_message.
    """
    if not items:
        logger.info("No digest items to send to +%s", to)
        return {"success": False, "message_id": None, "error": "Empty digest"}

    lines = [f"📋 *BharatFlow Digest — {period}*\n"]
    for i, item in enumerate(items[:10], 1):   # cap at 10 items
        title  = item.get("title", "Untitled")
        source = item.get("source", "")
        url    = item.get("url", "")
        line   = f"{i}. {title}"
        if source:
            line += f" _{source}_"
        if url:
            line += f"\n   🔗 {url}"
        lines.append(line)

    if len(items) > 10:
        lines.append(f"\n…and {len(items) - 10} more items.")

    lines.append("\n_Tap a link to read more. Filtered & delivered by BharatFlow._")
    body = "\n".join(lines)

    return send_text_message(to, body, respect_quiet_hours=respect_quiet_hours)


def send_system_alert(
    to: str,
    service: str,
    metric: str,
    value: str,
    severity: str = "WARNING",
    *,
    respect_quiet_hours: bool = False,  # system alerts bypass quiet hours
) -> dict:
    """
    Send a server / monitoring alert. Bypasses quiet hours by default.
    """
    severity_emoji = {"CRITICAL": "🔴", "WARNING": "🟠", "INFO": "🔵"}.get(severity.upper(), "⚠️")
    body = (
        f"{severity_emoji} *BharatFlow Monitor — {severity}*\n\n"
        f"🖥️ Service : {service}\n"
        f"📊 Metric  : {metric}\n"
        f"📈 Value   : {value}\n"
        f"🕐 Time    : {datetime.now().strftime('%d %b %Y, %I:%M %p IST')}\n\n"
        f"_Action may be required. Check your dashboard._"
    )
    return send_text_message(to, body, respect_quiet_hours=respect_quiet_hours)


def send_github_alert(
    to: str,
    event: str,
    repo: str,
    details: str,
    url: str = "",
    *,
    respect_quiet_hours: bool = True,
) -> dict:
    """
    Send a GitHub event notification (PR, issue, merge, etc.).
    """
    body = (
        f"🐙 *GitHub — {event}*\n\n"
        f"📁 Repo   : {repo}\n"
        f"📝 {details}\n"
    )
    if url:
        body += f"\n🔗 {url}"
    body += "\n\n_Delivered by BharatFlow_"
    return send_text_message(to, body, respect_quiet_hours=respect_quiet_hours, preview_url=bool(url))


def send_test_message(to: str) -> dict:
    """
    Send a simple test message to verify the WhatsApp connection.
    Ignores quiet hours.
    """
    body = (
        "✅ *BharatFlow — Test Message*\n\n"
        "🎉 Your WhatsApp is successfully connected to BharatFlow!\n\n"
        "You'll receive filtered notifications here going forward.\n"
        f"_Sent at {datetime.now().strftime('%I:%M %p, %d %b %Y')}_"
    )
    return send_text_message(to, body, respect_quiet_hours=False)


# ─────────────────────────────────────────────────────────────────────────────
# BATCH SENDER  (for digest / bulk delivery)
# ─────────────────────────────────────────────────────────────────────────────
def batch_send(messages: list[dict], delay_seconds: float = 0.5) -> list[dict]:
    """
    Send multiple messages with a configurable inter-message delay to avoid
    hitting Meta's rate limits.

    Each dict in `messages` must have:
        to   (str)
        body (str)
        type (str): "text" | "job" | "digest" | "system" | "github"
        [other kwargs depending on type]

    Returns:
        List of result dicts from individual send functions.
    """
    results = []
    for msg in messages:
        msg_type = msg.pop("type", "text")
        to       = msg.pop("to", "")

        try:
            if msg_type == "text":
                res = send_text_message(to, msg.get("body", ""), **{k: v for k, v in msg.items() if k != "body"})
            elif msg_type == "job":
                res = send_job_alert(to, **msg)
            elif msg_type == "digest":
                res = send_digest(to, **msg)
            elif msg_type == "system":
                res = send_system_alert(to, **msg)
            elif msg_type == "github":
                res = send_github_alert(to, **msg)
            else:
                res = {"success": False, "message_id": None, "error": f"Unknown type: {msg_type}"}
        except Exception as e:
            logger.exception("Unexpected error sending to %s: %s", to, e)
            res = {"success": False, "message_id": None, "error": str(e)}

        results.append({"to": to, "type": msg_type, **res})

        if delay_seconds > 0:
            time.sleep(delay_seconds)

    return results


# ─────────────────────────────────────────────────────────────────────────────
# CLI / QUICK TEST
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    # Usage:  python whatsapp_sender.py <phone_number>
    phone = sys.argv[1] if len(sys.argv) > 1 else input("Enter test phone (+91xxxxxxxxxx): ")

    print("\n🚀 BharatFlow WhatsApp Sender — Quick Test\n" + "─" * 45)
    print(f"Recipient : {phone}")
    print(f"API URL   : {BASE_URL}")
    print(f"Token set : {'✅' if ACCESS_TOKEN else '❌ (missing!)'}")
    print("─" * 45)

    if not ACCESS_TOKEN:
        print("\n⚠️  WHATSAPP_ACCESS_TOKEN not set in .env — cannot send message.")
        sys.exit(1)

    result = send_test_message(phone)
    print(f"\nResult: {result}")

    if result["success"]:
        print("✅ Message delivered successfully!")
    else:
        print(f"❌ Delivery failed: {result['error']}")

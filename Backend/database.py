import sqlite3
from datetime import datetime

DB_PATH = "bharatflow.db"


def get_connection():
    # Opens a connection to the SQLite database file
    # row_factory = sqlite3.Row allows accessing columns by name instead of index
    # PRAGMA foreign_keys = ON enforces foreign key constraints
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


# ─── CREATE ALL TABLES ────────────────────────────────────────────────────────

def create_tables():
    # Creates all 6 tables in the database if they don't already exist
    # Safe to run multiple times — won't overwrite existing data
    # Should be called once when the app starts up for the first time
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            name                TEXT NOT NULL,
            email               TEXT UNIQUE NOT NULL,
            whatsapp_number     TEXT NOT NULL,
            location            TEXT,
            profile_type        TEXT CHECK(profile_type IN ('student','professional','both')),
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS user_goals (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER NOT NULL,
            goal_type           TEXT CHECK(goal_type IN ('job_hunt','price_watch','insurance','mass_hiring','health_alert')),
            description         TEXT,
            is_active           INTEGER DEFAULT 1,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            deactivated_at      DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS filters (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER NOT NULL,
            source              TEXT,
            from_domain         TEXT,
            subject_keyword     TEXT,
            body_keyword        TEXT,
            location            TEXT,
            min_salary          INTEGER,
            max_salary          INTEGER,
            is_active           INTEGER DEFAULT 1,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS watchlist (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER NOT NULL,
            product_name        TEXT NOT NULL,
            platform            TEXT CHECK(platform IN ('amazon','flipkart','meesho')),
            product_url         TEXT,
            target_price        INTEGER,
            current_price       INTEGER,
            is_active           INTEGER DEFAULT 1,
            last_checked        DATETIME,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS gmail_tokens (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER UNIQUE NOT NULL,
            access_token        TEXT NOT NULL,
            refresh_token       TEXT NOT NULL,
            token_expiry        DATETIME,
            pubsub_topic        TEXT,
            watch_expiry        DATETIME,
            created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS notification_log (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id             INTEGER NOT NULL,
            source              TEXT,
            original_subject    TEXT,
            summary             TEXT,
            whatsapp_status     TEXT CHECK(whatsapp_status IN ('sent','failed','pending')),
            is_duplicate        INTEGER DEFAULT 0,
            sent_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)

    conn.commit()
    conn.close()
    print("All tables created successfully.")


# ─── USERS ────────────────────────────────────────────────────────────────────

def insert_user(name, email, whatsapp_number, location, profile_type):
    # Inserts a new user into the users table when they sign up
    # email must be unique — if same email signs up twice, it prints a warning and skips
    # profile_type must be one of: 'student', 'professional', 'both'
    # whatsapp_number should include country code e.g. +919876543210
    conn = get_connection()
    try:
        conn.execute("""
            INSERT INTO users (name, email, whatsapp_number, location, profile_type)
            VALUES (?, ?, ?, ?, ?)
        """, (name, email, whatsapp_number, location, profile_type))
        conn.commit()
        print(f"User {name} inserted.")
    except sqlite3.IntegrityError:
        print(f"User with email {email} already exists.")
    finally:
        conn.close()


def get_user_by_email(email):
    # Fetches a single user record by their Gmail address
    # Used when a Gmail push notification arrives — we look up who owns that email
    # Returns a dictionary with all user columns, or None if not found
    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()
    conn.close()
    return dict(user) if user else None


def get_user_by_id(user_id):
    # Fetches a single user record by their internal database ID
    # Used when we already have the user_id and need their WhatsApp number or location
    # Returns a dictionary with all user columns, or None if not found
    conn = get_connection()
    user = conn.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return dict(user) if user else None


# ─── USER GOALS ───────────────────────────────────────────────────────────────

def insert_goal(user_id, goal_type, description=""):
    # Adds a new life goal for a user during onboarding or when they update their profile
    # goal_type must be one of: 'job_hunt', 'price_watch', 'insurance', 'mass_hiring', 'health_alert'
    # description is optional — e.g. "Looking for job in Kolkata under 8LPA"
    # is_active defaults to 1 — goal is active immediately after creation
    conn = get_connection()
    conn.execute("""
        INSERT INTO user_goals (user_id, goal_type, description)
        VALUES (?, ?, ?)
    """, (user_id, goal_type, description))
    conn.commit()
    conn.close()
    print(f"Goal '{goal_type}' added for user {user_id}.")


def get_active_goals(user_id):
    # Fetches all currently active goals for a user
    # Used by the relevance engine to check what the user currently cares about
    # Returns a list of goal dictionaries — empty list if user has no active goals
    conn = get_connection()
    goals = conn.execute("""
        SELECT * FROM user_goals
        WHERE user_id = ? AND is_active = 1
    """, (user_id,)).fetchall()
    conn.close()
    return [dict(g) for g in goals]


def deactivate_goal(goal_id):
    # Marks a goal as completed/inactive when the user no longer needs it
    # e.g. user found a job → call this to stop sending job alerts
    # Sets is_active = 0 and records the exact time it was deactivated
    # Does NOT delete the record — keeps history for future reference
    conn = get_connection()
    conn.execute("""
        UPDATE user_goals
        SET is_active = 0, deactivated_at = ?
        WHERE id = ?
    """, (datetime.now(), goal_id))
    conn.commit()
    conn.close()
    print(f"Goal {goal_id} deactivated.")


# ─── FILTERS ─────────────────────────────────────────────────────────────────

def insert_filter(user_id, source=None, from_domain=None, subject_keyword=None,
                  body_keyword=None, location=None, min_salary=None, max_salary=None):
    # Adds a new email filter rule for a user
    # All fields are optional — only fill what's relevant for that filter
    # e.g. for a job filter: from_domain='naukri.com', subject_keyword='offer', location='Kolkata'
    # e.g. for a price filter: source='amazon', subject_keyword='price drop'
    # filter_engine.py reads these rules to decide if an incoming email matches
    conn = get_connection()
    conn.execute("""
        INSERT INTO filters
        (user_id, source, from_domain, subject_keyword, body_keyword, location, min_salary, max_salary)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, source, from_domain, subject_keyword, body_keyword, location, min_salary, max_salary))
    conn.commit()
    conn.close()
    print(f"Filter added for user {user_id}.")


def get_filters_by_user(user_id):
    # Fetches all active filter rules for a specific user
    # Called by filter_engine.py when a new email arrives to check for matches
    # Returns a list of filter dictionaries — empty list if user has no filters
    conn = get_connection()
    filters = conn.execute("""
        SELECT * FROM filters
        WHERE user_id = ? AND is_active = 1
    """, (user_id,)).fetchall()
    conn.close()
    return [dict(f) for f in filters]


def deactivate_filter(filter_id):
    # Pauses a specific filter rule without deleting it
    # Used when user removes a filter from their dashboard
    # Sets is_active = 0 so filter_engine.py ignores it
    conn = get_connection()
    conn.execute(
        "UPDATE filters SET is_active = 0 WHERE id = ?", (filter_id,)
    )
    conn.commit()
    conn.close()


# ─── WATCHLIST ────────────────────────────────────────────────────────────────

def insert_watchlist(user_id, product_name, platform, product_url, target_price):
    # Adds a product to the user's price watchlist
    # BharatFlow will monitor this product and alert via WhatsApp when price drops to target_price
    # platform must be one of: 'amazon', 'flipkart', 'meesho'
    # current_price starts as NULL — gets updated when scraper first checks the price
    conn = get_connection()
    conn.execute("""
        INSERT INTO watchlist (user_id, product_name, platform, product_url, target_price)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, product_name, platform, product_url, target_price))
    conn.commit()
    conn.close()
    print(f"Watchlist item '{product_name}' added for user {user_id}.")


def get_active_watchlist(user_id):
    # Fetches all products the user is currently watching
    # Used by the price scraper to know which products to check periodically
    # Returns a list of watchlist dictionaries — empty list if nothing in watchlist
    conn = get_connection()
    items = conn.execute("""
        SELECT * FROM watchlist
        WHERE user_id = ? AND is_active = 1
    """, (user_id,)).fetchall()
    conn.close()
    return [dict(i) for i in items]


def update_current_price(watchlist_id, current_price):
    # Updates the last known price for a watchlist item after scraper checks it
    # Also records the exact time it was last checked in last_checked column
    # Called every time the scraper runs — keeps price history fresh
    conn = get_connection()
    conn.execute("""
        UPDATE watchlist
        SET current_price = ?, last_checked = ?
        WHERE id = ?
    """, (current_price, datetime.now(), watchlist_id))
    conn.commit()
    conn.close()


def deactivate_watchlist_item(watchlist_id):
    # Removes a product from active watching — called when user buys it or manually removes it
    # Sets is_active = 0 so scraper stops checking this product
    # Does NOT delete the record — keeps purchase history
    conn = get_connection()
    conn.execute(
        "UPDATE watchlist SET is_active = 0 WHERE id = ?", (watchlist_id,)
    )
    conn.commit()
    conn.close()


# ─── GMAIL TOKENS ─────────────────────────────────────────────────────────────

def save_gmail_token(user_id, access_token, refresh_token, token_expiry,
                     pubsub_topic=None, watch_expiry=None):
    # Saves or updates Gmail OAuth tokens for a user after they connect their Gmail account
    # access_token expires every hour — refresh_token is used to get a new one automatically
    # pubsub_topic is the Google Pub/Sub topic name assigned to this user's inbox watcher
    # watch_expiry is when the Gmail inbox watch expires — needs renewal every 7 days
    # ON CONFLICT means if token already exists for this user, it updates instead of inserting
    conn = get_connection()
    conn.execute("""
        INSERT INTO gmail_tokens
        (user_id, access_token, refresh_token, token_expiry, pubsub_topic, watch_expiry)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
            access_token  = excluded.access_token,
            refresh_token = excluded.refresh_token,
            token_expiry  = excluded.token_expiry,
            pubsub_topic  = excluded.pubsub_topic,
            watch_expiry  = excluded.watch_expiry
    """, (user_id, access_token, refresh_token, token_expiry, pubsub_topic, watch_expiry))
    conn.commit()
    conn.close()
    print(f"Gmail token saved for user {user_id}.")


def get_gmail_token(user_id):
    # Fetches the stored Gmail OAuth tokens for a user
    # Called by gmail_handler.py when it needs to make API calls on behalf of the user
    # Returns a dictionary with token details, or None if user hasn't connected Gmail yet
    conn = get_connection()
    token = conn.execute(
        "SELECT * FROM gmail_tokens WHERE user_id = ?", (user_id,)
    ).fetchone()
    conn.close()
    return dict(token) if token else None


# ─── NOTIFICATION LOG ─────────────────────────────────────────────────────────

def log_notification(user_id, source, original_subject, summary,
                     whatsapp_status="pending", is_duplicate=0):
    # Records every WhatsApp notification that was attempted or sent
    # Called immediately before sending — status starts as 'pending'
    # After WhatsApp API responds, update_notification_status() changes it to 'sent' or 'failed'
    # is_duplicate = 1 means this exact email was already sent before — helps prevent spam
    conn = get_connection()
    conn.execute("""
        INSERT INTO notification_log
        (user_id, source, original_subject, summary, whatsapp_status, is_duplicate)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, source, original_subject, summary, whatsapp_status, is_duplicate))
    conn.commit()
    conn.close()


def update_notification_status(log_id, status):
    # Updates the delivery status of a notification after WhatsApp API responds
    # status should be 'sent' if delivered successfully, 'failed' if Meta API returned an error
    # Called by whatsapp_sender.py after it gets a response from Meta Cloud API
    conn = get_connection()
    conn.execute(
        "UPDATE notification_log SET whatsapp_status = ? WHERE id = ?",
        (status, log_id)
    )
    conn.commit()
    conn.close()


def is_duplicate_notification(user_id, original_subject):
    # Checks if this exact email subject was already sent to this user before
    # Prevents sending the same job alert or price notification twice
    # Returns True if a matching sent notification exists, False otherwise
    # Called by the main pipeline before summarizing — skip if already sent
    conn = get_connection()
    result = conn.execute("""
        SELECT id FROM notification_log
        WHERE user_id = ? AND original_subject = ?
        AND whatsapp_status = 'sent'
    """, (user_id, original_subject)).fetchone()
    conn.close()
    return result is not None


def get_recent_notifications(user_id, limit=10):
    # Fetches the most recent notifications sent to a user
    # Used by the frontend dashboard to show notification history
    # limit defaults to 10 — returns last 10 notifications ordered by newest first
    conn = get_connection()
    logs = conn.execute("""
        SELECT * FROM notification_log
        WHERE user_id = ?
        ORDER BY sent_at DESC
        LIMIT ?
    """, (user_id, limit)).fetchall()
    conn.close()
    return [dict(l) for l in logs]


# ─── INIT ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Entry point — run this file directly to create the database and test all functions
    # Command: python database.py
    # This will create bharatflow.db in the current directory with all 6 tables
    create_tables()

    # Test insert
    insert_user(
        name="Rahul Das",
        email="rahul@gmail.com",
        whatsapp_number="+919876543210",
        location="Kolkata",
        profile_type="student"
    )

    insert_goal(1, "job_hunt", "Looking for job in Kolkata under 8LPA")
    insert_goal(1, "price_watch", "Waiting for boAt earphones price drop")

    insert_filter(
        user_id=1,
        source="gmail",
        from_domain="naukri.com",
        subject_keyword="offer letter",
        location="Kolkata",
        min_salary=400000,
        max_salary=800000
    )

    insert_watchlist(
        user_id=1,
        product_name="boAt Airdopes 141",
        platform="amazon",
        product_url="https://amazon.in/dp/example",
        target_price=999
    )

    print("\nUser:", get_user_by_email("rahul@gmail.com"))
    print("Goals:", get_active_goals(1))
    print("Filters:", get_filters_by_user(1))
    print("Watchlist:", get_active_watchlist(1))
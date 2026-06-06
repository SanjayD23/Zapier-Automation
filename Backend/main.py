from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import database

app = FastAPI(title="BharatFlow API")

# Allow Frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class SignupRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    phone: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class SyncRequest(BaseModel):
    user_id: int
    domains: List[str] # e.g. ["github", "ecommerce", "insurance", "jobs"]

# --- Endpoints ---

@app.post("/api/auth/signup")
def signup(req: SignupRequest):
    # In a real app, hash the password. For now, we rely on the database.py users table.
    name = f"{req.firstName} {req.lastName}"
    # The users table doesn't have a password column in our current schema, 
    # so we just insert the user.
    database.insert_user(
        name=name,
        email=req.email,
        whatsapp_number=req.phone,
        location="India", # Default
        profile_type="professional"
    )
    
    user = database.get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=400, detail="Email already exists or DB error.")
    
    return {"status": "success", "user_id": user["id"], "name": user["name"]}

@app.post("/api/auth/login")
def login(req: LoginRequest):
    user = database.get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    return {"status": "success", "user_id": user["id"], "name": user["name"]}

@app.post("/api/onboarding/sync-activity")
def sync_activity(req: SyncRequest):
    """
    This endpoint simulates connecting to Google Search/Activity.
    Based on the user's selected domains and simulated 'search history',
    it automatically generates personalized filters and watchlists.
    """
    user_id = req.user_id
    domains = req.domains
    
    # 1. Clear old goals (mocking a fresh sync)
    # We would ideally just deactivate, but for onboarding we just add new ones.
    
    generated_filters = []
    
    if "github" in domains:
        database.insert_goal(user_id, "job_hunt", "Track GitHub PRs and Commits")
        database.insert_filter(
            user_id=user_id,
            source="gmail",
            from_domain="github.com",
            subject_keyword="PR, Review, Merge, Issue",
        )
        generated_filters.append("GitHub PR & Issue Tracking")

    if "insurance" in domains:
        database.insert_goal(user_id, "insurance", "Track policy renewals and health alerts")
        database.insert_filter(
            user_id=user_id,
            source="gmail",
            subject_keyword="Policy, Renewal, Premium, Claim",
        )
        generated_filters.append("Insurance & Policy Renewals")

    if "ecommerce" in domains:
        database.insert_goal(user_id, "price_watch", "E-commerce price tracking")
        # Simulate tracking an item from search history
        database.insert_watchlist(
            user_id=user_id,
            product_name="Sony WH-1000XM5 Headphones", # Mocked from Google Search Activity
            platform="amazon",
            product_url="https://amazon.in/dp/sony-headphones",
            target_price=24999
        )
        generated_filters.append("E-Commerce Price Drops")

    if "jobs" in domains:
        database.insert_goal(user_id, "job_hunt", "Software Engineer Roles")
        database.insert_filter(
            user_id=user_id,
            source="gmail",
            from_domain="linkedin.com, naukri.com",
            subject_keyword="Offer, Interview, Shortlist",
        )
        generated_filters.append("SDE Job Alerts")

    return {
        "status": "success",
        "message": "AI successfully analyzed your Google Activity and built your profile.",
        "generated_filters": generated_filters
    }

@app.get("/api/user/{user_id}/dashboard")
def get_dashboard_data(user_id: int):
    """Fetch all user data for the dashboard"""
    user = database.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    goals = database.get_active_goals(user_id)
    filters = database.get_filters_by_user(user_id)
    watchlist = database.get_active_watchlist(user_id)
    notifications = database.get_recent_notifications(user_id, limit=20)
    
    return {
        "user": user,
        "goals": goals,
        "filters": filters,
        "watchlist": watchlist,
        "history": notifications
    }

if __name__ == "__main__":
    import uvicorn
    # Run server on port 8080
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)

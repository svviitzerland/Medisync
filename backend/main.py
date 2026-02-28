from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai, tickets

app = FastAPI(title="MediSync API - AI Hospital Orchestration")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "MediSync Backend is running"}


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "MediSync Backend is running"}


app.include_router(ai.router, prefix="/api/ai", tags=["AI"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
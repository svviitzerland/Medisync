from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ai, tickets, admin, patients

app = FastAPI(title="MediSync API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])

from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()


from dependencies import get_current_user
from fastapi import Depends

@router.get(
    "/stats",
    responses={
        200: {
            "description": "Hospital statistics summary",
            "content": {
                "application/json": {
                    "example": {
                        "patients": 128,
                        "doctors": 12,
                        "tickets": 345,
                        "revenue": 15750000,
                    }
                }
            },
        },
        400: {
            "description": "Error fetching stats",
            "content": {
                "application/json": {
                    "example": {"detail": "Database connection error"}
                }
            },
        },
    },
)
async def get_admin_stats(user: dict = Depends(get_current_user)):
    """
    Fetch hospital data summary for the Admin Dashboard
    """
    try:
        patients_res = (
            supabase.table("profiles")
            .select("id", count="exact")
            .eq("role", "patient")
            .execute()
        )
        doctors_res = supabase.table("doctors").select("id", count="exact").execute()
        tickets_res = supabase.table("tickets").select("id", count="exact").execute()
        revenue_res = (
            supabase.table("invoices")
            .select("medicine_fee,room_fee,doctor_fee")
            .execute()
        )

        total_revenue = 0
        if revenue_res.data:
            for inv in revenue_res.data:
                total_revenue += (
                    inv.get("medicine_fee", 0)
                    + inv.get("room_fee", 0)
                    + inv.get("doctor_fee", 0)
                )

        return {
            "patients": patients_res.count if hasattr(patients_res, "count") else 0,
            "doctors": doctors_res.count if hasattr(doctors_res, "count") else 0,
            "tickets": tickets_res.count if hasattr(tickets_res, "count") else 0,
            "revenue": total_revenue,
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, HTTPException
from database import supabase

router = APIRouter()

@router.get("/stats")
async def get_admin_stats():
    """
    Fetch hospital data summary for the Admin Dashboard
    """
    try:
        patients_res = supabase.table("profiles").select("id", count="exact").eq("role", "patient").execute()
        doctors_res = supabase.table("doctors").select("id", count="exact").execute()
        tickets_res = supabase.table("tickets").select("id", count="exact").execute()
        revenue_res = supabase.table("invoices").select("medicine_fee,room_fee,doctor_fee").execute()

        total_revenue = 0
        if revenue_res.data:
             for inv in revenue_res.data:
                 total_revenue += (inv.get("medicine_fee", 0) + inv.get("room_fee", 0) + inv.get("doctor_fee", 0))

        return {
            "patients": patients_res.count if hasattr(patients_res, 'count') else 0,
            "doctors": doctors_res.count if hasattr(doctors_res, 'count') else 0,
            "tickets": tickets_res.count if hasattr(tickets_res, 'count') else 0,
            "revenue": total_revenue
        }
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))

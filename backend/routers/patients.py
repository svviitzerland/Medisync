from fastapi import APIRouter, HTTPException, Body
from database import supabase

router = APIRouter()


@router.post("/register")
async def register_patient(
    nik: str = Body(...),
    name: str = Body(...),
    age: int = Body(...),
    phone: str = Body(...),
):
    """
    Register a new patient from the FO/Admin side.
    We use the Supabase Admin API to create user auth.
    """
    try:
        email = f"pasien_{nik}@medisync.local"
        password = f"Psn{nik}!"

        # 1. Create user in Supabase Auth via admin
        res = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "role": "patient",
                    "nik": nik,
                    "name": name,
                    "age": age,
                    "phone": phone,
                },
            }
        )

        user_id = res.user.id

        return {
            "status": "success",
            "message": "Patient registered successfully",
            "patient": {"id": user_id, "nik": nik, "name": name},
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

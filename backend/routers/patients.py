from fastapi import APIRouter, HTTPException, Body
from database import supabase

router = APIRouter()


from dependencies import get_current_user
from fastapi import Depends

@router.post(
    "/register",
    responses={
        200: {
            "description": "Patient registered successfully",
            "content": {
                "application/json": {
                    "example": {
                        "status": "success",
                        "message": "Patient registered successfully",
                        "patient": {
                            "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
                            "nik": "3201012345678901",
                            "name": "Budi Santoso",
                        },
                    }
                }
            },
        },
        400: {
            "description": "Registration failed",
            "content": {
                "application/json": {
                    "example": {"detail": "User with this NIK already exists"}
                }
            },
        },
    },
)
async def register_patient(
    nik: str = Body(..., examples=["3201012345678901"]),
    name: str = Body(..., examples=["Budi Santoso"]),
    age: int = Body(..., examples=[35]),
    phone: str = Body(..., examples=["081234567890"]),
    user: dict = Depends(get_current_user),
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

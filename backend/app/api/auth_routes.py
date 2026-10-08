"""
Authentication routes - register & login.
"""
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserRegister, UserLogin, Token, UserOut
from app.core.database import db
from app.core.auth import verify_password, create_access_token

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", response_model=UserOut)
async def register(user: UserRegister):
    # Check if username exists
    if db.get_user_by_username(user.username):
        raise HTTPException(status_code=400, detail="Username already exists")

    user_dict = user.model_dump()
    new_user = db.add_user(user_dict)

    return {k: v for k, v in new_user.items() if k != "password"}


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    db_user = db.get_user_by_username(user.username)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    token = create_access_token(data={"sub": db_user["username"], "role": db_user["role"]})
    return {"access_token": token, "token_type": "bearer"}

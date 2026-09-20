from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import schemas
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.deps import get_current_user
from app.models import Course, EventRegistration, User

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=schemas.TokenOut)
def login(data: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(func.lower(User.email) == data.email.strip().lower()))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Неверный email или пароль")
    user.last_active_at = datetime.now()
    db.commit()
    return schemas.TokenOut(access_token=create_access_token(user.id), user=user)


@router.get("/auth/me", response_model=schemas.UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.post("/registrations", response_model=schemas.RegistrationOut, status_code=201)
def register_for_event(data: schemas.RegistrationIn, db: Session = Depends(get_db)):
    """Публичная заявка на событие: доступна без авторизации."""
    registration = EventRegistration(**data.model_dump())
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


@router.get("/courses", response_model=list[schemas.CourseOut])
def courses(db: Session = Depends(get_db)):
    return db.scalars(select(Course).order_by(Course.id)).all()

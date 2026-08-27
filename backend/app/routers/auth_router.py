from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/auth", tags=["Auth"])

ROLE_MODEL_MAP = {
    "admin": models.Admin,
    "teacher": models.Teacher,
    "parent": models.Parent,
}


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    role = credentials.role.lower()
    model = ROLE_MODEL_MAP.get(role)
    if not model:
        raise HTTPException(status_code=400, detail="Invalid role. Use admin, teacher, or parent.")

    user = db.query(model).filter(model.email == credentials.email).first()
    if not user or not auth.verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    user_id = getattr(user, f"{role}_id")
    token = auth.create_access_token(data={"sub": str(user_id), "role": role, "email": user.email})

    return schemas.Token(access_token=token, role=role, user_id=user_id, name=user.name)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import Base, engine
from . import models
from .routers import auth_router, admin_router, teacher_router, parent_router, child_router

# Creates tables automatically if they don't exist yet.
# For production, prefer proper migrations (e.g. Alembic) instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smart Preschool Learning & Management System API",
    description="Backend API for Admin, Teacher, Parent and Child Learning modules",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(admin_router.router)
app.include_router(teacher_router.router)
app.include_router(parent_router.router)
app.include_router(child_router.router)


@app.get("/")
def root():
    return {"message": "Smart Preschool Learning & Management System API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}

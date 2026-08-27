"""
Run this once after setting up your MySQL database to create the first Admin
account, so you have a way to log in and start using the /api/admin endpoints
to create teachers, parents, students, and classrooms.

Usage:
    cd backend
    python seed_admin.py
"""
from app.database import SessionLocal, Base, engine
from app import models, auth

Base.metadata.create_all(bind=engine)

db = SessionLocal()

existing = db.query(models.Admin).filter(models.Admin.email == "admin@school.com").first()
if existing:
    print("Admin already exists:", existing.email)
else:
    admin = models.Admin(
        name="Super Admin",
        email="admin@school.com",
        password_hash=auth.hash_password("admin123"),
    )
    db.add(admin)
    db.commit()
    print("Admin created -> email: admin@school.com | password: admin123")
    print("Change this password after first login.")

db.close()

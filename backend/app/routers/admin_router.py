from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/admin", tags=["Admin"])
require_admin = auth.require_role("admin")


@router.get("/dashboard")
def dashboard_stats(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    total_students = db.query(func.count(models.Student.student_id)).scalar()
    total_teachers = db.query(func.count(models.Teacher.teacher_id)).scalar()
    today_attendance = (
        db.query(func.count(models.Attendance.attendance_id))
        .filter(models.Attendance.att_date == date.today(), models.Attendance.status == "present")
        .scalar()
    )
    pending_fees = (
        db.query(func.count(models.Fee.fee_id)).filter(models.Fee.status == "pending").scalar()
    )
    upcoming_events = (
        db.query(func.count(models.Event.event_id)).filter(models.Event.event_date >= date.today()).scalar()
    )

    return {
        "total_students": total_students,
        "total_teachers": total_teachers,
        "today_attendance": today_attendance,
        "pending_fees": pending_fees,
        "upcoming_events": upcoming_events,
    }


@router.post("/teachers", response_model=schemas.TeacherOut)
def create_teacher(payload: schemas.TeacherCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    teacher = models.Teacher(
        name=payload.name,
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        phone=payload.phone,
        class_id=payload.class_id,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return teacher


@router.get("/teachers", response_model=list[schemas.TeacherOut])
def list_teachers(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    return db.query(models.Teacher).all()


@router.post("/parents", response_model=schemas.ParentOut)
def create_parent(payload: schemas.ParentCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    parent = models.Parent(
        name=payload.name,
        email=payload.email,
        password_hash=auth.hash_password(payload.password),
        phone=payload.phone,
        address=payload.address,
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)
    return parent


@router.get("/parents", response_model=list[schemas.ParentOut])
def list_parents(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    return db.query(models.Parent).all()


@router.post("/classrooms", response_model=schemas.ClassroomOut)
def create_classroom(payload: schemas.ClassroomCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    classroom = models.Classroom(**payload.dict())
    db.add(classroom)
    db.commit()
    db.refresh(classroom)
    return classroom


@router.get("/classrooms", response_model=list[schemas.ClassroomOut])
def list_classrooms(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    return db.query(models.Classroom).all()


@router.post("/students", response_model=schemas.StudentOut)
def create_student(payload: schemas.StudentCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    student = models.Student(**payload.dict())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.get("/students", response_model=list[schemas.StudentOut])
def list_students(db: Session = Depends(get_db), current_user: dict = Depends(require_admin)):
    return db.query(models.Student).all()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/teacher", tags=["Teacher"])
require_teacher = auth.require_role("teacher")


@router.get("/students", response_model=list[schemas.StudentOut])
def my_class_students(db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    teacher_id = int(current_user["sub"])
    teacher = db.query(models.Teacher).filter(models.Teacher.teacher_id == teacher_id).first()
    if not teacher or not teacher.class_id:
        return []
    return db.query(models.Student).filter(models.Student.class_id == teacher.class_id).all()


@router.get("/my-class")
def my_class(db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    teacher_id = int(current_user["sub"])
    teacher = db.query(models.Teacher).filter(models.Teacher.teacher_id == teacher_id).first()
    if not teacher or not teacher.class_id:
        return None
    classroom = db.query(models.Classroom).filter(models.Classroom.class_id == teacher.class_id).first()
    if not classroom:
        return None
    return {"class_id": classroom.class_id, "class_name": classroom.class_name, "section": classroom.section}


@router.post("/attendance", response_model=schemas.AttendanceOut)
def mark_attendance(payload: schemas.AttendanceCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    teacher_id = int(current_user["sub"])
    _verify_teacher_owns_class(db, teacher_id, payload.class_id)

    # Upsert: re-marking the same student/date updates the existing row
    # instead of creating a duplicate.
    existing = (
        db.query(models.Attendance)
        .filter(
            models.Attendance.student_id == payload.student_id,
            models.Attendance.class_id == payload.class_id,
            models.Attendance.att_date == payload.att_date,
        )
        .first()
    )
    if existing:
        existing.status = payload.status
        existing.marked_by = teacher_id
        db.commit()
        db.refresh(existing)
        return existing

    record = models.Attendance(**payload.dict(), marked_by=teacher_id)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/attendance/{class_id}/{att_date}", response_model=list[schemas.AttendanceOut])
def get_attendance(class_id: int, att_date: str, db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    _verify_teacher_owns_class(db, int(current_user["sub"]), class_id)
    return (
        db.query(models.Attendance)
        .filter(models.Attendance.class_id == class_id, models.Attendance.att_date == att_date)
        .all()
    )


def _verify_teacher_owns_class(db: Session, teacher_id: int, class_id: int):
    teacher = db.query(models.Teacher).filter(models.Teacher.teacher_id == teacher_id).first()
    if not teacher or teacher.class_id != class_id:
        raise HTTPException(status_code=403, detail="You are not assigned to this class")


@router.post("/homework")
def upload_homework(payload: schemas.HomeworkCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    teacher_id = int(current_user["sub"])
    _verify_teacher_owns_class(db, teacher_id, payload.class_id)
    hw = models.Homework(
        title=payload.title, description=payload.description, due_date=payload.due_date,
        class_id=payload.class_id, teacher_id=teacher_id,
    )
    db.add(hw)
    db.commit()
    db.refresh(hw)
    return {"message": "Homework uploaded", "homework_id": hw.homework_id}


@router.get("/homework", response_model=list[schemas.HomeworkOut])
def list_homework(db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    teacher_id = int(current_user["sub"])
    return db.query(models.Homework).filter(models.Homework.teacher_id == teacher_id).order_by(models.Homework.due_date.desc()).all()


@router.post("/activity")
def upload_activity(payload: schemas.ActivityCreate, db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    teacher_id = int(current_user["sub"])
    _verify_teacher_owns_class(db, teacher_id, payload.class_id)
    activity = models.Activity(
        title=payload.title, description=payload.description, act_date=payload.act_date,
        class_id=payload.class_id, teacher_id=teacher_id, photo_url=payload.photo_url,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return {"message": "Activity uploaded", "activity_id": activity.activity_id}


@router.get("/activity", response_model=list[schemas.ActivityOut])
def list_activity(db: Session = Depends(get_db), current_user: dict = Depends(require_teacher)):
    teacher_id = int(current_user["sub"])
    return db.query(models.Activity).filter(models.Activity.teacher_id == teacher_id).order_by(models.Activity.act_date.desc()).all()

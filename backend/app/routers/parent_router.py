from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, schemas, auth
from ..database import get_db

router = APIRouter(prefix="/api/parent", tags=["Parent"])
require_parent = auth.require_role("parent")


@router.get("/children", response_model=list[schemas.StudentOut])
def my_children(db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    parent_id = int(current_user["sub"])
    return db.query(models.Student).filter(models.Student.parent_id == parent_id).all()


@router.get("/attendance/{student_id}", response_model=list[schemas.AttendanceOut])
def child_attendance(student_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    _verify_child_belongs_to_parent(db, student_id, int(current_user["sub"]))
    return db.query(models.Attendance).filter(models.Attendance.student_id == student_id).all()


@router.get("/fees/{student_id}", response_model=list[schemas.FeeOut])
def child_fees(student_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    _verify_child_belongs_to_parent(db, student_id, int(current_user["sub"]))
    return db.query(models.Fee).filter(models.Fee.student_id == student_id).all()


@router.get("/homework/{student_id}", response_model=list[schemas.HomeworkOut])
def child_homework(student_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    _verify_child_belongs_to_parent(db, student_id, int(current_user["sub"]))
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    return (
        db.query(models.Homework)
        .filter(models.Homework.class_id == student.class_id)
        .order_by(models.Homework.due_date.desc())
        .all()
    )


@router.get("/activities/{student_id}", response_model=list[schemas.ActivityOut])
def child_activities(student_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    _verify_child_belongs_to_parent(db, student_id, int(current_user["sub"]))
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    return (
        db.query(models.Activity)
        .filter(models.Activity.class_id == student.class_id)
        .order_by(models.Activity.act_date.desc())
        .all()
    )


@router.get("/notifications")
def my_notifications(db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    parent_id = int(current_user["sub"])
    notes = db.query(models.Notification).filter(models.Notification.parent_id == parent_id).all()
    return [
        {
            "notification_id": n.notification_id,
            "type": n.type,
            "message": n.message,
            "sent_date": n.sent_date,
            "is_read": n.is_read,
        }
        for n in notes
    ]


def _verify_child_belongs_to_parent(db: Session, student_id: int, parent_id: int):
    student = db.query(models.Student).filter(models.Student.student_id == student_id).first()
    if not student or student.parent_id != parent_id:
        raise HTTPException(status_code=403, detail="This student is not linked to your account")


# ---------- Child Mode: Parent PIN ----------
@router.post("/child-pin")
def set_child_pin(payload: schemas.SetChildPin, db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    """Set or update the 4-digit PIN used to exit Child Mode on a shared device."""
    if not (payload.pin.isdigit() and len(payload.pin) == 4):
        raise HTTPException(status_code=400, detail="PIN must be exactly 4 digits")

    parent_id = int(current_user["sub"])
    parent = db.query(models.Parent).filter(models.Parent.parent_id == parent_id).first()
    parent.child_pin_hash = auth.hash_password(payload.pin)
    db.commit()
    return {"message": "Child Mode PIN saved"}


@router.get("/child-pin/status")
def child_pin_status(db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    parent_id = int(current_user["sub"])
    parent = db.query(models.Parent).filter(models.Parent.parent_id == parent_id).first()
    return {"pin_set": bool(parent.child_pin_hash)}


# ---------- Parent Report ----------
@router.get("/report/{student_id}", response_model=schemas.ParentReport)
def get_report(student_id: int, db: Session = Depends(get_db), current_user: dict = Depends(require_parent)):
    _verify_child_belongs_to_parent(db, student_id, int(current_user["sub"]))

    total_minutes = (
        db.query(func.coalesce(func.sum(models.LearningSession.duration_minutes), 0))
        .filter(models.LearningSession.student_id == student_id)
        .scalar()
    )
    lessons_completed = (
        db.query(func.coalesce(func.sum(models.LearningProgress.completed_lessons), 0))
        .filter(models.LearningProgress.student_id == student_id)
        .scalar()
    )
    quizzes_attempted = (
        db.query(func.count(models.QuizResult.quiz_id))
        .filter(models.QuizResult.student_id == student_id)
        .scalar()
    )
    rewards_earned = (
        db.query(func.count(models.Reward.reward_id))
        .filter(models.Reward.student_id == student_id)
        .scalar()
    )
    recent_rewards = (
        db.query(models.Reward)
        .filter(models.Reward.student_id == student_id)
        .order_by(models.Reward.earned_date.desc())
        .limit(5)
        .all()
    )

    return schemas.ParentReport(
        student_id=student_id,
        total_minutes_learned=total_minutes,
        lessons_completed=lessons_completed,
        quizzes_attempted=quizzes_attempted,
        rewards_earned=rewards_earned,
        recent_rewards=recent_rewards,
    )

from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional


# ---------- Auth ----------
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    role: str  # admin / teacher / parent


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    name: str


# ---------- Admin ----------
class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class AdminOut(BaseModel):
    admin_id: int
    name: str
    email: EmailStr

    class Config:
        from_attributes = True


# ---------- Teacher ----------
class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    class_id: Optional[int] = None


class TeacherOut(BaseModel):
    teacher_id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    class_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Parent ----------
class ParentCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None


class ParentOut(BaseModel):
    parent_id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Student ----------
class StudentCreate(BaseModel):
    name: str
    dob: Optional[date] = None
    gender: Optional[str] = None
    parent_id: Optional[int] = None
    class_id: Optional[int] = None
    admission_date: Optional[date] = None


class StudentOut(BaseModel):
    student_id: int
    name: str
    parent_id: Optional[int] = None
    class_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Classroom ----------
class ClassroomCreate(BaseModel):
    class_name: str
    section: Optional[str] = None
    teacher_id: Optional[int] = None


class ClassroomOut(BaseModel):
    class_id: int
    class_name: str
    section: Optional[str] = None
    teacher_id: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Attendance ----------
class AttendanceCreate(BaseModel):
    student_id: int
    class_id: int
    att_date: date
    status: str


class AttendanceOut(AttendanceCreate):
    attendance_id: int
    marked_by: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Fee ----------
class FeeOut(BaseModel):
    fee_id: int
    student_id: int
    amount: float
    due_date: Optional[date] = None
    status: str

    class Config:
        from_attributes = True


# ---------- Child Mode: Parent PIN ----------
class SetChildPin(BaseModel):
    pin: str  # 4-digit string, e.g. "4821"


class VerifyChildPin(BaseModel):
    student_id: int
    pin: str


class VerifyChildPinResponse(BaseModel):
    valid: bool


# ---------- Child Mode: Learning Sessions ----------
class SessionStart(BaseModel):
    student_id: int


class SessionStartResponse(BaseModel):
    session_id: int
    start_time: datetime


class SessionEnd(BaseModel):
    session_id: int
    focus_breaks: int = 0


class SessionEndResponse(BaseModel):
    session_id: int
    duration_minutes: int
    reward_earned: Optional[str] = None


class FocusBreakPing(BaseModel):
    session_id: int


# ---------- Rewards ----------
class RewardOut(BaseModel):
    reward_id: int
    reward_type: str
    reward_name: str
    source: str
    earned_date: datetime

    class Config:
        from_attributes = True


# ---------- Parent Report ----------
class ParentReport(BaseModel):
    student_id: int
    total_minutes_learned: int
    lessons_completed: int
    quizzes_attempted: int
    rewards_earned: int
    recent_rewards: list[RewardOut]


# ---------- Homework ----------
class HomeworkCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: date
    class_id: int


class HomeworkOut(BaseModel):
    homework_id: int
    title: str
    description: Optional[str] = None
    due_date: date
    class_id: int

    class Config:
        from_attributes = True


# ---------- Activity ----------
class ActivityCreate(BaseModel):
    title: str
    description: Optional[str] = None
    act_date: date
    class_id: int
    photo_url: Optional[str] = None


class ActivityOut(BaseModel):
    activity_id: int
    title: str
    description: Optional[str] = None
    act_date: date
    class_id: int
    photo_url: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- AI Learning Buddy ----------
class AIChatRequest(BaseModel):
    student_id: Optional[int] = None
    parent_id: Optional[int] = None
    user_type: str  # child / parent
    message: str


class AIChatResponse(BaseModel):
    reply: str

from sqlalchemy import (
    Column, Integer, String, Date, DateTime, Boolean, DECIMAL, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Admin(Base):
    __tablename__ = "admins"

    admin_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="admin")


class Teacher(Base):
    __tablename__ = "teachers"

    teacher_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20))
    class_id = Column(Integer, ForeignKey("classrooms.class_id"), nullable=True)

    classroom = relationship("Classroom", back_populates="teacher", foreign_keys=[class_id])


class Parent(Base):
    __tablename__ = "parents"

    parent_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    phone = Column(String(20))
    address = Column(String(255))
    # 4-digit PIN (hashed) used to exit Child Mode on a shared device
    child_pin_hash = Column(String(255), nullable=True)

    students = relationship("Student", back_populates="parent")


class Classroom(Base):
    __tablename__ = "classrooms"

    class_id = Column(Integer, primary_key=True, index=True)
    class_name = Column(String(100), nullable=False)
    section = Column(String(20))
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"), nullable=True)

    teacher = relationship("Teacher", back_populates="classroom", foreign_keys=[Teacher.class_id])
    students = relationship("Student", back_populates="classroom")


class Student(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    dob = Column(Date)
    gender = Column(String(20))
    parent_id = Column(Integer, ForeignKey("parents.parent_id"))
    class_id = Column(Integer, ForeignKey("classrooms.class_id"))
    admission_date = Column(Date)
    profile_photo = Column(String(255))
    # login credentials for the Child module (simple PIN-based access)
    login_pin = Column(String(255))

    parent = relationship("Parent", back_populates="students")
    classroom = relationship("Classroom", back_populates="students")


class Attendance(Base):
    __tablename__ = "attendance"

    attendance_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    class_id = Column(Integer, ForeignKey("classrooms.class_id"))
    att_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)  # present / absent / late
    marked_by = Column(Integer, ForeignKey("teachers.teacher_id"))


class Activity(Base):
    __tablename__ = "activities"

    activity_id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classrooms.class_id"))
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"))
    title = Column(String(150), nullable=False)
    description = Column(Text)
    act_date = Column(Date)
    photo_url = Column(String(255))


class Homework(Base):
    __tablename__ = "homework"

    homework_id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classrooms.class_id"))
    teacher_id = Column(Integer, ForeignKey("teachers.teacher_id"))
    title = Column(String(150), nullable=False)
    description = Column(Text)
    due_date = Column(Date)
    file_url = Column(String(255))


class Fee(Base):
    __tablename__ = "fees"

    fee_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    due_date = Column(Date)
    status = Column(String(20), default="pending")  # pending / paid / overdue
    payment_date = Column(Date, nullable=True)
    receipt_url = Column(String(255), nullable=True)


class Event(Base):
    __tablename__ = "events"

    event_id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    description = Column(Text)
    event_date = Column(Date, nullable=False)
    created_by = Column(Integer, ForeignKey("admins.admin_id"))


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    parent_id = Column(Integer, ForeignKey("parents.parent_id"))
    type = Column(String(50))  # homework / attendance / fee / event / holiday
    message = Column(String(255), nullable=False)
    sent_date = Column(DateTime, server_default=func.now())
    is_read = Column(Boolean, default=False)


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    term = Column(String(50))
    generated_date = Column(DateTime, server_default=func.now())
    file_url = Column(String(255), nullable=True)


class LearningProgress(Base):
    __tablename__ = "learning_progress"

    progress_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    module_name = Column(String(100))  # alphabets / numbers / colors / shapes ...
    completed_lessons = Column(Integer, default=0)
    quiz_score = Column(Integer, default=0)
    weak_areas = Column(String(255), nullable=True)
    last_updated = Column(DateTime, onupdate=func.now(), server_default=func.now())


class QuizResult(Base):
    __tablename__ = "quiz_results"

    quiz_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    quiz_name = Column(String(150))
    score = Column(Integer)
    quiz_date = Column(DateTime, server_default=func.now())
    attempts = Column(Integer, default=1)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    message_id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, nullable=False)
    sender_type = Column(String(20), nullable=False)  # teacher / parent / admin
    receiver_id = Column(Integer, nullable=False)
    receiver_type = Column(String(20), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(DateTime, server_default=func.now())


class AIConversationLog(Base):
    __tablename__ = "ai_conversation_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=True)
    parent_id = Column(Integer, ForeignKey("parents.parent_id"), nullable=True)
    user_type = Column(String(20))  # child / parent
    query = Column(Text)
    response = Column(Text)
    timestamp = Column(DateTime, server_default=func.now())


class LearningSession(Base):
    """One Child Mode session — from entering to exiting the learning screen."""
    __tablename__ = "learning_sessions"

    session_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    start_time = Column(DateTime, server_default=func.now())
    end_time = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    focus_breaks = Column(Integer, default=0)  # times the child left the tab/app mid-session


class Reward(Base):
    """Stars/badges earned by a child — from quizzes or from staying focused."""
    __tablename__ = "rewards"

    reward_id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"))
    reward_type = Column(String(30))  # star / badge / level_unlock
    reward_name = Column(String(150))
    source = Column(String(30))  # quiz / focus_session
    earned_date = Column(DateTime, server_default=func.now())

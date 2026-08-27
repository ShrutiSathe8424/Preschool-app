import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/api/child", tags=["Child Learning"])

# NOTE: The child module intentionally uses a lightweight, no-typing login
# (PIN or parent-assisted login) rather than JWT role checks tied to email,
# since preschoolers won't type emails/passwords. Access is opened by the
# parent from their own authenticated dashboard in a real deployment.


@router.post("/exit-pin/verify", response_model=schemas.VerifyChildPinResponse)
def verify_exit_pin(payload: schemas.VerifyChildPin, db: Session = Depends(get_db)):
    """
    Checks the PIN typed on the Child Mode exit screen against the linked
    parent's saved PIN. No parent login is required here on purpose —
    the child is holding the device, not the parent.
    """
    from .. import auth

    student = db.query(models.Student).filter(models.Student.student_id == payload.student_id).first()
    if not student or not student.parent_id:
        raise HTTPException(status_code=404, detail="Student or linked parent not found")

    parent = db.query(models.Parent).filter(models.Parent.parent_id == student.parent_id).first()
    if not parent or not parent.child_pin_hash:
        raise HTTPException(status_code=400, detail="No Child Mode PIN has been set by the parent yet")

    valid = auth.verify_password(payload.pin, parent.child_pin_hash)
    return schemas.VerifyChildPinResponse(valid=valid)


@router.post("/session/start", response_model=schemas.SessionStartResponse)
def start_session(payload: schemas.SessionStart, db: Session = Depends(get_db)):
    session = models.LearningSession(student_id=payload.student_id)
    db.add(session)
    db.commit()
    db.refresh(session)
    return schemas.SessionStartResponse(session_id=session.session_id, start_time=session.start_time)


@router.post("/session/focus-break")
def log_focus_break(payload: schemas.FocusBreakPing, db: Session = Depends(get_db)):
    """Called from the frontend whenever the child leaves the learning tab/app mid-session."""
    session = db.query(models.LearningSession).filter(models.LearningSession.session_id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.focus_breaks = (session.focus_breaks or 0) + 1
    db.commit()
    return {"message": "Focus break logged", "focus_breaks": session.focus_breaks}


@router.post("/session/end", response_model=schemas.SessionEndResponse)
def end_session(payload: schemas.SessionEnd, db: Session = Depends(get_db)):
    import datetime as dt

    session = db.query(models.LearningSession).filter(models.LearningSession.session_id == payload.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.end_time = dt.datetime.utcnow()
    duration = int((session.end_time - session.start_time).total_seconds() // 60)
    session.duration_minutes = duration
    session.focus_breaks = payload.focus_breaks

    reward_earned = None
    # Reward: stayed focused (no more than 1 break) for at least 20 minutes
    if duration >= 20 and payload.focus_breaks <= 1:
        reward = models.Reward(
            student_id=session.student_id,
            reward_type="star",
            reward_name="Focused Learner",
            source="focus_session",
        )
        db.add(reward)
        reward_earned = "star"

    db.commit()
    return schemas.SessionEndResponse(session_id=session.session_id, duration_minutes=duration, reward_earned=reward_earned)


@router.get("/rewards/{student_id}", response_model=list[schemas.RewardOut])
def list_rewards(student_id: int, db: Session = Depends(get_db)):
    return (
        db.query(models.Reward)
        .filter(models.Reward.student_id == student_id)
        .order_by(models.Reward.earned_date.desc())
        .all()
    )


@router.get("/progress/{student_id}")
def get_progress(student_id: int, db: Session = Depends(get_db)):
    records = db.query(models.LearningProgress).filter(models.LearningProgress.student_id == student_id).all()
    return [
        {
            "module_name": r.module_name,
            "completed_lessons": r.completed_lessons,
            "quiz_score": r.quiz_score,
            "weak_areas": r.weak_areas,
        }
        for r in records
    ]


@router.post("/progress/{student_id}/update")
def update_progress(student_id: int, module_name: str, completed_lessons: int, db: Session = Depends(get_db)):
    record = (
        db.query(models.LearningProgress)
        .filter(models.LearningProgress.student_id == student_id, models.LearningProgress.module_name == module_name)
        .first()
    )
    if not record:
        record = models.LearningProgress(student_id=student_id, module_name=module_name, completed_lessons=completed_lessons)
        db.add(record)
    else:
        record.completed_lessons = completed_lessons
    db.commit()
    return {"message": "Progress updated"}


@router.post("/quiz-result")
def submit_quiz_result(student_id: int, quiz_name: str, score: int, db: Session = Depends(get_db)):
    result = models.QuizResult(student_id=student_id, quiz_name=quiz_name, score=score)
    db.add(result)
    db.commit()
    db.refresh(result)

    # score >= 80 unlocks a star, persisted so the Parent Report can show it
    reward = None
    if score >= 80:
        db.add(models.Reward(student_id=student_id, reward_type="star", reward_name=f"Great score on {quiz_name}", source="quiz"))
        db.commit()
        reward = "star"

    return {"message": "Quiz recorded", "quiz_id": result.quiz_id, "reward": reward}


@router.post("/ai-buddy/chat", response_model=schemas.AIChatResponse)
def ai_buddy_chat(payload: schemas.AIChatRequest, db: Session = Depends(get_db)):
    """
    Talks to the AI Learning Buddy. Wire this up to OpenAI or Gemini
    using the API key from your .env file. A simple rule-based fallback
    is included so the endpoint works even before you add a real key.
    """
    reply = _generate_ai_reply(payload.message)

    log = models.AIConversationLog(
        student_id=payload.student_id,
        parent_id=payload.parent_id,
        user_type=payload.user_type,
        query=payload.message,
        response=reply,
    )
    db.add(log)
    db.commit()

    return schemas.AIChatResponse(reply=reply)


def _generate_ai_reply(message: str) -> str:
    openai_key = os.getenv("OPENAI_API_KEY")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if openai_key:
        return _call_openai(message, openai_key)
    if gemini_key:
        return _call_gemini(message, gemini_key)

    # Fallback: simple rule-based responses for common preschool prompts
    text = message.lower()
    if "abc" in text or "alphabet" in text:
        return "Let's start! A is for Apple. Can you say A?"
    if "story" in text:
        return "Once upon a time, there was a little bunny who loved to hop in the garden..."
    if "count" in text or any(str(n) in text for n in range(10)):
        return "Let's count together! 1, 2, 3... can you count with me?"
    return "Hi friend! I'm your Learning Buddy. Ask me about letters, numbers, or say 'tell me a story'!"


def _call_openai(message: str, api_key: str) -> str:
    import requests

    response = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a friendly AI Learning Buddy for preschool children aged 3-5. "
                        "Keep replies short, warm, simple, and encouraging. Use easy words only."
                    ),
                },
                {"role": "user", "content": message},
            ],
            "max_tokens": 150,
        },
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def _call_gemini(message: str, api_key: str) -> str:
    import requests

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    response = requests.post(
        url,
        json={
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                "You are a friendly AI Learning Buddy for preschool children aged 3-5. "
                                "Keep replies short, warm, simple, and encouraging. Use easy words only.\n\n"
                                f"Child says: {message}"
                            )
                        }
                    ]
                }
            ]
        },
        timeout=15,
    )
    response.raise_for_status()
    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]

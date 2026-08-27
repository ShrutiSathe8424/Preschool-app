# Sprout — Smart Preschool Learning & Management System

Basic full-stack skeleton: FastAPI (Python) + MySQL backend, React frontend,
with AI Learning Buddy hooks for OpenAI or Gemini.

```
preschool-app/
├── backend/          FastAPI + SQLAlchemy + MySQL
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   └── routers/
│   ├── requirements.txt
│   ├── .env.example
│   └── seed_admin.py
└── frontend/          React (Vite)
```

See `backend/SETUP.md` and `frontend/SETUP.md` for step-by-step install
instructions for VS Code.

## Child Mode (new)

The Child Learning module is now a locked-down "Child Mode" rather than an open page:

- **Launch**: Only from the Parent dashboard's "▶ Enter Child Mode" button — this requires the parent to have set a 4-digit PIN first.
- **Parent PIN lock**: Set/changed from the Parent dashboard (`POST /api/parent/child-pin`). The same PIN is required to exit Child Mode (`POST /api/child/exit-pin/verify`) — the child cannot back out on their own.
- **Fullscreen + back-button block**: `ChildModeGuard` requests fullscreen on entry and intercepts the browser back button so the child stays on the learning screen.
- **Session timer**: A 30-minute countdown is shown at all times; when it hits zero, the child is prompted to get a parent to enter the PIN.
- **Focus detection**: If the child switches tabs/apps (`visibilitychange`/`blur` events), a "Stay Focused!" overlay appears and the break is logged (`POST /api/child/session/focus-break`).
- **Rewards**: A student earns a star automatically for finishing a session of 20+ minutes with at most one focus break, or for scoring 80+ on a quiz. Rewards are stored in the `rewards` table.
- **Parent Report**: The Parent dashboard's "View Report" button calls `GET /api/parent/report/{student_id}` for total minutes learned, lessons completed, quizzes attempted, and rewards earned.

**Note on Android Kiosk Mode**: this build implements the web-appropriate equivalents (fullscreen, PIN lock, focus detection). If you later wrap this as a native Android app for school-owned tablets, Android's Lock Task Mode (Kiosk Mode) can additionally prevent the user from leaving the app at the OS level — that's a native-app feature and isn't available to a web app.

## Design system (new)

The frontend was rebuilt on a single shared UI kit instead of one-off inline
styles per page, so all four roles read as one product:

- **Tokens** — `frontend/src/styles/theme.css` defines the full palette
  (ink navy, meadow green, sunbeam amber, blush red), type scale (Lexend for
  headings, Inter for body/UI, JetBrains Mono for data, Baloo 2 for Child
  Mode), radii, shadows and a per-role accent variable.
- **Primitives** — `frontend/src/components/ui/` (`Button`, `Card`,
  `StatCard`, `Badge`, `DataTable`, `Field`, `Tabs`, `Feedback`) are the only
  building blocks every dashboard uses, so a change to one style updates the
  whole app.
- **App shell** — `frontend/src/components/AppShell.jsx` is the shared
  sidebar/content layout for Admin, Teacher and Parent. Only the accent color
  (`.role-admin` / `.role-teacher` / `.role-parent`) changes between them.
- **Child Mode** — `frontend/src/pages/child-mode.css` is intentionally its
  own, louder, rounder visual language for the one screen a preschooler
  actually uses, while `ChildModeGuard` keeps the exact same session/PIN/
  focus-detection logic as before.
- **Icons** — `lucide-react` replaces emoji-as-icon in the navigation and
  buttons; illustrative emoji are kept only inside Child Mode, where they're
  part of the product, not a placeholder.

No backend contract, route, or page's functionality changed — only markup and
styling.

## Admin, Teacher & Parent screens

- **Admin dashboard** now has tabs: Overview (stats), Classes, Teachers, Parents, Students — each with an add-form and a live table, all backed by the existing `/api/admin/*` endpoints.
- **Teacher dashboard** now has tabs: Attendance (mark present/absent/late per student for a chosen date, upserts on re-save), Homework, and Activities (both with add-form + history table). Uses the new `GET /api/teacher/my-class` endpoint to know which class the teacher is assigned to, and `POST /api/teacher/attendance` now upserts instead of creating duplicate rows for the same student/date.
- **Parent dashboard** now has a "Homework & Activities" button per child pulling from the new `GET /api/parent/homework/{id}` and `GET /api/parent/activities/{id}` endpoints, alongside the existing report and Child Mode launch buttons.
- Teacher endpoints for attendance/homework/activity now verify the teacher is actually assigned to the class_id they're posting to (403 otherwise).

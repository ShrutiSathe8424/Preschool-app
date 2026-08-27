import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import { Banner, EmptyState } from "../components/ui/Feedback";
import { CalendarCheck2, BookOpen, Palette, School } from "lucide-react";

const NAV = [
  { key: "Attendance", label: "Attendance", icon: CalendarCheck2 },
  { key: "Homework", label: "Homework", icon: BookOpen },
  { key: "Activities", label: "Activities", icon: Palette },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TeacherDashboard() {
  const [tab, setTab] = useState("Attendance");
  const [myClass, setMyClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [error, setError] = useState("");
  const { user, logout } = useAuth();

  useEffect(() => {
    api.get("/api/teacher/my-class").then((res) => setMyClass(res.data)).catch(() => {});
    api
      .get("/api/teacher/students")
      .then((res) => setStudents(res.data))
      .catch(() => setError("Could not load your class list."));
  }, []);

  return (
    <AppShell
      role="teacher"
      roleLabel="Teacher"
      navItems={NAV}
      activeNav={tab}
      onNavChange={setTab}
      userName={user?.name}
      onLogout={logout}
    >
      <div className="page-header">
        <div>
          <div className="page-header__eyebrow">Teacher</div>
          <h1>{tab}</h1>
          <p>
            {myClass ? (
              <>
                <School size={13} style={{ verticalAlign: -2, marginRight: 5 }} />
                {myClass.class_name}
                {myClass.section ? ` – ${myClass.section}` : ""}
              </>
            ) : (
              "Waiting on a class assignment"
            )}
          </p>
        </div>
      </div>

      <Banner tone="error">{error}</Banner>
      {!myClass && !error && (
        <Card>
          <EmptyState icon={School} title="No class assigned yet" hint="Ask an admin to assign you to a class to get started." />
        </Card>
      )}

      {myClass && (
        <>
          {tab === "Attendance" && <AttendanceTab classId={myClass.class_id} students={students} />}
          {tab === "Homework" && <HomeworkTab classId={myClass.class_id} />}
          {tab === "Activities" && <ActivitiesTab classId={myClass.class_id} />}
        </>
      )}
    </AppShell>
  );
}

// ---------------- Attendance ----------------
function AttendanceTab({ classId, students }) {
  const [date, setDate] = useState(todayStr());
  const [statuses, setStatuses] = useState({}); // student_id -> status
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get(`/api/teacher/attendance/${classId}/${date}`)
      .then((res) => {
        const map = {};
        res.data.forEach((a) => {
          map[a.student_id] = a.status;
        });
        setStatuses(map);
      })
      .catch(() => setStatuses({}));
  }, [classId, date]);

  function setStatus(studentId, status) {
    setStatuses((prev) => ({ ...prev, [studentId]: status }));
  }

  async function saveAll() {
    setSaving(true);
    setMessage("");
    try {
      for (const s of students) {
        const status = statuses[s.student_id] || "present";
        await api.post("/api/teacher/attendance", { student_id: s.student_id, class_id: classId, att_date: date, status });
      }
      setMessage("Attendance saved.");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="form-row" style={{ marginBottom: 4 }}>
        <div className="field field--fixed">
          <span className="field__label">Date</span>
          <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <Button onClick={saveAll} loading={saving}>{saving ? "Saving" : "Save attendance"}</Button>
      </div>
      <Banner tone={message.includes("saved") ? "success" : "error"}>{message}</Banner>

      <div style={{ marginTop: 18 }}>
        <DataTable
          columns={[
            { key: "name", header: "Student" },
            {
              key: "status",
              header: "Status",
              render: (s) => {
                const current = statuses[s.student_id] || "present";
                return (
                  <div>
                    {["present", "absent", "late"].map((opt) => (
                      <label key={opt} className="radio-inline">
                        <input
                          type="radio"
                          name={`status-${s.student_id}`}
                          checked={current === opt}
                          onChange={() => setStatus(s.student_id, opt)}
                        />
                        {opt}
                      </label>
                    ))}
                    <Badge variant={current}>{current}</Badge>
                  </div>
                );
              },
            },
          ]}
          rows={students}
          rowKey={(s) => s.student_id}
          emptyIcon={CalendarCheck2}
          emptyTitle="No students in your class yet"
        />
      </div>
    </Card>
  );
}

// ---------------- Homework ----------------
function HomeworkTab({ classId }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", due_date: todayStr() });
  const [message, setMessage] = useState("");

  function refresh() {
    api.get("/api/teacher/homework").then((res) => setItems(res.data)).catch(() => {});
  }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/api/teacher/homework", { ...form, class_id: classId });
      setForm({ title: "", description: "", due_date: todayStr() });
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not add homework.");
    }
  }

  return (
    <Card>
      <div className="section-title">Assign homework</div>
      <form onSubmit={handleAdd} className="form-row">
        <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="input" style={{ flex: "2 1 220px" }} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
        <Button type="submit">Assign homework</Button>
      </form>
      <Banner tone="error">{message}</Banner>

      <div style={{ marginTop: 22 }}>
        <DataTable
          columns={[
            { key: "title", header: "Title" },
            { key: "description", header: "Description" },
            { key: "due_date", header: "Due" },
          ]}
          rows={items}
          rowKey={(h) => h.homework_id}
          emptyIcon={BookOpen}
          emptyTitle="No homework assigned yet"
        />
      </div>
    </Card>
  );
}

// ---------------- Activities ----------------
function ActivitiesTab({ classId }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", act_date: todayStr() });
  const [message, setMessage] = useState("");

  function refresh() {
    api.get("/api/teacher/activity").then((res) => setItems(res.data)).catch(() => {});
  }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/api/teacher/activity", { ...form, class_id: classId });
      setForm({ title: "", description: "", act_date: todayStr() });
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not add activity.");
    }
  }

  return (
    <Card>
      <div className="section-title">Log an activity</div>
      <form onSubmit={handleAdd} className="form-row">
        <input className="input" placeholder="Title (e.g. Story Time)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <input className="input" style={{ flex: "2 1 220px" }} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input className="input" type="date" value={form.act_date} onChange={(e) => setForm({ ...form, act_date: e.target.value })} required />
        <Button type="submit">Log activity</Button>
      </form>
      <Banner tone="error">{message}</Banner>

      <div style={{ marginTop: 22 }}>
        <DataTable
          columns={[
            { key: "title", header: "Title" },
            { key: "description", header: "Description" },
            { key: "act_date", header: "Date" },
          ]}
          rows={items}
          rowKey={(a) => a.activity_id}
          emptyIcon={Palette}
          emptyTitle="No activities logged yet"
        />
      </div>
    </Card>
  );
}

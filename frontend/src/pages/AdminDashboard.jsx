import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import DataTable from "../components/ui/DataTable";
import { Banner } from "../components/ui/Feedback";
import {
  LayoutGrid,
  Building2,
  GraduationCap,
  Users2,
  Baby,
  CalendarCheck2,
  Wallet,
  CalendarClock,
} from "lucide-react";

const NAV = [
  { key: "Overview", label: "Overview", icon: LayoutGrid },
  { key: "Classes", label: "Classes", icon: Building2 },
  { key: "Teachers", label: "Teachers", icon: GraduationCap },
  { key: "Parents", label: "Parents", icon: Users2 },
  { key: "Students", label: "Students", icon: Baby },
];

export default function AdminDashboard() {
  const [tab, setTab] = useState("Overview");
  const { user, logout } = useAuth();

  return (
    <AppShell
      role="admin"
      roleLabel="Administrator"
      navItems={NAV}
      activeNav={tab}
      onNavChange={setTab}
      userName={user?.name}
      onLogout={logout}
    >
      <div className="page-header">
        <div>
          <div className="page-header__eyebrow">Admin</div>
          <h1>{tab === "Overview" ? `Welcome back, ${user?.name?.split(" ")[0] || ""}` : tab}</h1>
          <p>
            {tab === "Overview" && "Here's how the school is doing today."}
            {tab === "Classes" && "Create classrooms and see who's already set up."}
            {tab === "Teachers" && "Add staff accounts and assign them to a class."}
            {tab === "Parents" && "Manage the parent accounts linked to your students."}
            {tab === "Students" && "Enroll students and link them to a parent and class."}
          </p>
        </div>
      </div>

      {tab === "Overview" && <Overview />}
      {tab === "Classes" && <ClassesTab />}
      {tab === "Teachers" && <TeachersTab />}
      {tab === "Parents" && <ParentsTab />}
      {tab === "Students" && <StudentsTab />}
    </AppShell>
  );
}

// ---------------- Overview ----------------
function Overview() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/admin/dashboard")
      .then((res) => setStats(res.data))
      .catch(() => setError("Could not load dashboard stats. Is the backend running?"));
  }, []);

  return (
    <div>
      <Banner tone="error">{error}</Banner>
      {stats && (
        <div className="stat-grid">
          <StatCard icon={Baby} label="Total Students" value={stats.total_students} />
          <StatCard icon={GraduationCap} label="Total Teachers" value={stats.total_teachers} />
          <StatCard icon={CalendarCheck2} label="Today's Attendance" value={stats.today_attendance} />
          <StatCard icon={Wallet} label="Pending Fees" value={stats.pending_fees} />
          <StatCard icon={CalendarClock} label="Upcoming Events" value={stats.upcoming_events} />
        </div>
      )}
    </div>
  );
}

// ---------------- Classes ----------------
function ClassesTab() {
  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [message, setMessage] = useState("");

  function refresh() {
    api.get("/api/admin/classrooms").then((res) => setClasses(res.data)).catch(() => {});
  }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/api/admin/classrooms", { class_name: className, section: section || null });
      setClassName("");
      setSection("");
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not add class.");
    }
  }

  return (
    <Card>
      <div className="section-title">Add a class</div>
      <div className="section-sub">New classrooms appear in the table below immediately.</div>
      <form onSubmit={handleAdd} className="form-row">
        <div className="field field--wide">
          <span className="field__label">Class name</span>
          <input className="input" placeholder="e.g. Nursery A" value={className} onChange={(e) => setClassName(e.target.value)} required />
        </div>
        <div className="field">
          <span className="field__label">Section</span>
          <input className="input" placeholder="Optional" value={section} onChange={(e) => setSection(e.target.value)} />
        </div>
        <Button type="submit">Add class</Button>
      </form>
      <Banner tone="error">{message}</Banner>

      <div style={{ marginTop: 22 }}>
        <DataTable
          columns={[
            { key: "class_id", header: "ID" },
            { key: "class_name", header: "Class" },
            { key: "section", header: "Section" },
          ]}
          rows={classes}
          rowKey={(c) => c.class_id}
          emptyIcon={Building2}
          emptyTitle="No classes yet"
          emptyHint="Add your first classroom above."
        />
      </div>
    </Card>
  );
}

// ---------------- Teachers ----------------
function TeachersTab() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", class_id: "" });
  const [message, setMessage] = useState("");

  function refresh() {
    api.get("/api/admin/teachers").then((res) => setTeachers(res.data)).catch(() => {});
    api.get("/api/admin/classrooms").then((res) => setClasses(res.data)).catch(() => {});
  }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/api/admin/teachers", {
        ...form,
        class_id: form.class_id ? Number(form.class_id) : null,
      });
      setForm({ name: "", email: "", password: "", phone: "", class_id: "" });
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not add teacher.");
    }
  }

  function classLabel(id) {
    const c = classes.find((c) => c.class_id === id);
    return c ? `${c.class_name}${c.section ? ` – ${c.section}` : ""}` : null;
  }

  return (
    <Card>
      <div className="section-title">Add a teacher</div>
      <div className="section-sub">Assigning a class now is optional — it can be set later from the class list.</div>
      <form onSubmit={handleAdd} className="form-row">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <select className="select" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}>
          <option value="">Assign class (optional)</option>
          {classes.map((c) => (
            <option key={c.class_id} value={c.class_id}>
              {c.class_name}
              {c.section ? ` – ${c.section}` : ""}
            </option>
          ))}
        </select>
        <Button type="submit">Add teacher</Button>
      </form>
      <Banner tone="error">{message}</Banner>

      <div style={{ marginTop: 22 }}>
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
            { key: "class_id", header: "Class", render: (t) => classLabel(t.class_id) || <span className="table-cell--muted">Unassigned</span> },
          ]}
          rows={teachers}
          rowKey={(t) => t.teacher_id}
          emptyIcon={GraduationCap}
          emptyTitle="No teachers yet"
          emptyHint="Add your first teacher account above."
        />
      </div>
    </Card>
  );
}

// ---------------- Parents ----------------
function ParentsTab() {
  const [parents, setParents] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", address: "" });
  const [message, setMessage] = useState("");

  function refresh() {
    api.get("/api/admin/parents").then((res) => setParents(res.data)).catch(() => {});
  }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/api/admin/parents", form);
      setForm({ name: "", email: "", password: "", phone: "", address: "" });
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not add parent.");
    }
  }

  return (
    <Card>
      <div className="section-title">Add a parent</div>
      <div className="section-sub">Parents can be linked to a student from the Students tab.</div>
      <form onSubmit={handleAdd} className="form-row">
        <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit">Add parent</Button>
      </form>
      <Banner tone="error">{message}</Banner>

      <div style={{ marginTop: 22 }}>
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "email", header: "Email" },
            { key: "phone", header: "Phone" },
          ]}
          rows={parents}
          rowKey={(p) => p.parent_id}
          emptyIcon={Users2}
          emptyTitle="No parents yet"
          emptyHint="Add your first parent account above."
        />
      </div>
    </Card>
  );
}

// ---------------- Students ----------------
function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState({ name: "", parent_id: "", class_id: "" });
  const [message, setMessage] = useState("");

  function refresh() {
    api.get("/api/admin/students").then((res) => setStudents(res.data)).catch(() => {});
    api.get("/api/admin/parents").then((res) => setParents(res.data)).catch(() => {});
    api.get("/api/admin/classrooms").then((res) => setClasses(res.data)).catch(() => {});
  }
  useEffect(refresh, []);

  async function handleAdd(e) {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/api/admin/students", {
        name: form.name,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        class_id: form.class_id ? Number(form.class_id) : null,
      });
      setForm({ name: "", parent_id: "", class_id: "" });
      refresh();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Could not add student.");
    }
  }

  function parentName(id) {
    return parents.find((p) => p.parent_id === id)?.name;
  }
  function className(id) {
    return classes.find((c) => c.class_id === id)?.class_name;
  }

  return (
    <Card>
      <div className="section-title">Enroll a student</div>
      <div className="section-sub">Every student needs a parent and a class.</div>
      <form onSubmit={handleAdd} className="form-row">
        <input className="input" placeholder="Student name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="select" value={form.parent_id} onChange={(e) => setForm({ ...form, parent_id: e.target.value })} required>
          <option value="">Select parent</option>
          {parents.map((p) => (
            <option key={p.parent_id} value={p.parent_id}>{p.name}</option>
          ))}
        </select>
        <select className="select" value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })} required>
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.class_id} value={c.class_id}>{c.class_name}</option>
          ))}
        </select>
        <Button type="submit">Add student</Button>
      </form>
      <Banner tone="error">{message}</Banner>

      <div style={{ marginTop: 22 }}>
        <DataTable
          columns={[
            { key: "name", header: "Name" },
            { key: "parent_id", header: "Parent", render: (s) => parentName(s.parent_id) },
            { key: "class_id", header: "Class", render: (s) => className(s.class_id) },
          ]}
          rows={students}
          rowKey={(s) => s.student_id}
          emptyIcon={Baby}
          emptyTitle="No students yet"
          emptyHint="Enroll your first student above."
        />
      </div>
    </Card>
  );
}

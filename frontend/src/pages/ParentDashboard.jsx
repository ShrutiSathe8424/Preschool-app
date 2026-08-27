import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Banner } from "../components/ui/Feedback";
import { Users2, Lock, Play, ClipboardList, BarChart3, BookOpen, Palette } from "lucide-react";

const NAV = [{ key: "Children", label: "My Children", icon: Users2 }];

export default function ParentDashboard() {
  const [children, setChildren] = useState([]);
  const [error, setError] = useState("");
  const [pinSet, setPinSet] = useState(null);
  const [showPinForm, setShowPinForm] = useState(false);
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [reports, setReports] = useState({}); // student_id -> report
  const [updates, setUpdates] = useState({}); // student_id -> {homework, activities}
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/parent/children")
      .then((res) => setChildren(res.data))
      .catch(() => setError("Could not load your children's info."));

    api
      .get("/api/parent/child-pin/status")
      .then((res) => setPinSet(res.data.pin_set))
      .catch(() => setPinSet(false));
  }, []);

  function loadReport(studentId) {
    api
      .get(`/api/parent/report/${studentId}`)
      .then((res) => setReports((prev) => ({ ...prev, [studentId]: res.data })))
      .catch(() => {});
  }

  function loadUpdates(studentId) {
    Promise.all([api.get(`/api/parent/homework/${studentId}`), api.get(`/api/parent/activities/${studentId}`)])
      .then(([hwRes, actRes]) => {
        setUpdates((prev) => ({ ...prev, [studentId]: { homework: hwRes.data, activities: actRes.data } }));
      })
      .catch(() => {});
  }

  async function handleSavePin(e) {
    e.preventDefault();
    setPinMessage("");
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setPinMessage("PIN must be exactly 4 digits.");
      return;
    }
    if (pin !== pinConfirm) {
      setPinMessage("PINs don't match.");
      return;
    }
    try {
      await api.post("/api/parent/child-pin", { pin });
      setPinSet(true);
      setShowPinForm(false);
      setPin("");
      setPinConfirm("");
    } catch (err) {
      setPinMessage(err.response?.data?.detail || "Could not save PIN.");
    }
  }

  function enterChildMode(studentId) {
    if (!pinSet) {
      setPinMessage("Set a Child Mode PIN first so you can exit it later.");
      setShowPinForm(true);
      return;
    }
    navigate(`/child/${studentId}`);
  }

  return (
    <AppShell
      role="parent"
      roleLabel="Parent"
      navItems={NAV}
      activeNav="Children"
      onNavChange={() => {}}
      userName={user?.name}
      onLogout={logout}
    >
      <div className="page-header">
        <div>
          <div className="page-header__eyebrow">Parent</div>
          <h1>Welcome, {user?.name?.split(" ")[0] || ""}</h1>
          <p>See your child's day and open Learning World when they're ready to play.</p>
        </div>
      </div>

      <Banner tone="error">{error}</Banner>

      {/* Child Mode PIN setup */}
      <Card className="pin-card" style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <div style={{ background: "var(--sunbeam-50)", color: "var(--sunbeam-600)", borderRadius: 10, padding: 9, display: "flex" }}>
              <Lock size={17} />
            </div>
            <div>
              <div className="section-title" style={{ marginBottom: 2 }}>Child Mode PIN</div>
              <p style={{ color: "var(--color-text-muted)", fontSize: 13, margin: 0 }}>
                {pinSet ? "PIN is set — required to exit Child Mode." : "Not set yet. Set a PIN before letting your child use Learning World."}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowPinForm((s) => !s)}>
            {pinSet ? "Change PIN" : "Set PIN"}
          </Button>
        </div>

        {showPinForm && (
          <form onSubmit={handleSavePin} style={{ marginTop: 16, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="field">
              <span className="field__label">New PIN</span>
              <input
                className="input"
                style={{ width: 84, letterSpacing: 6, textAlign: "center" }}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <div className="field">
              <span className="field__label">Confirm</span>
              <input
                className="input"
                style={{ width: 84, letterSpacing: 6, textAlign: "center" }}
                type="password"
                inputMode="numeric"
                maxLength={4}
                placeholder="••••"
                value={pinConfirm}
                onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button type="submit" size="sm">Save PIN</Button>
          </form>
        )}
        <Banner tone="error">{pinMessage}</Banner>
      </Card>

      {/* Children list */}
      <div className="section-title" style={{ marginBottom: 14 }}>My children</div>
      {children.length === 0 ? (
        <Card>
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: 13.5 }}>No children linked to your account yet.</p>
        </Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {children.map((c) => {
            const report = reports[c.student_id];
            const upd = updates[c.student_id];
            return (
              <Card key={c.student_id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="shell-user__avatar" style={{ background: "var(--sunbeam-500)", width: 38, height: 38, fontSize: 14 }}>
                      {c.name?.[0]?.toUpperCase()}
                    </div>
                    <h3 style={{ margin: 0, fontSize: 16 }}>{c.name}</h3>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button variant="outline" size="sm" onClick={() => loadUpdates(c.student_id)}>
                      <ClipboardList size={14} /> Homework & activities
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => loadReport(c.student_id)}>
                      <BarChart3 size={14} /> View report
                    </Button>
                    <Button size="sm" onClick={() => enterChildMode(c.student_id)}>
                      <Play size={14} /> Enter Child Mode
                    </Button>
                  </div>
                </div>

                {report && (
                  <div className="stat-grid" style={{ marginTop: 18, marginBottom: 0, paddingTop: 18, borderTop: "1px solid var(--color-border)" }}>
                    <StatMini label="Minutes learned" value={report.total_minutes_learned} />
                    <StatMini label="Lessons completed" value={report.lessons_completed} />
                    <StatMini label="Quizzes attempted" value={report.quizzes_attempted} />
                    <StatMini label="Rewards earned" value={report.rewards_earned} />
                  </div>
                )}

                {upd && (
                  <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                      <BookOpen size={14} color="var(--sunbeam-600)" />
                      <strong style={{ fontSize: 13.5 }}>Homework</strong>
                    </div>
                    {upd.homework.length === 0 ? (
                      <p style={{ color: "var(--color-text-faint)", fontSize: 13 }}>Nothing assigned yet.</p>
                    ) : (
                      upd.homework.map((h) => (
                        <div key={h.homework_id} className="update-row">
                          <strong>{h.title}</strong> — due {h.due_date}
                          {h.description && <div style={{ color: "var(--color-text-muted)", fontSize: 12.5 }}>{h.description}</div>}
                        </div>
                      ))
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "16px 0 8px" }}>
                      <Palette size={14} color="var(--sunbeam-600)" />
                      <strong style={{ fontSize: 13.5 }}>Recent activities</strong>
                    </div>
                    {upd.activities.length === 0 ? (
                      <p style={{ color: "var(--color-text-faint)", fontSize: 13 }}>No activities logged yet.</p>
                    ) : (
                      upd.activities.map((a) => (
                        <div key={a.activity_id} className="update-row">
                          <strong>{a.title}</strong> — {a.act_date}
                          {a.description && <div style={{ color: "var(--color-text-muted)", fontSize: 12.5 }}>{a.description}</div>}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

function StatMini({ label, value }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 600, color: "var(--ink-900)" }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 2 }}>{label}</div>
    </div>
  );
}

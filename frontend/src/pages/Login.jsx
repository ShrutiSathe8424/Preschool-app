import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/ui/Logo";
import Button from "../components/ui/Button";
import { Banner } from "../components/ui/Feedback";
import { ShieldCheck, GraduationCap, Users2 } from "lucide-react";

const ROLES = [
  { value: "admin", label: "Admin", icon: ShieldCheck },
  { value: "teacher", label: "Teacher", icon: GraduationCap },
  { value: "parent", label: "Parent", icon: Users2 },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const returnedRole = await login(email, password, role);
      navigate(`/${returnedRole}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your details.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.showcase}>
        <div style={styles.showcaseInner}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={30} mono />
            <span style={styles.brandName}>Sprout</span>
          </div>
          <h1 style={styles.headline}>
            One calm place for the whole preschool day.
          </h1>
          <p style={styles.sub}>
            Attendance, homework and activities for staff — a guided, PIN-locked
            Learning World for the children.
          </p>
          <div style={styles.pillRow}>
            <span style={styles.pill}>Admin</span>
            <span style={styles.pill}>Teacher</span>
            <span style={styles.pill}>Parent</span>
            <span style={{ ...styles.pill, background: "rgba(245,166,35,0.18)", color: "#ffd889" }}>Child Mode</span>
          </div>
        </div>
      </div>

      <div style={styles.formSide}>
        <form style={styles.card} onSubmit={handleSubmit}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Logo size={24} />
            <span style={styles.cardBrand}>Sprout</span>
          </div>
          <h2 style={styles.title}>Sign in</h2>
          <p style={styles.subtitle}>Enter your details to reach your dashboard.</p>

          <div style={styles.roleRow}>
            {ROLES.map((r) => (
              <button
                type="button"
                key={r.value}
                onClick={() => setRole(r.value)}
                style={{ ...styles.roleBtn, ...(role === r.value ? styles.roleBtnActive : {}) }}
              >
                <r.icon size={16} />
                {r.label}
              </button>
            ))}
          </div>

          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            className="input"
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@school.com"
            required
          />

          <label style={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            style={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <Banner tone="error">{error}</Banner>

          <Button type="submit" loading={loading} block style={{ marginTop: 22 }}>
            {loading ? "Signing in" : "Sign in"}
          </Button>

          <p style={styles.footnote}>
            Children don't sign in here — a parent launches Child Mode from their own dashboard.
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    background: "var(--paper)",
  },
  showcase: {
    flex: "1 1 46%",
    background: "linear-gradient(160deg, #101a2e 0%, #16482f 100%)",
    display: "flex",
    alignItems: "center",
    padding: "48px",
    position: "relative",
  },
  showcaseInner: { maxWidth: 420 },
  brandName: { fontFamily: "var(--font-display)", color: "#fff", fontWeight: 600, fontSize: 16 },
  headline: {
    fontFamily: "var(--font-display)",
    color: "#fff",
    fontSize: "clamp(28px, 3.4vw, 38px)",
    fontWeight: 600,
    lineHeight: 1.2,
    marginTop: 28,
  },
  sub: { color: "rgba(255,255,255,0.65)", fontSize: 14.5, lineHeight: 1.6, marginTop: 14, maxWidth: 380 },
  pillRow: { display: "flex", gap: 8, marginTop: 28, flexWrap: "wrap" },
  pill: {
    fontSize: 12,
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.85)",
  },
  formSide: {
    flex: "1 1 54%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    background: "#fff",
    padding: "36px 34px",
    borderRadius: 20,
    boxShadow: "var(--shadow-lg)",
    border: "1px solid var(--color-border)",
    width: 360,
    display: "flex",
    flexDirection: "column",
  },
  cardBrand: { fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13, color: "var(--color-text-muted)" },
  title: { margin: "14px 0 2px", fontSize: 21 },
  subtitle: { marginBottom: 20, color: "var(--color-text-muted)", fontSize: 13 },
  roleRow: { display: "flex", gap: 6, marginBottom: 18, background: "var(--paper)", padding: 4, borderRadius: 10 },
  roleBtn: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "8px 6px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "var(--color-text-muted)",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
  },
  roleBtnActive: { background: "#fff", color: "var(--ink-900)", boxShadow: "var(--shadow-sm)" },
  label: { fontSize: 12, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6, marginTop: 12 },
  input: { fontSize: 14 },
  footnote: { marginTop: 18, fontSize: 11.5, color: "var(--color-text-faint)", textAlign: "center", lineHeight: 1.5 },
};

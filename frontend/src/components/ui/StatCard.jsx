export default function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="stat-card">
      {Icon && <Icon size={16} color="var(--role-accent, var(--color-primary))" style={{ marginBottom: 10 }} />}
      <div className="stat-card__value">{value ?? "—"}</div>
      <div className="stat-card__label">{label}</div>
    </div>
  );
}

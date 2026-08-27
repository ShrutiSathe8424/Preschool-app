export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={22} className="empty-state__icon" />}
      <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{title}</div>
      {hint && <div style={{ marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function Banner({ tone = "error", children }) {
  if (!children) return null;
  return <div className={`banner banner--${tone}`}>{children}</div>;
}

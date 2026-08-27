export default function Tabs({ items, active, onChange }) {
  return (
    <div className="tabs">
      {items.map((t) => (
        <button
          key={t}
          className={`tab ${active === t ? "is-active" : ""}`}
          onClick={() => onChange(t)}
          type="button"
        >
          {t}
        </button>
      ))}
    </div>
  );
}

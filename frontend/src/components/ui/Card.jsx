export default function Card({ children, className = "", padded = true, style }) {
  return (
    <div className={`card ${padded ? "card--pad" : ""} ${className}`} style={style}>
      {children}
    </div>
  );
}

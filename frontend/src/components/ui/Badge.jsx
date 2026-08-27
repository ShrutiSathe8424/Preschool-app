const VARIANTS = {
  present: "badge--present",
  absent: "badge--absent",
  late: "badge--late",
  neutral: "badge--neutral",
};

export default function Badge({ variant = "neutral", children }) {
  return <span className={`badge ${VARIANTS[variant] || VARIANTS.neutral}`}>{children}</span>;
}

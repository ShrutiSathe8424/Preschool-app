export default function Logo({ size = 28, mono = false }) {
  const leaf = mono ? "currentColor" : "#2ba884";
  const leaf2 = mono ? "currentColor" : "#1a7d67";
  const stem = mono ? "currentColor" : "#f5a623";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 29V17" stroke={stem} strokeWidth="2.2" strokeLinecap="round" />
      <path
        d="M16 18C16 18 6 17.5 6 8.5C6 8.5 16 8 16 18Z"
        fill={leaf}
      />
      <path
        d="M16 15C16 15 26 14.5 26 5.5C26 5.5 16 5 16 15Z"
        fill={leaf2}
      />
    </svg>
  );
}

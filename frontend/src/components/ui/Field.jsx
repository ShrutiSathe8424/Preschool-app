export function Field({ label, className = "", children }) {
  return (
    <div className={`field ${className}`}>
      {label && <span className="field__label">{label}</span>}
      {children}
    </div>
  );
}

export function TextInput({ label, className = "", wide, fixed, ...rest }) {
  return (
    <Field label={label} className={wide ? "field--wide" : fixed ? "field--fixed" : ""}>
      <input className={`input ${className}`} {...rest} />
    </Field>
  );
}

export function Select({ label, className = "", wide, fixed, children, ...rest }) {
  return (
    <Field label={label} className={wide ? "field--wide" : fixed ? "field--fixed" : ""}>
      <select className={`select ${className}`} {...rest}>
        {children}
      </select>
    </Field>
  );
}

import { LogOut } from "lucide-react";
import Logo from "./ui/Logo";

function initials(name) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

/**
 * Shared shell for the three "grown-up" dashboards. `role` drives the accent
 * color (see .role-admin / .role-teacher / .role-parent in ui.css) so every
 * module reuses the exact same layout and only the accent changes.
 */
export default function AppShell({ role, roleLabel, navItems, activeNav, onNavChange, userName, onLogout, children }) {
  return (
    <div className={`shell role-${role}`}>
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <Logo size={26} />
          <div>
            <div className="shell-brand__name">Sprout</div>
            <div className="shell-brand__tag">Preschool Suite</div>
          </div>
        </div>

        <nav className="shell-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`shell-nav__item ${activeNav === item.key ? "is-active" : ""}`}
              onClick={() => onNavChange(item.key)}
            >
              <item.icon size={16} strokeWidth={2.2} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="shell-sidebar__spacer" />

        <div className="shell-user">
          <div className="shell-user__avatar">{initials(userName)}</div>
          <div>
            <div className="shell-user__name">{userName}</div>
            <div className="shell-user__role">{roleLabel}</div>
          </div>
          <button className="shell-user__logout" onClick={onLogout} title="Log out" type="button">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <div className="shell-main">
        <div className="shell-content">{children}</div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import {
  ArrowLeft,
  CaretRight,
  ChatCircleDots,
  Check,
  Cube,
  House,
  MagnifyingGlass,
  Package,
  Plus,
  SignOut,
  SpinnerGap,
  UserFocus,
  UsersThree,
  X
} from "@phosphor-icons/react";
import { NavLink, useNavigate } from "react-router-dom";
import { ADMIN_UNAUTHORIZED_EVENT, api, clearSessionToken } from "./api";

const navigation = [
  { to: "/", label: "Overview", icon: House },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/customers", label: "Customers", icon: UsersThree },
  { to: "/employees", label: "Employees", icon: UserFocus },
  { to: "/products", label: "Products", icon: Cube }
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearSessionToken();
    window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><ChatCircleDots weight="bold" size={22} /></span>
          <span>Steel Assist</span>
        </div>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <Icon size={21} weight="regular" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <button className="sign-out" type="button" onClick={logout}>
          <SignOut size={20} />
          Sign out
        </button>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
  backTo
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backTo?: string;
}) {
  const navigate = useNavigate();
  return (
    <header className="page-header">
      <div>
        {backTo && (
          <button className="back-button" type="button" onClick={() => navigate(backTo)}>
            <ArrowLeft size={18} /> Back
          </button>
        )}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-action">{action}</div>}
    </header>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  icon = true
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  icon?: boolean;
}) {
  return (
    <button className="button primary" type={type} onClick={onClick} disabled={disabled}>
      {icon && <Plus size={18} weight="bold" />}
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  type = "button",
  disabled = false
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button className="button secondary" type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function SearchBox({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="search-box">
      <MagnifyingGlass size={21} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Clear search">
          <X size={16} />
        </button>
      )}
    </label>
  );
}

export function StatusPill({ active, label }: { active?: boolean; label?: string }) {
  const text = label || (active ? "Active" : "Inactive");
  const tone = label ? "neutral" : active ? "positive" : "muted";
  return <span className={`status-pill ${tone}`}>{text}</span>;
}

export function RowLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate();
  return (
    <button className="row-link" type="button" onClick={() => navigate(to)} aria-label={label}>
      <CaretRight size={20} weight="bold" />
    </button>
  );
}

export function LoadingState() {
  return (
    <div className="state-box" role="status">
      <SpinnerGap className="spin" size={28} />
      <span>Loading…</span>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="state-box empty-state">
      <div className="empty-icon"><Check size={24} /></div>
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert error-alert">
      <span>{message}</span>
      {onRetry && <button type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function DetailCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="detail-card">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="detail-row">
      <span>{label}</span>
      <strong>{children || "—"}</strong>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  children,
  disabled = false
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {children}
      </select>
    </label>
  );
}

export function ToggleField({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle-field">
      <span>
        <strong>{label}</strong>
        <small>{description}</small>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true" />
    </label>
  );
}

export function FormActions({
  onCancel,
  busy,
  submitLabel = "Save changes"
}: {
  onCancel: () => void;
  busy: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="form-actions">
      <SecondaryButton onClick={onCancel} disabled={busy}>Cancel</SecondaryButton>
      <PrimaryButton type="submit" disabled={busy} icon={false}>
        {busy ? "Saving…" : submitLabel}
      </PrimaryButton>
    </div>
  );
}

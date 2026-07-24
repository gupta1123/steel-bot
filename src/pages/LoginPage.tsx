import { FormEvent, useState } from "react";
import { Chat, Eye, EyeSlash, LockKey, User } from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";

const REMEMBERED_USERNAME_KEY = "steel-assist-admin-username";

function readRememberedUsername() {
  try {
    return window.localStorage.getItem(REMEMBERED_USERNAME_KEY) || "";
  } catch {
    return "";
  }
}

function persistRememberedUsername(username: string, remember: boolean) {
  try {
    if (remember) window.localStorage.setItem(REMEMBERED_USERNAME_KEY, username);
    else window.localStorage.removeItem(REMEMBERED_USERNAME_KEY);
  } catch {
    // Authentication still works when browser storage is unavailable.
  }
}

export default function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState(readRememberedUsername);
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(() => Boolean(readRememberedUsername()));
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("/auth/login", { method: "POST", body: { username, password } });
      persistRememberedUsername(username.trim(), remember);
      onSignedIn();
      const destination = (location.state as { from?: string } | null)?.from || "/";
      navigate(destination, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to sign in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-brand-section">
          <div className="login-brand" aria-hidden="true">
            <Chat size={23} weight="bold" />
          </div>
          <div className="login-brand-meta">
            <span className="login-brand-tag">Steel Assist</span>
            <h1 id="login-heading">Welcome back</h1>
            <p>Sign in to manage customers, products and live orders.</p>
          </div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label className="login-input-group">
            <span>Username</span>
            <span className="login-field-wrapper">
              <User className="login-field-icon" size={17} weight="bold" aria-hidden="true" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter your username"
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label className="login-input-group">
            <span>Password</span>
            <span className="login-field-wrapper">
              <LockKey className="login-field-icon" size={17} weight="bold" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeSlash size={17} weight="bold" /> : <Eye size={17} weight="bold" />}
              </button>
            </span>
          </label>

          <div className="login-utilities">
            <label className="login-remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="login-forgot"
              onClick={() => {
                setError("");
                setNotice("Password reset is not configured yet. Contact your administrator.");
              }}
            >
              Forgot password?
            </button>
          </div>

          {error && <div className="login-feedback error" role="alert"><LockKey size={17} />{error}</div>}
          {notice && <div className="login-feedback info" role="status">{notice}</div>}

          <button type="submit" className="login-submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

import { FormEvent, useState } from "react";
import { LockKey, StackSimple } from "@phosphor-icons/react";
import { useLocation, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api";
import { PrimaryButton, TextField } from "../components";

export default function LoginPage({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/auth/login", { method: "POST", body: { username, password } });
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
      <section className="login-card">
        <div className="login-brand"><StackSimple weight="fill" size={28} /></div>
        <span className="eyebrow">Steel Assist</span>
        <h1>Welcome back</h1>
        <p>Sign in to manage customers, products and live orders.</p>
        <form onSubmit={submit} className="login-form">
          <TextField label="Username" value={username} onChange={setUsername} required />
          <TextField label="Password" value={password} onChange={setPassword} type="password" required />
          {error && <div className="field-error"><LockKey size={18} />{error}</div>}
          <PrimaryButton type="submit" disabled={busy} icon={false}>
            {busy ? "Signing in…" : "Sign in"}
          </PrimaryButton>
        </form>
      </section>
    </main>
  );
}

import { useState } from "react";
import { register, resolveRoleFromInviteCode } from "../api/auth";
import { useCabinet } from "./context";
import { CabinetAlert, CabinetButton, Field } from "./components/Ui";

export function AuthForm() {
  const { login, toast } = useCabinet();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regCode, setRegCode] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!loginEmail.trim() || !loginPassword) {
      setFeedback({ type: "error", text: "Введите email и пароль" });
      return;
    }
    setSubmitting(true);
    try {
      await login(loginEmail.trim(), loginPassword);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Неверный email или пароль",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    if (!regCode.trim() || !regName.trim() || !regEmail.trim() || !regPassword) {
      setFeedback({ type: "error", text: "Заполните все поля" });
      return;
    }
    if (regPassword.length < 6) {
      setFeedback({ type: "error", text: "Пароль минимум 6 символов" });
      return;
    }

    const parts = regName.trim().split(/\s+/);
    const firstName = parts[0] ?? "Имя";
    const lastName = parts.slice(1).join(" ") || "Фамилия";

    setSubmitting(true);
    try {
      const role = await resolveRoleFromInviteCode(regCode.trim());
      await register({
        email: regEmail.trim(),
        password: regPassword,
        first_name: firstName,
        last_name: lastName,
        invite_code: regCode.trim(),
        role,
      });
      setFeedback({ type: "success", text: "Регистрация успешна! Войдите с вашим email и паролем." });
      setMode("login");
      setLoginEmail(regEmail.trim());
      setRegCode("");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Не удалось зарегистрироваться",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cabinet-auth-wrap">
      <div className="cabinet-auth-card">
        <div className="cabinet-auth-tabs">
          <button
            type="button"
            className={`cabinet-auth-tab${mode === "login" ? " is-active" : ""}`}
            onClick={() => { setMode("login"); setFeedback(null); }}
          >
            Войти
          </button>
          <button
            type="button"
            className={`cabinet-auth-tab${mode === "register" ? " is-active" : ""}`}
            onClick={() => { setMode("register"); setFeedback(null); }}
          >
            Регистрация
          </button>
        </div>

        {feedback && (
          <CabinetAlert variant={feedback.type === "error" ? "error" : "success"}>
            {feedback.text}
          </CabinetAlert>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <Field label="Email">
              <input
                className="cabinet-input"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Пароль">
              <input
                className="cabinet-input"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Пароль"
                autoComplete="current-password"
              />
            </Field>
            <CabinetButton type="submit" variant="primary" className="cabinet-btn--block" disabled={submitting}>
              {submitting ? "Вход..." : "Войти →"}
            </CabinetButton>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <CabinetAlert>Для регистрации нужен код-приглашение от администратора</CabinetAlert>
            <Field label="Код приглашения">
              <input
                className="cabinet-input"
                value={regCode}
                onChange={(e) => setRegCode(e.target.value)}
                placeholder="Код из письма"
              />
            </Field>
            <Field label="Имя и фамилия">
              <input
                className="cabinet-input"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Иван Иванов"
              />
            </Field>
            <Field label="Email">
              <input
                className="cabinet-input"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="ivan@mail.ru"
              />
            </Field>
            <Field label="Пароль">
              <input
                className="cabinet-input"
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Минимум 6 символов"
              />
            </Field>
            <CabinetButton type="submit" variant="primary" className="cabinet-btn--block" disabled={submitting}>
              {submitting ? "Регистрация..." : "Зарегистрироваться →"}
            </CabinetButton>
          </form>
        )}
      </div>
    </div>
  );
}

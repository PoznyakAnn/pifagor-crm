import { useCabinet } from "./context";
import { AuthForm } from "./AuthForm";
import { AdminPanel } from "./panels/AdminPanel";
import { TutorPanel } from "./panels/TutorPanel";
import { ParentPanel } from "./panels/ParentPanel";
import { ChildPanel } from "./panels/ChildPanel";
import { CabinetButton, CabinetLoading } from "./components/Ui";
import { fullName, ROLE_LABELS } from "./utils";

export function CabinetApp() {
  const { user, loading, logout } = useCabinet();

  if (loading) {
    return <CabinetLoading />;
  }

  if (!user) {
    return <AuthForm />;
  }

  const displayName = fullName(user.first_name, user.last_name, user.email);

  return (
    <div className="cabinet-app">
      <div className="cabinet-topbar">
        <div>
          <h1 className="cabinet-topbar__title text-h1-unbounded">Личный кабинет</h1>
          <p className="cabinet-topbar__subtitle text-h3">
            {displayName} · {ROLE_LABELS[user.role]}
          </p>
        </div>
        <CabinetButton onClick={logout}>Выйти</CabinetButton>
      </div>

      {user.role === "admin" && <AdminPanel user={user} />}
      {user.role === "tutor" && <TutorPanel user={user} />}
      {user.role === "parent" && <ParentPanel user={user} />}
      {user.role === "child" && <ChildPanel user={user} />}
    </div>
  );
}

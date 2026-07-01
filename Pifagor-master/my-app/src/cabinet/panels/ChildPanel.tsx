import { useEffect, useState } from "react";
import { fetchHomeworks, submitHomework } from "../../api/cabinet";
import type { ApiHomework, ApiUser } from "../../api/types";
import { useCabinet } from "../context";
import {
  CabinetBadge,
  CabinetButton,
  CabinetCard,
  CabinetLoading,
  CabinetTabs,
} from "../components/Ui";
import { ScheduleSection } from "../components/ScheduleSection";

const TABS = [
  { id: "schedule", label: "Расписание" },
  { id: "homework", label: "Домашнее задание" },
];

export function ChildPanel({ user }: { user: ApiUser }) {
  const { toast } = useCabinet();
  const [tab, setTab] = useState("schedule");
  const [month, setMonth] = useState(() => new Date());
  const [homeworks, setHomeworks] = useState<ApiHomework[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHomeworks = async () => {
    setLoading(true);
    try {
      setHomeworks(await fetchHomeworks());
    } catch {
      setHomeworks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "homework") loadHomeworks();
  }, [tab]);

  const markDone = async (id: number) => {
    try {
      await submitHomework(id);
      toast("Отмечено как выполненное");
      await loadHomeworks();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  };

  return (
    <>
      <CabinetTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "schedule" && (
        <ScheduleSection
          user={user}
          month={month}
          onMonthChange={(dir) =>
            setMonth((m) => new Date(m.getFullYear(), m.getMonth() + dir, 1))
          }
          title="Мои занятия"
        />
      )}

      {tab === "homework" && (
        loading ? <CabinetLoading /> : homeworks.length === 0 ? (
          <div className="cabinet-empty">Домашних заданий нет</div>
        ) : (
          homeworks.map((h) => (
            <CabinetCard key={h.id}>
              <div className="cabinet-inline-actions cabinet-inline-actions--between">
                <CabinetBadge variant={h.is_done ? "green" : "amber"}>
                  {h.is_done ? "Выполнено" : "Не выполнено"}
                </CabinetBadge>
                <span className="cabinet-muted">{(h.created_at || "").slice(0, 10)}</span>
              </div>
              <p className="cabinet-hw-text">{h.description}</p>
              {!h.is_done && (
                <CabinetButton variant="success" size="sm" onClick={() => markDone(h.id)}>
                  ✓ Выполнено
                </CabinetButton>
              )}
            </CabinetCard>
          ))
        )
      )}
    </>
  );
}

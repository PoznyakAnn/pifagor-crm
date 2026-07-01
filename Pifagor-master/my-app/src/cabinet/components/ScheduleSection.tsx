import { useCallback, useEffect, useState } from "react";
import type { ApiLesson } from "../../api/types";
import { fetchLessons } from "../../api/lessons";
import { monthRange } from "../utils";
import {
  CabinetCard,
  CabinetLoading,
  LessonCalendar,
  LessonStatusBadge,
  MonthNav,
} from "./Ui";
import { LessonDetailModal } from "./LessonDetailModal";
import { AddLessonModal } from "./AddLessonModal";
import type { ApiUser } from "../../api/types";
import { CabinetButton } from "./Ui";

export function useSchedule(user: ApiUser, month: Date) {
  const [lessons, setLessons] = useState<ApiLesson[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const range = monthRange(month);
      const data = await fetchLessons(range);
      setLessons(data);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { lessons, loading, reload };
}

export function ScheduleSection({
  user,
  month,
  onMonthChange,
  showTutorStudent = false,
  canAddLesson = false,
  title = "Занятия",
}: {
  user: ApiUser;
  month: Date;
  onMonthChange: (dir: -1 | 1) => void;
  showTutorStudent?: boolean;
  canAddLesson?: boolean;
  title?: string;
}) {
  const { lessons, loading, reload } = useSchedule(user, month);
  const [selectedLesson, setSelectedLesson] = useState<ApiLesson | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <MonthNav
        month={month}
        onChange={onMonthChange}
        actions={
          canAddLesson ? (
            <CabinetButton variant="primary" size="sm" onClick={() => setAddOpen(true)}>
              + Добавить занятие
            </CabinetButton>
          ) : undefined
        }
      />

      <CabinetCard>
        {loading ? <CabinetLoading /> : (
          <LessonCalendar lessons={lessons} month={month} onLessonClick={setSelectedLesson} />
        )}
      </CabinetCard>

      <CabinetCard title={title}>
        {loading ? <CabinetLoading /> : lessons.length === 0 ? (
          <div className="cabinet-empty">Занятий нет</div>
        ) : (
          <div className="cabinet-table-wrap">
            <table className="cabinet-table">
              <thead>
                <tr>
                  <th>Дата</th>
                  <th>Время</th>
                  {showTutorStudent && <th>Ученик</th>}
                  {showTutorStudent && <th>Репетитор</th>}
                  <th>Предмет</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr key={l.id} className="cabinet-table__clickable" onClick={() => setSelectedLesson(l)}>
                    <td>{l.date?.slice(0, 10)}</td>
                    <td>{l.time_start?.slice(0, 5)}</td>
                    {showTutorStudent && <td>{l.student_name ?? "—"}</td>}
                    {showTutorStudent && <td>{l.tutor_name ?? "—"}</td>}
                    <td>{l.subject_name ?? "—"}</td>
                    <td><LessonStatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CabinetCard>

      <LessonDetailModal
        lesson={selectedLesson}
        user={user}
        onClose={() => setSelectedLesson(null)}
        onUpdated={reload}
      />

      {canAddLesson && (
        <AddLessonModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          user={user}
          onCreated={reload}
        />
      )}
    </>
  );
}

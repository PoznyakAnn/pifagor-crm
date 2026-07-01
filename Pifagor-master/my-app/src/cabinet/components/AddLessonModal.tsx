import { useEffect, useState } from "react";
import { apiFetch } from "../../api/client";
import { createLesson, fetchAllStudents } from "../../api/lessons";
import { fetchSubjects } from "../../api/public";
import type { ApiSubject, ApiTutor, ApiUser } from "../../api/types";
import { useCabinet } from "../context";
import { filterAllowedSubjects } from "../../utils/subjects";
import { calcTimeEnd, fullName } from "../utils";
import { CabinetButton, Field, Modal } from "./Ui";

interface AddLessonModalProps {
  open: boolean;
  onClose: () => void;
  user: ApiUser;
  onCreated: () => void;
}

export function AddLessonModal({ open, onClose, user, onCreated }: AddLessonModalProps) {
  const { toast } = useCabinet();
  const [students, setStudents] = useState<{ id: number; name: string }[]>([]);
  const [tutors, setTutors] = useState<{ id: number; name: string }[]>([]);
  const [subjects, setSubjects] = useState<ApiSubject[]>([]);
  const [studentId, setStudentId] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("15:00");
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().slice(0, 10));

    fetchAllStudents()
      .then((list) =>
        setStudents(
          list.map((s) => ({
            id: s.child_profile.id,
            name: fullName(s.first_name, s.last_name, s.email),
          })),
        ),
      )
      .catch(() => setStudents([]));

    fetchSubjects()
      .then((s) => {
        const allowed = filterAllowedSubjects(s);
        setSubjects(allowed);
        if (allowed[0]) setSubjectId(String(allowed[0].id));
      })
      .catch(() => setSubjects([]));

    if (user.role === "admin") {
      apiFetch<ApiTutor[]>("/api/v1/users/tutors/public")
        .then((list) =>
          setTutors(
            list.map((t) => ({
              id: t.id,
              name: fullName(t.user.first_name, t.user.last_name, t.user.email),
            })),
          ),
        )
        .catch(() => setTutors([]));
    }
  }, [open, user.role]);

  const handleSubmit = async () => {
    let resolvedTutorId: number | null = null;
    if (user.role === "admin") {
      resolvedTutorId = tutorId ? parseInt(tutorId, 10) : null;
      if (!resolvedTutorId) {
        toast("Выберите репетитора", "error");
        return;
      }
    } else if (user.role === "tutor") {
      resolvedTutorId = user.tutor_profile?.id ?? null;
      if (!resolvedTutorId) {
        toast("Профиль репетитора не найден", "error");
        return;
      }
    } else {
      toast("Только репетитор или администратор может создавать занятия", "error");
      return;
    }

    if (!studentId || !subjectId || !date || !time) {
      toast("Заполните все поля", "error");
      return;
    }

    const timeStart = time.split(":").length === 2 ? `${time}:00` : time;

    setSubmitting(true);
    try {
      await createLesson({
        tutor_id: resolvedTutorId,
        child_id: parseInt(studentId, 10),
        subject_id: parseInt(subjectId, 10),
        date,
        time_start: timeStart,
        time_end: calcTimeEnd(time, duration),
        is_free_trial: false,
        notes: "",
      });
      toast("Занятие добавлено");
      onClose();
      onCreated();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Не удалось сохранить", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Новое занятие" onClose={onClose}>
      {user.role === "admin" && (
        <Field label="Репетитор">
          <select className="cabinet-input" value={tutorId} onChange={(e) => setTutorId(e.target.value)}>
            <option value="">Выберите...</option>
            {tutors.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Ученик">
        <select className="cabinet-input" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
          <option value="">Выберите...</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Предмет">
        <select className="cabinet-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Дата">
        <input className="cabinet-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Время">
        <input className="cabinet-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </Field>
      <Field label="Длительность (мин)">
        <input
          className="cabinet-input"
          type="number"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value, 10) || 60)}
        />
      </Field>
      <div className="cabinet-modal__actions">
        <CabinetButton variant="primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Сохранение..." : "Добавить"}
        </CabinetButton>
        <CabinetButton onClick={onClose}>Отмена</CabinetButton>
      </div>
    </Modal>
  );
}

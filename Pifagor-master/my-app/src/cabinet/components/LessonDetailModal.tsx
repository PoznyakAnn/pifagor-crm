import { useEffect, useState } from "react";
import type { ApiLesson, ApiUser } from "../../api/types";
import { createHomework } from "../../api/cabinet";
import { updateLesson } from "../../api/lessons";
import { useCabinet } from "../context";
import { formatTimeStart } from "../utils";
import {
  CabinetButton,
  Field,
  LessonStatusBadge,
  Modal,
} from "./Ui";

interface LessonDetailModalProps {
  lesson: ApiLesson | null;
  user: ApiUser;
  onClose: () => void;
  onUpdated: () => void;
}

export function LessonDetailModal({
  lesson,
  user,
  onClose,
  onUpdated,
}: LessonDetailModalProps) {
  const { toast } = useCabinet();
  const [status, setStatus] = useState(lesson?.status ?? "scheduled");
  const [hwText, setHwText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (lesson) setStatus(lesson.status);
  }, [lesson]);

  if (!lesson) return null;

  const canEditStatus = user.role === "tutor" || user.role === "admin";
  const canAddHw = user.role === "tutor";

  const handleStatusSave = async () => {
    setSaving(true);
    try {
      await updateLesson(lesson.id, { status });
      toast("Статус обновлён");
      onUpdated();
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddHomework = async () => {
    if (!hwText.trim()) {
      toast("Введите текст задания", "error");
      return;
    }
    try {
      await createHomework({
        lesson_id: lesson.id,
        child_id: lesson.child_id,
        description: hwText.trim(),
      });
      toast("Домашнее задание добавлено");
      setHwText("");
      onClose();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    }
  };

  return (
    <Modal
      open={Boolean(lesson)}
      title={`${lesson.subject_name ?? "Занятие"} · ${lesson.date?.slice(0, 10)}`}
      onClose={onClose}
    >
      <div className="cabinet-lesson-detail__badges">
        <LessonStatusBadge status={lesson.status} />
      </div>
      <p className="cabinet-lesson-detail__meta">
        Ученик: <strong>{lesson.student_name ?? "—"}</strong>
        · Репетитор: <strong>{lesson.tutor_name ?? "—"}</strong>
        <br />
        Время: {formatTimeStart(lesson.time_start)}–{formatTimeStart(lesson.time_end)}
      </p>

      {canEditStatus && (
        <Field label="Изменить статус">
          <select
            className="cabinet-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="scheduled">Предстоит</option>
            <option value="completed">Проведено</option>
            <option value="cancelled">Отменено</option>
            <option value="rescheduled">Перенесено</option>
          </select>
        </Field>
      )}

      {canEditStatus && (
        <div className="cabinet-modal__actions">
          <CabinetButton variant="primary" size="sm" onClick={handleStatusSave} disabled={saving}>
            Сохранить статус
          </CabinetButton>
        </div>
      )}

      {canAddHw && (
        <div className="cabinet-lesson-detail__hw">
          <h4 className="text-h3">Домашнее задание</h4>
          <Field label="Текст задания">
            <textarea
              className="cabinet-input cabinet-input--textarea"
              rows={3}
              value={hwText}
              onChange={(e) => setHwText(e.target.value)}
              placeholder="Текст задания..."
            />
          </Field>
          <CabinetButton variant="primary" size="sm" onClick={handleAddHomework}>
            Добавить ДЗ
          </CabinetButton>
        </div>
      )}
    </Modal>
  );
}

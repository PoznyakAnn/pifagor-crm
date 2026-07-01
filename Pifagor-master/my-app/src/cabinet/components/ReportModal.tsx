import { useEffect, useState } from "react";
import { createReport } from "../../api/cabinet";
import { fetchTutorStudents } from "../../api/lessons";
import { useCabinet } from "../context";
import { fullName } from "../utils";
import { CabinetButton, Field, Modal } from "./Ui";

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ReportModal({ open, onClose, onCreated }: ReportModalProps) {
  const { toast } = useCabinet();
  const [students, setStudents] = useState<{ id: number; name: string }[]>([]);
  const [childId, setChildId] = useState("");
  const [lessonCount, setLessonCount] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetchTutorStudents()
      .then((list) => {
        const mapped = list.map((s) => ({
          id: s.child_profile_id,
          name: fullName(s.first_name, s.last_name, s.email),
        }));
        setStudents(mapped);
        if (mapped[0]) setChildId(String(mapped[0].id));
      })
      .catch(() => setStudents([]));
  }, [open]);

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast("Введите текст отчёта", "error");
      return;
    }
    if (!childId) {
      toast("Выберите ученика", "error");
      return;
    }

    setSubmitting(true);
    try {
      await createReport({
        child_id: parseInt(childId, 10),
        subject_id: 1,
        content: content.trim(),
        lesson_count: lessonCount,
      });
      toast("Отчёт сохранён");
      onClose();
      onCreated();
      setContent("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ошибка", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="Отчёт за занятия" onClose={onClose}>
      <Field label="Ученик">
        <select className="cabinet-input" value={childId} onChange={(e) => setChildId(e.target.value)}>
          {students.length === 0 && <option value="">Нет учеников</option>}
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </Field>
      <Field label="Кол-во занятий в отчёте">
        <input
          className="cabinet-input"
          type="number"
          min={1}
          value={lessonCount}
          onChange={(e) => setLessonCount(parseInt(e.target.value, 10) || 5)}
        />
      </Field>
      <Field label="Текст отчёта">
        <textarea
          className="cabinet-input cabinet-input--textarea"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Опишите прогресс ученика..."
        />
      </Field>
      <div className="cabinet-modal__actions">
        <CabinetButton variant="primary" onClick={handleSubmit} disabled={submitting}>
          Сохранить
        </CabinetButton>
        <CabinetButton onClick={onClose}>Отмена</CabinetButton>
      </div>
    </Modal>
  );
}

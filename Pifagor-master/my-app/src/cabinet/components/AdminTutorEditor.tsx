import { useState } from "react";
import type { ApiSubject, ApiTutor } from "../../api/types";
import { deleteAdminTutor, updateAdminTutor } from "../../api/admin";
import { CabinetBadge, CabinetButton, CabinetCard } from "./Ui";
import { TutorProfileForm, type TutorProfileFormValues } from "./TutorProfileForm";
import { fullName } from "../utils";

interface AdminTutorEditorProps {
  tutor: ApiTutor;
  subjects: ApiSubject[];
  onUpdated: (tutor: ApiTutor) => void;
  onDeleted: (tutorId: number) => void;
}

export function AdminTutorEditor({ tutor, subjects, onUpdated, onDeleted }: AdminTutorEditorProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async (values: TutorProfileFormValues) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAdminTutor(tutor.id, {
        bio: values.bio.trim() || undefined,
        education: values.education.trim() || undefined,
        experience_years: values.experience_years ? Number(values.experience_years) : undefined,
        rate_per_hour: values.rate_per_hour ? Number(values.rate_per_hour) : undefined,
        is_published: values.is_published,
        subject_ids: values.subject_ids,
        user: {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          avatar_url: values.avatar_url.trim() || undefined,
        },
      });
      onUpdated(updated);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteAdminTutor(tutor.id);
      onDeleted(tutor.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось удалить");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <CabinetCard
      title={fullName(tutor.user.first_name, tutor.user.last_name)}
      actions={
        <div className="cabinet-inline-actions">
          <CabinetBadge variant={tutor.is_published ? "green" : "gray"}>
            {tutor.is_published ? "На сайте" : "Скрыт"}
          </CabinetBadge>
          <CabinetButton size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Свернуть" : "Редактировать"}
          </CabinetButton>
          <CabinetButton
            size="sm"
            variant="danger"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting ? "Удаление…" : confirmDelete ? "Подтвердить удаление" : "Удалить"}
          </CabinetButton>
        </div>
      }
    >
      <div className="cabinet-person-card__email">{tutor.user.email}</div>
      <div className="cabinet-tutor-summary">
        {tutor.subjects.length > 0 ? (
          tutor.subjects.map((s) => (
            <CabinetBadge key={s.id} variant="blue">{s.name}</CabinetBadge>
          ))
        ) : (
          <span className="cabinet-muted">Предметы не назначены</span>
        )}
      </div>
      {tutor.bio && <p className="cabinet-muted">{tutor.bio}</p>}

      {error && <div className="cabinet-alert cabinet-alert--error">{error}</div>}
      {confirmDelete && (
        <div className="cabinet-alert cabinet-alert--error">
          Нажмите «Подтвердить удаление» ещё раз. Репетиторов с историей занятий удалить нельзя.
        </div>
      )}

      {open && (
        <>
          <TutorProfileForm
            mode="admin"
            tutor={tutor}
            subjects={subjects}
            saving={saving}
            onSave={handleSave}
          />
        </>
      )}
    </CabinetCard>
  );
}

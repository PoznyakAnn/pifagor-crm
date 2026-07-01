import { useEffect, useState } from "react";
import type { ApiSubject, ApiTutor } from "../../api/types";
import { CabinetButton, Field } from "./Ui";

export interface TutorProfileFormValues {
  first_name: string;
  last_name: string;
  avatar_url: string;
  bio: string;
  education: string;
  experience_years: string;
  rate_per_hour: string;
  is_published: boolean;
  subject_ids: number[];
}

interface TutorProfileFormProps {
  mode: "admin" | "self" | "view";
  tutor: ApiTutor;
  subjects: ApiSubject[];
  saving?: boolean;
  onSave?: (values: TutorProfileFormValues) => Promise<void>;
}

function toFormValues(tutor: ApiTutor): TutorProfileFormValues {
  return {
    first_name: tutor.user.first_name,
    last_name: tutor.user.last_name,
    avatar_url: tutor.user.avatar_url ?? "",
    bio: tutor.bio ?? "",
    education: tutor.education ?? "",
    experience_years: tutor.experience_years != null ? String(tutor.experience_years) : "",
    rate_per_hour: tutor.rate_per_hour != null ? String(tutor.rate_per_hour) : "",
    is_published: tutor.is_published,
    subject_ids: tutor.subjects.map((s) => s.id),
  };
}

export function TutorProfileForm({
  mode,
  tutor,
  subjects,
  saving = false,
  onSave,
}: TutorProfileFormProps) {
  const [values, setValues] = useState(() => toFormValues(tutor));

  useEffect(() => {
    setValues(toFormValues(tutor));
  }, [tutor]);

  const toggleSubject = (subjectId: number) => {
    setValues((prev) => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter((id) => id !== subjectId)
        : [...prev.subject_ids, subjectId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) await onSave(values);
  };

  if (mode === "view") {
    return (
      <div className="cabinet-tutor-form cabinet-tutor-form--view">
        <div className="cabinet-grid-2">
          <Field label="Имя">
            <div className="cabinet-field-value">{tutor.user.first_name || "—"}</div>
          </Field>
          <Field label="Фамилия">
            <div className="cabinet-field-value">{tutor.user.last_name || "—"}</div>
          </Field>
        </div>

        <Field label="Email">
          <div className="cabinet-field-value">{tutor.user.email}</div>
        </Field>

        {tutor.user.avatar_url && (
          <Field label="Фото">
            <div className="cabinet-field-value">{tutor.user.avatar_url}</div>
          </Field>
        )}

        <Field label="Описание для сайта">
          <div className="cabinet-field-value">{tutor.bio || "—"}</div>
        </Field>

        <Field label="Образование">
          <div className="cabinet-field-value">{tutor.education || "—"}</div>
        </Field>

        <div className="cabinet-grid-2">
          <Field label="Опыт (лет)">
            <div className="cabinet-field-value">
              {tutor.experience_years != null ? tutor.experience_years : "—"}
            </div>
          </Field>
          <Field label="Ставка (BYN/час)">
            <div className="cabinet-field-value">
              {tutor.rate_per_hour != null ? tutor.rate_per_hour : "—"}
            </div>
          </Field>
        </div>

        <p className="cabinet-muted">
          Профиль редактирует администратор. Для изменений обратитесь в школу.
        </p>
      </div>
    );
  }

  return (
    <form className="cabinet-tutor-form" onSubmit={handleSubmit}>
      <div className="cabinet-grid-2">
        <Field label="Имя">
          <input
            className="cabinet-input"
            value={values.first_name}
            onChange={(e) => setValues((v) => ({ ...v, first_name: e.target.value }))}
          />
        </Field>
        <Field label="Фамилия">
          <input
            className="cabinet-input"
            value={values.last_name}
            onChange={(e) => setValues((v) => ({ ...v, last_name: e.target.value }))}
          />
        </Field>
      </div>

      <Field label="Фото (URL)">
        <input
          className="cabinet-input"
          value={values.avatar_url}
          onChange={(e) => setValues((v) => ({ ...v, avatar_url: e.target.value }))}
          placeholder="https://..."
        />
      </Field>

      <Field label="Описание для сайта">
        <textarea
          className="cabinet-input cabinet-textarea"
          rows={3}
          value={values.bio}
          onChange={(e) => setValues((v) => ({ ...v, bio: e.target.value }))}
          placeholder="Кратко о репетиторе — показывается на карточке"
        />
      </Field>

      <Field label="Образование">
        <textarea
          className="cabinet-input cabinet-textarea"
          rows={2}
          value={values.education}
          onChange={(e) => setValues((v) => ({ ...v, education: e.target.value }))}
        />
      </Field>

      <div className="cabinet-grid-2">
        <Field label="Опыт (лет)">
          <input
            className="cabinet-input"
            type="number"
            min={0}
            value={values.experience_years}
            onChange={(e) => setValues((v) => ({ ...v, experience_years: e.target.value }))}
          />
        </Field>
        <Field label="Ставка (BYN/час)">
          <input
            className="cabinet-input"
            type="number"
            min={0}
            step="0.01"
            value={values.rate_per_hour}
            onChange={(e) => setValues((v) => ({ ...v, rate_per_hour: e.target.value }))}
          />
        </Field>
      </div>

      {mode === "admin" && (
        <>
          <Field label="Предметы на сайте">
            <div className="cabinet-subject-checkboxes">
              {subjects.map((subject) => (
                <label key={subject.id} className="cabinet-subject-check">
                  <input
                    type="checkbox"
                    checked={values.subject_ids.includes(subject.id)}
                    onChange={() => toggleSubject(subject.id)}
                  />
                  <span>{subject.name}</span>
                </label>
              ))}
            </div>
          </Field>

          <label className="cabinet-checkbox-row">
            <input
              type="checkbox"
              checked={values.is_published}
              onChange={(e) => setValues((v) => ({ ...v, is_published: e.target.checked }))}
            />
            <span>Опубликовать на сайте</span>
          </label>
        </>
      )}

      {mode === "self" && (
        <p className="cabinet-muted">
          Публикация на сайте и предметы назначает администратор после проверки профиля.
        </p>
      )}

      <CabinetButton type="submit" variant="primary" disabled={saving}>
        {saving ? "Сохранение…" : "Сохранить профиль"}
      </CabinetButton>
    </form>
  );
}

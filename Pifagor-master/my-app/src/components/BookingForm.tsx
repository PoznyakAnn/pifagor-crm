import { useMemo, useState } from "react";
import { submitLeadRequest } from "../api/public";
import type { ApiSubject } from "../api/types";
import { findSubjectId } from "../utils/tutors";
import { filterAllowedSubjects, getSubjectOptionNames } from "../utils/subjects";

interface BookingFormProps {
  defaultSubject?: string;
  message?: string;
  formId?: string;
  formClassName?: string;
  subjects?: ApiSubject[];
  submitLabel?: string;
}

export function BookingForm({
  defaultSubject = "",
  message,
  formId = "top-booking-form",
  formClassName = "banner-form",
  subjects,
  submitLabel = "Записаться",
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  const allowedSubjects = useMemo(
    () => (subjects?.length ? filterAllowedSubjects(subjects) : undefined),
    [subjects],
  );

  const subjectOptions = useMemo(
    () => getSubjectOptionNames(allowedSubjects),
    [allowedSubjects],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim() || !phone.trim()) {
      setFeedback({ type: "error", text: "Заполните имя и телефон" });
      return;
    }

    setSubmitting(true);
    try {
      await submitLeadRequest({
        name: name.trim(),
        phone: phone.trim(),
        subject_id: allowedSubjects ? findSubjectId(allowedSubjects, subject) : undefined,
        message: message ?? (subject ? `Предмет: ${subject}` : undefined),
      });
      setFeedback({
        type: "success",
        text: "Заявка отправлена! Мы свяжемся с вами в ближайшее время.",
      });
      setName("");
      setPhone("");
      setSubject(defaultSubject);
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Не удалось отправить заявку",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id={formId} className={formClassName} onSubmit={handleSubmit}>
      <div className="banner-form-info">
        <div className="banner-form-small">
          Не уверены в знаниях<span className="banner-form-punct">?</span>
        </div>
        <div className="banner-form-big">Запишитесь на пробное!</div>
      </div>

      <input
        type="text"
        placeholder="Имя родителя"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={submitting}
      />

      <input
        type="tel"
        placeholder="Номер телефона"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        disabled={submitting}
      />

      <div className="select-wrapper">
        <div
          className={`select-trigger ${!subject ? "placeholder" : ""}`}
          onClick={() => !submitting && setIsOpen(!isOpen)}
        >
          <span>{subject || "Предмет"}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={`select-arrow-icon ${isOpen ? "is-open" : ""}`}
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {isOpen && (
          <div className="select-dropdown">
            {subjectOptions.map((title) => (
              <div
                key={title}
                className={`select-option ${subject === title ? "selected" : ""}`}
                onClick={() => {
                  setSubject(title);
                  setIsOpen(false);
                }}
              >
                {title}
              </div>
            ))}
          </div>
        )}
      </div>

      {feedback && (
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "8px 12px",
            borderRadius: 8,
            fontSize: 14,
            background: feedback.type === "success" ? "#EAF3DE" : "#FCEBEB",
            color: feedback.type === "success" ? "#3B6D11" : "#A32D2D",
          }}
        >
          {feedback.text}
        </div>
      )}

      <button type="submit" className="banner-form-btn" disabled={submitting}>
        {submitting ? "Отправка…" : submitLabel}
      </button>
    </form>
  );
}

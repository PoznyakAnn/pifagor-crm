import type { ReactNode } from "react";
import type { ApiLesson } from "../api/types";
import { DAYS_RU, formatTimeStart, monthLabel, statusBadgeClass, statusLabel } from "../utils";

export function CabinetTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="cabinet-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`cabinet-tab${active === tab.id ? " is-active" : ""}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function CabinetCard({
  title,
  children,
  actions,
}: {
  title?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="cabinet-card">
      {(title || actions) && (
        <div className="cabinet-card__head">
          {title && <h3 className="cabinet-card__title text-h2">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function CabinetBadge({
  children,
  variant = "gray",
}: {
  children: ReactNode;
  variant?: string;
}) {
  return <span className={`cabinet-badge cabinet-badge--${variant}`}>{children}</span>;
}

export function CabinetButton({
  children,
  onClick,
  type = "button",
  variant = "default",
  size = "md",
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "default" | "primary" | "success" | "danger";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`cabinet-btn cabinet-btn--${variant} cabinet-btn--${size}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export function CabinetAlert({
  children,
  variant = "info",
}: {
  children: ReactNode;
  variant?: "info" | "success" | "error";
}) {
  return <div className={`cabinet-alert cabinet-alert--${variant}`}>{children}</div>;
}

export function CabinetEmpty({ children }: { children: ReactNode }) {
  return <div className="cabinet-empty">{children}</div>;
}

export function CabinetLoading() {
  return <div className="cabinet-loading"><span className="cabinet-spinner" /> Загрузка...</div>;
}

export function CabinetTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  if (!rows.length) return <CabinetEmpty>Нет данных</CabinetEmpty>;
  return (
    <div className="cabinet-table-wrap">
      <table className="cabinet-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr key={i}>
              {cells.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MonthNav({
  month,
  onChange,
  actions,
}: {
  month: Date;
  onChange: (dir: -1 | 1) => void;
  actions?: ReactNode;
}) {
  return (
    <div className="cabinet-month-nav">
      <div className="cabinet-month-nav__left">
        <CabinetButton size="sm" onClick={() => onChange(-1)}>◀</CabinetButton>
        <span className="cabinet-month-nav__label text-h3">{monthLabel(month)}</span>
        <CabinetButton size="sm" onClick={() => onChange(1)}>▶</CabinetButton>
      </div>
      {actions}
    </div>
  );
}

function lessonCalClass(lesson: ApiLesson) {
  if (lesson.status === "cancelled") return "cancelled";
  if (lesson.status === "completed") return "done";
  if (lesson.is_paid) return "paid";
  if (lesson.status === "scheduled") return "upcoming";
  return "unpaid";
}

export function LessonCalendar({
  lessons,
  month,
  onLessonClick,
}: {
  lessons: ApiLesson[];
  month: Date;
  onLessonClick?: (lesson: ApiLesson) => void;
}) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const last = new Date(year, m + 1, 0);
  let startDow = first.getDay();
  if (startDow === 0) startDow = 7;
  const today = new Date().toISOString().slice(0, 10);

  const cells: ReactNode[] = DAYS_RU.map((d) => (
    <div key={d} className="cabinet-cal-header">{d}</div>
  ));

  for (let i = 1; i < startDow; i++) {
    cells.push(<div key={`e${i}`} className="cabinet-cal-day cabinet-cal-day--empty" />);
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dayLessons = lessons.filter((l) => l.date?.slice(0, 10) === dateStr);
    const isToday = dateStr === today;

    cells.push(
      <div
        key={dateStr}
        className={`cabinet-cal-day${dayLessons.length ? " cabinet-cal-day--has" : ""}${isToday ? " cabinet-cal-day--today" : ""}`}
      >
        <div className="cabinet-cal-day-num">{d}</div>
        {dayLessons.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`cabinet-cal-lesson cabinet-cal-lesson--${lessonCalClass(l)}`}
            title={l.subject_name ?? ""}
            onClick={() => onLessonClick?.(l)}
          >
            {formatTimeStart(l.time_start)} {l.subject_name ?? ""}
          </button>
        ))}
      </div>,
    );
  }

  return <div className="cabinet-cal-grid">{cells}</div>;
}

export function LessonStatusBadge({ status }: { status: string }) {
  const variant = statusBadgeClass(status).replace("cabinet-badge--", "");
  return <CabinetBadge variant={variant}>{statusLabel(status)}</CabinetBadge>;
}

export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="cabinet-modal-overlay" onClick={onClose}>
      <div className="cabinet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cabinet-modal__title">
          <span className="text-h3">{title}</span>
          <CabinetButton size="sm" onClick={onClose}>✕</CabinetButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="cabinet-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function StatGrid({ items }: { items: { value: string | number; label: string }[] }) {
  return (
    <div className="cabinet-stats">
      {items.map((item) => (
        <div key={item.label} className="cabinet-stat-card">
          <div className="cabinet-stat-value">{item.value}</div>
          <div className="cabinet-stat-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ReportCard({
  lessonCount,
  date,
  student,
  content,
}: {
  lessonCount: number;
  date: string;
  student?: string;
  content: string;
}) {
  return (
    <div className="cabinet-report-card">
      <div className="cabinet-report-card__head">
        <CabinetBadge variant="purple">Отчёт за {lessonCount} занятий</CabinetBadge>
        <span className="cabinet-report-card__meta">
          {date.slice(0, 10)} · {student ?? ""}
        </span>
      </div>
      <p className="cabinet-report-card__text">{content}</p>
    </div>
  );
}

export function PersonCard({
  name,
  email,
  badge,
}: {
  name: string;
  email: string;
  badge: ReactNode;
}) {
  return (
    <div className="cabinet-person-card">
      <div>
        <div className="cabinet-person-card__name">{name}</div>
        <div className="cabinet-person-card__email">{email}</div>
      </div>
      {badge}
    </div>
  );
}

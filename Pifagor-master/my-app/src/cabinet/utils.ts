export const MONTHS_RU = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const DAYS_RU = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export const ROLE_LABELS: Record<string, string> = {
  admin: "Администратор",
  tutor: "Репетитор",
  parent: "Родитель",
  child: "Ученик",
};

export function formatDate(value: string, opts?: Intl.DateTimeFormatOptions) {
  try {
    return new Date(value).toLocaleDateString("ru-RU", opts ?? {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

export function formatShortDate(value: string) {
  return (value || "").slice(0, 10);
}

export function monthParam(month: Date) {
  return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`;
}

export function monthRange(month: Date) {
  const ym = monthParam(month);
  const year = month.getFullYear();
  const m = month.getMonth() + 1;
  const lastDay = new Date(year, m, 0).getDate();
  return {
    date_from: `${ym}-01`,
    date_to: `${ym}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function monthLabel(month: Date) {
  return `${MONTHS_RU[month.getMonth()]} ${month.getFullYear()}`;
}

export function statusLabel(status: string) {
  if (status === "scheduled") return "Предстоит";
  if (status === "completed" || status === "done") return "Проведено";
  if (status === "cancelled") return "Отменено";
  if (status === "rescheduled") return "Перенесено";
  return status;
}

export function statusBadgeClass(status: string) {
  if (status === "scheduled") return "cabinet-badge--blue";
  if (status === "completed" || status === "done") return "cabinet-badge--green";
  if (status === "cancelled") return "cabinet-badge--red";
  if (status === "rescheduled") return "cabinet-badge--amber";
  return "cabinet-badge--gray";
}

export function roleBadgeClass(role: string) {
  if (role === "admin") return "cabinet-badge--red";
  if (role === "tutor") return "cabinet-badge--purple";
  if (role === "parent") return "cabinet-badge--blue";
  if (role === "child") return "cabinet-badge--green";
  return "cabinet-badge--gray";
}

export function fullName(first?: string, last?: string, fallback = "") {
  const name = `${last ?? ""} ${first ?? ""}`.trim();
  return name || fallback;
}

export function calcTimeEnd(timeStart: string, durationMin: number) {
  const [h, m] = timeStart.split(":").map(Number);
  const end = new Date();
  end.setHours(h, m + durationMin, 0, 0);
  return `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}:00`;
}

export function formatTimeStart(time: string) {
  return time?.slice(0, 5) ?? "";
}

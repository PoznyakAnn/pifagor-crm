import { apiFetch } from "./client";
import type { ApiTutor, EmailReceipt, FinanceReportRow, InviteCode, ApiUser } from "./types";

export function fetchInviteCodes() {
  return apiFetch<InviteCode[]>("/api/v1/admin/invite-codes", {}, true);
}

export function createInviteCodes(payload: { role: string; description?: string }) {
  return apiFetch<InviteCode[]>("/api/v1/admin/invite-codes", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function fetchAllUsers() {
  return apiFetch<ApiUser[]>("/api/v1/users/", {}, true);
}

export function fetchFinanceReport(weekStart?: string) {
  const q = weekStart ? `?week_start=${weekStart}` : "";
  return apiFetch<FinanceReportRow[]>(`/api/v1/admin/finance-report${q}`, {}, true);
}

export function fetchReceipts() {
  return apiFetch<EmailReceipt[]>("/api/v1/admin/receipts", {}, true);
}

export function parseEmails() {
  return apiFetch<{ new_receipts: number; message: string }>(
    "/api/v1/admin/receipts/parse-emails",
    { method: "POST", body: JSON.stringify({}) },
    true,
  );
}

export interface AdminTutorUpdatePayload {
  bio?: string;
  education?: string;
  experience_years?: number;
  rate_per_hour?: number;
  is_published?: boolean;
  subject_ids?: number[];
  user?: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export function fetchAdminTutors() {
  return apiFetch<ApiTutor[]>("/api/v1/admin/tutors", {}, true);
}

export function updateAdminTutor(tutorId: number, payload: AdminTutorUpdatePayload) {
  return apiFetch<ApiTutor>(`/api/v1/admin/tutors/${tutorId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function deleteAdminTutor(tutorId: number) {
  return apiFetch<void>(`/api/v1/admin/tutors/${tutorId}`, {
    method: "DELETE",
  }, true);
}

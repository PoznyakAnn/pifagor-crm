import { apiFetch, apiFileUrl, apiUpload } from "./client";
import type {
  ApiAct,
  ApiComment,
  ApiHomework,
  ApiNotification,
  ApiParentContract,
  ApiPayment,
  ApiReport,
  ApiTutorContract,
  TutorFinance,
} from "./types";

export function fetchHomeworks(childId?: number) {
  const q = childId ? `?child_id=${childId}` : "";
  return apiFetch<ApiHomework[]>(`/api/v1/homeworks${q}`, {}, true);
}

export function createHomework(payload: {
  lesson_id: number;
  child_id: number;
  description: string;
}) {
  return apiFetch<ApiHomework>("/api/v1/homeworks", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function submitHomework(hwId: number, submissionUrl?: string) {
  return apiFetch<{ ok: boolean }>(`/api/v1/homeworks/${hwId}/submit`, {
    method: "PATCH",
    body: JSON.stringify({ submission_url: submissionUrl ?? "done" }),
  }, true);
}

export function fetchPayments(childId?: number) {
  const q = childId ? `?child_id=${childId}` : "";
  return apiFetch<ApiPayment[]>(`/api/v1/payments${q}`, {}, true);
}

export function markPaymentPaid(paymentId: number) {
  return apiFetch<{ ok: boolean }>(`/api/v1/payments/${paymentId}/mark-paid`, {
    method: "PATCH",
  }, true);
}

export function fetchReports(childId?: number) {
  const q = childId ? `?child_id=${childId}` : "";
  return apiFetch<ApiReport[]>(`/api/v1/reports${q}`, {}, true);
}

export function createReport(payload: {
  child_id: number;
  subject_id: number;
  content: string;
  lesson_count: number;
}) {
  return apiFetch<ApiReport>("/api/v1/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function fetchNotifications() {
  return apiFetch<ApiNotification[]>("/api/v1/notifications", {}, true);
}

export function markNotificationRead(id: number) {
  return apiFetch<{ ok: boolean }>(`/api/v1/notifications/${id}/read`, {
    method: "PATCH",
  }, true);
}

export function fetchComments() {
  return apiFetch<ApiComment[]>("/api/v1/comments", {}, true);
}

export function createComment(payload: { tutor_id: number; child_id: number; text: string }) {
  return apiFetch<ApiComment>("/api/v1/comments", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function fetchActs() {
  return apiFetch<ApiAct[]>("/api/v1/acts", {}, true);
}

export function fetchParentContracts() {
  return apiFetch<ApiParentContract[]>("/api/v1/contracts/parent", {}, true);
}

export function signParentContract(contractId: number, signedFileUrl: string) {
  return apiFetch<{ ok: boolean }>(
    `/api/v1/contracts/parent/${contractId}/sign?signed_file_url=${encodeURIComponent(signedFileUrl)}`,
    { method: "PATCH" },
    true,
  );
}

export function fetchTutorContracts() {
  return apiFetch<ApiTutorContract[]>("/api/v1/contracts/tutor", {}, true);
}

export function fetchTutorFinance() {
  return apiFetch<TutorFinance>("/api/v1/tutor/finance", {}, true);
}

export function downloadActBlankUrl() {
  return apiFileUrl("/api/v1/tutor/act/blank");
}

export function uploadTutorAct(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiUpload<{ ok?: boolean }>("/api/v1/tutor/acts", fd);
}

export function uploadParentSignedContract(contractId: number, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  return apiUpload<{ ok?: boolean }>(`/api/v1/parent/contract/${contractId}/signed`, fd);
}

export function parentContractFileUrl(contractId: number) {
  return apiFileUrl(`/api/v1/parent/contract/${contractId}/file`);
}

import { apiFetch } from "./client";
import type { ApiLesson, ApiStudentListItem, ApiTutorStudent } from "./types";

export function fetchLessons(params?: {
  date_from?: string;
  date_to?: string;
  status?: string;
}) {
  const search = new URLSearchParams();
  if (params?.date_from) search.set("date_from", params.date_from);
  if (params?.date_to) search.set("date_to", params.date_to);
  if (params?.status) search.set("status", params.status);
  const q = search.toString();
  return apiFetch<ApiLesson[]>(`/api/v1/lessons/${q ? `?${q}` : ""}`, {}, true);
}

export function createLesson(payload: {
  tutor_id: number;
  child_id: number;
  subject_id: number;
  date: string;
  time_start: string;
  time_end: string;
  is_free_trial?: boolean;
  notes?: string;
}) {
  return apiFetch<ApiLesson>("/api/v1/lessons/", {
    method: "POST",
    body: JSON.stringify(payload),
  }, true);
}

export function updateLesson(
  lessonId: number,
  payload: Partial<{ status: string; date: string; time_start: string; time_end: string; notes: string }>,
) {
  return apiFetch<ApiLesson>(`/api/v1/lessons/${lessonId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function fetchTutorStudents() {
  return apiFetch<ApiTutorStudent[]>("/api/v1/lessons/tutor/my-students", {}, true);
}

export function fetchAllStudents() {
  return apiFetch<ApiStudentListItem[]>("/api/v1/lessons/students-list/all", {}, true);
}

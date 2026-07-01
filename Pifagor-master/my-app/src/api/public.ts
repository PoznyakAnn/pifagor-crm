import { apiFetch } from "./client";
import type {
  ApiFaq,
  ApiPrice,
  ApiReview,
  ApiSubject,
  ApiTutor,
  LeadRequestPayload,
} from "./types";

export function fetchSubjects() {
  return apiFetch<ApiSubject[]>("/api/v1/subjects");
}

export function fetchPrices(subjectId?: number) {
  const query = subjectId ? `?subject_id=${subjectId}` : "";
  return apiFetch<ApiPrice[]>(`/api/v1/prices${query}`);
}

export function fetchReviews(tutorId?: number) {
  const query = tutorId ? `?tutor_id=${tutorId}` : "";
  return apiFetch<ApiReview[]>(`/api/v1/reviews${query}`);
}

export function fetchFaq(subjectId?: number) {
  const query = subjectId ? `?subject_id=${subjectId}` : "";
  return apiFetch<ApiFaq[]>(`/api/v1/faq${query}`);
}

export function fetchTutors() {
  return apiFetch<ApiTutor[]>("/api/v1/users/tutors/public");
}

export function submitLeadRequest(payload: LeadRequestPayload) {
  return apiFetch<{ id: number }>("/api/v1/requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getLessonPrice(prices: ApiPrice[]): number | null {
  if (!prices.length) return null;
  const single = prices.find((p) => p.lessons_in_package === 1);
  return single?.price_per_lesson ?? prices[0].price_per_lesson;
}

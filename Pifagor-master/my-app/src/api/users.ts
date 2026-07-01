import { apiFetch } from "./client";
import type { ApiTutor } from "./types";

export interface TutorSelfProfilePayload {
  bio?: string;
  education?: string;
  experience_years?: number;
  rate_per_hour?: number;
}

export interface UserProfilePayload {
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
}

export function fetchMyTutorProfile() {
  return apiFetch<ApiTutor>("/api/v1/users/tutors/me", {}, true);
}

export function updateMyTutorProfile(payload: TutorSelfProfilePayload) {
  return apiFetch<ApiTutor>("/api/v1/users/tutors/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

export function updateMyUserProfile(payload: UserProfilePayload) {
  return apiFetch("/api/v1/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, true);
}

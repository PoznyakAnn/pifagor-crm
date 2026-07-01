import { apiFetch } from "./client";
import { tokenStore } from "./token";
import type { ApiUser, AuthToken, UserRole } from "./types";

export function login(email: string, password: string) {
  return apiFetch<AuthToken>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  invite_code: string;
  role: UserRole;
}) {
  return apiFetch<ApiUser>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({
      ...payload,
      middle_name: "",
      phone: "+375000000000",
    }),
  });
}

export interface InviteCodeValidation {
  code: string;
  role: UserRole;
  is_used: boolean;
}

export function validateInviteCode(code: string) {
  const q = encodeURIComponent(code.trim());
  return apiFetch<InviteCodeValidation>(`/api/v1/auth/invite-codes/validate?code=${q}`);
}

export function fetchMe() {
  return apiFetch<ApiUser>("/api/v1/users/me", {}, true);
}

export function persistSession(tokens: AuthToken) {
  tokenStore.set(tokens.access_token, tokens.refresh_token);
}

export function clearSession() {
  tokenStore.clear();
}

export function hasSession() {
  return Boolean(tokenStore.getAccess());
}

export async function resolveRoleFromInviteCode(code: string): Promise<UserRole> {
  const trimmed = code.trim();
  try {
    const found = await validateInviteCode(trimmed);
    if (found.is_used) {
      throw new Error("Код доступа уже использован");
    }
    return found.role;
  } catch (err) {
    if (err instanceof Error && err.message === "Код доступа уже использован") {
      throw err;
    }
    // fallback by code prefix when API unavailable
  }

  const upper = trimmed.toUpperCase();
  if (upper.includes("-TUT-")) return "tutor";
  if (upper.includes("-PRN-")) return "parent";
  if (upper.includes("-CHD-")) return "child";
  if (upper.includes("TUTOR") || upper.includes("REP")) return "tutor";
  if (upper.includes("PARENT") || upper.includes("PRN")) return "parent";
  if (upper.includes("ADMIN")) return "admin";

  throw new Error("Код доступа не найден");
}

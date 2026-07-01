import type { SubjectKey } from "../types/navigation";

/** Frontend page keys ↔ CRM subject slugs in the database. */
export const SUBJECT_KEY_TO_SLUG: Record<SubjectKey, string> = {
  math: "matematika",
  physics: "fizika",
  english: "angliyskiy",
  chemistry: "himiya",
};

export const SUBJECT_SLUG_TO_KEY: Record<string, SubjectKey> = {
  matematika: "math",
  fizika: "physics",
  angliyskiy: "english",
  himiya: "chemistry",
};

export function slugForSubjectKey(key: SubjectKey): string {
  return SUBJECT_KEY_TO_SLUG[key];
}

export function subjectKeyForSlug(slug: string): SubjectKey | undefined {
  return SUBJECT_SLUG_TO_KEY[slug];
}

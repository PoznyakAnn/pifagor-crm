import type { ApiSubject } from "../api/types";
import { SUBJECTS } from "../data/site";
import { SUBJECT_KEY_TO_SLUG } from "../data/subjectMap";

const ALLOWED_SLUGS = new Set<string>(Object.values(SUBJECT_KEY_TO_SLUG));
const ALLOWED_NAMES = new Set(SUBJECTS.map((s) => s.title.toLowerCase()));

export function filterAllowedSubjects(subjects: ApiSubject[]): ApiSubject[] {
  return subjects.filter(
    (s) => ALLOWED_SLUGS.has(s.slug) || ALLOWED_NAMES.has(s.name.toLowerCase()),
  );
}

export function getSubjectOptionNames(subjects?: ApiSubject[]): string[] {
  if (subjects?.length) {
    return filterAllowedSubjects(subjects).map((s) => s.name);
  }
  return SUBJECTS.map((s) => s.title);
}

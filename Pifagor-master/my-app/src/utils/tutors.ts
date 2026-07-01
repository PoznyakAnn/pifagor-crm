import type { ApiSubject, ApiTutor } from "../api/types";
import type { SubjectKey } from "../types/navigation";
import { SUBJECTS } from "../data/site";
import { slugForSubjectKey } from "../data/subjectMap";

export interface DisplayTutor {
  id: number;
  name: string;
  title: string;
  image?: string;
  avatarLetter?: string;
}

export interface DisplayFaq {
  question: string;
  answer: string;
}

export function tutorDisplayName(tutor: ApiTutor): string {
  return `${tutor.user.first_name} ${tutor.user.last_name}`.trim();
}

export function tutorDisplayTitle(tutor: ApiTutor): string {
  if (tutor.bio) return tutor.bio;
  if (tutor.education) return tutor.education;
  if (tutor.experience_years) return `Опыт ${tutor.experience_years} лет`;
  return "Репетитор";
}

export function mapApiTutor(tutor: ApiTutor, fallbackImage?: string): DisplayTutor {
  const name = tutorDisplayName(tutor);
  return {
    id: tutor.id,
    name,
    title: tutorDisplayTitle(tutor),
    image: tutor.user.avatar_url ?? fallbackImage,
    avatarLetter: name.charAt(0) || "Р",
  };
}

export function resolveSubjectSlug(
  subjectName: string,
  apiSubjects?: ApiSubject[],
): string | undefined {
  const fromSite = SUBJECTS.find(
    (s) => s.title.toLowerCase() === subjectName.toLowerCase(),
  );
  if (fromSite) return slugForSubjectKey(fromSite.subjectKey);

  return apiSubjects?.find((s) => s.name.toLowerCase() === subjectName.toLowerCase())?.slug;
}

export function filterTutorsBySubjectName(
  tutors: ApiTutor[],
  subjectName: string,
  apiSubjects?: ApiSubject[],
): ApiTutor[] {
  const slug = resolveSubjectSlug(subjectName, apiSubjects);

  return tutors.filter((t) =>
    t.subjects.some((s) => {
      if (slug && s.slug === slug) return true;
      return s.name.toLowerCase() === subjectName.toLowerCase();
    }),
  );
}

export function filterTutorsBySubjectKey(
  tutors: ApiTutor[],
  subjectKey: SubjectKey,
): ApiTutor[] {
  const slug = slugForSubjectKey(subjectKey);
  return tutors.filter((t) => t.subjects.some((s) => s.slug === slug));
}

export function findSubjectId(
  subjects: ApiSubject[],
  subjectName: string,
): number | undefined {
  return subjects.find((s) => s.name === subjectName)?.id;
}

export function findSubjectIdByKey(
  subjects: ApiSubject[],
  subjectKey: SubjectKey,
): number | undefined {
  const slug = slugForSubjectKey(subjectKey);
  return subjects.find((s) => s.slug === slug)?.id;
}

export function mapApiFaq(faqs: { question: string; answer: string }[]): DisplayFaq[] {
  return faqs.map(({ question, answer }) => ({ question, answer }));
}

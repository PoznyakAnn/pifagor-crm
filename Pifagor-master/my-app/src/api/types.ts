export interface ApiSubject {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  is_active: boolean;
}

export interface ApiPrice {
  id: number;
  subject_id?: number | null;
  title: string;
  description?: string | null;
  price_per_lesson: number;
  lessons_in_package?: number | null;
  discount_percent?: number | null;
  is_active: boolean;
}

export interface ApiReview {
  id: number;
  author_name: string;
  text: string;
  rating: number;
  tutor_id?: number | null;
  is_published: boolean;
  created_at: string;
}

export interface ApiFaq {
  id: number;
  question: string;
  answer: string;
  subject_id?: number | null;
  order: number;
}

export interface ApiTutorSubject {
  id: number;
  name: string;
  slug: string;
}

export interface ApiTutorUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
}

export interface ApiTutor {
  id: number;
  bio?: string | null;
  education?: string | null;
  experience_years?: number | null;
  rate_per_hour?: number | null;
  is_published: boolean;
  user: ApiTutorUser;
  subjects: ApiTutorSubject[];
}

export interface LeadRequestPayload {
  name: string;
  phone: string;
  email?: string;
  subject_id?: number;
  message?: string;
}

export type UserRole = "admin" | "tutor" | "parent" | "child";

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string | null;
  phone?: string | null;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  tutor_profile?: { id: number } | null;
  child_profile?: { id: number } | null;
  parent_profile?: { id: number } | null;
}

export interface InviteCode {
  id: number;
  code: string;
  role: UserRole;
  description?: string | null;
  is_used: boolean;
  created_at?: string;
}

export interface ApiLesson {
  id: number;
  tutor_id: number;
  child_id: number;
  subject_id: number;
  student_name?: string;
  tutor_name?: string;
  subject_name?: string;
  date: string;
  time_start: string;
  time_end: string;
  status: string;
  cancel_reason?: string | null;
  notes?: string | null;
  is_free_trial?: boolean;
  is_paid?: boolean;
}

export interface ApiTutorStudent {
  child_profile_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface ApiStudentListItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  child_profile: { id: number };
}

export interface ApiReport {
  id: number;
  tutor_id: number;
  child_id: number;
  subject_id: number;
  content: string;
  lesson_count: number;
  file_url?: string | null;
  created_at: string;
  student_name?: string;
}

export interface ApiAct {
  id: number;
  tutor_id: number;
  period_start: string;
  period_end: string;
  lessons_count: number;
  total_amount: number;
  blank_url?: string | null;
  signed_url?: string | null;
  created_at: string;
}

export interface ApiParentContract {
  id: number;
  parent_id: number;
  child_id: number;
  file_url: string;
  signed_file_url?: string | null;
  is_signed: boolean;
  created_at: string;
}

export interface ApiTutorContract {
  id: number;
  tutor_id: number;
  file_url: string;
  signed_at?: string | null;
  created_at: string;
}

export interface ApiComment {
  id: number;
  parent_id: number;
  tutor_id: number;
  child_id: number;
  text: string;
  created_at: string;
}

export interface FinanceReportRow {
  child_id: number;
  student_name: string;
  lessons_conducted: number;
  lessons_paid: number;
  amount_paid: number;
}

export interface EmailReceipt {
  id: number;
  receipt_number?: string | null;
  payer_name: string;
  amount: number;
  payment_date?: string | null;
  child_id?: number | null;
  student_name?: string | null;
  created_at: string;
}

export interface ApiHomework {
  id: number;
  lesson_id: number;
  child_id: number;
  description: string;
  file_url?: string | null;
  submission_url?: string | null;
  is_done: boolean;
  created_at: string;
}

export interface ApiPayment {
  id: number;
  parent_id: number;
  child_id: number;
  amount: number;
  description?: string | null;
  is_paid: boolean;
  paid_at?: string | null;
  period_start?: string | null;
  period_end?: string | null;
  created_at: string;
}

export interface ApiNotification {
  id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export interface TutorFinance {
  lessons_done: number;
  earnings: number;
  acts_count: number;
}

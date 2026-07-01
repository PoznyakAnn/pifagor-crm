import mathIcon from "../assets/main_page/cards/math.png";
import physicsIcon from "../assets/main_page/cards/physics.png";
import englishIcon from "../assets/main_page/cards/english.png";
import chemistryIcon from "../assets/main_page/cards/chem.png";
import icon1 from "../assets/main_page/price/check.png";
import icon2 from "../assets/main_page/price/check2.png";
import icon3 from "../assets/main_page/price/time.png";
import icon4 from "../assets/main_page/price/assess.png";
import review1 from "../assets/reviews/review1.png";
import review2 from "../assets/reviews/review2.png";
import review3 from "../assets/reviews/review3.png";
import review4 from "../assets/reviews/review4.png";
import type { SubjectKey } from "../types/navigation";

export interface SubjectCard {
  title: string;
  className: string;
  icon: string;
  desc: string;
  subjectKey: SubjectKey;
}

export const SUBJECT_BANNER_BULLETS = [
  "поднимем оценку в школе",
  "подготовим к экзаменам",
  "бесплатное пробное занятие",
];

export const SUBJECTS: SubjectCard[] = [
  {
    title: "Математика",
    className: "card-math",
    icon: mathIcon,
    desc: "Разбор сложных тем, уравнений и подготовка к экзаменам",
    subjectKey: "math",
  },
  {
    title: "Физика",
    className: "card-physics",
    icon: physicsIcon,
    desc: "Понимание формул, решение задач и подготовка к тестам",
    subjectKey: "physics",
  },
  {
    title: "Английский язык",
    className: "card-english",
    icon: englishIcon,
    desc: "Разговорная практика, грамматика и подготовка к экзаменам",
    subjectKey: "english",
  },
  {
    title: "Химия",
    className: "card-chemistry",
    icon: chemistryIcon,
    desc: "Изучение реакций, разбор теории и помощь с задачами",
    subjectKey: "chemistry",
  },
];

export const SUBJECTS_NAV = SUBJECTS.map(({ title, subjectKey }) => ({
  title,
  key: subjectKey,
}));

export const PRICING_FEATURES = [
  { text: "Индивидуальные занятия", icon: icon1 },
  { text: "Контроль прогресса", icon: icon4 },
  { text: "Гибкое расписание", icon: icon3 },
  { text: "Профессиональные репетиторы", icon: icon2 },
];

export const REVIEW_IMAGES = [review1, review2, review3, review4];

export const CONTACT = {
  phone: "+375447933870",
  phoneDisplay: "+375 44 793 38 70",
  email: "pifagor@gmail.com",
};

export const SOCIAL_LINKS = {
  instagram:
    "https://www.instagram.com/pifagor.by?igsh=ZWt6em94N2t4NGsz&utm_source=qr",
  telegram: "https://t.me/nikstasss",
  viber: "viber://chat?number=%2B375447933870",
};

export const ANCHORS = {
  subjects: "subjects",
  prices: "prices",
  reviews: "reviews",
  about: "about",
} as const;

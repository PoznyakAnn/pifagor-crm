import { useMemo, useState } from "react";
import { Logo } from "./components/Logo";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { WaveDivider } from "./components/WaveDivider";
import { ReviewsSlider } from "./components/ReviewsSlider";
import { BookingForm } from "./components/BookingForm";
import { BannerBullets } from "./components/BannerBullets";
import waveBlue from "./assets/wave_blue.svg";
import alexeyPetrovImg from "./assets/Alexey Petrov.png";
import homeImg from "./assets/homelander.png";
import mathStatue from "./assets/main_page/math_statue.png";
import engStatue from "./assets/main_page/eng_statue.png";
import physicsStatue from "./assets/main_page/physics_statue.png";
import chemStatue from "./assets/main_page/chem_statue.png";
import chemistryBack from "./assets/chemistry_back.png";
import { PRICING_FEATURES } from "./data/site";
import { scrollToBookingForm } from "./utils/scroll";
import { useFaq, usePrices, useSubjects, useTutors } from "./hooks/usePublicData";
import {
  filterTutorsBySubjectName,
  findSubjectIdByKey,
  mapApiFaq,
  mapApiTutor,
} from "./utils/tutors";
import type { PageKey, SubjectKey } from "./types/navigation";
import "./SubjectPage.css";

export type { SubjectKey };

const CHEMISTRY_BANNER_DECOR: {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width: string;
  rotate: number;
  opacity: number;
}[] = [
  { top: "-8%", left: "-6%", width: "420px", rotate: -28, opacity: 0.22 },
  { top: "12%", left: "18%", width: "360px", rotate: 42, opacity: 0.16 },
  { top: "-5%", right: "8%", width: "390px", rotate: 75, opacity: 0.18 },
  { top: "35%", right: "-4%", width: "480px", rotate: -55, opacity: 0.2 },
  { bottom: "18%", left: "4%", width: "440px", rotate: 18, opacity: 0.17 },
  { bottom: "8%", right: "22%", width: "320px", rotate: -90, opacity: 0.14 },
  { top: "48%", left: "42%", width: "280px", rotate: 135, opacity: 0.12 },
];

interface SubjectConfig {
  title: string;
  subtitle: string;
  accentColor: string;
  bgGradient: string;
  priceRightGradient: string;
  bannerImage: string;
  imageStyle?: React.CSSProperties;
  badgeText?: string;
  tutors: Tutor[];
  reviews: Review[];
  faqs: FAQ[];
  titlePaddingTop?: number;
  waveColor?: string;
}

interface Tutor {
  name: string;
  title: string;
  avatarLetter?: string;
  avatarColor?: string;
  image?: string;
}

interface Review {
  name: string;
  role: string;
  rating: number;
  text: string;
}

interface FAQ {
  question: string;
  answer: string;
}

// ─── Per-subject data ─────────────────────────────────────────────────────────

const SUBJECT_CONFIGS: Record<SubjectKey, SubjectConfig> = {
  math: {
    title: "Математика",
    titlePaddingTop: 60,
    subtitle: "Unlock your potential in algebra, geometry, and calculus.",
    accentColor: "#1D809F",
    bgGradient: `radial-gradient(circle at 100% 100%, #FFFFFF 0%, #AEE3F1 15%, #40A8C5 50%, #153E61 95%, #0D2942 100%)`,
    priceRightGradient: "radial-gradient(circle at center, #5EA3C9 0%, #1D809F 55%, #205A7E 100%)",
    bannerImage: mathStatue,
    imageStyle: { bottom: -160, left: 700, width: 'min(460px, 40vw)', right: -70 },
    tutors: [
      { name: "Алексей Петров",  title: "Тренер математических олимпиад",  avatarLetter: "А", avatarColor: "#245985" },
      { name: "Алексей Петров",  title: "Тренер математических олимпиад",  avatarLetter: "А", avatarColor: "#245985" },
      { name: "Алексей Петров",  title: "Подготовил 10 стобалльников Учится в БГУ",  avatarLetter: "А", avatarColor: "#245985" },
    ],
    reviews: [
      { name: "Елена В.", role: "Мама одиннадцатиклассника", rating: 5, text: "Долго искали хорошего репетитора по математике. В Пифагоре нашли индивидуальный подход. Сын перестал бояться сложных задач и сдал экзамен на высокий балл." },
      { name: "Максим",   role: "Ученик",                    rating: 5, text: "Занимался онлайн. Интерактивная доска и разборы домашних заданий оказались даже удобнее обычных уроков." },
      { name: "Ольга К.", role: "Мама ученика",              rating: 5, text: "Сын занимался в Пифагоре, очень доволен. Оценки подтянулись, сдал экзамен отлично." },
      { name: "Оксана Р.", role: "Ученица",                  rating: 5, text: "Занималась математикой перед ЦТ. Репетитор объяснял очень понятно, всё разобрали по полочкам." },
    ],
    faqs: [
      { "question": "Сколько длится занятие?", "answer": "Стандартное занятие длится 60 минут, однако мы также предлагаем продленные 90-минутные сессии в зависимости от потребностей студента и целей обучения." },
        { "question": "Нужны ли мне свои материалы?", "answer": "Нет — все необходимые учебные материалы и рабочие листы предоставляет ваш репетитор. Вам понадобятся только блокнот и желание учиться." },
        { "question": "Могу ли я поменять репетитора?", "answer": "Да, безусловно. Если вы чувствуете, что стиль преподавания вам не совсем подходит, мы бесплатно подберем вам другого специалиста." }
    ],
  },

  english: {
    title: "Английский язык",
    subtitle: "Unlock your potential in algebra, geometry, and calculus.",
    accentColor: "#F9AB01",
    titlePaddingTop: 0 ,
    waveColor: 'blue',
    bgGradient: `radial-gradient(circle at center, #FBBF24 0%, #F59E0B 55%, #D97706 100%)`,
    priceRightGradient: "radial-gradient(circle at center, #FBBF24 0%, #F59E0B 55%, #D97706 100%)",
    bannerImage: engStatue,
    imageStyle: { bottom: -70, width: 'min(600px, 40vw)', right: -100 },
    badgeText: "Not open book!",
    tutors: [
      { name: "Звёздочка",  title: "#Homelight",  avatarLetter: "А", avatarColor: "#F9AB01" },
      { name: "Билли бутчер",  title: "Ои хьюи",  avatarLetter: "А", avatarColor: "#F9AB01" },
      { name: "Алексей Петров",  title: "Топ-5 Репетитор",  avatarLetter: "А", avatarColor: "#F9AB01" },
    ],
    reviews: [
      { name: "Дарья",    role: "Ученица",         rating: 5, text: "Подготовилась к ЦЭ по английскому на отлично. Грамматика стала намного понятнее после первых же занятий." },
      { name: "Виктор",   role: "Ученик",           rating: 5, text: "Разговорная практика помогла мне не бояться говорить. Очень рекомендую этого преподавателя." },
      { name: "Наталья",  role: "Мама выпускницы",  rating: 5, text: "Дочка подтянула средний балл и поступила на бюджет. Рекомендую однозначно." },
      { name: "Игорь",    role: "Ученик",           rating: 5, text: "Готовился к международному экзамену. Структурированный подход и реальная практика — именно то, что нужно." },
    ],
    faqs: [
      { "question": "Сколько длится занятие?", "answer": "Стандартное занятие длится 60 минут, однако мы также предлагаем продленные 90-минутные сессии в зависимости от потребностей студента и целей обучения." },
        { "question": "Нужны ли мне свои материалы?", "answer": "Нет — все необходимые учебные материалы и рабочие листы предоставляет ваш репетитор. Вам понадобятся только блокнот и желание учиться." },
        { "question": "Могу ли я поменять репетитора?", "answer": "Да, безусловно. Если вы чувствуете, что стиль преподавания вам не совсем подходит, мы бесплатно подберем вам другого специалиста." }
    ],
  },

  physics: {
    title: "Физика",
    subtitle: "Unlock your potential in algebra, geometry, and calculus.",
    accentColor: "#4FBED9",
    waveColor: 'blue',
    bgGradient: `radial-gradient(circle at 100% 100%, #6CD5F0 0%, #4FBED9 40%, #3098B5 75%, #207D99 100%)`,
    priceRightGradient: "radial-gradient(circle at center, #6CD5F0 0%, #4FBED9 55%, #207D99 100%)",
    bannerImage: physicsStatue,
    imageStyle: { bottom: -160, width: 'min(600px, 40vw)', right: 30 },
    tutors: [
      { name: "Алексей Смелый", title: "Эксперт",    avatarLetter: "А", avatarColor: "#40A8C5" },
     { name: "Джон Гиллман", title: "Я умнее, сильнее. Я лучше. Я лучше вас!",  image: homeImg },
      { name: "Алексей Петров", title: "Топ-5 Репетитор",  avatarLetter: "А", avatarColor: "#40A8C5" },
    ],
    reviews: [
      { name: "Ольга",    role: "Мама ученика",  rating: 5, text: "Сын занимался физикой в Пифагоре, очень доволен. Оценки подтянулись, сдал экзамен отлично." },
      { name: "Игорь",    role: "Ученик",        rating: 5, text: "Готовился здесь к ЦЭ по физике. Атмосфера крутая, дают только то, что реально будет на тесте." },
      { name: "Максим",   role: "Ученик",        rating: 5, text: "Задачи по механике казались невозможными, а теперь я решаю их сам. Большое спасибо!" },
      { name: "Татьяна",  role: "Мама ученицы",  rating: 5, text: "Результат превзошёл ожидания. Спасибо школе Пифагор за отличную организацию." },
    ],
   faqs: [
      { "question": "Сколько длится занятие?", "answer": "Стандартное занятие длится 60 минут, однако мы также предлагаем продленные 90-минутные сессии в зависимости от потребностей студента и целей обучения." },
        { "question": "Нужны ли мне свои материалы?", "answer": "Нет — все необходимые учебные материалы и рабочие листы предоставляет ваш репетитор. Вам понадобятся только блокнот и желание учиться." },
        { "question": "Могу ли я поменять репетитора?", "answer": "Да, безусловно. Если вы чувствуете, что стиль преподавания вам не совсем подходит, мы бесплатно подберем вам другого специалиста." }
    ],
  },

  chemistry: {
    title: "Химия",
    subtitle: "Unlock your potential in algebra, geometry, and calculus.",
    accentColor: "#2AD4A7",
    bgGradient: `radial-gradient(circle at 100% 100%, #46EAC0 0%, #2AD4A7 40%, #1AB28B 75%, #119674 100%)`,
    priceRightGradient: "radial-gradient(circle at center, #46EAC0 0%, #2AD4A7 55%, #119674 100%)",
    bannerImage: chemStatue,
    imageStyle: { bottom: -150, width: 'min(650px, 40vw)', right: -50 },
    badgeText: "Химия",
    tutors: [
      { name: "Алексей Смелый", title: "Старт Эксперт",    avatarLetter: "А", avatarColor: "#23E2AF" },
      { name: "Алексей Петров", title: "МАП Олимп Совет",  avatarLetter: "А", avatarColor: "#23E2AF" },
      { name: "Алексей Петров", title: "Топ-5 Репетитор",  avatarLetter: "А", avatarColor: "#23E2AF" },
    ],
    reviews: [
      { name: "Анна",     role: "Ученица",         rating: 5, text: "Органическая химия была для меня тёмным лесом. После курса всё встало на свои места, сдала на отлично." },
      { name: "Владимир", role: "Ученик",           rating: 5, text: "Преподаватель объясняет реакции через реальные примеры. Гораздо интереснее, чем в школе." },
      { name: "Марина",   role: "Мама ученицы",     rating: 5, text: "Дочка мечтает о медицинском, химия была слабым местом. После Пифагора — уверенность и хороший балл." },
      { name: "Сергей",   role: "Ученик",           rating: 5, text: "Готовился к олимпиаде. Разбирали нестандартные задачи — именно это и помогло победить." },
    ],
   faqs: [
      { "question": "Сколько длится занятие?", "answer": "Стандартное занятие длится 60 минут, однако мы также предлагаем продленные 90-минутные сессии в зависимости от потребностей студента и целей обучения." },
        { "question": "Нужны ли мне свои материалы?", "answer": "Нет — все необходимые учебные материалы и рабочие листы предоставляет ваш репетитор. Вам понадобятся только блокнот и желание учиться." },
        { "question": "Могу ли я поменять репетитора?", "answer": "Да, безусловно. Если вы чувствуете, что стиль преподавания вам не совсем подходит, мы бесплатно подберем вам другого специалиста." }
    ],
  },
};

// ─── Helper components ────────────────────────────────────────────────────────

function TutorCard({ tutor, accentColor }: { tutor: Tutor; accentColor?: string }) {

  // Автоматический подбор мягкого пастельного фонда карточки в тон предмету
  let cardBgColor = "#F4FAFC"; // Математика / Физика (Дефолт)
  let nameColor = "#1D476D";    // ИСПРАВЛЕНО: Глубокий темно-синий для имени
  let titleColor = "#40A8C5";   // ИСПРАВЛЕНО: Яркий бирюзовый для описания, как на макете

  if (accentColor === "#F9AB01") { // Английский язык
    cardBgColor = "#FFFDF5";
    nameColor = "#8A5400";
    titleColor = "#8C765C";
  } else if (accentColor === "#23E2AF") { // Химия
    cardBgColor = "#F2FAF7";
    nameColor = "#167A60";
    titleColor = "#5A857A";
  }

  return (
    <div
      style={{
        backgroundColor: cardBgColor,
        borderRadius: "24px",
        padding: "22px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        boxSizing: "border-box",
        transition: "all 0.3s ease",

        // ── ИСПРАВЛЕНО: Убираем жесткий height, чтобы текст не зажимался ──
        width: "353px",
        minWidth: "353px",
        minHeight: "454px",        /* Минимальная высота по Figma */
        height: "auto",            /* Если текста много, карточка плавно вырастет вниз */
        paddingBottom: "24px",     /* Дополнительный нижний отступ для безопасности */
        flexShrink: 0
      }}
    >
      {/* Квадратный контейнер для картинки */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: "16px",
          overflow: "hidden",
          marginBottom: "16px",
          display: "block",
          flexShrink: 0
        }}
      >
        <img
          src={tutor.image || alexeyPetrovImg}
          alt={tutor.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block"
          }}
        />
      </div>

      {/* Блок с текстом */}
      <div
        style={{
          paddingLeft: "4px",
          paddingRight: "4px",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Имя репетитора */}
        <div
          className="text-h2"
          style={{
            color: nameColor,
            marginBottom: "8px",
            fontWeight: 500,
            textAlign: "left"
          }}
        >
          {tutor.name}
        </div>

        {/* Описание / Регалии — теперь точно влезут все строки */}
        <div
          className="text-h3"
          style={{
            color: titleColor,
            lineHeight: "1.4",
            textAlign: "left",
            whiteSpace: "pre-line"
          }}
        >
          {tutor.title}
        </div>
      </div>
    </div>
  );
}

// Добавили accentColor в параметры функции и в описание типов через двоеточие
function FaqItem({ faq, accentColor }: { faq: FAQ; accentColor?: string }) {
  const [open, setOpen] = useState(false);

  // 1. Определение цветов фона и текста в зависимости от предмета
  let bgColor = "#F4FAFC";    // Математика / Физика (Дефолт)
  let titleColor = "#1A547E";
  let textColor = "#5A738E";
  let iconColor = "#7994A6";

  if (accentColor === "#F9AB01") { // Английский
    bgColor = "#FFFDF5";
    titleColor = "#8A5400";
    textColor = "#8C765C";
    iconColor = "#B38F54";
  } else if (accentColor === "#23E2AF") { // Химия
    bgColor = "#F2FAF7";
    titleColor = "#167A60";
    textColor = "#5A857A";
    iconColor = "#63A391";
  }

  return (
    <div
      style={{
        backgroundColor: bgColor,
        borderRadius: "12px",
        marginBottom: "12px",
        overflow: "hidden",
        width: "100%",
        display: "block",
        boxSizing: "border-box"
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          maxWidth: "100%",
          minWidth: "100%",
          height: "auto",
          minHeight: "unset",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 32px",
          background: "none",
          border: "none",
          outline: "none",
          textAlign: "left",
          cursor: "pointer",
          boxSizing: "border-box"
        }}
      >
        <span
          className="text-h2"
          style={{
            color: titleColor,
            fontWeight: 400,
            display: "inline-block",
            width: "auto"
          }}
        >
          {faq.question}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          style={{
            width: "20px",
            height: "20px",
            minWidth: "20px",
            minHeight: "20px",
            maxWidth: "20px",
            maxHeight: "20px",
            color: iconColor,
            display: "block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.3s ease",
            boxSizing: "border-box"
          }}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          className="text-h3"
          style={{
            padding: "0 32px 24px 32px",
            lineHeight: "1.5",
            color: textColor,
            width: "100%",
            boxSizing: "border-box"
          }}
        >
          {faq.answer}
        </div>
      )}
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────

interface SubjectPageProps {
  subject: SubjectKey;
  onBack: () => void;
  onNavigate: (key: PageKey) => void;
}

export default function SubjectPage({ subject, onBack, onNavigate }: SubjectPageProps) {
  const cfg = SUBJECT_CONFIGS[subject];
  const { data: subjects } = useSubjects();
  const { data: apiTutors } = useTutors();
  const subjectId = findSubjectIdByKey(subjects, subject);
  const { data: apiFaqs } = useFaq(subjectId);
  const { lessonPrice } = usePrices(subjectId);

  const tutors = useMemo((): Tutor[] => {
    if (!apiTutors.length) return cfg.tutors;

    const filtered = filterTutorsBySubjectName(apiTutors, cfg.title, subjects);
    return filtered.slice(0, 3).map((t) => {
      const mapped = mapApiTutor(t, alexeyPetrovImg);
      return {
        name: mapped.name,
        title: mapped.title,
        avatarLetter: mapped.avatarLetter,
        avatarColor: cfg.accentColor,
        image: mapped.image,
      };
    });
  }, [apiTutors, cfg.tutors, cfg.accentColor, cfg.title, subjects]);

  const faqs = useMemo(() => {
    if (!apiFaqs.length) return cfg.faqs;
    return mapApiFaq(apiFaqs);
  }, [apiFaqs, cfg.faqs]);

  return (
    <div className="app">
      <Header
        currentSubject={subject}
        onHome={onBack}
        onNavigate={onNavigate}
      />

      {/* ── Banner ── */}
      <section
          className="banner subject-banner"
          style={{
            backgroundImage: cfg.bgGradient,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
      >
        {subject === "chemistry" && (
          <div className="subject-banner__decor" aria-hidden="true">
            {CHEMISTRY_BANNER_DECOR.map((item, index) => (
              <img
                key={index}
                src={chemistryBack}
                alt=""
                className="subject-banner__decor-item"
                style={{
                  top: item.top,
                  left: item.left,
                  right: item.right,
                  bottom: item.bottom,
                  width: item.width,
                  opacity: item.opacity,
                  transform: `rotate(${item.rotate}deg)`,
                }}
              />
            ))}
          </div>
        )}
        <div className="banner-inner">
          <div className="banner-content">
            <h1 className="banner-title text-display-unbounded" style={{ maxWidth: 500,  paddingTop: cfg.titlePaddingTop ?? 60  }}>{cfg.title}</h1>
            <BannerBullets style={{ maxWidth: 700, paddingTop: 20 }} />
          </div>
          <img src={cfg.bannerImage} alt="" className="banner-image banner-image--subject" style={cfg.imageStyle} />
        </div>

        <BookingForm
          defaultSubject={cfg.title}
          subjects={subjects.length ? subjects : undefined}
        />
      </section>

      <WaveDivider variant="banner" src={cfg.waveColor === "blue" ? waveBlue : undefined} />

    <div className="container" style={{ paddingTop: 100 }}>
      <h2 className="section-title text-h1-unbounded" style={{ paddingTop: 8, marginBottom: 32, textAlign: 'left' }}>
        Наши репетиторы
      </h2>

      {/* 2. Центрируем ТОЛЬКО этот внутренний контейнер с карточками */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div
          className="tutors-grid"
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center', /* Центрирует 3 карточки внутри доступной ширины */
            alignItems: 'stretch',
            gap: '30px',
            width: '100%',
            maxWidth: '1120px', /* Делает ширину сетки точно такой же, как форма сверху */
            flexWrap: 'wrap'
          }}
        >
          {tutors.length === 0 ? (
            <p className="subject-tutors-empty text-h3">
              Репетиторы по этому предмету скоро появятся
            </p>
          ) : (
            tutors.map((t, i) => (
              <TutorCard key={i} tutor={t} accentColor={cfg.accentColor} />
            ))
          )}
        </div>
      </div>
    </div>

      {/* ── Reviews ── */}
      <div id="reviews">
        <div style={{ marginTop: 48 }}>
          <ReviewsSlider />
        </div>
      </div>
      {/* ── Pricing ── */}
      <div className="container">
        <h2 className="section-title section-title--compact text-h1-unbounded" style={{ marginBottom: -40, paddingTop: 40 }}>
          Цены
        </h2>
      </div>

      <div id="prices" className="price-section container">
        <div className="price-box">
          <div className="price-left">
            <h2 className="text-h1-futura">Стоимость одного занятия</h2>
            <div className="price-value text-h1-unbounded">{lessonPrice} BYN</div>
            <div className="price-features">
              {PRICING_FEATURES.map(f => (
                <div key={f.text} className="price-feature-item">
                  <div className="price-feature-icon">
                    <img src={f.icon} alt="" />
                  </div>
                  <span className="price-feature text-body-lg">{f.text}</span>
                </div>
              ))}
            </div>
            <div className="price-buttons">
              <button
                type="button"
                className="price-btn price-btn--primary"
                style={{ background: cfg.accentColor === "#23E2AF" ? "#1ab894" : cfg.accentColor }}
                onClick={scrollToBookingForm}
              >
                Оставить заявку
              </button>
              <button type="button" className="price-btn price-btn--outline" onClick={scrollToBookingForm}>
                Хочу дешевле!
              </button>
            </div>
          </div>

          <div
            className="price-right"
            style={{ background: cfg.priceRightGradient }}
          >
            <div className="price-right-inner">
              <Logo variant="footer" />
              <div className="price-right-tagline text-h1-futura">
                Понимай, за<br />что платишь.
              </div>
            </div>
          </div>
        </div>
      </div>

    {/* ── FAQ ── */}
    <div className="container" style={{ paddingBottom: 64 }}>
      <h2 className="section-title text-h1-unbounded" style={{ marginBottom: 24 }}>
        Часто задаваемые вопросы
      </h2>
      <div className="faq-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map((faq, i) => (
          // Добавили проп accentColor
          <FaqItem key={i} faq={faq} accentColor={cfg.accentColor} />
        ))}
      </div>
    </div>

    <WaveDivider variant="footer" />
    <Footer onHome={onBack} onNavigate={onNavigate} />
    </div>
  );
}

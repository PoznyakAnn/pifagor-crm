import { Logo } from "./Logo";
import tg from "../assets/tg.png";
import vb from "../assets/vb.png";
import inst from "../assets/inst.png";
import { ANCHORS, CONTACT, SOCIAL_LINKS } from "../data/site";
import { scrollToAnchor, scrollToBookingForm } from "../utils/scroll";
import type { PageKey } from "../types/navigation";

interface FooterProps {
  onHome: () => void;
  onNavigate: (page: PageKey) => void;
  isHome?: boolean;
}

export function Footer({ onHome, onNavigate, isHome = false }: FooterProps) {
  const handleBookingClick = () => {
    if (isHome) {
      scrollToBookingForm();
    } else {
      onHome();
      setTimeout(scrollToBookingForm, 300);
    }
  };

  const handleSubjectsClick = (e: React.MouseEvent) => {
  e.preventDefault();

  const scrollWithOffset = () => {
    const element = document.getElementById(ANCHORS.subjects);
    if (element) {
      const headerOffset = 300; // На сколько пикселей опустить экран (высота шапки)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  if (isHome) {
    scrollWithOffset();
  } else {
    onHome();
    // 300мс нужно, чтобы успела загрузиться главная страница,
    // иначе JS не найдет блок с предметами для расчета координат
    setTimeout(scrollWithOffset, 300);
  }
};

  const handleAnchorClick = (e: React.MouseEvent, anchor: string) => {
    e.preventDefault();
    scrollToAnchor(anchor);
  };

  return (
    <div id={ANCHORS.about}>
      <div className="footer-wrap">
        <footer className="footer">
          <div className="container footer-grid">
            <div className="footer-info-col">
              <div className="footer-logo-box">
                <Logo variant="footer" />
              </div>
              <p className="footer-address text-h3">
                ООО «Пифагор Центр», УНП 193900047
                <br />
                Юридический адрес: 220019 г. Минск,
                <br />
                ул. Сухаревская, д. 16
                <br />
                Свидетельство регистрации от 20.08.2025,
                <br />
                выдано Минским горисполкомом
                <br />
                Режим работы: пн–пт 10:00–20:00
              </p>
            </div>

            <div className="footer-menu-col">
              <a href={`#${ANCHORS.subjects}`} className="footer-link" onClick={handleSubjectsClick}>
                Предметы
              </a>
              <a
                href="#"
                className="footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("tutors");
                }}
              >
                Репетиторы
              </a>
              <a
                href={`#${ANCHORS.prices}`}
                className="footer-link"
                onClick={(e) => handleAnchorClick(e, ANCHORS.prices)}
              >
                Цены
              </a>
              <a
                href={`#${ANCHORS.reviews}`}
                className="footer-link"
                onClick={(e) => handleAnchorClick(e, ANCHORS.reviews)}
              >
                Отзывы
              </a>
              <a
                href="#"
                className="footer-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate("cabinet");
                }}
              >
                Личный кабинет
              </a>
              <a
                href={`#${ANCHORS.about}`}
                className="footer-link"
                onClick={(e) => handleAnchorClick(e, ANCHORS.about)}
              >
                О нас
              </a>
            </div>

            <div className="footer-actions-col">
              <button type="button" className="footer-cta-btn" onClick={handleBookingClick}>
                Присоединиться к занятиям
              </button>

              <div className="footer-social-box">
                <p className="footer-social-title">
                  Хочешь узнать больше?
                  <br />
                  Напиши нам!
                </p>

                <div className="footer-social-icons">
                  <a
                    href={SOCIAL_LINKS.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon instagram"
                  >
                    <img src={inst} alt="Instagram" />
                  </a>
                  <a
                    href={SOCIAL_LINKS.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon telegram"
                  >
                    <img src={tg} alt="Telegram" />
                  </a>
                  <a href={SOCIAL_LINKS.viber} className="social-icon viber">
                    <img src={vb} alt="Viber" />
                  </a>
                </div>

                <a href={`mailto:${CONTACT.email}`} className="footer-email">
                  {CONTACT.email}
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

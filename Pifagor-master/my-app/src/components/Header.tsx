import { useState } from "react";
import { Logo } from "./Logo";
import { SUBJECTS_NAV, CONTACT, ANCHORS } from "../data/site";
import { scrollToAnchor } from "../utils/scroll";
import type { PageKey, SubjectKey } from "../types/navigation";

interface HeaderProps {
  currentPage?: PageKey | null;
  currentSubject?: SubjectKey;
  onHome: () => void;
  onNavigate: (page: PageKey) => void;
}

export function Header({ currentPage, currentSubject, onHome, onNavigate }: HeaderProps) {
  const [subjectsOpen, setSubjectsOpen] = useState(false);

  const handleAnchorClick = (e: React.MouseEvent, anchor: string) => {
    e.preventDefault();
    scrollToAnchor(anchor);
  };

  return (
    <header className="header">
      <a
        href="#"
        className="header-logo-link"
        onClick={(e) => {
          e.preventDefault();
          onHome();
        }}
      >
        <Logo />
      </a>

      <nav className="header-nav-main">
        <div className="header-dropdown">
          <a
            href="#"
            className="text-h3"
            onClick={(e) => {
              e.preventDefault();
              setSubjectsOpen(!subjectsOpen);
            }}
          >
            Предметы
          </a>

          {subjectsOpen && (
            <div className="header-dropdown-menu">
              {SUBJECTS_NAV.map((subject) => (
                <a
                  key={subject.key}
                  href="#"
                  className={`header-dropdown-item${
                    subject.key === currentSubject ? " header-dropdown-item--active" : ""
                  }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSubjectsOpen(false);
                    onNavigate(subject.key);
                  }}
                >
                  {subject.title}
                </a>
              ))}
            </div>
          )}
        </div>

        <a
          href="#"
          className={`text-h3${currentPage === "tutors" ? " header-link--active" : ""}`}
          onClick={(e) => {
            e.preventDefault();
            onNavigate("tutors");
          }}
        >
          Репетиторы
        </a>

        <a
          href={`#${ANCHORS.prices}`}
          className="text-h3"
          onClick={(e) => handleAnchorClick(e, ANCHORS.prices)}
        >
          Цены
        </a>
      </nav>

      <div className="header-right">
        <nav className="header-nav-secondary">
          <a
            href={`#${ANCHORS.reviews}`}
            className="text-h3"
            onClick={(e) => handleAnchorClick(e, ANCHORS.reviews)}
          >
            Отзывы
          </a>
          <a
            href="#"
            className={`text-h3${currentPage === "cabinet" ? " header-link--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate("cabinet");
            }}
          >
            Личный кабинет
          </a>
          <a
            href={`#${ANCHORS.about}`}
            className="text-h3"
            onClick={(e) => handleAnchorClick(e, ANCHORS.about)}
          >
            О нас
          </a>
        </nav>
        <a href={`tel:${CONTACT.phone}`} className="header-phone text-h3">
          {CONTACT.phoneDisplay}
        </a>
      </div>
    </header>
  );
}

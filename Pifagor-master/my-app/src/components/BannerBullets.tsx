import type { CSSProperties } from "react";
import { SUBJECT_BANNER_BULLETS } from "../data/site";

interface BannerBulletsProps {
  className?: string;
  style?: CSSProperties;
}

export function BannerBullets({ className, style }: BannerBulletsProps) {
  return (
    <ul
      className={`banner-bullets text-h1-futura${className ? ` ${className}` : ""}`}
      style={style}
    >
      {SUBJECT_BANNER_BULLETS.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

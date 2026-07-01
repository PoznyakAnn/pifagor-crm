import waveImg from "../assets/wave_bottom.svg";

interface WaveDividerProps {
  variant: "banner" | "footer";
  src?: string;
}

export function WaveDivider({ variant, src }: WaveDividerProps) {
  return (
    <div className={`wave-divider wave-divider--${variant}`} aria-hidden="true">
      <img src={src ?? waveImg} alt="" />
    </div>
  );
}

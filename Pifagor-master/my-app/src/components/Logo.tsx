import logoImg from '../assets/pifagor_logo.png';

type LogoProps = {
  variant?: 'default' | 'footer';
  className?: string;
};

export function Logo({ variant = 'default', className = '' }: LogoProps) {
  return (
    <img
      src={logoImg}
      alt="Пифагор"
      className={`logo ${variant === 'footer' ? 'logo--footer' : ''} ${className}`.trim()}
    />
  );
}

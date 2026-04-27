import Image from "next/image";

interface EkaloxLogoProps {
  className?: string;
}

export function EkaloxLogo({ className = "h-10 w-auto max-w-[120px]" }: EkaloxLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="EKALOX"
      width={120}
      height={40}
      priority
      className={className}
    />
  );
}

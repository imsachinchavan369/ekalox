interface ProductDescriptionTextProps {
  className?: string;
  text: string;
}

export function ProductDescriptionText({ className = "", text }: ProductDescriptionTextProps) {
  return (
    <div className={`whitespace-pre-wrap break-words text-sm leading-7 text-slate-300 ${className}`}>
      {text}
    </div>
  );
}

interface ProductDescriptionTextProps {
  className?: string;
  text: string;
}

function renderInlineMarkdown(line: string) {
  return line.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={index} className="font-black text-white">{part.slice(2, -2)}</strong>;
    }

    return part;
  });
}

export function ProductDescriptionText({ className = "", text }: ProductDescriptionTextProps) {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  return (
    <div className={`break-words text-sm leading-7 text-slate-300 ${className}`}>
      {normalized.split("\n").map((line, index) => (
        line.trim() ? (
          <p key={index} className="min-h-[1.75rem] whitespace-pre-wrap">
            {renderInlineMarkdown(line)}
          </p>
        ) : (
          <div key={index} className="h-3" aria-hidden="true" />
        )
      ))}
    </div>
  );
}

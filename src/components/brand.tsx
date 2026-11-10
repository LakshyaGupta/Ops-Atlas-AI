import { Link } from "@tanstack/react-router";

export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="30" rx="8" className="fill-surface-raised stroke-border" />
      <path d="M8 22 L16 8 L24 22" className="stroke-primary" strokeWidth="2.4" fill="none" strokeLinejoin="round" />
      <circle cx="16" cy="18" r="2.4" className="fill-primary" />
    </svg>
  );
}

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-[15px] font-semibold tracking-tight">
        OpsAtlas <span className="text-primary">AI</span>
      </span>
    </Link>
  );
}

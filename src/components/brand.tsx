import { Link } from "@tanstack/react-router";
import { useId } from "react";

export function BrandMark({ className = "h-7 w-7" }: { className?: string }) {
  const clipId = useId();
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="64" height="52.82" />
        </clipPath>
      </defs>
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="14"
        className="fill-surface-raised stroke-border"
        strokeWidth="1.5"
      />
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M8.52 56.35 L31.87 14.38 L55.63 56.35"
          className="stroke-primary"
          strokeWidth="6.03"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="butt"
        />
        <circle cx="31.94" cy="41.81" r="6.44" className="fill-primary" />
      </g>
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

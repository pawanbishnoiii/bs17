import * as React from "react";
import { cn } from "@/lib/utils";

export type FolderPreview = { id: string; label: string; image?: string | null };

/**
 * A tactile 3D folder: the back panel and tab sit behind a front flap, and on
 * hover (or focus) the preview cards fan out of the folder mouth.
 */
export function Folder3D({
  title,
  subtitle,
  count,
  gradient,
  previews = [],
  onOpen,
  className,
}: {
  title: string;
  subtitle?: string;
  count: number;
  gradient?: string;
  previews?: FolderPreview[];
  onOpen?: () => void;
  className?: string;
}) {
  const [active, setActive] = React.useState(false);
  const shown = previews.slice(0, 5);
  const back = gradient ?? "linear-gradient(135deg, var(--blue-soft, #dbe8ff), var(--lavender-soft, #e7e2ff))";
  const front = gradient ?? "linear-gradient(135deg, var(--lavender-soft, #e7e2ff), var(--blue-soft, #dbe8ff))";

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className={cn(
        "group relative block w-full text-left outline-none",
        "transition-transform duration-500 ease-out focus-visible:scale-[1.02]",
        className,
      )}
      aria-label={`Open folder ${title}`}
    >
      <div
        className="relative mx-auto h-40 w-full max-w-[220px] transition-transform duration-500 ease-out group-hover:-translate-y-1"
        style={{ perspective: "900px" }}
      >
        {/* tab */}
        <span
          className="absolute top-2 left-3 h-5 w-20 rounded-t-xl"
          style={{ background: back }}
        />
        {/* back panel */}
        <span
          className="absolute inset-x-0 top-6 bottom-0 rounded-2xl shadow-md"
          style={{ background: back }}
        />

        {/* fanned preview cards */}
        <div className="pointer-events-none absolute inset-x-0 top-6 bottom-8">
          {shown.map((p, i) => {
            const mid = (shown.length - 1) / 2;
            const factor = shown.length > 1 ? (i - mid) / Math.max(mid, 1) : 0;
            return (
              <span
                key={p.id}
                className="absolute bottom-2 left-1/2 block h-20 w-16 overflow-hidden rounded-lg border border-border bg-background shadow-md transition-all duration-500 ease-out"
                style={{
                  transform: active
                    ? `translate(-50%, -34px) translateX(${factor * 52}px) rotate(${factor * 18}deg)`
                    : "translate(-50%, 8px) rotate(0deg)",
                  opacity: active ? 1 : 0,
                  transitionDelay: `${i * 45}ms`,
                  zIndex: 10 + i,
                }}
              >
                {p.image ? (
                  <img src={p.image} alt="" className="size-full object-cover" />
                ) : (
                  <span className="grid size-full place-items-center px-1 text-center text-[8px] leading-tight font-bold text-muted-foreground">
                    {p.label.slice(0, 22)}
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* front flap */}
        <span
          className="absolute inset-x-0 bottom-0 z-20 h-24 rounded-2xl border border-white/50 shadow-lg backdrop-blur-[2px] transition-transform duration-500 ease-out"
          style={{
            background: front,
            transform: active ? "rotateX(-26deg)" : "rotateX(0deg)",
            transformOrigin: "bottom center",
          }}
        />
      </div>

      <div className="mt-3 min-w-0 text-center">
        <p className="truncate text-sm font-extrabold tracking-tight">{title}</p>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-muted-foreground">
          {subtitle ? `${subtitle} · ` : ""}
          {count} {count === 1 ? "file" : "files"}
        </p>
      </div>
    </button>
  );
}

export default Folder3D;

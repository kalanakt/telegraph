import Link from "next/link";
import { cn } from "@/lib/utils";

export function PublicBrand({
  href = "/",
  className,
  detail = "Telegram automation"
}: {
  href?: string;
  className?: string;
  detail?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("focus-ring group inline-flex items-center gap-3", className)}
    >
      <span
        aria-hidden="true"
        className="relative flex size-11 items-center justify-center overflow-hidden rounded-lg bg-[linear-gradient(160deg,oklch(var(--foreground)/0.98),oklch(var(--foreground)/0.88))]"
      >
        <span className="absolute inset-[8px] rounded-[6px] bg-white/4" />
        <span className="absolute left-[11px] top-[10px] h-[3px] w-[18px] rounded-full bg-primary/90" />
        <span className="absolute left-[11px] top-[18px] h-[3px] w-[12px] rounded-full bg-white/82" />
        <span className="absolute left-[11px] top-[26px] h-[3px] w-[18px] rounded-full bg-secondary/82" />
        <span className="absolute right-[11px] top-[13px] h-[16px] w-[3px] rounded-full bg-white/14" />
      </span>

      <span className="grid min-w-0 gap-0.5">
        <span className="text-[0.7rem] text-muted-foreground">
          {detail}
        </span>
        <span className="font-display text-[1.22rem] font-semibold leading-none text-foreground">
          Telegraph
        </span>
      </span>
    </Link>
  );
}

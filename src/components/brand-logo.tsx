import { cn } from "@/lib/utils";

type BrandLogoProps = {
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: { icon: 28, text: "text-base" },
  md: { icon: 36, text: "text-lg" },
  lg: { icon: 48, text: "text-xl" },
};

export function BrandLogo({ showText = true, size = "md", className }: BrandLogoProps) {
  const { icon, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-icon.svg"
        alt="ShortLink"
        width={icon}
        height={icon}
        className="shrink-0"
      />
      {showText && (
        <span className={cn("font-bold tracking-tight", text)}>
          <span className="text-zinc-900 dark:text-zinc-50">Short</span>
          <span className="text-indigo-500">Link</span>
        </span>
      )}
    </div>
  );
}

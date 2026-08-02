import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.ComponentPropsWithoutRef<"div"> {
  rounded?: "sm" | "md" | "lg" | "full";
}

const RADII = {
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-md)]",
  lg: "rounded-[var(--radius-lg)]",
  full: "rounded-full",
} as const;

export function Skeleton({ className, rounded = "sm", ...props }: SkeletonProps) {
  return <div aria-hidden className={cn("shimmer", RADII[rounded], className)} {...props} />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-md)] border border-hairline bg-surface p-5",
        className,
      )}
    >
      <Skeleton className="mb-4 h-4 w-1/3" />
      <SkeletonText lines={3} />
    </div>
  );
}

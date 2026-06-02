import { cn } from "@/lib/utils";

interface VoidSkeletonProps {
  className?: string;
  height?: number;
}

export function VoidSkeleton({ className, height = 120 }: VoidSkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-void-3 overflow-hidden",
        className
      )}
      style={{ height }}
    >
      <div
        className="w-full h-full"
        style={{
          background:
            "linear-gradient(90deg, var(--void-2) 25%, var(--void-3) 50%, var(--void-2) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
        }}
      />
    </div>
  );
}

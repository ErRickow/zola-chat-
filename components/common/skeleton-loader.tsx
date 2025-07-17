import { cn } from "@/lib/utils";

/**
 * A skeleton loader component to indicate that a code block is being generated.
 */
export function SkeletonLoader({
  className,
  lines = 5,
}: {
  className ? : string;
  lines ? : number;
}) {
  return (
    <div className={cn("space-y-2 p-4", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 animate-pulse rounded-md bg-muted/50"
          style={{
            width: `${Math.floor(Math.random() * (95 - 60 + 1)) + 60}%`, // Random width between 60-95%
            opacity: 1 - i * 0.1, // Fading opacity
          }}
        />
      ))}
    </div>
  );
}
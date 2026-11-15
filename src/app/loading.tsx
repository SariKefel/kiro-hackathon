import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6 p-6"
      role="status"
      aria-label="Loading RescueSync"
    >
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((key) => (
          <Skeleton key={key} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-72" />
      <span className="sr-only">Loading RescueSync...</span>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-24">
      <Skeleton className="mx-auto h-12 w-3/4" />
      <Skeleton className="mx-auto mt-4 h-12 w-2/3" />
      <Skeleton className="mx-auto mt-8 h-4 w-1/2" />
      <Skeleton className="mx-auto mt-3 h-4 w-2/5" />
      <Skeleton className="mx-auto mt-10 h-12 w-48" rounded="md" />
      <Skeleton className="mt-16 h-80 w-full" rounded="lg" />
    </div>
  );
}

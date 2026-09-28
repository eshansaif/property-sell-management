export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-muted ${className}`} />;
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

export function ListingDetailSkeleton() {
  return (
    <div className="container-page py-10">
      <Skeleton className="mb-4 h-4 w-64" />
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="aspect-[16/10] w-full" />
          <div className="mt-2 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-square" />)}
          </div>
          <Skeleton className="mt-6 h-8 w-2/3" />
          <Skeleton className="mt-3 h-5 w-1/3" />
          <Skeleton className="mt-8 h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InquiryDetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card p-6">
          <Skeleton className="h-6 w-48" />
          <div className="mt-5 grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}><Skeleton className="h-3 w-16" /><Skeleton className="mt-2 h-4 w-32" /></div>
            ))}
          </div>
        </div>
        <div className="card p-6"><Skeleton className="h-5 w-32" /><Skeleton className="mt-3 h-4 w-full" /><Skeleton className="mt-2 h-4 w-3/4" /></div>
        <div className="card space-y-3 p-6">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
      <div className="space-y-6">
        <div className="card p-6"><Skeleton className="h-5 w-28" /><div className="mt-4 grid grid-cols-2 gap-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div></div>
        <div className="card p-6"><Skeleton className="h-4 w-40" /><Skeleton className="mt-2 h-4 w-32" /></div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-40" />
      <div className="mt-6 flex gap-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-24" />)}</div>
      <div className="card mt-6 max-w-2xl space-y-4 p-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i}><Skeleton className="h-3 w-24" /><Skeleton className="mt-2 h-10 w-full" /></div>)}
      </div>
    </div>
  );
}

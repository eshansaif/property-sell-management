"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-3 py-24 text-center">
      <p className="font-display text-2xl text-text-primary">Something went wrong</p>
      <p className="max-w-md text-sm text-text-secondary">
        We hit an unexpected error. Please try again — if the problem continues, contact support.
      </p>
      <div className="mt-2 flex gap-3">
        <button onClick={() => reset()} className="btn-primary">Try again</button>
        <Link href="/" className="btn-outline">Go home</Link>
      </div>
    </main>
  );
}

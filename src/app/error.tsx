"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-center">
        <p className="font-display text-2xl text-text-primary">Something went wrong</p>
        <p className="max-w-md text-sm text-text-secondary">
          We hit an unexpected error. Please try again — if the problem continues, contact support.
        </p>
        <button onClick={() => reset()} className="btn-primary">Try again</button>
      </body>
    </html>
  );
}

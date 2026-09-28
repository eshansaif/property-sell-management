"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

type Props = {
  serviceId?: string;
  subServiceId?: string;
  listingId?: string;
  contextLabel?: string; // e.g. "Land Sale → Residential Land → Bashundhara 5 Katha"
  sourcePage?: string;
};

export function InquiryForm({ serviceId, subServiceId, listingId, contextLabel, sourcePage }: Props) {
  const toast = useToast();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      name: form.get("name"),
      phone: form.get("phone"),
      email: form.get("email") || "",
      message: form.get("message"),
      preferredContact: form.get("preferredContact") || undefined,
      company: form.get("company") || "", // honeypot
      consent: form.get("consent") === "on",
      serviceId,
      subServiceId,
      listingId,
      sourcePage: sourcePage ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    };

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        toast.error("Couldn't send your inquiry", data?.error ?? "Please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      toast.success("Inquiry sent", "Our team will contact you shortly.");
      (e.target as HTMLFormElement).reset();
    } catch {
      setError("Network error. Please check your connection and try again.");
      toast.error("Network error", "Please check your connection and try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-6 text-center">
        <p className="font-display text-lg text-text-primary">Thanks — we've got your request.</p>
        <p className="mt-1 text-sm text-text-secondary">
          Our team will contact you shortly. You'll usually hear back within one business day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6" id="contact">
      {contextLabel && (
        <p className="rounded-md bg-surface-muted px-3 py-2 text-xs text-text-secondary">
          Regarding: <span className="font-medium text-text-primary">{contextLabel}</span>
        </p>
      )}

      {/* Honeypot — hidden from real users, catches basic bots */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name *</label>
          <input className="input" id="name" name="name" required maxLength={120} placeholder="Your full name" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone *</label>
          <input className="input" id="phone" name="phone" required maxLength={20} placeholder="e.g. 01XXXXXXXXX" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="email">Email (optional)</label>
        <input className="input" id="email" name="email" type="email" maxLength={200} placeholder="you@example.com" />
      </div>

      <div>
        <label className="label" htmlFor="message">Message *</label>
        <textarea className="input" id="message" name="message" required rows={4} maxLength={2000} placeholder="Tell us what you're looking for..." />
      </div>

      <div>
        <label className="label" htmlFor="preferredContact">Preferred contact method</label>
        <select className="input" id="preferredContact" name="preferredContact" defaultValue="PHONE">
          <option value="PHONE">Phone call</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="EMAIL">Email</option>
        </select>
      </div>

      <label className="flex items-start gap-2 text-xs text-text-secondary">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        I agree to be contacted about this inquiry and accept the privacy policy.
      </label>

      {error && <p className="text-sm text-error">{error}</p>}

      <button type="submit" disabled={status === "submitting"} className="btn-accent w-full">
        {status === "submitting" ? "Sending..." : "Send Inquiry"}
      </button>
    </form>
  );
}

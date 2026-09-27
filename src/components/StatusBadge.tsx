const styles: Record<string, string> = {
  DRAFT: "bg-surface-muted text-text-secondary",
  PUBLISHED: "bg-success/10 text-success",
  ARCHIVED: "bg-warning/10 text-warning",
  NEW: "bg-info/10 text-info",
  CONTACTED: "bg-accent/10 text-accent",
  IN_PROGRESS: "bg-warning/10 text-warning",
  FOLLOW_UP: "bg-warning/10 text-warning",
  CONVERTED: "bg-success/10 text-success",
  CLOSED: "bg-surface-muted text-text-secondary",
  REJECTED: "bg-error/10 text-error",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${styles[status] ?? "bg-surface-muted text-text-secondary"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

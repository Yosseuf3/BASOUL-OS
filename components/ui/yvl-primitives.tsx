import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const classes = (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(" ");

export function Button({ className, children, disabled, "aria-busy": busy, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={classes("yvl-button", className)} disabled={disabled || Boolean(busy)} aria-busy={busy} {...props}>
    {busy ? <span className="yvl-spinner" aria-hidden="true" /> : null}{children}
  </button>;
}

export function IconButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { "aria-label": string }) {
  return <button type="button" className={classes("yvl-icon-button", className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={classes("yvl-input", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={classes("yvl-input", "yvl-textarea", className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={classes("yvl-input", "yvl-select", className)} {...props} />;
}

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <article className={classes("yvl-card", className)} {...props} />;
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={classes("yvl-surface", className)} {...props} />;
}

export function Panel({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={classes("panel", "yvl-panel", className)} {...props} />;
}

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "success" | "warning" | "danger" }) {
  return <span className={classes("yvl-badge", `yvl-tone-${tone}`, className)} {...props} />;
}

export function Status({ tone = "neutral", children, className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "accent" | "success" | "warning" | "danger" }) {
  return <span className={classes("yvl-status", `yvl-tone-${tone}`, className)} {...props}><i aria-hidden="true" />{children}</span>;
}

export function Dialog({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <div className="yvl-backdrop" role="presentation" onKeyDown={(event) => { if (event.key === "Escape") onClose(); }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="yvl-dialog" role="dialog" aria-modal="true" aria-labelledby="yvl-dialog-title">
      <header><h2 id="yvl-dialog-title">{title}</h2><IconButton autoFocus aria-label="إغلاق" onClick={onClose}>×</IconButton></header>
      {children}
    </section>
  </div>;
}

export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return <aside className="yvl-drawer" role="dialog" aria-modal="true" aria-label={title} onKeyDown={(event) => { if (event.key === "Escape") onClose(); }}>
    <header><h2>{title}</h2><IconButton autoFocus aria-label="إغلاق" onClick={onClose}>×</IconButton></header>{children}
  </aside>;
}

export function Navigation({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav className={classes("yvl-navigation", className)} {...props} />;
}

export function Tabs({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes("yvl-tabs", className)} role="tablist" {...props} />;
}

export function TableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={classes("table-wrap", "yvl-table-container", className)} {...props} />;
}

function Feedback({ kind, title, detail }: { kind: "empty" | "loading" | "error"; title: string; detail?: string }) {
  return <div className={classes("yvl-feedback", `yvl-feedback-${kind}`)} role={kind === "error" ? "alert" : "status"} aria-live="polite">
    {kind === "loading" ? <span className="yvl-spinner" aria-hidden="true" /> : null}<strong>{title}</strong>{detail ? <p>{detail}</p> : null}
  </div>;
}

export const EmptyState = (props: Omit<Parameters<typeof Feedback>[0], "kind">) => <Feedback kind="empty" {...props} />;
export const LoadingState = (props: Omit<Parameters<typeof Feedback>[0], "kind">) => <Feedback kind="loading" {...props} />;
export const ErrorState = (props: Omit<Parameters<typeof Feedback>[0], "kind">) => <Feedback kind="error" {...props} />;

export function Toast({ tone = "neutral", children }: { tone?: "neutral" | "success" | "danger"; children: ReactNode }) {
  return <div className={classes("yvl-toast", `yvl-tone-${tone}`)} role="status" aria-live="polite">{children}</div>;
}

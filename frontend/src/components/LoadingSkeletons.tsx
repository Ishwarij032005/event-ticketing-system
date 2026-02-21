import { motion } from "framer-motion";

const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent";

export function EventCardSkeleton() {
  return (
    <div className={`glass rounded-2xl overflow-hidden ${shimmer}`}>
      <div className="h-44 bg-muted/40" />
      <div className="p-5 space-y-3">
        <div className="h-5 w-3/4 rounded-lg bg-muted/40" />
        <div className="h-4 w-1/2 rounded-lg bg-muted/30" />
        <div className="h-4 w-2/3 rounded-lg bg-muted/30" />
        <div className="h-4 w-1/3 rounded-lg bg-muted/30" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className={`glass rounded-2xl p-5 ${shimmer}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-muted/40" />
        <div className="w-16 h-4 rounded-lg bg-muted/30" />
      </div>
      <div className="h-7 w-16 rounded-lg bg-muted/40 mb-2" />
      <div className="h-4 w-24 rounded-lg bg-muted/30" />
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className={`border-b border-border/30 ${shimmer}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <div className="h-4 rounded-lg bg-muted/30" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 4, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRowSkeleton key={i} cols={cols} />
      ))}
    </>
  );
}

export function TicketSkeleton() {
  return (
    <div className={`glass rounded-2xl p-5 flex items-center gap-4 ${shimmer}`}>
      <div className="w-16 h-16 rounded-xl bg-muted/40 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-1/3 rounded-lg bg-muted/40" />
        <div className="h-3 w-1/2 rounded-lg bg-muted/30" />
      </div>
      <div className="h-5 w-14 rounded-full bg-muted/30" />
      <div className="h-5 w-14 rounded-full bg-muted/30" />
    </div>
  );
}

import { motion } from "framer-motion";
import { Check, X, AlertTriangle } from "lucide-react";

type Variant = "success" | "error" | "warning";

const config: Record<Variant, { icon: typeof Check; bg: string; ring: string }> = {
  success: { icon: Check, bg: "bg-emerald-500/20", ring: "ring-emerald-500/30" },
  error: { icon: X, bg: "bg-destructive/20", ring: "ring-destructive/30" },
  warning: { icon: AlertTriangle, bg: "bg-amber-500/20", ring: "ring-amber-500/30" },
};

interface AnimatedStatusProps {
  variant: Variant;
  title: string;
  description?: string;
  show: boolean;
}

export default function AnimatedStatus({ variant, title, description, show }: AnimatedStatusProps) {
  if (!show) return null;
  const { icon: Icon, bg, ring } = config[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`flex items-center gap-3 p-4 rounded-xl ${bg} ring-1 ${ring}`}
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.1 }}
      >
        <Icon size={20} className={variant === "success" ? "text-emerald-400" : variant === "error" ? "text-destructive" : "text-amber-400"} />
      </motion.div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </motion.div>
  );
}

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ResultPanelProps {
  type: "success" | "error" | "warning" | "info" | "loading" | "empty";
  title?: string;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}

const icons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
  empty: Info,
};

const styles = {
  success: "border-success/30 bg-success/5",
  error: "border-destructive/30 bg-destructive/5",
  warning: "border-warning/30 bg-warning/5",
  info: "border-info/30 bg-info/5",
  loading: "border-border bg-muted/30",
  empty: "border-border bg-muted/20",
};

const iconStyles = {
  success: "text-success",
  error: "text-destructive",
  warning: "text-warning",
  info: "text-info",
  loading: "text-muted-foreground animate-spin",
  empty: "text-muted-foreground",
};

export const ResultPanel = ({ type, title, message, children, className }: ResultPanelProps) => {
  const Icon = icons[type];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={type + title}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn("rounded-xl border p-5", styles[type], className)}
      >
        <div className="flex items-start gap-3">
          <Icon className={cn("h-5 w-5 mt-0.5 shrink-0", iconStyles[type])} />
          <div className="space-y-1 min-w-0">
            {title && <p className="font-semibold text-sm text-foreground">{title}</p>}
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
            {children}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

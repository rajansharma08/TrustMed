import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusPillVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase transition-colors",
  {
    variants: {
      variant: {
        legit: "status-legit",
        review: "status-review",
        suspect: "status-suspect",
        default: "bg-muted text-muted-foreground",
        info: "bg-info/10 text-info",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        created: "bg-primary/10 text-primary",
        "in-transit": "bg-info/10 text-info",
        delivered: "bg-success/10 text-success",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface StatusPillProps extends VariantProps<typeof statusPillVariants> {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const StatusPill = ({ variant, children, className, dot = true }: StatusPillProps) => (
  <span className={cn(statusPillVariants({ variant }), className)}>
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {children}
  </span>
);

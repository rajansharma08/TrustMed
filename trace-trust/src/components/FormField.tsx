import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FormFieldProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  value?: string | number;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  hint?: string;
  textarea?: boolean;
  options?: { label: string; value: string }[];
}

export const FormField = ({
  label, id, type = "text", placeholder, value, onChange, required, className, disabled, hint, textarea, options,
}: FormFieldProps) => (
  <div className={cn("space-y-2", className)}>
    <Label htmlFor={id} className="text-sm font-medium text-foreground">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {options ? (
      <Select value={String(value)} onValueChange={(v) => onChange?.(v)} disabled={disabled}>
        <SelectTrigger id={id} className="bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : textarea ? (
      <Textarea
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="bg-background resize-none"
        rows={3}
      />
    ) : (
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        disabled={disabled}
        className="bg-background"
      />
    )}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

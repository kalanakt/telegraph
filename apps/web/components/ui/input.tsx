import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "focus-ring flex h-10 w-full rounded-md border border-border/75 bg-white/90 px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:border-primary",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };

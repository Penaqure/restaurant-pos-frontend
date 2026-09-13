import { InputHTMLAttributes, forwardRef } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import Input from "./Input";

const SearchInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input ref={ref} type="search" className={cn("pl-9", className)} {...props} />
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";

export default SearchInput;

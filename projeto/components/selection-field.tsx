import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/Checkbox";
import { Label } from "@/components/Label";

type SelectionMode = "single" | "multiple";

type SelectionOption = {
  value: string;
  label: string;
};

interface SelectionFieldProps {
  label: string;
  options: SelectionOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  selectionMode?: SelectionMode;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SelectionField({
  label,
  options,
  value,
  onChange,
  selectionMode = "single",
  id,
  placeholder,
  className,
  disabled,
}: SelectionFieldProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isMultiple = selectionMode === "multiple";
  const selectedValues = useMemo(
    () => (Array.isArray(value) ? value : value ? [value] : []),
    [value],
  );

  const selectedLabels = useMemo(
    () =>
      options
        .filter((option) => selectedValues.includes(option.value))
        .map((option) => option.label),
    [options, selectedValues],
  );

  const displayValue = useMemo(() => {
    if (selectedLabels.length === 0) {
      return (
        placeholder ??
        (isMultiple ? "Selecione opcoes" : "Selecione uma opcao")
      );
    }
    if (selectedLabels.length <= 2) {
      return selectedLabels.join(", ");
    }
    return `${selectedLabels.slice(0, 2).join(", ")} +${
      selectedLabels.length - 2
    }`;
  }, [isMultiple, placeholder, selectedLabels]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(optionValue: string) {
    if (disabled) {
      return;
    }

    if (isMultiple) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((item) => item !== optionValue)
        : [...selectedValues, optionValue];
      onChange(next);
      return;
    }

    onChange(optionValue);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>, optionValue: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleSelect(optionValue);
    }
  }

  return (
    <div ref={containerRef} className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          <span className="truncate text-foreground">{displayValue}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        {open ? (
          <div
            role="listbox"
            aria-multiselectable={isMultiple || undefined}
            className="absolute z-20 mt-2 w-full rounded-md border border-border bg-popover p-1 shadow-md"
          >
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  onKeyDown={(event) => handleKeyDown(event, option.value)}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    "transition-colors hover:bg-muted",
                    isSelected ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {isMultiple ? (
                    <Checkbox checked={isSelected} className="pointer-events-none" />
                  ) : (
                    <span className="flex h-4 w-4 items-center justify-center">
                      {isSelected ? <Check className="h-4 w-4" /> : null}
                    </span>
                  )}
                  <span className="text-left">{option.label}</span>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

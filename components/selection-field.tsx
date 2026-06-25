import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/Badge";
import { Checkbox } from "@/components/Checkbox";
import { Label } from "@/components/Label";

type SelectionMode = "single" | "multiple";

type SelectionOption = {
  value: string;
  label: string;
  /** Texto extra usado só na filtragem quando `searchable` está ativo. */
  searchText?: string;
  /** Badge opcional exibido à direita do rótulo (ex.: role Admin). */
  badge?: string;
};

interface SelectionFieldProps {
  label: string;
  options: SelectionOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  selectionMode?: SelectionMode;
  id?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
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
  searchPlaceholder = "Buscar...",
  searchable = false,
  className,
  disabled,
}: SelectionFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    const query = searchQuery.trim().toLowerCase();
    return options.filter((option) => {
      const haystack = (option.searchText ?? option.label).toLowerCase();
      return haystack.includes(query);
    });
  }, [options, searchable, searchQuery]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      return;
    }
    if (searchable) {
      searchInputRef.current?.focus();
    }
  }, [open, searchable]);

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
          <div className="absolute z-20 mt-2 w-full rounded-md border border-border bg-popover p-1 shadow-md">
            {searchable ? (
              <div className="border-b border-border p-2">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={(event) => event.stopPropagation()}
                  placeholder={searchPlaceholder}
                  className={cn(
                    "h-9 w-full rounded-md border border-input bg-background px-3 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  )}
                />
              </div>
            ) : null}
            <div
              role="listbox"
              aria-multiselectable={isMultiple || undefined}
              className="max-h-60 overflow-y-auto p-1"
            >
              {filteredOptions.length === 0 ? (
                <p className="px-2 py-2 text-sm text-muted-foreground">
                  Nenhum resultado encontrado.
                </p>
              ) : (
                filteredOptions.map((option) => {
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
                        <Checkbox
                          checked={isSelected}
                          className="pointer-events-none"
                        />
                      ) : (
                        <span className="flex h-4 w-4 items-center justify-center">
                          {isSelected ? <Check className="h-4 w-4" /> : null}
                        </span>
                      )}
                      <span className="flex-1 text-left">{option.label}</span>
                      {option.badge ? (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {option.badge}
                        </Badge>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SelectProps {
  id?: string;
  value?: string;
  defaultValue?: string;
  invalid?: boolean;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
  /**
   * Fired on selection. Shaped like a native change event
   * (`e.target.value`) so existing call sites keep working unchanged.
   */
  onChange?: (e: { target: { value: string } }) => void;
  // Allow arbitrary DOM props (name, etc.) to pass through to the trigger.
  name?: string;
}

interface OptionData {
  value: string;
  label: string;
  disabled?: boolean;
}

/** Extract {value,label} pairs from <option> children. */
function readOptions(children: ReactNode): OptionData[] {
  const out: OptionData[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as React.ReactElement<{
      value?: string | number;
      disabled?: boolean;
      children?: ReactNode;
    }>;
    const props = el.props;
    const value = props.value !== undefined ? String(props.value) : "";
    const label =
      typeof props.children === "string"
        ? props.children
        : Array.isArray(props.children)
          ? props.children.join("")
          : String(props.children ?? "");
    out.push({ value, label, disabled: props.disabled });
  });
  return out;
}

/**
 * Custom dropdown that mimics a native <select> API (value + onChange with
 * option children) but renders a fully stylable menu — no OS-native square
 * popup. Keyboard accessible (Enter/Space/Escape/Arrows), closes on outside
 * click, and respects the app's theme tokens.
 */
export function Select({
  id,
  value,
  defaultValue,
  invalid,
  disabled,
  className,
  children,
  onChange,
  name,
}: SelectProps) {
  const options = readOptions(children);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(
    defaultValue ?? options[0]?.value ?? "",
  );
  const current = isControlled ? (value as string) : internal;
  const selected = options.find((o) => o.value === current) ?? options[0];

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function commit(value: string) {
    if (!isControlled) setInternal(value);
    onChange?.({ target: { value } });
    setOpen(false);
  }

  function openMenu() {
    if (disabled) return;
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === current),
    );
    setActiveIndex(idx);
    setOpen(true);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[activeIndex];
      if (opt && !opt.disabled) commit(opt.value);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        className={cn(
          "w-full h-10 rounded-md border pl-3 pr-9 text-sm text-left bg-[color:var(--color-surface)] text-[color:var(--color-fg)] transition-colors outline-none inline-flex items-center",
          "border-[color:var(--color-border)] focus:border-[color:var(--color-ring)] focus:ring-2 focus:ring-[color:var(--color-ring)]/15",
          invalid &&
            "border-[color:var(--color-danger)] focus:border-[color:var(--color-danger)] focus:ring-[color:var(--color-danger)]/20",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <span className="truncate">{selected?.label ?? ""}</span>
      </button>
      <ChevronDown
        size={16}
        className={cn(
          "absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-fg-subtle)] pointer-events-none transition-transform",
          open && "rotate-180",
        )}
      />

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[var(--shadow-pop)] py-1 animate-fade-in"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === current;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value + i}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  if (!opt.disabled) commit(opt.value);
                }}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 h-9 text-sm cursor-pointer",
                  isActive && "bg-[color:var(--color-surface-2)]",
                  opt.disabled &&
                    "opacity-40 cursor-not-allowed pointer-events-none",
                  isSelected
                    ? "text-[color:var(--color-fg)] font-medium"
                    : "text-[color:var(--color-fg-muted)]",
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && (
                  <Check
                    size={14}
                    className="shrink-0 text-[color:var(--color-accent)]"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

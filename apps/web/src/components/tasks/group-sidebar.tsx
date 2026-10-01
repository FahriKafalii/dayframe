"use client";

import { useState } from "react";
import {
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Inbox,
  Infinity as InfinityIcon,
  Plus,
  Search,
  Star,
  Sun,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import type { TaskGroupDto } from "@dayframe/types";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { flattenGroups } from "@/lib/task-groups";
import { SMART_VIEWS, type SmartView } from "@/lib/task-views";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

/** Group filter value: "all" | "none" | group id. */
export type GroupFilter = string;

/** Indentation applied per nesting level, in pixels. */
const INDENT = 18;

const SMART_VIEW_ICONS: Record<string, LucideIcon> = {
  sun: Sun,
  star: Star,
  calendar: CalendarRange,
  infinity: InfinityIcon,
};

// Left-hand group tree: filter by group, create/delete groups and subgroups,
// expand/collapse. Nesting (parent_id) is shown as an indented tree.
export function GroupSidebar({
  groups,
  selected,
  onSelect,
  onGroupsChanged,
  smartView,
  onSmartView,
  search,
  onSearch,
  counts,
}: {
  groups: TaskGroupDto[];
  selected: GroupFilter;
  onSelect: (value: GroupFilter) => void;
  onGroupsChanged: () => void;
  smartView: SmartView;
  onSmartView: (view: SmartView) => void;
  search: string;
  onSearch: (value: string) => void;
  /** Per-smart-view task counts, shown as badges. */
  counts?: Partial<Record<SmartView, number>>;
}) {
  const { t } = useT();
  const [addingParent, setAddingParent] = useState<string | null | undefined>(
    undefined,
  );
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const flat = flattenGroups(groups, collapsed);

  function toggleCollapse(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createGroup(parentId: string | null) {
    const value = name.trim();
    if (!value || busy) return;
    setBusy(true);
    try {
      await api.taskGroups.create({ name: value, parent_id: parentId });
      setName("");
      setAddingParent(undefined);
      // Make sure a freshly added subgroup is visible under its parent.
      if (parentId) {
        setCollapsed((prev) => {
          const next = new Set(prev);
          next.delete(parentId);
          return next;
        });
      }
      onGroupsChanged();
    } catch (err) {
      toast.error(errorMessage(err, t));
    } finally {
      setBusy(false);
    }
  }

  async function deleteGroup(id: string) {
    try {
      await api.taskGroups.remove(id);
      if (selected === id) onSelect("all");
      onGroupsChanged();
    } catch (err) {
      toast.error(errorMessage(err, t));
    }
  }

  return (
    <div className="space-y-1">
      <div className="relative mb-2">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-fg-subtle)] pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("tasks.searchPlaceholder")}
          className="w-full h-9 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-8 pr-3 text-sm outline-none focus:border-[color:var(--color-border-strong)] transition-colors"
        />
      </div>

      <div className="space-y-0.5 mb-2">
        {SMART_VIEWS.map((v) => {
          const Icon = SMART_VIEW_ICONS[v.icon];
          return (
            <GroupItem
              key={v.key}
              icon={<Icon size={15} />}
              label={t(v.labelKey)}
              active={selected === "all" && smartView === v.key}
              onClick={() => onSmartView(v.key)}
              count={counts?.[v.key]}
            />
          );
        })}
      </div>

      <div className="h-px bg-[color:var(--color-border)] my-2" />

      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-fg-subtle)]">
          {t("tasks.groups")}
        </span>
        <button
          onClick={() =>
            setAddingParent((p) => (p === null ? undefined : null))
          }
          className="h-6 w-6 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)]"
          aria-label={t("tasks.groupNew")}
          title={t("tasks.groupNew")}
        >
          <FolderPlus size={15} />
        </button>
      </div>

      <GroupItem
        icon={<Inbox size={15} />}
        label={t("tasks.groupUngrouped")}
        active={selected === "none"}
        onClick={() => onSelect("none")}
      />

      {addingParent === null && (
        <NewGroupInput
          value={name}
          onChange={setName}
          onSubmit={() => createGroup(null)}
          onCancel={() => setAddingParent(undefined)}
          placeholder={t("tasks.groupNamePlaceholder")}
          depth={0}
        />
      )}

      {flat.map(({ group, depth, hasChildren, isLast }) => {
        const isCollapsed = collapsed.has(group.id);
        const isSelected = selected === group.id;
        return (
          <div key={group.id}>
            <div
              className={cn(
                "group/gi relative flex items-center rounded-md",
                isSelected
                  ? "bg-[color:var(--color-surface-2)]"
                  : "hover:bg-[color:var(--color-surface-2)]/60",
              )}
            >
              {/* Indentation + tree connector guides for nested groups. */}
              {depth > 0 && (
                <TreeGuides depth={depth} isLast={isLast} />
              )}

              <div
                className="flex items-center flex-1 min-w-0"
                style={{ paddingLeft: depth * INDENT }}
              >
                {hasChildren ? (
                  <button
                    onClick={() => toggleCollapse(group.id)}
                    className="h-8 w-6 shrink-0 inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)]"
                    aria-label={
                      isCollapsed ? t("tasks.groupExpand") : t("tasks.groupCollapse")
                    }
                    aria-expanded={!isCollapsed}
                  >
                    {isCollapsed ? (
                      <ChevronRight size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                ) : (
                  <span className="w-6 shrink-0" aria-hidden />
                )}

                <button
                  onClick={() => onSelect(group.id)}
                  className={cn(
                    "flex-1 min-w-0 flex items-center gap-2 h-8 pr-2 text-sm text-left",
                    isSelected
                      ? "text-[color:var(--color-fg)] font-medium"
                      : "text-[color:var(--color-fg-muted)]",
                  )}
                >
                  {hasChildren && !isCollapsed ? (
                    <FolderOpen
                      size={14}
                      className="shrink-0"
                      style={group.color ? { color: group.color } : undefined}
                    />
                  ) : (
                    <Folder
                      size={14}
                      className="shrink-0 text-[color:var(--color-fg-subtle)]"
                      style={group.color ? { color: group.color } : undefined}
                    />
                  )}
                  <span className="truncate">{group.name}</span>
                </button>
              </div>

              <div className="flex items-center opacity-0 group-hover/gi:opacity-100 focus-within:opacity-100 transition-opacity pr-1">
                <button
                  onClick={() =>
                    setAddingParent((p) =>
                      p === group.id ? undefined : group.id,
                    )
                  }
                  className="h-6 w-6 rounded inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface)]"
                  aria-label={t("tasks.groupSubgroup")}
                  title={t("tasks.groupSubgroup")}
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="h-6 w-6 rounded inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-danger)] hover:bg-[color:var(--color-surface)]"
                  aria-label={t("tasks.groupDelete")}
                  title={t("tasks.groupDelete")}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            {addingParent === group.id && (
              <NewGroupInput
                value={name}
                onChange={setName}
                onSubmit={() => createGroup(group.id)}
                onCancel={() => setAddingParent(undefined)}
                placeholder={t("tasks.groupSubgroupPlaceholder")}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Vertical connector lines tying a nested group to its ancestors, plus an elbow
// at the current depth.
function TreeGuides({ depth, isLast }: { depth: number; isLast: boolean }) {
  return (
    <div
      className="absolute inset-y-0 left-0 pointer-events-none"
      aria-hidden
      style={{ width: depth * INDENT }}
    >
      {Array.from({ length: depth }).map((_, level) => {
        const last = level === depth - 1;
        return (
          <span
            key={level}
            className="absolute top-0 bottom-0 border-l border-[color:var(--color-border)]"
            style={{
              left: level * INDENT + INDENT / 2,
              // Last child stops at the elbow; ancestor lines run full height.
              height: last && isLast ? "50%" : "100%",
            }}
          />
        );
      })}
      {/* Elbow connecting the vertical guide to the row. */}
      <span
        className="absolute border-b border-[color:var(--color-border)]"
        style={{
          left: (depth - 1) * INDENT + INDENT / 2,
          width: INDENT / 2,
          top: "50%",
        }}
      />
    </div>
  );
}

function GroupItem({
  icon,
  label,
  active,
  onClick,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 h-8 px-2 rounded-md text-sm transition-colors",
        active
          ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-fg)] font-medium"
          : "text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]/60",
      )}
    >
      {icon}
      <span className="truncate flex-1 text-left">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="text-xs text-[color:var(--color-fg-subtle)] tabular-nums">
          {count}
        </span>
      )}
    </button>
  );
}

function NewGroupInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  depth,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  placeholder: string;
  depth: number;
}) {
  return (
    <div className="py-1" style={{ paddingLeft: depth * INDENT + 6 }}>
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        onBlur={onCancel}
        placeholder={placeholder}
        className="w-full h-8 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 text-sm outline-none focus:border-[color:var(--color-border-strong)]"
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  FolderPlus,
  Inbox,
  Layers,
  Plus,
  Trash2,
} from "lucide-react";
import type { TaskGroupDto } from "@dayframe/types";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/error-message";
import { flattenGroups } from "@/lib/task-groups";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

/** Group filter value: "all" | "none" | group id. */
export type GroupFilter = string;

/** Indentation applied per nesting level, in pixels. */
const INDENT = 18;

/**
 * Left-hand group tree for the tasks page. Lets the user filter by group,
 * create groups/subgroups, expand/collapse subtrees, and delete groups.
 * Nesting (group-in-group) is modeled via parent_id and rendered as an
 * indented tree with connector guides so the hierarchy is visually obvious.
 */
export function GroupSidebar({
  groups,
  selected,
  onSelect,
  onGroupsChanged,
}: {
  groups: TaskGroupDto[];
  selected: GroupFilter;
  onSelect: (value: GroupFilter) => void;
  onGroupsChanged: () => void;
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
        icon={<Layers size={15} />}
        label={t("tasks.groupAll")}
        active={selected === "all"}
        onClick={() => onSelect("all")}
      />
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

/**
 * Vertical connector lines that visually tie a nested group to its ancestors.
 * One line per ancestor level plus an elbow at the current depth.
 */
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
              // The line to the current node stops at the elbow when it's the
              // last child; ancestor lines run the full height.
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
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
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
      <span className="truncate">{label}</span>
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

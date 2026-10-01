import type { TaskGroupDto } from "@dayframe/types";

export interface FlatGroup {
  group: TaskGroupDto;
  /** Nesting level, 0 = root. */
  depth: number;
  /** True when this group has at least one child group. */
  hasChildren: boolean;
  /** True when this node is the last child of its parent (for tree guides). */
  isLast: boolean;
}

/**
 * Turn a flat list of groups (each with parent_id) into a depth-first ordered
 * list annotated with nesting depth, so callers can render an indented tree.
 * Ordering within a parent follows the incoming order (already sorted by
 * position/created_at from the API). Orphaned nodes (missing parent) are
 * treated as roots so nothing silently disappears.
 *
 * Pass `collapsed` (a set of group ids whose subtrees are hidden) to skip the
 * descendants of collapsed groups. Collapsed groups themselves are still
 * emitted (with `hasChildren` true) so the caller can render an expand toggle.
 */
export function flattenGroups(
  groups: TaskGroupDto[],
  collapsed?: ReadonlySet<string>,
): FlatGroup[] {
  const byParent = new Map<string | null, TaskGroupDto[]>();
  const ids = new Set(groups.map((g) => g.id));
  for (const g of groups) {
    const parent = g.parent_id && ids.has(g.parent_id) ? g.parent_id : null;
    const arr = byParent.get(parent) ?? [];
    arr.push(g);
    byParent.set(parent, arr);
  }

  const out: FlatGroup[] = [];
  const visit = (parent: string | null, depth: number) => {
    const siblings = byParent.get(parent) ?? [];
    siblings.forEach((g, i) => {
      const children = byParent.get(g.id) ?? [];
      out.push({
        group: g,
        depth,
        hasChildren: children.length > 0,
        isLast: i === siblings.length - 1,
      });
      if (children.length > 0 && !collapsed?.has(g.id)) {
        visit(g.id, depth + 1);
      }
    });
  };
  visit(null, 0);
  return out;
}

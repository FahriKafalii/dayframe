"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { TaskDto } from "@dayframe/types";
import { TaskRow, type TaskRowHandlers } from "./task-row";
import { cn } from "@/lib/cn";

/**
 * Drag-and-drop sortable task list. Wraps TaskRow with a drag handle and
 * persists the new order via onReorder(ids). Keyboard-accessible (Tab to the
 * handle, Space to pick up, arrows to move). Row callbacks are forwarded via
 * TaskRowHandlers so new actions don't need to be threaded through by hand.
 */
export function SortableTaskList({
  tasks,
  onReorder,
  ...handlers
}: TaskRowHandlers & {
  tasks: TaskDto[];
  onReorder: (orderedIds: string[]) => void;
}) {
  // Local copy so the reorder feels instant; synced when the prop changes.
  const [items, setItems] = useState(tasks);
  useEffect(() => setItems(tasks), [tasks]);

  const sensors = useSensors(
    // 6px activation distance so a click still fires normal button actions.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((t) => t.id === active.id);
    const newIndex = items.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    onReorder(next.map((t) => t.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((task) => (
          <SortableRow key={task.id} task={task} {...handlers} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({
  task,
  ...handlers
}: TaskRowHandlers & { task: TaskDto }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative flex items-stretch",
        isDragging &&
          "z-10 shadow-[var(--shadow-pop)] bg-[color:var(--color-surface)] rounded-md",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className="shrink-0 px-1.5 flex items-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)] cursor-grab active:cursor-grabbing touch-none border-b border-[color:var(--color-border)] last:border-b-0"
      >
        <GripVertical size={15} />
      </button>
      <div className="flex-1 min-w-0">
        <TaskRow task={task} {...handlers} />
      </div>
    </div>
  );
}

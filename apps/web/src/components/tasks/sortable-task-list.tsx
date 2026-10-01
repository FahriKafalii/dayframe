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

export function SortableTaskList({
  tasks,
  onReorder,
  ...handlers
}: TaskRowHandlers & {
  tasks: TaskDto[];
  onReorder: (orderedIds: string[]) => void;
}) {
  const [items, setItems] = useState(tasks);
  useEffect(() => setItems(tasks), [tasks]);

  const sensors = useSensors(
    // Require 6px of movement before dragging so taps still fire row buttons.
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
        "group/row relative flex items-stretch",
        isDragging &&
          "z-10 shadow-[var(--shadow-pop)] bg-[color:var(--color-surface)] rounded-md",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        className={cn(
          "shrink-0 flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:text-[color:var(--color-fg-muted)] cursor-grab active:cursor-grabbing touch-none border-b border-[color:var(--color-border)] last:border-b-0 transition-opacity",
          // Thin, hover-revealed handle on desktop; hidden on phones to give the
          // title full width (reordering there is a niche gesture).
          "hidden sm:flex w-5 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100",
        )}
      >
        <GripVertical size={15} />
      </button>
      <div className="flex-1 min-w-0">
        <TaskRow task={task} {...handlers} />
      </div>
    </div>
  );
}

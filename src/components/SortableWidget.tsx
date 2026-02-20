"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

type SortableWidgetProps = {
  id: string;
  children: ReactNode;
  colSpan?: number;
};

export default function SortableWidget({ id, children, colSpan = 1 }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const spanClass = colSpan === 2 ? "sm:col-span-2" : "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-grab active:cursor-grabbing ${spanClass}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

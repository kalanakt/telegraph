"use client";

import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from "@xyflow/react";

export function BuilderEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  label,
  selected,
  data,
}: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.38,
  });

  const edgeData = (data ?? {}) as {
    onInsertNode?: (edgeId: string, anchor: { x: number; y: number }) => void;
    onDeleteEdge?: (edgeId: string) => void;
  };

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan builder-edge-label"
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 18}px)` }}
            title={String(label)}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan flex items-center gap-2"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <button
            type="button"
            className={`builder-edge-insert ${selected ? "builder-edge-insert-active" : ""}`}
            onClick={(event) => {
              event.stopPropagation();
              edgeData.onInsertNode?.(id, {
                x: event.clientX,
                y: event.clientY,
              });
            }}
            aria-label="Insert node on edge"
          >
            Add
          </button>
          {selected ? (
            <button
              type="button"
              className="rounded-sm border border-rose-300/80 bg-background/96 px-2 py-1 text-[10px] font-medium text-rose-700 shadow-sm transition hover:bg-rose-50"
              onClick={(event) => {
                event.stopPropagation();
                edgeData.onDeleteEdge?.(id);
              }}
              aria-label="Delete edge"
            >
              Delete
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

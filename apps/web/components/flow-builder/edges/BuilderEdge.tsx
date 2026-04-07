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

  const edgeData = (data ?? {}) as { onInsertNode?: (edgeId: string, anchor: { x: number; y: number }) => void };

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
        <button
          type="button"
          className={`nodrag nopan builder-edge-insert ${selected ? "builder-edge-insert-active" : ""}`}
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          onClick={(event) => {
            edgeData.onInsertNode?.(id, {
              x: event.clientX,
              y: event.clientY,
            });
          }}
          aria-label="Insert node on edge"
        >
          Add
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

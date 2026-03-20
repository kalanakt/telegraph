import { Handle, type NodeProps, Position } from "@xyflow/react";

export function ConditionNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-yellow-400 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="rounded-t-md bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-700">
        🔀 Condition
      </div>
      <div className="px-3 py-2 text-sm text-gray-700">
        {(d["variable"] as string) || "var"}{" "}
        {(d["operator"] as string) || "eq"}{" "}
        {(d["value"] as string) || "?"}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "30%" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "70%" }}
      />
    </div>
  );
}

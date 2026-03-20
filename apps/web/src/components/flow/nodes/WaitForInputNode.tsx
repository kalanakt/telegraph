import { Handle, type NodeProps, Position } from "@xyflow/react";

export function WaitForInputNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-orange-400 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="rounded-t-md bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700">
        ⏳ Wait for Input
      </div>
      <div className="max-w-[200px] truncate px-3 py-2 text-sm text-gray-700">
        → {(d["varName"] as string) || "input"}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

import { Handle, type NodeProps, Position } from "@xyflow/react";

export function SetVariableNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-gray-400 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="rounded-t-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
        📝 Set Variable
      </div>
      <div className="px-3 py-2 text-sm text-gray-700">
        {(d["variable"] as string) || "var"} ={" "}
        {(d["valueExpression"] as string) || "value"}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

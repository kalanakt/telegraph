import { Handle, type NodeProps, Position } from "@xyflow/react";

export function SendMediaNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-blue-400 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="rounded-t-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
        🖼️ Send Media
      </div>
      <div className="px-3 py-2 text-sm text-gray-700">
        {(d["mediaType"] as string) || "photo"}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

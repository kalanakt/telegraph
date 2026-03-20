import { Handle, type NodeProps, Position } from "@xyflow/react";

export function HttpRequestNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-green-400 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="rounded-t-md bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
        🌐 HTTP Request
      </div>
      <div className="px-3 py-2 text-sm text-gray-700">
        {(d["method"] as string) || "GET"}{" "}
        <span className="text-xs text-gray-400">
          {(d["url"] as string) || "url"}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

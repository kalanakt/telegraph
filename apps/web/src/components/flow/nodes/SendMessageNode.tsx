import { Handle, type NodeProps, Position } from "@xyflow/react";

export function SendMessageNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  const text = (d["text"] as string) || "Message text…";
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-blue-400 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="rounded-t-md bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700">
        📤 Send Message
      </div>
      <div className="max-w-[200px] truncate px-3 py-2 text-sm text-gray-700">
        {text}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

import { Handle, type NodeProps, Position } from "@xyflow/react";

export function AiPromptNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-green-400 bg-white shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="rounded-t-md bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
        🤖 AI Prompt
      </div>
      <div className="max-w-[200px] truncate px-3 py-2 text-sm text-gray-700">
        {(d["model"] as string) || "gpt-4o-mini"}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

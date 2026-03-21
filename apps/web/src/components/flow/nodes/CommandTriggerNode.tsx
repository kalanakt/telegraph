import { Handle, type NodeProps, Position } from "@xyflow/react";

export function CommandTriggerNode({ data }: NodeProps) {
  const d = data as Record<string, unknown>;
  return (
    <div className="min-w-[160px] rounded-lg border-2 border-purple-400 bg-white shadow-sm">
      <div className="rounded-t-md bg-purple-100 px-3 py-1.5 text-xs font-semibold text-purple-700">
        ⌘ Command Trigger
      </div>
      <div className="px-3 py-2 text-sm text-gray-700">
        {(d["command"] as string) || "/command"}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

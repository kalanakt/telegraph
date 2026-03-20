import { DragEvent } from "react";

interface PaletteItem {
  type: string;
  label: string;
}

const categories: { name: string; items: PaletteItem[] }[] = [
  {
    name: "Triggers",
    items: [
      { type: "command_trigger", label: "Command" },
      { type: "message_trigger", label: "Message" },
      { type: "callback_trigger", label: "Callback" },
    ],
  },
  {
    name: "Actions",
    items: [
      { type: "send_message", label: "Send Message" },
      { type: "send_media", label: "Send Media" },
      { type: "http_request", label: "HTTP Request" },
      { type: "ai_prompt", label: "AI Prompt" },
    ],
  },
  {
    name: "Logic",
    items: [
      { type: "condition", label: "Condition" },
      { type: "set_variable", label: "Set Variable" },
      { type: "wait_for_input", label: "Wait for Input" },
    ],
  },
];

function onDragStart(event: DragEvent, nodeType: string) {
  event.dataTransfer.setData("application/reactflow", nodeType);
  event.dataTransfer.effectAllowed = "move";
}

export function NodePalette() {
  return (
    <aside className="w-56 overflow-y-auto border-r border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Nodes
      </h3>
      {categories.map((cat) => (
        <div key={cat.name} className="mb-4">
          <h4 className="mb-2 text-xs font-medium text-gray-400">
            {cat.name}
          </h4>
          <div className="space-y-1">
            {cat.items.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                className="cursor-grab rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 active:cursor-grabbing"
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}

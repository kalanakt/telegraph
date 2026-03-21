import type { Node } from "@xyflow/react";

interface NodeConfigPanelProps {
  node: Node;
  onChange: (id: string, data: Record<string, unknown>) => void;
}

export function NodeConfigPanel({ node, onChange }: NodeConfigPanelProps) {
  const data = node.data as Record<string, unknown>;

  const update = (key: string, value: unknown) => {
    onChange(node.id, { ...data, [key]: value });
  };

  const renderFields = () => {
    switch (node.type) {
      case "command_trigger":
        return (
          <Field label="Command">
            <input
              type="text"
              value={(data["command"] as string) ?? ""}
              onChange={(e) => update("command", e.target.value)}
              placeholder="/start"
              className="input"
            />
          </Field>
        );

      case "message_trigger":
        return (
          <Field label="Pattern">
            <input
              type="text"
              value={(data["pattern"] as string) ?? ""}
              onChange={(e) => update("pattern", e.target.value)}
              placeholder="regex or text"
              className="input"
            />
          </Field>
        );

      case "callback_trigger":
        return (
          <Field label="Callback Data">
            <input
              type="text"
              value={(data["callbackData"] as string) ?? ""}
              onChange={(e) => update("callbackData", e.target.value)}
              placeholder="callback_data"
              className="input"
            />
          </Field>
        );

      case "send_message":
        return (
          <>
            <Field label="Text">
              <textarea
                value={(data["text"] as string) ?? ""}
                onChange={(e) => update("text", e.target.value)}
                rows={4}
                className="input"
              />
            </Field>
            <Field label="Parse Mode">
              <select
                value={(data["parseMode"] as string) ?? ""}
                onChange={(e) => update("parseMode", e.target.value)}
                className="input"
              >
                <option value="">None</option>
                <option value="HTML">HTML</option>
                <option value="MarkdownV2">MarkdownV2</option>
              </select>
            </Field>
          </>
        );

      case "send_media":
        return (
          <>
            <Field label="Media Type">
              <select
                value={(data["mediaType"] as string) ?? "photo"}
                onChange={(e) => update("mediaType", e.target.value)}
                className="input"
              >
                <option value="photo">Photo</option>
                <option value="video">Video</option>
                <option value="document">Document</option>
                <option value="audio">Audio</option>
              </select>
            </Field>
            <Field label="URL">
              <input
                type="text"
                value={(data["url"] as string) ?? ""}
                onChange={(e) => update("url", e.target.value)}
                className="input"
              />
            </Field>
          </>
        );

      case "http_request":
        return (
          <>
            <Field label="Method">
              <select
                value={(data["method"] as string) ?? "GET"}
                onChange={(e) => update("method", e.target.value)}
                className="input"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </Field>
            <Field label="URL">
              <input
                type="text"
                value={(data["url"] as string) ?? ""}
                onChange={(e) => update("url", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Headers (JSON)">
              <textarea
                value={(data["headers"] as string) ?? ""}
                onChange={(e) => update("headers", e.target.value)}
                rows={3}
                className="input font-mono text-xs"
              />
            </Field>
            <Field label="Body">
              <textarea
                value={(data["body"] as string) ?? ""}
                onChange={(e) => update("body", e.target.value)}
                rows={3}
                className="input"
              />
            </Field>
          </>
        );

      case "ai_prompt":
        return (
          <>
            <Field label="Model">
              <select
                value={(data["model"] as string) ?? "gpt-4o-mini"}
                onChange={(e) => update("model", e.target.value)}
                className="input"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
              </select>
            </Field>
            <Field label="Prompt">
              <textarea
                value={(data["userPromptTemplate"] as string) ?? ""}
                onChange={(e) => update("userPromptTemplate", e.target.value)}
                rows={4}
                className="input"
              />
            </Field>
            <Field label="Result Variable">
              <input
                type="text"
                value={(data["responseVariable"] as string) ?? ""}
                onChange={(e) => update("responseVariable", e.target.value)}
                className="input"
              />
            </Field>
          </>
        );

      case "condition":
        return (
          <>
            <Field label="Variable">
              <input
                type="text"
                value={(data["variable"] as string) ?? ""}
                onChange={(e) => update("variable", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Operator">
              <select
                value={(data["operator"] as string) ?? "eq"}
                onChange={(e) => update("operator", e.target.value)}
                className="input"
              >
                <option value="eq">equals</option>
                <option value="neq">not equals</option>
                <option value="contains">contains</option>
                <option value="gt">greater than</option>
                <option value="lt">less than</option>
              </select>
            </Field>
            <Field label="Value">
              <input
                type="text"
                value={(data["value"] as string) ?? ""}
                onChange={(e) => update("value", e.target.value)}
                className="input"
              />
            </Field>
          </>
        );

      case "set_variable":
        return (
          <>
            <Field label="Variable Name">
              <input
                type="text"
                value={(data["variable"] as string) ?? ""}
                onChange={(e) => update("variable", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Expression">
              <input
                type="text"
                value={(data["valueExpression"] as string) ?? ""}
                onChange={(e) => update("valueExpression", e.target.value)}
                className="input"
              />
            </Field>
          </>
        );

      case "wait_for_input":
        return (
          <>
            <Field label="Prompt Text">
              <textarea
                value={(data["promptText"] as string) ?? ""}
                onChange={(e) => update("promptText", e.target.value)}
                rows={3}
                className="input"
              />
            </Field>
            <Field label="Variable Name">
              <input
                type="text"
                value={(data["variable"] as string) ?? ""}
                onChange={(e) => update("variable", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Timeout (seconds)">
              <input
                type="number"
                value={(data["timeoutSecs"] as number) ?? ""}
                onChange={(e) =>
                  update(
                    "timeoutSecs",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                className="input"
              />
            </Field>
          </>
        );

      default:
        return (
          <p className="text-sm text-gray-500">
            No configuration for this node type.
          </p>
        );
    }
  };

  return (
    <aside className="w-72 overflow-y-auto border-l border-gray-200 bg-white p-4">
      <h3 className="mb-1 text-sm font-semibold text-gray-900">
        Configure Node
      </h3>
      <p className="mb-4 text-xs text-gray-400">{node.type}</p>
      <div className="space-y-3">{renderFields()}</div>

      {/* Shared input styles via Tailwind's @apply would be ideal, but inline works fine */}
      <style>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #d1d5db;
          padding: 0.375rem 0.625rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      `}</style>
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
      {children}
    </div>
  );
}

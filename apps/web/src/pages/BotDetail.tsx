import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useBot } from "../api/bots";
import { useCreateFlow, useFlows } from "../api/flows";

export function BotDetail() {
  const { botId } = useParams<{ botId: string }>();
  const { data: bot, isLoading: botLoading } = useBot(botId!);
  const { data: flows, isLoading: flowsLoading } = useFlows(botId!);
  const createFlow = useCreateFlow();
  const [showForm, setShowForm] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [flowDesc, setFlowDesc] = useState("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createFlow.mutate(
      { botId: botId!, name: flowName, description: flowDesc || undefined },
      {
        onSuccess: () => {
          setShowForm(false);
          setFlowName("");
          setFlowDesc("");
        },
      },
    );
  };

  if (botLoading) return <p className="p-8 text-gray-500">Loading bot…</p>;
  if (!bot) return <p className="p-8 text-gray-500">Bot not found.</p>;

  return (
    <div className="p-8">
      {/* Bot header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{bot.name}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              bot.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {bot.status}
          </span>
        </div>
        <p className="text-sm text-gray-500">@{bot.username}</p>
        <p className="mt-1 text-xs text-gray-400">
          Webhook: {bot.webhookConfigured ? "✅ Configured" : "❌ Not set"}
        </p>
      </div>

      {/* Flows section */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Flows</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Create Flow"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Flow Name
              </label>
              <input
                type="text"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={flowDesc}
                onChange={(e) => setFlowDesc(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {createFlow.error && (
            <p className="mt-2 text-sm text-red-600">
              {createFlow.error.message}
            </p>
          )}
          <button
            type="submit"
            disabled={createFlow.isPending}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createFlow.isPending ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {flowsLoading && <p className="text-gray-500">Loading flows…</p>}

      <div className="space-y-3">
        {flows?.map((flow) => (
          <Link
            key={flow.id}
            to={`/bots/${botId}/flows/${flow.id}`}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md"
          >
            <div>
              <h3 className="font-medium text-gray-900">{flow.name}</h3>
              {flow.description && (
                <p className="text-sm text-gray-500">{flow.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400">v{flow.version}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  flow.published
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {flow.published ? "Published" : "Draft"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {flows && flows.length === 0 && !flowsLoading && (
        <p className="text-center text-gray-500">
          No flows yet. Create your first flow to get started!
        </p>
      )}
    </div>
  );
}

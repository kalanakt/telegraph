import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { useBots, useCreateBot } from "../api/bots";

export function Bots() {
  const { data: bots, isLoading } = useBots();
  const createBot = useCreateBot();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [token, setToken] = useState("");

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    createBot.mutate(
      { name, username, token },
      {
        onSuccess: () => {
          setShowForm(false);
          setName("");
          setUsername("");
          setToken("");
        },
      },
    );
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Your Bots</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "Create Bot"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-lg border border-gray-200 bg-white p-6"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bot Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="my_bot"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Bot Token
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {createBot.error && (
            <p className="mt-2 text-sm text-red-600">
              {createBot.error.message}
            </p>
          )}
          <button
            type="submit"
            disabled={createBot.isPending}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {createBot.isPending ? "Creating…" : "Create"}
          </button>
        </form>
      )}

      {isLoading && <p className="text-gray-500">Loading bots…</p>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bots?.map((bot) => (
          <Link
            key={bot.id}
            to={`/bots/${bot.id}`}
            className="rounded-lg border border-gray-200 bg-white p-6 transition hover:shadow-md"
          >
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{bot.name}</h3>
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
          </Link>
        ))}
      </div>

      {bots && bots.length === 0 && !isLoading && (
        <p className="text-center text-gray-500">
          No bots yet. Create your first bot to get started!
        </p>
      )}
    </div>
  );
}

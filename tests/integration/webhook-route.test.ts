import { beforeEach, describe, expect, it, vi } from "vitest";

const handleIncomingUpdateMock = vi.fn();

vi.mock("@/lib/orchestrator/service", () => ({
  getAutomationOrchestrator: () => ({
    handleIncomingUpdate: (...args: unknown[]) => handleIncomingUpdateMock(...args)
  })
}));

import { POST } from "@/app/api/telegram/webhook/[botId]/route";

describe("POST /api/telegram/webhook/[botId]", () => {
  beforeEach(() => {
    process.env.TELEGRAM_WEBHOOK_SECRET_TOKEN = "secret";
    handleIncomingUpdateMock.mockReset();
  });

  it("rejects invalid webhook secrets", async () => {
    const response = await POST(
      new Request("http://localhost/api/telegram/webhook/bot_1", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-telegram-bot-api-secret-token": "wrong"
        },
        body: JSON.stringify({ update_id: 1 })
      }),
      { params: Promise.resolve({ botId: "bot_1" }) }
    );

    expect(response.status).toBe(401);
    expect(handleIncomingUpdateMock).not.toHaveBeenCalled();
  });
});

export interface UpdateJobData {
  botId: string;
  rawUpdateId: string;
  telegramUpdateId: number;
}

export interface ExecuteJobData {
  botId: string;
  chatId: string;
  planId: string;
  entryNodeId: string;
  updateData: Record<string, unknown>;
}

export interface OutboundJobData {
  botId: string;
  chatId: string;
  method: string;
  params: Record<string, unknown>;
}

export interface AiJobData {
  botId: string;
  chatId: string;
  planId: string;
  nodeId: string;
  resumeNodeId: string | null;
  config: {
    systemPrompt?: string;
    userPromptTemplate: string;
    model?: string;
    responseVariable: string;
  };
}

export interface PaymentJobData {
  botId: string;
  chatId?: string;
  update: Record<string, unknown>;
  type: "pre_checkout" | "successful_payment";
}

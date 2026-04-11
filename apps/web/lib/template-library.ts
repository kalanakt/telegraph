import {
  workflowTemplateDraftSchema,
  type ActionPayload,
  type ConditionPayload,
  type FlowDefinition,
  type JsonValue,
  type TriggerType,
  type WorkflowTemplateDraft,
} from "@telegram-builder/shared";

export type BuiltInTemplateCategory =
  | "onboarding"
  | "support"
  | "sales"
  | "operations"
  | "moderation"
  | "commerce";

export type BuiltInTemplateAudience = "business" | "community";
export type BuiltInTemplateSetupLevel = "instant" | "guided" | "advanced";

export type CuratedWorkflowTemplate = WorkflowTemplateDraft & {
  id: `builtin:${string}`;
  slug: string;
  category: BuiltInTemplateCategory;
  audience: BuiltInTemplateAudience;
  featured: boolean;
  setupLevel: BuiltInTemplateSetupLevel;
  requiresExternalIntegration: boolean;
  featuredOrder?: number;
};

function withLabel(label?: string) {
  return label ? { meta: { label } } : {};
}

function startNode(id: string, x: number, y: number, trigger: TriggerType, label?: string) {
  return {
    id,
    type: "start" as const,
    position: { x, y },
    data: { trigger },
    ...withLabel(label),
  };
}

function conditionNode(id: string, x: number, y: number, data: ConditionPayload, label?: string) {
  return {
    id,
    type: "condition" as const,
    position: { x, y },
    data,
    ...withLabel(label),
  };
}

function actionNode(id: string, x: number, y: number, data: ActionPayload, label?: string) {
  return {
    id,
    type: "action" as const,
    position: { x, y },
    data,
    ...withLabel(label),
  };
}

function delayNode(id: string, x: number, y: number, delayMs: number, label?: string) {
  return {
    id,
    type: "delay" as const,
    position: { x, y },
    data: { delay_ms: delayMs },
    ...withLabel(label),
  };
}

function setVariableNode(id: string, x: number, y: number, path: string, value: JsonValue, label?: string) {
  return {
    id,
    type: "set_variable" as const,
    position: { x, y },
    data: { path, value },
    ...withLabel(label),
  };
}

function switchNode(
  id: string,
  x: number,
  y: number,
  path: string,
  cases: Array<{ id: string; value: string; label?: string }>,
  label?: string
) {
  return {
    id,
    type: "switch" as const,
    position: { x, y },
    data: { path, cases },
    ...withLabel(label),
  };
}

function edge(id: string, source: string, target: string, sourceHandle?: string) {
  return {
    id,
    source,
    target,
    ...(sourceHandle ? { sourceHandle } : {}),
  };
}

function defineFlow(nodes: FlowDefinition["nodes"], edges: FlowDefinition["edges"]): FlowDefinition {
  return { nodes, edges };
}

function defineTemplate(template: CuratedWorkflowTemplate): CuratedWorkflowTemplate {
  const { id, slug, category, audience, featured, setupLevel, requiresExternalIntegration, featuredOrder, ...draft } =
    template;

  workflowTemplateDraftSchema.parse(draft);

  if (!id.startsWith("builtin:")) {
    throw new Error(`Built-in template ids must start with builtin:. Received '${id}'.`);
  }

  if (id !== `builtin:${slug}`) {
    throw new Error(`Built-in template id '${id}' must match slug '${slug}'.`);
  }

  if (featured && typeof featuredOrder !== "number") {
    throw new Error(`Featured template '${slug}' must define featuredOrder.`);
  }

  if (!featured && typeof featuredOrder !== "undefined") {
    throw new Error(`Non-featured template '${slug}' cannot define featuredOrder.`);
  }

  if (requiresExternalIntegration) {
    throw new Error(`Built-in template '${slug}' cannot require external integrations in the current catalog.`);
  }

  return {
    ...draft,
    id,
    slug,
    category,
    audience,
    featured,
    setupLevel,
    requiresExternalIntegration,
    ...(typeof featuredOrder === "number" ? { featuredOrder } : {}),
  };
}

export const CURATED_WORKFLOW_TEMPLATES: CuratedWorkflowTemplate[] = [
  defineTemplate({
    id: "builtin:starter-commands-pack",
    slug: "starter-commands-pack",
    title: "Starter Commands Pack",
    description:
      "A polished onboarding bundle for /start and /help. It welcomes new users, follows up after a short delay, and gives them obvious next steps without any external setup.",
    visibility: "PUBLIC",
    category: "onboarding",
    audience: "business",
    featured: true,
    setupLevel: "instant",
    requiresExternalIntegration: false,
    featuredOrder: 1,
    flows: [
      {
        name: "Welcome users on /start",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("start_start", 0, 0, "command_received", "Command received"),
            conditionNode("check_start", 220, 0, { type: "command_equals", value: "/start" }, "Is /start"),
            actionNode(
              "typing_welcome",
              460,
              0,
              {
                type: "telegram.sendChatAction",
                params: {
                  chat_id: "{{event.chatId}}",
                  action: "typing",
                },
              },
              "Typing indicator"
            ),
            actionNode(
              "send_welcome",
              700,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Welcome. I can help with support, pricing, and onboarding.\n\nTry:\n/help\n/hours\n/demo\n\nOr type support, pricing, or sales.",
                },
              },
              "Send welcome"
            ),
            delayNode("delay_follow_up", 940, 0, 120_000, "Wait 2 minutes"),
            actionNode(
              "send_follow_up",
              1180,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Quick tip: if someone types pricing, demo, refund, or support, you can route them with the other built-in templates right away.",
                },
              },
              "Send follow-up"
            ),
          ],
          [
            edge("e_start_1", "start_start", "check_start"),
            edge("e_start_2", "check_start", "typing_welcome", "true"),
            edge("e_start_3", "typing_welcome", "send_welcome"),
            edge("e_start_4", "send_welcome", "delay_follow_up"),
            edge("e_start_5", "delay_follow_up", "send_follow_up"),
          ]
        ),
      },
      {
        name: "Help menu on /help",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("start_help", 0, 0, "command_received", "Command received"),
            conditionNode("check_help", 220, 0, { type: "command_equals", value: "/help" }, "Is /help"),
            actionNode(
              "send_help",
              460,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Fastest next steps:\n• Type support for billing or technical help\n• Type pricing for plan guidance\n• Use /demo to start a sales conversation\n• Use /hours to share response times",
                },
              },
              "Send help menu"
            ),
          ],
          [edge("e_help_1", "start_help", "check_help"), edge("e_help_2", "check_help", "send_help", "true")]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:faq-button-router",
    slug: "faq-button-router",
    title: "FAQ Button Router",
    description:
      "Turn common pricing, setup, and hours questions into a neat button-driven FAQ flow that keeps replies consistent and easy to maintain.",
    visibility: "PUBLIC",
    category: "support",
    audience: "business",
    featured: true,
    setupLevel: "instant",
    requiresExternalIntegration: false,
    featuredOrder: 2,
    flows: [
      {
        name: "Offer FAQ choices from inbound messages",
        trigger: "message_received",
        flowDefinition: defineFlow(
          [
            startNode("faq_start", 0, 0, "message_received", "Message received"),
            conditionNode(
              "faq_match",
              240,
              0,
              {
                type: "any",
                conditions: [
                  { type: "text_contains", value: "pricing" },
                  { type: "text_contains", value: "price" },
                  { type: "text_contains", value: "setup" },
                  { type: "text_contains", value: "install" },
                  { type: "text_contains", value: "hours" },
                  { type: "text_contains", value: "when are you open" },
                ],
              },
              "Looks like an FAQ"
            ),
            actionNode(
              "faq_buttons",
              520,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "I can answer the most common questions right away. Pick one:",
                  reply_markup: {
                    inline_keyboard: [
                      [
                        { text: "Pricing", callback_data: "faq:pricing" },
                        { text: "Setup", callback_data: "faq:setup" },
                      ],
                      [{ text: "Business hours", callback_data: "faq:hours" }],
                    ],
                  },
                },
              },
              "Send FAQ buttons"
            ),
          ],
          [edge("e_faq_1", "faq_start", "faq_match"), edge("e_faq_2", "faq_match", "faq_buttons", "true")]
        ),
      },
      {
        name: "Reply to FAQ callback buttons",
        trigger: "callback_query_received",
        flowDefinition: defineFlow(
          [
            startNode("faq_callback_start", 0, 0, "callback_query_received", "Callback received"),
            conditionNode(
              "faq_callback_match",
              220,
              0,
              { type: "callback_data_contains", value: "faq:" },
              "FAQ callback"
            ),
            actionNode(
              "answer_faq_callback",
              460,
              0,
              {
                type: "telegram.answerCallbackQuery",
                params: {
                  callback_query_id: "{{event.callbackQueryId}}",
                  text: "Here you go",
                },
              },
              "Answer callback"
            ),
            setVariableNode("faq_selection", 700, 0, "faq.selection", "{{event.callbackData}}", "Store FAQ topic"),
            switchNode(
              "faq_switch",
              940,
              0,
              "vars.faq.selection",
              [
                { id: "pricing", value: "faq:pricing", label: "Pricing" },
                { id: "setup", value: "faq:setup", label: "Setup" },
                { id: "hours", value: "faq:hours", label: "Hours" },
              ],
              "Route FAQ topic"
            ),
            actionNode(
              "faq_pricing_reply",
              1220,
              -140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Pricing conversations usually move fastest when you share team size, your main use case, and whether you need approval or reporting features.",
                },
              },
              "Pricing reply"
            ),
            actionNode(
              "faq_setup_reply",
              1220,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Setup is usually three steps: connect the bot, define the first trigger, then turn on the flow only after you test it in a private chat.",
                },
              },
              "Setup reply"
            ),
            actionNode(
              "faq_hours_reply",
              1220,
              140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Our standard response window is Monday to Friday, 9 AM to 6 PM. Update this message with your real hours before enabling the flow.",
                },
              },
              "Hours reply"
            ),
            actionNode(
              "faq_fallback_reply",
              1220,
              280,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "I could not match that option. Send /help or type your question in plain language.",
                },
              },
              "Fallback reply"
            ),
          ],
          [
            edge("e_faq_cb_1", "faq_callback_start", "faq_callback_match"),
            edge("e_faq_cb_2", "faq_callback_match", "answer_faq_callback", "true"),
            edge("e_faq_cb_3", "answer_faq_callback", "faq_selection"),
            edge("e_faq_cb_4", "faq_selection", "faq_switch"),
            edge("e_faq_cb_5", "faq_switch", "faq_pricing_reply", "pricing"),
            edge("e_faq_cb_6", "faq_switch", "faq_setup_reply", "setup"),
            edge("e_faq_cb_7", "faq_switch", "faq_hours_reply", "hours"),
            edge("e_faq_cb_8", "faq_switch", "faq_fallback_reply", "default"),
          ]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:support-triage-buttons",
    slug: "support-triage-buttons",
    title: "Support Triage Buttons",
    description:
      "Detect support intent from normal messages, then route button taps into tailored billing, technical, or general support replies.",
    visibility: "PUBLIC",
    category: "support",
    audience: "business",
    featured: true,
    setupLevel: "instant",
    requiresExternalIntegration: false,
    featuredOrder: 3,
    flows: [
      {
        name: "Offer support options from inbound messages",
        trigger: "message_received",
        flowDefinition: defineFlow(
          [
            startNode("support_start", 0, 0, "message_received", "Message received"),
            conditionNode(
              "support_match",
              240,
              0,
              {
                type: "any",
                conditions: [
                  { type: "text_contains", value: "support" },
                  { type: "text_contains", value: "billing" },
                  { type: "text_contains", value: "refund" },
                  { type: "text_contains", value: "issue" },
                  { type: "text_contains", value: "bug" },
                  { type: "text_contains", value: "help" },
                ],
              },
              "Looks like support intent"
            ),
            actionNode(
              "support_buttons",
              520,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What do you need help with most right now?",
                  reply_markup: {
                    inline_keyboard: [
                      [
                        { text: "Billing", callback_data: "support:billing" },
                        { text: "Technical", callback_data: "support:technical" },
                      ],
                      [{ text: "Other", callback_data: "support:other" }],
                    ],
                  },
                },
              },
              "Send support buttons"
            ),
          ],
          [edge("e_support_1", "support_start", "support_match"), edge("e_support_2", "support_match", "support_buttons", "true")]
        ),
      },
      {
        name: "Route support callback buttons",
        trigger: "callback_query_received",
        flowDefinition: defineFlow(
          [
            startNode("callback_start", 0, 0, "callback_query_received", "Callback received"),
            conditionNode(
              "support_callback_match",
              220,
              0,
              { type: "callback_data_contains", value: "support:" },
              "Support callback"
            ),
            actionNode(
              "answer_support_callback",
              460,
              0,
              {
                type: "telegram.answerCallbackQuery",
                params: {
                  callback_query_id: "{{event.callbackQueryId}}",
                  text: "Routing you now",
                },
              },
              "Answer callback"
            ),
            setVariableNode("save_support_selection", 700, 0, "triage.selection", "{{event.callbackData}}", "Save selection"),
            switchNode(
              "support_switch",
              940,
              0,
              "vars.triage.selection",
              [
                { id: "billing", value: "support:billing", label: "Billing" },
                { id: "technical", value: "support:technical", label: "Technical" },
                { id: "other", value: "support:other", label: "Other" },
              ],
              "Route selection"
            ),
            actionNode(
              "send_billing_help",
              1220,
              -140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "For billing questions, send the invoice issue, the affected account, and whether this is a refund or plan-change request.",
                },
              },
              "Billing reply"
            ),
            actionNode(
              "send_technical_help",
              1220,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "For technical issues, send the error, the step that failed, and a screenshot if you have one.",
                },
              },
              "Technical reply"
            ),
            actionNode(
              "send_other_help",
              1220,
              140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Tell us what you need and a teammate can pick it up from there.",
                },
              },
              "Other reply"
            ),
            actionNode(
              "send_support_fallback",
              1220,
              280,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "I could not match that button. Try the menu again or type support.",
                },
              },
              "Fallback reply"
            ),
          ],
          [
            edge("e_callback_1", "callback_start", "support_callback_match"),
            edge("e_callback_2", "support_callback_match", "answer_support_callback", "true"),
            edge("e_callback_3", "answer_support_callback", "save_support_selection"),
            edge("e_callback_4", "save_support_selection", "support_switch"),
            edge("e_callback_5", "support_switch", "send_billing_help", "billing"),
            edge("e_callback_6", "support_switch", "send_technical_help", "technical"),
            edge("e_callback_7", "support_switch", "send_other_help", "other"),
            edge("e_callback_8", "support_switch", "send_support_fallback", "default"),
          ]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:lead-qualification-chat",
    slug: "lead-qualification-chat",
    title: "Lead Qualification Chat",
    description:
      "Turn /demo and inbound sales messages into a structured, in-chat qualification prompt that asks for the core details a human operator needs next.",
    visibility: "PUBLIC",
    category: "sales",
    audience: "business",
    featured: true,
    setupLevel: "instant",
    requiresExternalIntegration: false,
    featuredOrder: 4,
    flows: [
      {
        name: "Capture demo intent from messages",
        trigger: "message_received",
        flowDefinition: defineFlow(
          [
            startNode("lead_msg_start", 0, 0, "message_received", "Message received"),
            conditionNode(
              "lead_msg_match",
              240,
              0,
              {
                type: "any",
                conditions: [
                  { type: "text_contains", value: "demo" },
                  { type: "text_contains", value: "pricing" },
                  { type: "text_contains", value: "quote" },
                  { type: "text_contains", value: "sales" },
                  { type: "text_contains", value: "enterprise" },
                ],
              },
              "Lead intent detected"
            ),
            setVariableNode("lead_msg_store", 500, 0, "lead.intent", "{{event.text}}", "Store lead intent"),
            actionNode(
              "lead_msg_ack",
              760,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Thanks. To help the right person respond, reply with:\n1. Your team size\n2. What you want to automate\n3. Your timeline\n\nI already captured: {{vars.lead.intent}}",
                },
              },
              "Acknowledge lead"
            ),
          ],
          [
            edge("e_lead_msg_1", "lead_msg_start", "lead_msg_match"),
            edge("e_lead_msg_2", "lead_msg_match", "lead_msg_store", "true"),
            edge("e_lead_msg_3", "lead_msg_store", "lead_msg_ack"),
          ]
        ),
      },
      {
        name: "Capture /demo command requests",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("lead_cmd_start", 0, 0, "command_received", "Command received"),
            conditionNode("lead_cmd_match", 240, 0, { type: "command_equals", value: "/demo" }, "Is /demo"),
            setVariableNode("lead_cmd_store", 500, 0, "lead.command_request", "{{event.commandArgs}}", "Store command args"),
            actionNode(
              "lead_cmd_ack",
              760,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Demo request captured. Reply with your use case, team size, and preferred timing so a human follow-up starts with the right context.\n\nCurrent note: {{vars.lead.command_request}}",
                },
              },
              "Acknowledge command"
            ),
          ],
          [
            edge("e_lead_cmd_1", "lead_cmd_start", "lead_cmd_match"),
            edge("e_lead_cmd_2", "lead_cmd_match", "lead_cmd_store", "true"),
            edge("e_lead_cmd_3", "lead_cmd_store", "lead_cmd_ack"),
          ]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:business-hours-away-reply",
    slug: "business-hours-away-reply",
    title: "Business Hours Reply",
    description:
      "Share consistent office hours and response-time expectations whenever someone asks for a human reply or checks /hours.",
    visibility: "PUBLIC",
    category: "operations",
    audience: "business",
    featured: true,
    setupLevel: "guided",
    requiresExternalIntegration: false,
    featuredOrder: 5,
    flows: [
      {
        name: "Send hours on /hours",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("hours_cmd_start", 0, 0, "command_received", "Command received"),
            conditionNode("hours_cmd_match", 220, 0, { type: "command_equals", value: "/hours" }, "Is /hours"),
            actionNode(
              "hours_cmd_reply",
              460,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "We usually reply Monday to Friday, 9 AM to 6 PM. Update this message with your actual hours, holiday policy, and emergency contact path before enabling it.",
                },
              },
              "Send hours"
            ),
          ],
          [edge("e_hours_cmd_1", "hours_cmd_start", "hours_cmd_match"), edge("e_hours_cmd_2", "hours_cmd_match", "hours_cmd_reply", "true")]
        ),
      },
      {
        name: "Reply when someone asks for a human",
        trigger: "message_received",
        flowDefinition: defineFlow(
          [
            startNode("hours_msg_start", 0, 0, "message_received", "Message received"),
            conditionNode(
              "hours_msg_match",
              240,
              0,
              {
                type: "any",
                conditions: [
                  { type: "text_contains", value: "human" },
                  { type: "text_contains", value: "agent" },
                  { type: "text_contains", value: "call me" },
                  { type: "text_contains", value: "when are you open" },
                  { type: "text_contains", value: "office hours" },
                ],
              },
              "Needs hours reply"
            ),
            actionNode(
              "hours_msg_reply",
              500,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "A teammate will reply during business hours. Set this template to your real response window before enabling it so expectations stay accurate.",
                },
              },
              "Send away reply"
            ),
          ],
          [edge("e_hours_msg_1", "hours_msg_start", "hours_msg_match"), edge("e_hours_msg_2", "hours_msg_match", "hours_msg_reply", "true")]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:sales-inquiry-router",
    slug: "sales-inquiry-router",
    title: "Sales Inquiry Router",
    description:
      "Detect pricing and enterprise intent, then route button taps into crisp next-step replies for pricing, demos, or larger sales conversations.",
    visibility: "PUBLIC",
    category: "sales",
    audience: "business",
    featured: true,
    setupLevel: "instant",
    requiresExternalIntegration: false,
    featuredOrder: 6,
    flows: [
      {
        name: "Offer sales options from inbound messages",
        trigger: "message_received",
        flowDefinition: defineFlow(
          [
            startNode("sales_start", 0, 0, "message_received", "Message received"),
            conditionNode(
              "sales_match",
              240,
              0,
              {
                type: "any",
                conditions: [
                  { type: "text_contains", value: "pricing" },
                  { type: "text_contains", value: "quote" },
                  { type: "text_contains", value: "enterprise" },
                  { type: "text_contains", value: "demo" },
                  { type: "text_contains", value: "sales" },
                ],
              },
              "Looks like sales intent"
            ),
            actionNode(
              "sales_buttons",
              520,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What would help most right now?",
                  reply_markup: {
                    inline_keyboard: [
                      [
                        { text: "Pricing", callback_data: "sales:pricing" },
                        { text: "Book demo", callback_data: "sales:demo" },
                      ],
                      [{ text: "Enterprise", callback_data: "sales:enterprise" }],
                    ],
                  },
                },
              },
              "Send sales buttons"
            ),
          ],
          [edge("e_sales_1", "sales_start", "sales_match"), edge("e_sales_2", "sales_match", "sales_buttons", "true")]
        ),
      },
      {
        name: "Route sales callback buttons",
        trigger: "callback_query_received",
        flowDefinition: defineFlow(
          [
            startNode("sales_cb_start", 0, 0, "callback_query_received", "Callback received"),
            conditionNode("sales_cb_match", 220, 0, { type: "callback_data_contains", value: "sales:" }, "Sales callback"),
            actionNode(
              "sales_cb_answer",
              460,
              0,
              {
                type: "telegram.answerCallbackQuery",
                params: {
                  callback_query_id: "{{event.callbackQueryId}}",
                  text: "Got it",
                },
              },
              "Answer callback"
            ),
            setVariableNode("sales_choice", 700, 0, "sales.choice", "{{event.callbackData}}", "Store choice"),
            switchNode(
              "sales_switch",
              940,
              0,
              "vars.sales.choice",
              [
                { id: "pricing", value: "sales:pricing", label: "Pricing" },
                { id: "demo", value: "sales:demo", label: "Book demo" },
                { id: "enterprise", value: "sales:enterprise", label: "Enterprise" },
              ],
              "Route sales choice"
            ),
            actionNode(
              "sales_pricing_reply",
              1220,
              -140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "For pricing, reply with team size and the workflow you want to automate first.",
                },
              },
              "Pricing reply"
            ),
            actionNode(
              "sales_demo_reply",
              1220,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "For a demo, reply with your use case and when you want to go live.",
                },
              },
              "Demo reply"
            ),
            actionNode(
              "sales_enterprise_reply",
              1220,
              140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "For enterprise conversations, share team size, approval needs, and whether audit or reporting is required.",
                },
              },
              "Enterprise reply"
            ),
            actionNode(
              "sales_fallback_reply",
              1220,
              280,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "I could not match that option. Send /demo or describe what you need in one message.",
                },
              },
              "Fallback reply"
            ),
          ],
          [
            edge("e_sales_cb_1", "sales_cb_start", "sales_cb_match"),
            edge("e_sales_cb_2", "sales_cb_match", "sales_cb_answer", "true"),
            edge("e_sales_cb_3", "sales_cb_answer", "sales_choice"),
            edge("e_sales_cb_4", "sales_choice", "sales_switch"),
            edge("e_sales_cb_5", "sales_switch", "sales_pricing_reply", "pricing"),
            edge("e_sales_cb_6", "sales_switch", "sales_demo_reply", "demo"),
            edge("e_sales_cb_7", "sales_switch", "sales_enterprise_reply", "enterprise"),
            edge("e_sales_cb_8", "sales_switch", "sales_fallback_reply", "default"),
          ]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:keyword-moderation-for-groups",
    slug: "keyword-moderation-for-groups",
    title: "Keyword Moderation for Groups",
    description:
      "Clean up obvious spam in group chats by deleting messages with known bad keywords and posting a short moderation note.",
    visibility: "PUBLIC",
    category: "moderation",
    audience: "community",
    featured: true,
    setupLevel: "guided",
    requiresExternalIntegration: false,
    featuredOrder: 7,
    flows: [
      {
        name: "Delete obvious spam keywords",
        trigger: "message_received",
        flowDefinition: defineFlow(
          [
            startNode("moderation_start", 0, 0, "message_received", "Message received"),
            conditionNode(
              "moderation_match",
              240,
              0,
              {
                type: "all",
                conditions: [
                  {
                    type: "any",
                    conditions: [
                      { type: "chat_type_equals", value: "group" },
                      { type: "chat_type_equals", value: "supergroup" },
                    ],
                  },
                  {
                    type: "any",
                    conditions: [
                      { type: "text_contains", value: "airdrop" },
                      { type: "text_contains", value: "guaranteed profit" },
                      { type: "text_contains", value: "dm for signal" },
                      { type: "text_contains", value: "free crypto" },
                    ],
                  },
                ],
              },
              "Looks like spam"
            ),
            actionNode(
              "moderation_delete",
              520,
              0,
              {
                type: "telegram.deleteMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  message_id: "{{event.messageId}}",
                },
              },
              "Delete message"
            ),
            actionNode(
              "moderation_notice",
              780,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "A message was removed by the keyword moderation flow. Review the blocked phrases before enabling this in a live group.",
                },
              },
              "Post moderation note"
            ),
          ],
          [
            edge("e_mod_1", "moderation_start", "moderation_match"),
            edge("e_mod_2", "moderation_match", "moderation_delete", "true"),
            edge("e_mod_3", "moderation_delete", "moderation_notice"),
          ]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:community-moderation-basics",
    slug: "community-moderation-basics",
    title: "Community Moderation Basics",
    description:
      "A lightweight moderation bundle for Telegram groups. It reviews join requests with a simple profile check, then welcomes members when they join successfully.",
    visibility: "PUBLIC",
    category: "moderation",
    audience: "community",
    featured: true,
    setupLevel: "guided",
    requiresExternalIntegration: false,
    featuredOrder: 8,
    flows: [
      {
        name: "Review join requests",
        trigger: "chat_join_request_received",
        flowDefinition: defineFlow(
          [
            startNode("join_start", 0, 0, "chat_join_request_received", "Join request received"),
            conditionNode(
              "join_risk_match",
              260,
              0,
              {
                type: "any",
                conditions: [
                  { type: "event_path_contains", key: "joinRequestBio", value: "airdrop" },
                  { type: "event_path_contains", key: "joinRequestBio", value: "promo" },
                  { type: "event_path_contains", key: "joinRequestBio", value: "marketing" },
                ],
              },
              "Profile looks risky"
            ),
            actionNode(
              "join_decline",
              540,
              -120,
              {
                type: "telegram.declineChatJoinRequest",
                params: {
                  chat_id: "{{event.chatId}}",
                  user_id: "{{event.fromUserId}}",
                },
              },
              "Decline join request"
            ),
            actionNode(
              "join_decline_notice",
              800,
              -120,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Declined a join request after a bio-based moderation check. Review the blocked words before enabling this in production.",
                },
              },
              "Notify decline"
            ),
            actionNode(
              "join_approve",
              540,
              120,
              {
                type: "telegram.approveChatJoinRequest",
                params: {
                  chat_id: "{{event.chatId}}",
                  user_id: "{{event.fromUserId}}",
                },
              },
              "Approve join request"
            ),
            actionNode(
              "join_approve_notice",
              800,
              120,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Approved a new join request from @{{event.fromUsername}}.",
                },
              },
              "Notify approval"
            ),
          ],
          [
            edge("e_join_1", "join_start", "join_risk_match"),
            edge("e_join_2", "join_risk_match", "join_decline", "true"),
            edge("e_join_3", "join_decline", "join_decline_notice"),
            edge("e_join_4", "join_risk_match", "join_approve", "false"),
            edge("e_join_5", "join_approve", "join_approve_notice"),
          ]
        ),
      },
      {
        name: "Welcome newly joined members",
        trigger: "chat_member_updated",
        flowDefinition: defineFlow(
          [
            startNode("member_start", 0, 0, "chat_member_updated", "Member update received"),
            conditionNode(
              "member_joined",
              260,
              0,
              {
                type: "any",
                conditions: [
                  {
                    type: "all",
                    conditions: [
                      { type: "old_status_equals", value: "left" },
                      { type: "new_status_equals", value: "member" },
                    ],
                  },
                  {
                    type: "all",
                    conditions: [
                      { type: "old_status_equals", value: "kicked" },
                      { type: "new_status_equals", value: "member" },
                    ],
                  },
                ],
              },
              "Joined successfully"
            ),
            actionNode(
              "member_welcome",
              560,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Welcome to the community. Check the pinned guide before posting and introduce yourself when you are ready.",
                },
              },
              "Welcome member"
            ),
          ],
          [edge("e_member_1", "member_start", "member_joined"), edge("e_member_2", "member_joined", "member_welcome", "true")]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:media-intake-review-queue",
    slug: "media-intake-review-queue",
    title: "Media Intake Review Queue",
    description:
      "A niche template for bots that collect files in chat. It confirms receipt and tells the sender what context to include next so a human review stays organized.",
    visibility: "PUBLIC",
    category: "operations",
    audience: "business",
    featured: false,
    setupLevel: "advanced",
    requiresExternalIntegration: false,
    flows: [
      {
        name: "Capture media submissions",
        trigger: "message_received",
        flowDefinition: defineFlow(
          [
            startNode("media_start", 0, 0, "message_received", "Message received"),
            conditionNode(
              "media_match",
              240,
              0,
              {
                type: "any",
                conditions: [{ type: "message_has_photo" }, { type: "message_has_video" }, { type: "message_has_document" }],
              },
              "Has upload"
            ),
            actionNode(
              "media_ack",
              500,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Thanks, I received your file. Reply with what it is, what should be reviewed, and whether there is a deadline so the handoff stays clear.",
                },
              },
              "Confirm receipt"
            ),
          ],
          [edge("e_media_1", "media_start", "media_match"), edge("e_media_2", "media_match", "media_ack", "true")]
        ),
      },
    ],
  }),
  defineTemplate({
    id: "builtin:payments-approval-kit",
    slug: "payments-approval-kit",
    title: "Payments Approval Kit",
    description:
      "A niche Telegram commerce helper that answers shipping queries and pre-checkout requests with safe starter defaults. Review currencies and shipping options before using it live.",
    visibility: "PUBLIC",
    category: "commerce",
    audience: "business",
    featured: false,
    setupLevel: "advanced",
    requiresExternalIntegration: false,
    flows: [
      {
        name: "Approve shipping queries",
        trigger: "shipping_query_received",
        flowDefinition: defineFlow(
          [
            startNode("shipping_start", 0, 0, "shipping_query_received", "Shipping query received"),
            actionNode(
              "shipping_ok",
              260,
              0,
              {
                type: "telegram.answerShippingQuery",
                params: {
                  shipping_query_id: "{{event.shippingQueryId}}",
                  ok: true,
                  shipping_options: [
                    {
                      id: "standard",
                      title: "Standard shipping",
                      prices: [{ label: "Shipping", amount: 0 }],
                    },
                  ],
                },
              },
              "Approve shipping"
            ),
          ],
          [edge("e_shipping_1", "shipping_start", "shipping_ok")]
        ),
      },
      {
        name: "Approve supported pre-checkout currency",
        trigger: "pre_checkout_query_received",
        flowDefinition: defineFlow(
          [
            startNode("checkout_start", 0, 0, "pre_checkout_query_received", "Pre-checkout received"),
            conditionNode(
              "checkout_currency_match",
              260,
              0,
              { type: "event_path_equals", key: "currency", value: "USD" },
              "Currency is USD"
            ),
            actionNode(
              "checkout_ok",
              520,
              -120,
              {
                type: "telegram.answerPreCheckoutQuery",
                params: {
                  pre_checkout_query_id: "{{event.preCheckoutQueryId}}",
                  ok: true,
                },
              },
              "Approve payment"
            ),
            actionNode(
              "checkout_not_supported",
              520,
              120,
              {
                type: "telegram.answerPreCheckoutQuery",
                params: {
                  pre_checkout_query_id: "{{event.preCheckoutQueryId}}",
                  ok: false,
                  error_message: "This starter flow currently supports USD only. Update the currency rule before enabling it.",
                },
              },
              "Reject unsupported currency"
            ),
          ],
          [
            edge("e_checkout_1", "checkout_start", "checkout_currency_match"),
            edge("e_checkout_2", "checkout_currency_match", "checkout_ok", "true"),
            edge("e_checkout_3", "checkout_currency_match", "checkout_not_supported", "false"),
          ]
        ),
      },
    ],
  }),
];

export function getBuiltInWorkflowTemplates() {
  return CURATED_WORKFLOW_TEMPLATES;
}

export function getBuiltInWorkflowTemplateBySlug(slug: string) {
  return CURATED_WORKFLOW_TEMPLATES.find((template) => template.slug === slug) ?? null;
}

export function getBuiltInWorkflowTemplateById(id: string) {
  return CURATED_WORKFLOW_TEMPLATES.find((template) => template.id === id) ?? null;
}

export function getCuratedWorkflowTemplateSummaries() {
  return CURATED_WORKFLOW_TEMPLATES.map((template) => ({
    id: template.id,
    slug: template.slug,
    title: template.title,
    category: template.category,
    audience: template.audience,
    featured: template.featured,
    setupLevel: template.setupLevel,
    requiresExternalIntegration: template.requiresExternalIntegration,
    ...(typeof template.featuredOrder === "number" ? { featuredOrder: template.featuredOrder } : {}),
    flowCount: template.flows.length,
    triggers: [...new Set(template.flows.map((flow) => flow.trigger))],
  }));
}

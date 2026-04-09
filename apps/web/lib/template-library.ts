import {
  workflowTemplateDraftSchema,
  type ActionPayload,
  type ConditionPayload,
  type FlowDefinition,
  type JsonValue,
  type TriggerType,
  type WorkflowTemplateDraft
} from "@telegram-builder/shared";

export type CuratedWorkflowTemplate = WorkflowTemplateDraft & {
  slug: string;
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
    ...withLabel(label)
  };
}

function conditionNode(id: string, x: number, y: number, data: ConditionPayload, label?: string) {
  return {
    id,
    type: "condition" as const,
    position: { x, y },
    data,
    ...withLabel(label)
  };
}

function actionNode(
  id: string,
  x: number,
  y: number,
  data: ActionPayload,
  label?: string
) {
  return {
    id,
    type: "action" as const,
    position: { x, y },
    data,
    ...withLabel(label)
  };
}

function delayNode(id: string, x: number, y: number, delayMs: number, label?: string) {
  return {
    id,
    type: "delay" as const,
    position: { x, y },
    data: {
      delay_ms: delayMs
    },
    ...withLabel(label)
  };
}

function setVariableNode(id: string, x: number, y: number, path: string, value: JsonValue, label?: string) {
  return {
    id,
    type: "set_variable" as const,
    position: { x, y },
    data: {
      path,
      value
    },
    ...withLabel(label)
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
    data: {
      path,
      cases
    },
    ...withLabel(label)
  };
}

function edge(id: string, source: string, target: string, sourceHandle?: string) {
  return {
    id,
    source,
    target,
    ...(sourceHandle ? { sourceHandle } : {})
  };
}

function defineFlow(nodes: FlowDefinition["nodes"], edges: FlowDefinition["edges"]): FlowDefinition {
  return {
    nodes,
    edges
  };
}

function defineTemplate(template: CuratedWorkflowTemplate): CuratedWorkflowTemplate {
  const { slug, ...draft } = template;
  workflowTemplateDraftSchema.parse(draft);
  return template;
}

export const CURATED_WORKFLOW_TEMPLATES: CuratedWorkflowTemplate[] = [
  defineTemplate({
    slug: "starter-commands-pack",
    title: "Starter Commands Pack",
    description:
      "A polished onboarding bundle for /start and /help. It welcomes new users, follows up after a short delay, and gives them obvious next steps without requiring custom integrations.",
    visibility: "PUBLIC",
    flows: [
      {
        name: "Welcome users on /start",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("start_start", 0, 0, "command_received", "Command received"),
            conditionNode(
              "check_start",
              220,
              0,
              {
                type: "command_equals",
                value: "/start"
              },
              "Is /start"
            ),
            actionNode(
              "typing_welcome",
              460,
              0,
              {
                type: "telegram.sendChatAction",
                params: {
                  chat_id: "{{event.chatId}}",
                  action: "typing"
                }
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
                    "Welcome! I can help with onboarding, support, and sales.\n\nTry one of these commands:\n/start\n/help\n/demo"
                }
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
                    "Quick tip: send words like pricing, demo, support, or refund and your bot can route the conversation automatically."
                }
              },
              "Send follow-up"
            )
          ],
          [
            edge("e_start_1", "start_start", "check_start"),
            edge("e_start_2", "check_start", "typing_welcome", "true"),
            edge("e_start_3", "typing_welcome", "send_welcome"),
            edge("e_start_4", "send_welcome", "delay_follow_up"),
            edge("e_start_5", "delay_follow_up", "send_follow_up")
          ]
        )
      },
      {
        name: "Help menu on /help",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("start_help", 0, 0, "command_received", "Command received"),
            conditionNode(
              "check_help",
              220,
              0,
              {
                type: "command_equals",
                value: "/help"
              },
              "Is /help"
            ),
            actionNode(
              "send_help",
              460,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Here are the fastest next steps:\n• Send 'pricing' for plan questions\n• Send 'demo' to request a callback\n• Send 'support' to open issue triage"
                }
              },
              "Send help menu"
            )
          ],
          [
            edge("e_help_1", "start_help", "check_help"),
            edge("e_help_2", "check_help", "send_help", "true")
          ]
        )
      }
    ]
  }),
  defineTemplate({
    slug: "support-triage-buttons",
    title: "Support Triage Buttons",
    description:
      "Detect support intent from normal messages, then route button taps into tailored billing, technical, or general support replies. This bundle uses callback actions, variables, and a switch node correctly for Telegram callbacks.",
    visibility: "PUBLIC",
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
                  { type: "text_contains", value: "help" }
                ]
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
                        { text: "Technical", callback_data: "support:technical" }
                      ],
                      [{ text: "Other", callback_data: "support:other" }]
                    ]
                  }
                }
              },
              "Send support buttons"
            )
          ],
          [
            edge("e_support_1", "support_start", "support_match"),
            edge("e_support_2", "support_match", "support_buttons", "true")
          ]
        )
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
              {
                type: "callback_data_contains",
                value: "support:"
              },
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
                  text: "Routing you now"
                }
              },
              "Answer callback"
            ),
            setVariableNode(
              "save_support_selection",
              700,
              0,
              "triage.selection",
              "{{event.callbackData}}",
              "Save selection"
            ),
            switchNode(
              "support_switch",
              940,
              0,
              "vars.triage.selection",
              [
                { id: "billing", value: "support:billing", label: "Billing" },
                { id: "technical", value: "support:technical", label: "Technical" },
                { id: "other", value: "support:other", label: "Other" }
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
                    "For billing questions, ask for invoice, refund, or seat-count changes here and we can route it faster."
                }
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
                  text:
                    "For technical issues, send the error, the step that failed, and a screenshot if you have one."
                }
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
                  text: "Tell us what you need and a teammate can pick it up from there."
                }
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
                  text: "I could not match that button. Try the menu again or type support."
                }
              },
              "Fallback reply"
            )
          ],
          [
            edge("e_callback_1", "callback_start", "support_callback_match"),
            edge("e_callback_2", "support_callback_match", "answer_support_callback", "true"),
            edge("e_callback_3", "answer_support_callback", "save_support_selection"),
            edge("e_callback_4", "save_support_selection", "support_switch"),
            edge("e_callback_5", "support_switch", "send_billing_help", "billing"),
            edge("e_callback_6", "support_switch", "send_technical_help", "technical"),
            edge("e_callback_7", "support_switch", "send_other_help", "other"),
            edge("e_callback_8", "support_switch", "send_support_fallback", "default")
          ]
        )
      }
    ]
  }),
  defineTemplate({
    slug: "demo-lead-capture",
    title: "Demo Lead Capture",
    description:
      "Capture pricing and demo intent from inbound messages or /demo commands, confirm the request in Telegram, and push structured lead data to an external webhook. Update the example webhook URL before enabling.",
    visibility: "PUBLIC",
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
                  { type: "text_contains", value: "sales" }
                ]
              },
              "Lead intent detected"
            ),
            setVariableNode(
              "lead_msg_store",
              500,
              0,
              "lead.intent",
              "{{event.text}}",
              "Store lead intent"
            ),
            actionNode(
              "lead_msg_ack",
              760,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Thanks, I captured your request. Replace the sample webhook URL in this template before enabling it in production."
                }
              },
              "Acknowledge lead"
            ),
            actionNode(
              "lead_msg_webhook",
              1020,
              0,
              {
                type: "webhook.send",
                params: {
                  url: "https://hooks.example.com/telegraph/demo-intake",
                  body: {
                    entrypoint: "message",
                    source: "telegram",
                    chat_id: "{{event.chatId}}",
                    from_user_id: "{{event.fromUserId}}",
                    from_username: "{{event.fromUsername}}",
                    lead_intent: "{{vars.lead.intent}}",
                    raw_text: "{{event.text}}"
                  },
                  response_body_format: "json"
                }
              },
              "Send lead webhook"
            )
          ],
          [
            edge("e_lead_msg_1", "lead_msg_start", "lead_msg_match"),
            edge("e_lead_msg_2", "lead_msg_match", "lead_msg_store", "true"),
            edge("e_lead_msg_3", "lead_msg_store", "lead_msg_ack"),
            edge("e_lead_msg_4", "lead_msg_ack", "lead_msg_webhook")
          ]
        )
      },
      {
        name: "Capture /demo command requests",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("lead_cmd_start", 0, 0, "command_received", "Command received"),
            conditionNode(
              "lead_cmd_match",
              240,
              0,
              {
                type: "command_equals",
                value: "/demo"
              },
              "Is /demo"
            ),
            setVariableNode(
              "lead_cmd_store",
              500,
              0,
              "lead.command_request",
              "{{event.commandArgs}}",
              "Store command args"
            ),
            actionNode(
              "lead_cmd_ack",
              760,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Thanks for requesting a demo. Replace the sample webhook URL in this template before enabling it in production."
                }
              },
              "Acknowledge command"
            ),
            actionNode(
              "lead_cmd_webhook",
              1020,
              0,
              {
                type: "webhook.send",
                params: {
                  url: "https://hooks.example.com/telegraph/demo-intake",
                  body: {
                    entrypoint: "command",
                    source: "telegram",
                    chat_id: "{{event.chatId}}",
                    from_user_id: "{{event.fromUserId}}",
                    from_username: "{{event.fromUsername}}",
                    command_args: "{{vars.lead.command_request}}"
                  },
                  response_body_format: "json"
                }
              },
              "Send command webhook"
            )
          ],
          [
            edge("e_lead_cmd_1", "lead_cmd_start", "lead_cmd_match"),
            edge("e_lead_cmd_2", "lead_cmd_match", "lead_cmd_store", "true"),
            edge("e_lead_cmd_3", "lead_cmd_store", "lead_cmd_ack"),
            edge("e_lead_cmd_4", "lead_cmd_ack", "lead_cmd_webhook")
          ]
        )
      }
    ]
  }),
  defineTemplate({
    slug: "media-intake-review-queue",
    title: "Media Intake Review Queue",
    description:
      "A clean handoff for bots that collect files from users. When someone sends a photo, video, or document, the bot confirms receipt in chat and posts a normalized payload to your review endpoint.",
    visibility: "PUBLIC",
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
                conditions: [
                  { type: "message_has_photo" },
                  { type: "message_has_video" },
                  { type: "message_has_document" }
                ]
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
                    "Thanks, I received your file. Replace the sample webhook URL in this template before enabling it in production."
                }
              },
              "Confirm receipt"
            ),
            actionNode(
              "media_webhook",
              760,
              0,
              {
                type: "webhook.send",
                params: {
                  url: "https://hooks.example.com/telegraph/media-review",
                  body: {
                    source: "telegram",
                    chat_id: "{{event.chatId}}",
                    from_user_id: "{{event.fromUserId}}",
                    from_username: "{{event.fromUsername}}",
                    caption_or_text: "{{event.text}}",
                    has_photo: "{{event.hasPhoto}}",
                    has_video: "{{event.hasVideo}}",
                    has_document: "{{event.hasDocument}}"
                  },
                  response_body_format: "json"
                }
              },
              "Send review webhook"
            )
          ],
          [
            edge("e_media_1", "media_start", "media_match"),
            edge("e_media_2", "media_match", "media_ack", "true"),
            edge("e_media_3", "media_ack", "media_webhook")
          ]
        )
      }
    ]
  }),
  defineTemplate({
    slug: "payments-approval-kit",
    title: "Payments Approval Kit",
    description:
      "A ready-made payments helper for Telegram commerce flows. It answers shipping queries and pre-checkout requests with valid Telegram actions so payment flows can move forward immediately.",
    visibility: "PUBLIC",
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
                      prices: [{ label: "Shipping", amount: 0 }]
                    }
                  ]
                }
              },
              "Approve shipping"
            )
          ],
          [edge("e_shipping_1", "shipping_start", "shipping_ok")]
        )
      },
      {
        name: "Approve pre-checkout",
        trigger: "pre_checkout_query_received",
        flowDefinition: defineFlow(
          [
            startNode("checkout_start", 0, 0, "pre_checkout_query_received", "Pre-checkout received"),
            actionNode(
              "checkout_ok",
              260,
              0,
              {
                type: "telegram.answerPreCheckoutQuery",
                params: {
                  pre_checkout_query_id: "{{event.preCheckoutQueryId}}",
                  ok: true
                }
              },
              "Approve payment"
            )
          ],
          [edge("e_checkout_1", "checkout_start", "checkout_ok")]
        )
      }
    ]
  }),
  defineTemplate({
    slug: "community-moderation-basics",
    title: "Community Moderation Basics",
    description:
      "A lightweight moderation bundle for Telegram groups. It auto-approves join requests, posts a confirmation to the chat, and welcomes members when membership events show they have joined successfully.",
    visibility: "PUBLIC",
    flows: [
      {
        name: "Approve join requests",
        trigger: "chat_join_request_received",
        flowDefinition: defineFlow(
          [
            startNode("join_start", 0, 0, "chat_join_request_received", "Join request received"),
            actionNode(
              "join_approve",
              260,
              0,
              {
                type: "telegram.approveChatJoinRequest",
                params: {
                  chat_id: "{{event.chatId}}",
                  user_id: "{{event.fromUserId}}"
                }
              },
              "Approve join request"
            ),
            actionNode(
              "join_notify",
              520,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Approved a new join request from @{{event.fromUsername}}."
                }
              },
              "Notify chat"
            )
          ],
          [
            edge("e_join_1", "join_start", "join_approve"),
            edge("e_join_2", "join_approve", "join_notify")
          ]
        )
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
                      { type: "new_status_equals", value: "member" }
                    ]
                  },
                  {
                    type: "all",
                    conditions: [
                      { type: "old_status_equals", value: "kicked" },
                      { type: "new_status_equals", value: "member" }
                    ]
                  }
                ]
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
                  text:
                    "Welcome to the community, member {{event.targetUserId}}. Check the pinned guide before posting."
                }
              },
              "Welcome member"
            )
          ],
          [
            edge("e_member_1", "member_start", "member_joined"),
            edge("e_member_2", "member_joined", "member_welcome", "true")
          ]
        )
      }
    ]
  })
];

export function getCuratedWorkflowTemplateSummaries() {
  return CURATED_WORKFLOW_TEMPLATES.map((template) => ({
    slug: template.slug,
    title: template.title,
    flowCount: template.flows.length,
    triggers: [...new Set(template.flows.map((flow) => flow.trigger))]
  }));
}

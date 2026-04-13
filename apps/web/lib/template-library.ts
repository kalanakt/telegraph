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

function withMeta(label?: string, key?: string) {
  return label || key ? { meta: { ...(label ? { label } : {}), ...(key ? { key } : {}) } } : {};
}

function startNode(id: string, x: number, y: number, trigger: TriggerType, label?: string, key?: string) {
  return {
    id,
    type: "start" as const,
    position: { x, y },
    data: { trigger },
    ...withMeta(label, key),
  };
}

function conditionNode(id: string, x: number, y: number, data: ConditionPayload, label?: string, key?: string) {
  return {
    id,
    type: "condition" as const,
    position: { x, y },
    data,
    ...withMeta(label, key),
  };
}

function actionNode(id: string, x: number, y: number, data: ActionPayload, label?: string, key?: string) {
  return {
    id,
    type: "action" as const,
    position: { x, y },
    data,
    ...withMeta(label, key),
  };
}

function delayNode(id: string, x: number, y: number, delayMs: number, label?: string, key?: string) {
  return {
    id,
    type: "delay" as const,
    position: { x, y },
    data: { delay_ms: delayMs },
    ...withMeta(label, key),
  };
}

function awaitCallbackNode(
  id: string,
  x: number,
  y: number,
  data: {
    timeout_ms?: number;
    callback_prefix?: string;
    store_as?: string;
  },
  label?: string,
  key?: string
) {
  return {
    id,
    type: "await_callback" as const,
    position: { x, y },
    data,
    ...withMeta(label, key),
  };
}

function setVariableNode(id: string, x: number, y: number, path: string, value: JsonValue, label?: string, key?: string) {
  return {
    id,
    type: "set_variable" as const,
    position: { x, y },
    data: { path, value },
    ...withMeta(label, key),
  };
}

function switchNode(
  id: string,
  x: number,
  y: number,
  path: string,
  cases: Array<{ id: string; value: string; label?: string }>,
  label?: string,
  key?: string
) {
  return {
    id,
    type: "switch" as const,
    position: { x, y },
    data: { path, cases },
    ...withMeta(label, key),
  };
}

function formStepNode(
  id: string,
  x: number,
  y: number,
  field: string,
  source: "text" | "contact_phone" | "contact_payload" | "shipping_address",
  prompt?: string,
  timeout_ms?: number,
  label?: string,
  key?: string
) {
  return {
    id,
    type: "form_step" as const,
    position: { x, y },
    data: { field, source, ...(prompt ? { prompt } : {}), ...(timeout_ms ? { timeout_ms } : {}) },
    ...withMeta(label, key),
  };
}

function upsertCustomerNode(id: string, x: number, y: number, profile: JsonValue, label?: string, key?: string) {
  return {
    id,
    type: "upsert_customer" as const,
    position: { x, y },
    data: { profile },
    ...withMeta(label, key),
  };
}

function upsertOrderNode(
  id: string,
  x: number,
  y: number,
  data: {
    external_id?: string;
    invoice_payload?: string;
    currency?: string;
    total_amount?: number;
    status?: "draft" | "awaiting_shipping" | "awaiting_payment" | "paid" | "fulfilled" | "canceled";
    data?: JsonValue;
  },
  label?: string,
  key?: string
) {
  return {
    id,
    type: "upsert_order" as const,
    position: { x, y },
    data,
    ...withMeta(label, key),
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

const DAY_MS = 24 * 60 * 60 * 1000;
const PREMIUM_CHANNEL_CHAT_ID = "{{vars.secrets.premium_channel_chat_id}}";
const PREMIUM_GROUP_CHAT_ID = "{{vars.secrets.premium_group_chat_id}}";

const PREMIUM_PLANS = [
  {
    key: "weekly",
    label: "1 Week",
    starsAmount: 350,
    cryptoAmount: "10",
    durationDays: 7,
    reminderDelayMs: 5 * DAY_MS,
    expiryDelayMs: 2 * DAY_MS,
  },
  {
    key: "monthly",
    label: "1 Month",
    starsAmount: 1200,
    cryptoAmount: "25",
    durationDays: 30,
    reminderDelayMs: 28 * DAY_MS,
    expiryDelayMs: 2 * DAY_MS,
  },
  {
    key: "quarterly",
    label: "3 Months",
    starsAmount: 3000,
    cryptoAmount: "60",
    durationDays: 90,
    reminderDelayMs: 88 * DAY_MS,
    expiryDelayMs: 2 * DAY_MS,
  },
  {
    key: "lifetime",
    label: "Lifetime",
    starsAmount: 9000,
    cryptoAmount: "120",
    durationDays: null,
    reminderDelayMs: null,
    expiryDelayMs: null,
  },
] as const;

type PremiumPlan = (typeof PREMIUM_PLANS)[number];

function subscriptionOrderData(plan: PremiumPlan, paymentMethod: "stars" | "crypto") {
  return {
    subscription: {
      planKey: plan.key,
      planLabel: plan.label,
      paymentMethod,
      durationDays: plan.durationDays,
      reminderDelayMs: plan.reminderDelayMs,
      expiryDelayMs: plan.expiryDelayMs,
      channelChatId: PREMIUM_CHANNEL_CHAT_ID,
      groupChatId: PREMIUM_GROUP_CHAT_ID,
    },
  } satisfies JsonValue;
}

function activeSubscriptionProfile(plan: PremiumPlan, paymentMethod: "stars" | "crypto") {
  return {
    attributes: {
      subscription: {
        planKey: plan.key,
        planLabel: plan.label,
        paymentMethod,
        status: "active",
        startsAt: "{{now.iso}}",
        endsAt: plan.durationDays ? `{{now.plus_days.${plan.durationDays}.iso}}` : null,
        reminderAt: plan.durationDays ? `{{now.plus_days.${plan.durationDays - 2}.iso}}` : null,
        channelChatId: PREMIUM_CHANNEL_CHAT_ID,
        groupChatId: PREMIUM_GROUP_CHAT_ID,
      },
    },
  } satisfies JsonValue;
}

function expiredSubscriptionProfile(plan: PremiumPlan, paymentMethod: "stars" | "crypto") {
  return {
    attributes: {
      subscription: {
        planKey: plan.key,
        planLabel: plan.label,
        paymentMethod,
        status: "expired",
        startsAt: "{{customer.attributes.subscription.startsAt}}",
        endsAt: "{{customer.attributes.subscription.endsAt}}",
        reminderAt: "{{customer.attributes.subscription.reminderAt}}",
        channelChatId: PREMIUM_CHANNEL_CHAT_ID,
        groupChatId: PREMIUM_GROUP_CHAT_ID,
      },
    },
  } satisfies JsonValue;
}

function buildPremiumStartFlow(): FlowDefinition {
  return defineFlow(
    [
      startNode("premium_start", 0, 0, "command_received", "Start command"),
      conditionNode("premium_is_start", 240, 0, { type: "command_equals", value: "/start" }, "Command is /start"),
      actionNode(
        "premium_welcome",
        520,
        0,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text:
              "Welcome. Subscribe to unlock the premium channel, VIP drops, and the private group. Choose a plan to continue.",
            reply_markup: {
              inline_keyboard: [
                [{ text: "1 Week", callback_data: "plan:weekly" }, { text: "1 Month", callback_data: "plan:monthly" }],
                [{ text: "3 Months", callback_data: "plan:quarterly" }, { text: "Lifetime", callback_data: "plan:lifetime" }],
              ],
            },
          },
        },
        "Show plans"
      ),
    ],
    [edge("e_premium_start_1", "premium_start", "premium_is_start"), edge("e_premium_start_2", "premium_is_start", "premium_welcome", "true")]
  );
}

function buildPremiumCallbackFlow(): FlowDefinition {
  const nodes: FlowDefinition["nodes"] = [
    startNode("premium_cb_start", 0, 0, "callback_query_received", "Callback received"),
    actionNode(
      "premium_cb_ack",
      220,
      0,
      {
        type: "telegram.answerCallbackQuery",
        params: {
          callback_query_id: "{{event.callbackQueryId}}",
          text: "Got it",
        },
      },
      "Acknowledge tap"
    ),
    switchNode(
      "premium_cb_switch",
      480,
      0,
      "event.callbackData",
      [
        ...PREMIUM_PLANS.flatMap((plan) => [
          { id: `case_plan_${plan.key}`, value: `plan:${plan.key}`, label: `Plan ${plan.label}` },
          { id: `case_renew_${plan.key}`, value: `renew:${plan.key}`, label: `Renew ${plan.label}` },
          { id: `case_pay_stars_${plan.key}`, value: `pay:stars:${plan.key}`, label: `Stars ${plan.label}` },
          { id: `case_pay_crypto_${plan.key}`, value: `pay:crypto:${plan.key}`, label: `Crypto ${plan.label}` },
        ]),
        { id: "case_cancel", value: "cancel", label: "Cancel" },
      ],
      "Route choice"
    ),
  ];
  const edges: FlowDefinition["edges"] = [
    edge("e_premium_cb_1", "premium_cb_start", "premium_cb_ack"),
    edge("e_premium_cb_2", "premium_cb_ack", "premium_cb_switch"),
  ];

  for (const [index, plan] of PREMIUM_PLANS.entries()) {
    const y = index * 260 - 360;
    const choiceNodeId = `premium_choice_${plan.key}`;
    const starsOrderNodeId = `premium_stars_order_${plan.key}`;
    const starsInvoiceNodeId = `premium_stars_invoice_${plan.key}`;
    const cryptoOrderNodeId = `premium_crypto_order_${plan.key}`;
    const cryptoInvoiceNodeId = `premium_crypto_invoice_${plan.key}`;
    const cryptoPendingNodeId = `premium_crypto_pending_${plan.key}`;

    nodes.push(
      actionNode(
        choiceNodeId,
        840,
        y,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text: `${plan.label} selected. Choose how you want to pay.`,
            reply_markup: {
              inline_keyboard: [
                [{ text: "Pay with Telegram Stars", callback_data: `pay:stars:${plan.key}` }],
                [{ text: "Pay with Crypto", callback_data: `pay:crypto:${plan.key}` }],
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          },
        },
        `Choose ${plan.label} payment`
      ),
      upsertOrderNode(
        starsOrderNodeId,
        840,
        y + 80,
        {
          external_id: `subscription:stars:${plan.key}:{{event.fromUserId}}`,
          invoice_payload: `premium:stars:${plan.key}:{{event.fromUserId}}:{{event.updateId}}`,
          currency: "XTR",
          total_amount: plan.starsAmount,
          status: "awaiting_payment",
          data: subscriptionOrderData(plan, "stars"),
        },
        `Store ${plan.label} Stars order`
      ),
      actionNode(
        starsInvoiceNodeId,
        1100,
        y + 80,
        {
          type: "telegram.sendInvoice",
          params: {
            chat_id: "{{event.chatId}}",
            title: `${plan.label} Premium Access`,
            description: "Pay in Telegram Stars to unlock premium access instantly.",
            payload: "{{order.invoicePayload}}",
            currency: "XTR",
            prices: [{ label: `${plan.label} premium access`, amount: plan.starsAmount }],
          },
        },
        `Send ${plan.label} Stars invoice`,
        `stars_invoice_${plan.key}`
      ),
      upsertOrderNode(
        cryptoOrderNodeId,
        840,
        y + 160,
        {
          external_id: `subscription:crypto:${plan.key}:{{event.fromUserId}}`,
          invoice_payload: `premium:crypto:${plan.key}:{{event.fromUserId}}:{{event.updateId}}`,
          currency: "USDT",
          total_amount: Number(plan.cryptoAmount),
          status: "awaiting_payment",
          data: subscriptionOrderData(plan, "crypto"),
        },
        `Store ${plan.label} Crypto order`
      ),
      actionNode(
        cryptoInvoiceNodeId,
        1100,
        y + 160,
        {
          type: "cryptopay.createInvoice",
          params: {
            currency_type: "crypto",
            asset: "USDT",
            amount: plan.cryptoAmount,
            description: `${plan.label} premium access`,
            payload: "{{order.invoicePayload}}",
          },
        },
        `Create ${plan.label} Crypto invoice`,
        `crypto_invoice_${plan.key}`
      ),
      actionNode(
        cryptoPendingNodeId,
        1360,
        y + 160,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text: "Payment pending. Complete the invoice, then you will receive access automatically.",
            reply_markup: {
              inline_keyboard: [
                [{ text: "Pay invoice", url: `{{vars.crypto_invoice_${plan.key}.body.bot_invoice_url}}` }],
                [{ text: "Cancel", callback_data: "cancel" }],
              ],
            },
          },
        },
        `Send ${plan.label} Crypto link`
      )
    );

    edges.push(
      edge(`e_premium_choice_plan_${plan.key}`, "premium_cb_switch", choiceNodeId, `case_plan_${plan.key}`),
      edge(`e_premium_choice_renew_${plan.key}`, "premium_cb_switch", choiceNodeId, `case_renew_${plan.key}`),
      edge(`e_premium_stars_start_${plan.key}`, "premium_cb_switch", starsOrderNodeId, `case_pay_stars_${plan.key}`),
      edge(`e_premium_stars_finish_${plan.key}`, starsOrderNodeId, starsInvoiceNodeId),
      edge(`e_premium_crypto_start_${plan.key}`, "premium_cb_switch", cryptoOrderNodeId, `case_pay_crypto_${plan.key}`),
      edge(`e_premium_crypto_mid_${plan.key}`, cryptoOrderNodeId, cryptoInvoiceNodeId),
      edge(`e_premium_crypto_finish_${plan.key}`, cryptoInvoiceNodeId, cryptoPendingNodeId)
    );
  }

  nodes.push(
    actionNode(
      "premium_cancel",
      840,
      520,
      {
        type: "telegram.sendMessage",
        params: {
          chat_id: "{{event.chatId}}",
          text: "Payment canceled. Pick a plan again whenever you are ready.",
        },
      },
      "Cancel purchase"
    )
  );
  edges.push(edge("e_premium_cancel", "premium_cb_switch", "premium_cancel", "case_cancel"));

  return defineFlow(nodes, edges);
}

function buildPremiumActivationFlow(trigger: "message_received" | "cryptopay.invoice_paid", paymentMethod: "stars" | "crypto"): FlowDefinition {
  const nodes: FlowDefinition["nodes"] = [startNode(`premium_activate_start_${paymentMethod}`, 0, 0, trigger, "Activation trigger")];
  const edges: FlowDefinition["edges"] = [];

  let entryNodeId = `premium_activate_start_${paymentMethod}`;
  if (trigger === "message_received") {
    nodes.push(
      conditionNode(
        "premium_stars_paid_match",
        220,
        0,
        { type: "event_path_exists", key: "successfulPaymentChargeId" },
        "Has successful payment"
      )
    );
    edges.push(edge("e_premium_stars_paid_1", entryNodeId, "premium_stars_paid_match"));
    entryNodeId = "premium_stars_paid_match";
  }

  const planSwitchId = `premium_activation_switch_${paymentMethod}`;
  nodes.push(
    switchNode(
      planSwitchId,
      480,
      0,
      "order.attributes.subscription.planKey",
      PREMIUM_PLANS.map((plan) => ({ id: `activate_${paymentMethod}_${plan.key}`, value: plan.key, label: plan.label })),
      "Plan branch"
    )
  );
  edges.push(edge(`e_premium_activate_entry_${paymentMethod}`, entryNodeId, planSwitchId, trigger === "message_received" ? "true" : undefined));

  for (const [index, plan] of PREMIUM_PLANS.entries()) {
    const y = index * 520 - 780;
    const activeCustomerNodeId = `premium_active_customer_${paymentMethod}_${plan.key}`;
    const successNodeId = `premium_success_${paymentMethod}_${plan.key}`;
    const channelCondId = `premium_channel_enabled_${paymentMethod}_${plan.key}`;
    const channelInviteId = `premium_channel_invite_${paymentMethod}_${plan.key}`;
    const channelMessageId = `premium_channel_message_${paymentMethod}_${plan.key}`;
    const groupCondId = `premium_group_enabled_${paymentMethod}_${plan.key}`;
    const groupInviteId = `premium_group_invite_${paymentMethod}_${plan.key}`;
    const groupMessageId = `premium_group_message_${paymentMethod}_${plan.key}`;

    nodes.push(
      upsertCustomerNode(activeCustomerNodeId, 760, y, activeSubscriptionProfile(plan, paymentMethod), `Activate ${plan.label} access`),
      actionNode(
        successNodeId,
        1020,
        y,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text: plan.durationDays === null ? "Payment successful. Your lifetime access is active now." : `Payment successful. Your ${plan.label} access is active now.`,
          },
        },
        `Confirm ${plan.label} payment`
      ),
      conditionNode(channelCondId, 1280, y - 60, { type: "variable_exists", key: "secrets.premium_channel_chat_id" }, "Channel configured"),
      actionNode(
        channelInviteId,
        1540,
        y - 120,
        {
          type: "telegram.createChatInviteLink",
          params: {
            chat_id: PREMIUM_CHANNEL_CHAT_ID,
            name: `${plan.key} channel access`,
            member_limit: 1,
            expire_date: "{{now.plus_days.2.unix}}",
          },
        },
        `Create ${plan.label} channel invite`,
        `channel_invite_${paymentMethod}_${plan.key}`
      ),
      actionNode(
        channelMessageId,
        1800,
        y - 120,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text: "Join the premium channel with this one-time link.",
            reply_markup: {
              inline_keyboard: [[{ text: "Join premium channel", url: `{{vars.channel_invite_${paymentMethod}_${plan.key}.body.invite_link}}` }]],
            },
          },
        },
        `Send ${plan.label} channel link`
      ),
      conditionNode(groupCondId, 1280, y + 80, { type: "variable_exists", key: "secrets.premium_group_chat_id" }, "Group configured"),
      actionNode(
        groupInviteId,
        1540,
        y + 40,
        {
          type: "telegram.createChatInviteLink",
          params: {
            chat_id: PREMIUM_GROUP_CHAT_ID,
            name: `${plan.key} group access`,
            member_limit: 1,
            expire_date: "{{now.plus_days.2.unix}}",
          },
        },
        `Create ${plan.label} group invite`,
        `group_invite_${paymentMethod}_${plan.key}`
      ),
      actionNode(
        groupMessageId,
        1800,
        y + 40,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text: "Join the private group with this one-time link.",
            reply_markup: {
              inline_keyboard: [[{ text: "Join premium group", url: `{{vars.group_invite_${paymentMethod}_${plan.key}.body.invite_link}}` }]],
            },
          },
        },
        `Send ${plan.label} group link`
      )
    );

    edges.push(
      edge(`e_premium_activate_${paymentMethod}_${plan.key}`, planSwitchId, activeCustomerNodeId, `activate_${paymentMethod}_${plan.key}`),
      edge(`e_premium_activate_success_${paymentMethod}_${plan.key}`, activeCustomerNodeId, successNodeId),
      edge(`e_premium_activate_channel_cond_${paymentMethod}_${plan.key}`, successNodeId, channelCondId),
      edge(`e_premium_activate_channel_true_${paymentMethod}_${plan.key}`, channelCondId, channelInviteId, "true"),
      edge(`e_premium_activate_channel_false_${paymentMethod}_${plan.key}`, channelCondId, groupCondId, "false"),
      edge(`e_premium_activate_channel_send_${paymentMethod}_${plan.key}`, channelInviteId, channelMessageId),
      edge(`e_premium_activate_channel_next_${paymentMethod}_${plan.key}`, channelMessageId, groupCondId),
      edge(`e_premium_activate_group_true_${paymentMethod}_${plan.key}`, groupCondId, groupInviteId, "true"),
      edge(`e_premium_activate_group_send_${paymentMethod}_${plan.key}`, groupInviteId, groupMessageId)
    );

    if (plan.durationDays === null || plan.reminderDelayMs === null || plan.expiryDelayMs === null) {
      continue;
    }

    const reminderDelayId = `premium_reminder_delay_${paymentMethod}_${plan.key}`;
    const reminderMessageId = `premium_reminder_message_${paymentMethod}_${plan.key}`;
    const expiryDelayId = `premium_expiry_delay_${paymentMethod}_${plan.key}`;
    const expiredCustomerNodeId = `premium_expired_customer_${paymentMethod}_${plan.key}`;
    const removeChannelCondId = `premium_remove_channel_${paymentMethod}_${plan.key}`;
    const banChannelId = `premium_ban_channel_${paymentMethod}_${plan.key}`;
    const unbanChannelId = `premium_unban_channel_${paymentMethod}_${plan.key}`;
    const removeGroupCondId = `premium_remove_group_${paymentMethod}_${plan.key}`;
    const banGroupId = `premium_ban_group_${paymentMethod}_${plan.key}`;
    const unbanGroupId = `premium_unban_group_${paymentMethod}_${plan.key}`;
    const expiredMessageId = `premium_expired_message_${paymentMethod}_${plan.key}`;

    nodes.push(
      delayNode(reminderDelayId, 2060, y, plan.reminderDelayMs, `Wait before ${plan.label} reminder`),
      actionNode(
        reminderMessageId,
        2300,
        y,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text: `Your ${plan.label} plan will expire in 2 days. Renew now to keep access.`,
            reply_markup: {
              inline_keyboard: [[{ text: "Renew now", callback_data: `renew:${plan.key}` }]],
            },
          },
        },
        `Remind ${plan.label} renewal`
      ),
      delayNode(expiryDelayId, 2540, y, plan.expiryDelayMs, `Wait until ${plan.label} expiry`),
      upsertCustomerNode(expiredCustomerNodeId, 2780, y, expiredSubscriptionProfile(plan, paymentMethod), `Mark ${plan.label} expired`),
      conditionNode(removeChannelCondId, 3020, y - 60, { type: "variable_exists", key: "secrets.premium_channel_chat_id" }, "Remove channel access"),
      actionNode(
        banChannelId,
        3260,
        y - 120,
        {
          type: "telegram.banChatMember",
          params: {
            chat_id: PREMIUM_CHANNEL_CHAT_ID,
            user_id: "{{customer.telegramUserId}}",
          },
        },
        `Ban ${plan.label} from channel`
      ),
      actionNode(
        unbanChannelId,
        3500,
        y - 120,
        {
          type: "telegram.unbanChatMember",
          params: {
            chat_id: PREMIUM_CHANNEL_CHAT_ID,
            user_id: "{{customer.telegramUserId}}",
          },
        },
        `Unban ${plan.label} from channel`
      ),
      conditionNode(removeGroupCondId, 3020, y + 80, { type: "variable_exists", key: "secrets.premium_group_chat_id" }, "Remove group access"),
      actionNode(
        banGroupId,
        3260,
        y + 40,
        {
          type: "telegram.banChatMember",
          params: {
            chat_id: PREMIUM_GROUP_CHAT_ID,
            user_id: "{{customer.telegramUserId}}",
          },
        },
        `Ban ${plan.label} from group`
      ),
      actionNode(
        unbanGroupId,
        3500,
        y + 40,
        {
          type: "telegram.unbanChatMember",
          params: {
            chat_id: PREMIUM_GROUP_CHAT_ID,
            user_id: "{{customer.telegramUserId}}",
          },
        },
        `Unban ${plan.label} from group`
      ),
      actionNode(
        expiredMessageId,
        3740,
        y,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.chatId}}",
            text: "Your subscription has expired and access was removed. Pick a plan to buy again.",
            reply_markup: {
              inline_keyboard: [
                [{ text: "1 Week", callback_data: "plan:weekly" }, { text: "1 Month", callback_data: "plan:monthly" }],
                [{ text: "3 Months", callback_data: "plan:quarterly" }, { text: "Lifetime", callback_data: "plan:lifetime" }],
              ],
            },
          },
        },
        `Notify ${plan.label} expiry`
      )
    );

    edges.push(
      edge(`e_premium_activate_group_false_${paymentMethod}_${plan.key}`, groupCondId, reminderDelayId, "false"),
      edge(`e_premium_activate_group_next_${paymentMethod}_${plan.key}`, groupMessageId, reminderDelayId),
      edge(`e_premium_reminder_delay_${paymentMethod}_${plan.key}`, reminderDelayId, reminderMessageId),
      edge(`e_premium_reminder_message_${paymentMethod}_${plan.key}`, reminderMessageId, expiryDelayId),
      edge(`e_premium_expiry_delay_${paymentMethod}_${plan.key}`, expiryDelayId, expiredCustomerNodeId),
      edge(`e_premium_remove_channel_start_${paymentMethod}_${plan.key}`, expiredCustomerNodeId, removeChannelCondId),
      edge(`e_premium_remove_channel_true_${paymentMethod}_${plan.key}`, removeChannelCondId, banChannelId, "true"),
      edge(`e_premium_remove_channel_false_${paymentMethod}_${plan.key}`, removeChannelCondId, removeGroupCondId, "false"),
      edge(`e_premium_remove_channel_mid_${paymentMethod}_${plan.key}`, banChannelId, unbanChannelId),
      edge(`e_premium_remove_channel_next_${paymentMethod}_${plan.key}`, unbanChannelId, removeGroupCondId),
      edge(`e_premium_remove_group_true_${paymentMethod}_${plan.key}`, removeGroupCondId, banGroupId, "true"),
      edge(`e_premium_remove_group_false_${paymentMethod}_${plan.key}`, removeGroupCondId, expiredMessageId, "false"),
      edge(`e_premium_remove_group_mid_${paymentMethod}_${plan.key}`, banGroupId, unbanGroupId),
      edge(`e_premium_remove_group_end_${paymentMethod}_${plan.key}`, unbanGroupId, expiredMessageId)
    );
  }

  return defineFlow(nodes, edges);
}

function buildPremiumMemberFlow(): FlowDefinition {
  return defineFlow(
    [
      startNode("premium_member_start", 0, 0, "chat_member_updated", "Member update received"),
      conditionNode(
        "premium_member_joined",
        240,
        0,
        {
          type: "all",
          conditions: [
            { type: "old_status_equals", value: "left" },
            { type: "new_status_equals", value: "member" },
          ],
        },
        "Joined premium area"
      ),
      switchNode(
        "premium_member_status",
        520,
        0,
        "customer.attributes.subscription.status",
        [{ id: "member_status_active", value: "active", label: "Active" }],
        "Subscription status"
      ),
      actionNode(
        "premium_member_confirm",
        800,
        0,
        {
          type: "telegram.sendMessage",
          params: {
            chat_id: "{{event.targetUserId}}",
            text: "Your premium access is active. Enjoy the channel and group.",
          },
        },
        "Confirm membership"
      ),
    ],
    [
      edge("e_premium_member_1", "premium_member_start", "premium_member_joined"),
      edge("e_premium_member_2", "premium_member_joined", "premium_member_status", "true"),
      edge("e_premium_member_3", "premium_member_status", "premium_member_confirm", "member_status_active"),
    ]
  );
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
    id: "builtin:appointment-booking-bot",
    slug: "appointment-booking-bot",
    title: "Appointment Booking Bot",
    description:
      "Collect appointment requests inside Telegram, confirm the details with the user, and forward each request to an admin chat for manual follow-up.",
    visibility: "PUBLIC",
    category: "sales",
    audience: "business",
    featured: false,
    setupLevel: "guided",
    requiresExternalIntegration: false,
    flows: [
      {
        name: "Capture appointment requests from /start",
        trigger: "command_received",
        flowDefinition: defineFlow(
          [
            startNode("booking_start", 0, 0, "command_received", "Command received"),
            conditionNode("booking_start_match", 220, 0, { type: "command_equals", value: "/start" }, "Is /start"),
            setVariableNode(
              "booking_admin_chat",
              500,
              0,
              "config.admin_chat_id",
              "SET_ADMIN_CHAT_ID",
              "Admin chat ID (edit me)"
            ),
            actionNode(
              "booking_menu",
              780,
              0,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Book an appointment or ask for help.\n\nChoose one option to continue.",
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: "Book appointment", callback_data: "booking:menu:book" }],
                      [{ text: "Choose a service", callback_data: "booking:menu:services" }],
                      [{ text: "Contact support", callback_data: "booking:menu:support" }],
                    ],
                  },
                },
              },
              "Show main menu"
            ),
            awaitCallbackNode(
              "booking_menu_choice",
              1060,
              0,
              {
                timeout_ms: 15 * 60 * 1000,
                callback_prefix: "booking:menu:",
                store_as: "booking.menu_action",
              },
              "Wait for menu choice"
            ),
            switchNode(
              "booking_menu_switch",
              1320,
              0,
              "vars.booking.menu_action",
              [
                { id: "book", value: "booking:menu:book", label: "Book appointment" },
                { id: "services", value: "booking:menu:services", label: "Choose a service" },
                { id: "support", value: "booking:menu:support", label: "Contact support" },
              ],
              "Route menu choice"
            ),
            actionNode(
              "booking_services_intro",
              1600,
              -140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Available services:\n• Consultation\n• Follow-up visit\n• Product demo\n\nReply with the service you want when the next message arrives.",
                },
              },
              "Show services"
            ),
            actionNode(
              "booking_support_reply",
              1600,
              140,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Please share your question here and a team member will follow up. You can also restart anytime with /start.",
                },
              },
              "Send support reply"
            ),
            actionNode(
              "booking_service_prompt",
              1880,
              -40,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What service do you want to book?",
                },
              },
              "Ask service"
            ),
            formStepNode(
              "booking_service_step",
              2160,
              -40,
              "booking.service",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store service"
            ),
            actionNode(
              "booking_name_prompt",
              2440,
              -40,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What is your name?",
                },
              },
              "Ask name"
            ),
            formStepNode(
              "booking_name_step",
              2720,
              -40,
              "booking.name",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store name"
            ),
            actionNode(
              "booking_date_prompt",
              3000,
              -40,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What date do you prefer?",
                },
              },
              "Ask preferred date"
            ),
            formStepNode(
              "booking_date_step",
              3280,
              -40,
              "booking.date",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store preferred date"
            ),
            actionNode(
              "booking_time_prompt",
              3560,
              -40,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What time do you prefer?",
                },
              },
              "Ask preferred time"
            ),
            formStepNode(
              "booking_time_step",
              3840,
              -40,
              "booking.time",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store preferred time"
            ),
            actionNode(
              "booking_phone_prompt",
              4120,
              -40,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What is your phone number?",
                },
              },
              "Ask phone number"
            ),
            formStepNode(
              "booking_phone_step",
              4400,
              -40,
              "booking.phone",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store phone number"
            ),
            actionNode(
              "booking_note_prompt",
              4680,
              -40,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Any note or special request?",
                },
              },
              "Ask note"
            ),
            formStepNode(
              "booking_note_step",
              4960,
              -40,
              "booking.note",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store note"
            ),
            actionNode(
              "booking_summary",
              5240,
              -40,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Please confirm your appointment request.\n\nName: {{vars.booking.name}}\nService: {{vars.booking.service}}\nDate: {{vars.booking.date}}\nTime: {{vars.booking.time}}\nPhone: {{vars.booking.phone}}\nNote: {{vars.booking.note}}",
                  reply_markup: {
                    inline_keyboard: [
                      [
                        { text: "Confirm", callback_data: "booking:summary:confirm" },
                        { text: "Edit", callback_data: "booking:summary:edit" },
                      ],
                    ],
                  },
                },
              },
              "Show summary"
            ),
            awaitCallbackNode(
              "booking_summary_choice",
              5520,
              -40,
              {
                timeout_ms: 15 * 60 * 1000,
                callback_prefix: "booking:summary:",
                store_as: "booking.summary_action",
              },
              "Wait for summary choice"
            ),
            switchNode(
              "booking_summary_switch",
              5800,
              -40,
              "vars.booking.summary_action",
              [
                { id: "confirm", value: "booking:summary:confirm", label: "Confirm" },
                { id: "edit", value: "booking:summary:edit", label: "Edit" },
              ],
              "Route summary choice"
            ),
            conditionNode(
              "booking_admin_configured",
              8880,
              -180,
              {
                type: "variable_equals",
                key: "config.admin_chat_id",
                value: "SET_ADMIN_CHAT_ID",
              },
              "Admin chat still placeholder"
            ),
            actionNode(
              "booking_config_warning",
              9160,
              -320,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Booking is almost ready, but the admin chat is not configured yet. Edit the \"Admin chat ID (edit me)\" node in this flow, then try again.",
                },
              },
              "Warn about setup"
            ),
            actionNode(
              "booking_admin_notify",
              9160,
              -100,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{vars.config.admin_chat_id}}",
                  text:
                    "New Appointment Request\n\nName: {{vars.booking.name}}\nService: {{vars.booking.service}}\nDate: {{vars.booking.date}}\nTime: {{vars.booking.time}}\nPhone: {{vars.booking.phone}}\nTelegram: @{{event.fromUsername}}\nNote: {{vars.booking.note}}",
                },
              },
              "Notify admin"
            ),
            actionNode(
              "booking_user_confirmed",
              9440,
              -100,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Your appointment request has been sent. A team member will review it and contact you soon.",
                },
              },
              "Confirm request"
            ),
            actionNode(
              "booking_service_prompt_edit",
              6080,
              220,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Let's update the request. What service do you want to book?",
                },
              },
              "Ask service again"
            ),
            formStepNode(
              "booking_service_step_edit",
              6360,
              220,
              "booking.service",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store updated service"
            ),
            actionNode(
              "booking_name_prompt_edit",
              6640,
              220,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What is your name?",
                },
              },
              "Ask name again"
            ),
            formStepNode(
              "booking_name_step_edit",
              6920,
              220,
              "booking.name",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store updated name"
            ),
            actionNode(
              "booking_date_prompt_edit",
              7200,
              220,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What date do you prefer?",
                },
              },
              "Ask preferred date again"
            ),
            formStepNode(
              "booking_date_step_edit",
              7480,
              220,
              "booking.date",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store updated date"
            ),
            actionNode(
              "booking_time_prompt_edit",
              7760,
              220,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What time do you prefer?",
                },
              },
              "Ask preferred time again"
            ),
            formStepNode(
              "booking_time_step_edit",
              8040,
              220,
              "booking.time",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store updated time"
            ),
            actionNode(
              "booking_phone_prompt_edit",
              8320,
              220,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "What is your phone number?",
                },
              },
              "Ask phone number again"
            ),
            formStepNode(
              "booking_phone_step_edit",
              8600,
              220,
              "booking.phone",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store updated phone"
            ),
            actionNode(
              "booking_note_prompt_edit",
              8880,
              220,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text: "Any note or special request?",
                },
              },
              "Ask note again"
            ),
            formStepNode(
              "booking_note_step_edit",
              9160,
              220,
              "booking.note",
              "text",
              undefined,
              30 * 60 * 1000,
              "Store updated note"
            ),
            actionNode(
              "booking_summary_edit",
              9440,
              220,
              {
                type: "telegram.sendMessage",
                params: {
                  chat_id: "{{event.chatId}}",
                  text:
                    "Review your updated appointment request.\n\nName: {{vars.booking.name}}\nService: {{vars.booking.service}}\nDate: {{vars.booking.date}}\nTime: {{vars.booking.time}}\nPhone: {{vars.booking.phone}}\nNote: {{vars.booking.note}}",
                  reply_markup: {
                    inline_keyboard: [[{ text: "Confirm", callback_data: "booking:updated:confirm" }]],
                  },
                },
              },
              "Show updated summary"
            ),
            awaitCallbackNode(
              "booking_summary_choice_edit",
              9720,
              220,
              {
                timeout_ms: 15 * 60 * 1000,
                callback_prefix: "booking:updated:",
                store_as: "booking.updated_summary_action",
              },
              "Wait for updated confirmation"
            ),
          ],
          [
            edge("e_booking_1", "booking_start", "booking_start_match"),
            edge("e_booking_2", "booking_start_match", "booking_admin_chat", "true"),
            edge("e_booking_3", "booking_admin_chat", "booking_menu"),
            edge("e_booking_4", "booking_menu", "booking_menu_choice"),
            edge("e_booking_5", "booking_menu_choice", "booking_menu_switch"),
            edge("e_booking_6", "booking_menu_switch", "booking_service_prompt", "book"),
            edge("e_booking_7", "booking_menu_switch", "booking_services_intro", "services"),
            edge("e_booking_8", "booking_menu_switch", "booking_support_reply", "support"),
            edge("e_booking_9", "booking_menu_switch", "booking_support_reply", "default"),
            edge("e_booking_10", "booking_services_intro", "booking_service_prompt"),
            edge("e_booking_11", "booking_service_prompt", "booking_service_step"),
            edge("e_booking_12", "booking_service_step", "booking_name_prompt"),
            edge("e_booking_13", "booking_name_prompt", "booking_name_step"),
            edge("e_booking_14", "booking_name_step", "booking_date_prompt"),
            edge("e_booking_15", "booking_date_prompt", "booking_date_step"),
            edge("e_booking_16", "booking_date_step", "booking_time_prompt"),
            edge("e_booking_17", "booking_time_prompt", "booking_time_step"),
            edge("e_booking_18", "booking_time_step", "booking_phone_prompt"),
            edge("e_booking_19", "booking_phone_prompt", "booking_phone_step"),
            edge("e_booking_20", "booking_phone_step", "booking_note_prompt"),
            edge("e_booking_21", "booking_note_prompt", "booking_note_step"),
            edge("e_booking_22", "booking_note_step", "booking_summary"),
            edge("e_booking_23", "booking_summary", "booking_summary_choice"),
            edge("e_booking_24", "booking_summary_choice", "booking_summary_switch"),
            edge("e_booking_25", "booking_summary_switch", "booking_admin_configured", "confirm"),
            edge("e_booking_26", "booking_summary_switch", "booking_service_prompt_edit", "edit"),
            edge("e_booking_27", "booking_summary_switch", "booking_service_prompt_edit", "default"),
            edge("e_booking_28", "booking_admin_configured", "booking_config_warning", "true"),
            edge("e_booking_29", "booking_admin_configured", "booking_admin_notify", "false"),
            edge("e_booking_30", "booking_admin_notify", "booking_user_confirmed"),
            edge("e_booking_31", "booking_service_prompt_edit", "booking_service_step_edit"),
            edge("e_booking_32", "booking_service_step_edit", "booking_name_prompt_edit"),
            edge("e_booking_33", "booking_name_prompt_edit", "booking_name_step_edit"),
            edge("e_booking_34", "booking_name_step_edit", "booking_date_prompt_edit"),
            edge("e_booking_35", "booking_date_prompt_edit", "booking_date_step_edit"),
            edge("e_booking_36", "booking_date_step_edit", "booking_time_prompt_edit"),
            edge("e_booking_37", "booking_time_prompt_edit", "booking_time_step_edit"),
            edge("e_booking_38", "booking_time_step_edit", "booking_phone_prompt_edit"),
            edge("e_booking_39", "booking_phone_prompt_edit", "booking_phone_step_edit"),
            edge("e_booking_40", "booking_phone_step_edit", "booking_note_prompt_edit"),
            edge("e_booking_41", "booking_note_prompt_edit", "booking_note_step_edit"),
            edge("e_booking_42", "booking_note_step_edit", "booking_summary_edit"),
            edge("e_booking_43", "booking_summary_edit", "booking_summary_choice_edit"),
            edge("e_booking_44", "booking_summary_choice_edit", "booking_admin_configured"),
          ]
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
    id: "builtin:premium-membership-bot",
    slug: "premium-membership-bot",
    title: "Premium Membership Bot",
    description:
      "Sell access to a private channel and/or group with plan selection, Telegram Stars or Crypto Pay checkout, reminder nudges, and automatic expiry handling.",
    visibility: "PUBLIC",
    category: "commerce",
    audience: "business",
    featured: true,
    setupLevel: "guided",
    requiresExternalIntegration: false,
    featuredOrder: 9,
    flows: [
      {
        name: "Welcome and show plans",
        trigger: "command_received",
        flowDefinition: buildPremiumStartFlow(),
      },
      {
        name: "Handle plan and payment callbacks",
        trigger: "callback_query_received",
        flowDefinition: buildPremiumCallbackFlow(),
      },
      {
        name: "Activate access after Telegram Stars payment",
        trigger: "message_received",
        flowDefinition: buildPremiumActivationFlow("message_received", "stars"),
      },
      {
        name: "Activate access after Crypto Pay invoice is paid",
        trigger: "cryptopay.invoice_paid",
        flowDefinition: buildPremiumActivationFlow("cryptopay.invoice_paid", "crypto"),
      },
      {
        name: "Confirm when a paid member joins",
        trigger: "chat_member_updated",
        flowDefinition: buildPremiumMemberFlow(),
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

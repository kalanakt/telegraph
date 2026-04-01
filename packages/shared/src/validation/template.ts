import { z } from "zod";
import { flowDefinitionSchema, triggerSchema, validateFlowForTrigger } from "./workflow.js";

export const templateVisibilitySchema = z.enum(["PRIVATE", "PUBLIC"]);

export const templateFlowSchema = z
  .object({
    id: z.string().min(1).optional(),
    name: z.string().min(1).max(120),
    trigger: triggerSchema,
    flowDefinition: flowDefinitionSchema
  })
  .superRefine((flow, ctx) => {
    validateFlowForTrigger(flow.flowDefinition, flow.trigger, ctx);
  });

export const workflowTemplateDraftSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  visibility: templateVisibilitySchema,
  flows: z.array(templateFlowSchema).min(1).max(100)
});

export const createTemplateSchema = workflowTemplateDraftSchema;

export const installTemplateSchema = z.object({
  botId: z.string().min(1)
});

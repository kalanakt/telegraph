import type { TriggerMapping } from '@telegraph/schemas';

// PlanEdge is both a zod schema and a type (via `type PlanEdge = z.infer<...>`)
// The condition field is optional and may be undefined due to zod inference
type PlanEdge = { condition?: string | undefined; targetNodeId: string };

/**
 * Replace `{{variable}}` placeholders with values from the variables map.
 */
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key];
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value : JSON.stringify(value);
  });
}

/**
 * Match incoming text against trigger mappings. Returns entry node ID or null.
 */
export function matchTrigger(triggers: TriggerMapping[], text: string): string | null {
  // Command triggers: /command
  if (text.startsWith('/')) {
    const command = text.split(/\s/)[0]!;
    const match = triggers.find((t) => t.type === 'command' && t.pattern === command);
    if (match) return match.entryNodeId;
  }

  // Message triggers
  for (const trigger of triggers) {
    if (trigger.type !== 'message') continue;
    // Simple exact match
    if (trigger.pattern === text) return trigger.entryNodeId;
  }

  return null;
}

/**
 * Evaluate condition rules against session variables and return the matching edge.
 */
export function evaluateCondition(
  rules: Array<{ variable: string; operator: string; value: string; targetEdgeId: string }>,
  edges: PlanEdge[],
  variables: Record<string, unknown>,
  defaultEdgeId?: string,
): PlanEdge | null {
  for (const rule of rules) {
    const actual = variables[rule.variable];
    const expected = rule.value;
    let matched = false;

    switch (rule.operator) {
      case 'eq':
        matched = String(actual) === expected;
        break;
      case 'neq':
        matched = String(actual) !== expected;
        break;
      case 'contains':
        matched = typeof actual === 'string' && actual.includes(expected);
        break;
      case 'gt':
        matched = Number(actual) > Number(expected);
        break;
      case 'lt':
        matched = Number(actual) < Number(expected);
        break;
      case 'regex':
        try {
          matched = new RegExp(expected).test(String(actual));
        } catch {
          matched = false;
        }
        break;
    }

    if (matched) {
      return edges.find((e) => e.targetNodeId === rule.targetEdgeId) ?? null;
    }
  }

  // Default edge
  if (defaultEdgeId) {
    return edges.find((e) => e.targetNodeId === defaultEdgeId) ?? null;
  }

  return null;
}

/**
 * Simple expression evaluator for set_variable nodes.
 * Supports variable references like `{{var}}` and plain string/number values.
 */
export function evaluateExpression(value: string, variables: Record<string, unknown>): unknown {
  // If it's a template, render it
  if (value.includes('{{')) {
    return renderTemplate(value, variables);
  }

  // Try to parse as number
  const num = Number(value);
  if (!Number.isNaN(num) && value.trim() !== '') return num;

  // Try to parse as boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Return as string
  return value;
}

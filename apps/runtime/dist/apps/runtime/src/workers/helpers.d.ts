import type { TriggerMapping } from '@telegraph/schemas';
type PlanEdge = {
    condition?: string | undefined;
    targetNodeId: string;
};
/**
 * Replace `{{variable}}` placeholders with values from the variables map.
 */
export declare function renderTemplate(template: string, variables: Record<string, unknown>): string;
/**
 * Match incoming text against trigger mappings. Returns entry node ID or null.
 */
export declare function matchTrigger(triggers: TriggerMapping[], text: string): string | null;
/**
 * Evaluate condition rules against session variables and return the matching edge.
 */
export declare function evaluateCondition(rules: Array<{
    variable: string;
    operator: string;
    value: string;
    targetEdgeId: string;
}>, edges: PlanEdge[], variables: Record<string, unknown>, defaultEdgeId?: string): PlanEdge | null;
/**
 * Simple expression evaluator for set_variable nodes.
 * Supports variable references like `{{var}}` and plain string/number values.
 */
export declare function evaluateExpression(value: string, variables: Record<string, unknown>): unknown;
export {};
//# sourceMappingURL=helpers.d.ts.map
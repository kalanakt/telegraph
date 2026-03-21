import type { CallbackTokenMap, ExecutionPlan, FlowGraph } from '@telegraph/schemas';
export interface CompileResult {
    plan: ExecutionPlan;
    callbackMap: CallbackTokenMap;
}
export interface CompileError {
    message: string;
    nodeId?: string;
}
export declare class CompileValidationError extends Error {
    readonly errors: CompileError[];
    constructor(errors: CompileError[]);
}
/** Validate the graph and return any errors. */
export declare function validate(graph: FlowGraph): CompileError[];
/**
 * Compile a FlowGraph into an immutable ExecutionPlan and callback token map.
 */
export declare function compile(flowId: string, version: number, graph: FlowGraph): CompileResult;
//# sourceMappingURL=compiler.d.ts.map
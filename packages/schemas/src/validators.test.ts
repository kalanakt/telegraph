import { describe, it, expect } from 'vitest';
import { validateFlowGraph, validateExecutionPlan } from './validators.js';
import { simpleEchoFlow } from './samples/simple-echo.js';

describe('validateFlowGraph', () => {
  it('accepts a minimal valid graph (1 trigger + 1 message + 1 edge)', () => {
    const graph = {
      nodes: [
        { id: 'n1', type: 'command_trigger', config: { command: '/go' }, position: { x: 0, y: 0 } },
        { id: 'n2', type: 'send_message', config: { text: 'hi' }, position: { x: 0, y: 100 } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };
    const result = validateFlowGraph(graph);
    expect(result.success).toBe(true);
  });

  it('accepts the simpleEchoFlow sample', () => {
    const result = validateFlowGraph(simpleEchoFlow);
    expect(result.success).toBe(true);
  });

  it('rejects when nodes field is missing', () => {
    const result = validateFlowGraph({ edges: [] });
    expect(result.success).toBe(false);
  });

  it('rejects a node with an invalid type', () => {
    const graph = {
      nodes: [
        { id: 'n1', type: 'not_real', config: {}, position: { x: 0, y: 0 } },
      ],
      edges: [],
    };
    const result = validateFlowGraph(graph);
    expect(result.success).toBe(false);
  });
});

describe('validateExecutionPlan', () => {
  it('accepts a minimal valid execution plan', () => {
    const plan = {
      id: 'plan-1',
      flowId: 'flow-1',
      version: 1,
      triggers: [
        { type: 'command', pattern: '/start', entryNodeId: 'n1' },
      ],
      nodes: {
        n1: { id: 'n1', type: 'send_message', config: { text: 'hi' }, edges: [] },
      },
      metadata: { compiledAt: '2025-01-01T00:00:00Z', nodeCount: 1 },
    };
    const result = validateExecutionPlan(plan);
    expect(result.success).toBe(true);
  });

  it('rejects when flowId is missing', () => {
    const plan = {
      id: 'plan-1',
      version: 1,
      triggers: [],
      nodes: {},
      metadata: { compiledAt: '2025-01-01T00:00:00Z', nodeCount: 0 },
    };
    const result = validateExecutionPlan(plan);
    expect(result.success).toBe(false);
  });
});

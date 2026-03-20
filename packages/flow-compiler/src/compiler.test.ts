import { describe, expect, it } from 'vitest';
import { simpleEchoFlow } from '@telegraph/schemas';
import type { FlowGraph } from '@telegraph/schemas';
import { compile, CompileValidationError } from './compiler.js';

describe('flow compiler', () => {
  it('compiles a simple flow (command trigger → send_message)', () => {
    const graph: FlowGraph = {
      nodes: [
        {
          id: 'trigger',
          type: 'command_trigger',
          config: { command: '/start' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'msg',
          type: 'send_message',
          config: { text: 'Hello!' },
          position: { x: 0, y: 100 },
        },
      ],
      edges: [{ id: 'e1', source: 'trigger', target: 'msg' }],
    };

    const { plan, callbackMap } = compile('flow-1', 1, graph);

    expect(plan.flowId).toBe('flow-1');
    expect(plan.version).toBe(1);
    expect(plan.triggers).toHaveLength(1);
    expect(plan.triggers[0]).toMatchObject({
      type: 'command',
      pattern: '/start',
      entryNodeId: 'msg',
    });
    expect(Object.keys(plan.nodes)).toHaveLength(2);
    expect(plan.nodes['trigger']).toBeDefined();
    expect(plan.nodes['msg']).toBeDefined();
    expect(plan.nodes['msg']!.edges).toHaveLength(0);
    expect(plan.nodes['trigger']!.edges).toHaveLength(1);
    expect(plan.nodes['trigger']!.edges[0]).toMatchObject({ targetNodeId: 'msg' });
    expect(plan.metadata.nodeCount).toBe(2);
    expect(Object.keys(callbackMap)).toHaveLength(0);
  });

  it('compiles a branching flow (condition → 2 send_messages)', () => {
    const graph: FlowGraph = {
      nodes: [
        {
          id: 'trigger',
          type: 'command_trigger',
          config: { command: '/check' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'cond',
          type: 'condition',
          config: {
            rules: [{ variable: 'x', operator: 'eq', value: '1', targetEdgeId: 'e-yes' }],
            defaultEdgeId: 'e-no',
          },
          position: { x: 0, y: 100 },
        },
        {
          id: 'yes-msg',
          type: 'send_message',
          config: { text: 'Yes!' },
          position: { x: -100, y: 200 },
        },
        {
          id: 'no-msg',
          type: 'send_message',
          config: { text: 'No!' },
          position: { x: 100, y: 200 },
        },
      ],
      edges: [
        { id: 'e-trigger', source: 'trigger', target: 'cond' },
        { id: 'e-yes', source: 'cond', target: 'yes-msg' },
        { id: 'e-no', source: 'cond', target: 'no-msg' },
      ],
    };

    const { plan } = compile('flow-2', 1, graph);

    expect(plan.triggers).toHaveLength(1);
    expect(Object.keys(plan.nodes)).toHaveLength(4);

    const condNode = plan.nodes['cond']!;
    expect(condNode.edges).toHaveLength(2);
    expect(condNode.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ condition: 'e-yes', targetNodeId: 'yes-msg' }),
        expect.objectContaining({ targetNodeId: 'no-msg' }),
      ]),
    );
  });

  it('rejects an empty graph', () => {
    const graph: FlowGraph = { nodes: [], edges: [] };

    expect(() => compile('flow-empty', 1, graph)).toThrow(CompileValidationError);
  });

  it('rejects a graph with orphan nodes', () => {
    const graph: FlowGraph = {
      nodes: [
        {
          id: 'trigger',
          type: 'command_trigger',
          config: { command: '/start' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'connected',
          type: 'send_message',
          config: { text: 'OK' },
          position: { x: 0, y: 100 },
        },
        {
          id: 'orphan',
          type: 'send_message',
          config: { text: 'Unreachable' },
          position: { x: 200, y: 200 },
        },
      ],
      edges: [{ id: 'e1', source: 'trigger', target: 'connected' }],
    };

    expect(() => compile('flow-orphan', 1, graph)).toThrow(CompileValidationError);

    try {
      compile('flow-orphan', 1, graph);
    } catch (err) {
      const ve = err as CompileValidationError;
      expect(ve.errors.some((e) => e.nodeId === 'orphan')).toBe(true);
    }
  });

  it('rejects a graph with no triggers', () => {
    const graph: FlowGraph = {
      nodes: [
        {
          id: 'msg1',
          type: 'send_message',
          config: { text: 'Hello' },
          position: { x: 0, y: 0 },
        },
        {
          id: 'msg2',
          type: 'send_message',
          config: { text: 'World' },
          position: { x: 0, y: 100 },
        },
      ],
      edges: [{ id: 'e1', source: 'msg1', target: 'msg2' }],
    };

    expect(() => compile('flow-no-trigger', 1, graph)).toThrow(CompileValidationError);

    try {
      compile('flow-no-trigger', 1, graph);
    } catch (err) {
      const ve = err as CompileValidationError;
      expect(ve.errors.some((e) => e.message.includes('trigger'))).toBe(true);
    }
  });

  it('compiles wait_for_input and generates callback tokens', () => {
    const { plan, callbackMap } = compile('flow-wait', 1, simpleEchoFlow);

    // The simpleEchoFlow has: trigger-start → greet → wait → echo
    expect(plan.triggers).toHaveLength(1);
    expect(plan.triggers[0]).toMatchObject({
      type: 'command',
      pattern: '/start',
      entryNodeId: 'greet',
    });
    expect(Object.keys(plan.nodes)).toHaveLength(4);

    // One wait_for_input → one callback token
    const tokens = Object.keys(callbackMap);
    expect(tokens).toHaveLength(1);
    const token = tokens[0]!;
    expect(token).toMatch(/^cb_/);
    expect(callbackMap[token]).toMatchObject({ nodeId: 'wait', planId: plan.id });
  });
});

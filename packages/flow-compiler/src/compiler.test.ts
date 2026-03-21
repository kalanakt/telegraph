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

  it('rejects a graph with cycles', () => {
    const graph: FlowGraph = {
      nodes: [
        { id: 'trigger', type: 'command_trigger', config: { command: '/loop' }, position: { x: 0, y: 0 } },
        { id: 'a', type: 'send_message', config: { text: 'A' }, position: { x: 0, y: 100 } },
        { id: 'b', type: 'send_message', config: { text: 'B' }, position: { x: 0, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 'trigger', target: 'a' },
        { id: 'e2', source: 'a', target: 'b' },
        { id: 'e3', source: 'b', target: 'a' },
      ],
    };
    expect(() => compile('flow-cycle', 1, graph)).toThrow(CompileValidationError);
    try {
      compile('flow-cycle', 1, graph);
    } catch (err) {
      const ve = err as CompileValidationError;
      expect(ve.errors.some((e) => e.message.includes('Cycle detected'))).toBe(true);
    }
  });

  it('compiles condition node edges with correct condition fields', () => {
    const graph: FlowGraph = {
      nodes: [
        { id: 'trigger', type: 'command_trigger', config: { command: '/decide' }, position: { x: 0, y: 0 } },
        {
          id: 'cond',
          type: 'condition',
          config: {
            rules: [
              { variable: 'a', operator: 'eq', value: '1', targetEdgeId: 'e-rule1' },
              { variable: 'b', operator: 'eq', value: '2', targetEdgeId: 'e-rule2' },
            ],
            defaultEdgeId: 'e-default',
          },
          position: { x: 0, y: 100 },
        },
        { id: 'r1', type: 'send_message', config: { text: 'R1' }, position: { x: -100, y: 200 } },
        { id: 'r2', type: 'send_message', config: { text: 'R2' }, position: { x: 0, y: 200 } },
        { id: 'def', type: 'send_message', config: { text: 'Default' }, position: { x: 100, y: 200 } },
      ],
      edges: [
        { id: 'e-t', source: 'trigger', target: 'cond' },
        { id: 'e-rule1', source: 'cond', target: 'r1' },
        { id: 'e-rule2', source: 'cond', target: 'r2' },
        { id: 'e-default', source: 'cond', target: 'def' },
      ],
    };

    const { plan } = compile('flow-cond-detail', 1, graph);
    const condEdges = plan.nodes['cond']!.edges;

    expect(condEdges).toHaveLength(3);

    const rule1Edge = condEdges.find((e) => e.targetNodeId === 'r1');
    expect(rule1Edge).toMatchObject({ condition: 'e-rule1', targetNodeId: 'r1' });

    const rule2Edge = condEdges.find((e) => e.targetNodeId === 'r2');
    expect(rule2Edge).toMatchObject({ condition: 'e-rule2', targetNodeId: 'r2' });

    const defaultEdge = condEdges.find((e) => e.targetNodeId === 'def');
    expect(defaultEdge).toBeDefined();
    expect(defaultEdge!.condition).toBeUndefined();
  });

  it('compiles a multi-trigger flow with two command triggers', () => {
    const graph: FlowGraph = {
      nodes: [
        { id: 'tA', type: 'command_trigger', config: { command: '/a' }, position: { x: 0, y: 0 } },
        { id: 'tB', type: 'command_trigger', config: { command: '/b' }, position: { x: 200, y: 0 } },
        { id: 'msg', type: 'send_message', config: { text: 'Hello' }, position: { x: 100, y: 100 } },
      ],
      edges: [
        { id: 'e1', source: 'tA', target: 'msg' },
        { id: 'e2', source: 'tB', target: 'msg' },
      ],
    };

    const { plan } = compile('flow-multi', 1, graph);

    expect(plan.triggers).toHaveLength(2);
    expect(plan.triggers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'command', pattern: '/a' }),
        expect.objectContaining({ type: 'command', pattern: '/b' }),
      ]),
    );
  });

  it('compiles a message_trigger with pattern and matchType', () => {
    const graph: FlowGraph = {
      nodes: [
        {
          id: 'mt',
          type: 'message_trigger',
          config: { pattern: 'hello', matchType: 'contains' },
          position: { x: 0, y: 0 },
        },
        { id: 'reply', type: 'send_message', config: { text: 'Hi!' }, position: { x: 0, y: 100 } },
      ],
      edges: [{ id: 'e1', source: 'mt', target: 'reply' }],
    };

    const { plan } = compile('flow-msg-trigger', 1, graph);

    expect(plan.triggers).toHaveLength(1);
    expect(plan.triggers[0]).toMatchObject({
      type: 'message',
      pattern: 'hello',
      matchType: 'contains',
      entryNodeId: 'reply',
    });
  });

  it('rejects a self-referencing edge', () => {
    const graph: FlowGraph = {
      nodes: [
        { id: 'trigger', type: 'command_trigger', config: { command: '/self' }, position: { x: 0, y: 0 } },
        { id: 'loop', type: 'send_message', config: { text: 'Loop' }, position: { x: 0, y: 100 } },
      ],
      edges: [
        { id: 'e1', source: 'trigger', target: 'loop' },
        { id: 'e-self', source: 'loop', target: 'loop' },
      ],
    };

    expect(() => compile('flow-self', 1, graph)).toThrow(CompileValidationError);

    try {
      compile('flow-self', 1, graph);
    } catch (err) {
      const ve = err as CompileValidationError;
      expect(ve.errors.some((e) => e.message.includes('self-referencing'))).toBe(true);
    }
  });


});

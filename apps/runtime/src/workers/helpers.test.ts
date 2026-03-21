import { describe, it, expect } from 'vitest';
import { renderTemplate, matchTrigger, evaluateCondition, evaluateExpression } from './helpers.js';
import type { TriggerMapping } from '@telegraph/schemas';

describe('renderTemplate', () => {
  it('performs basic substitution', () => {
    expect(renderTemplate('Hello {{name}}', { name: 'World' })).toBe('Hello World');
  });

  it('replaces missing variable with empty string', () => {
    expect(renderTemplate('Hello {{name}}', {})).toBe('Hello ');
  });

  it('JSON-stringifies object values', () => {
    expect(renderTemplate('data: {{obj}}', { obj: { a: 1 } })).toBe('data: {"a":1}');
  });

  it('replaces multiple variables', () => {
    expect(renderTemplate('{{a}} and {{b}}', { a: 'X', b: 'Y' })).toBe('X and Y');
  });

  it('returns template unchanged when there are no placeholders', () => {
    expect(renderTemplate('no placeholders here', { x: '1' })).toBe('no placeholders here');
  });
});

describe('matchTrigger', () => {
  const triggers: TriggerMapping[] = [
    { type: 'command', pattern: '/start', entryNodeId: 'n1' },
    { type: 'message', pattern: 'hello', entryNodeId: 'n2', matchType: 'exact' },
    { type: 'message', pattern: 'hello', entryNodeId: 'n3', matchType: 'contains' },
    { type: 'message', pattern: '\\d+', entryNodeId: 'n4', matchType: 'regex' },
  ];

  it('matches a command trigger', () => {
    expect(matchTrigger(triggers, '/start')).toBe('n1');
  });

  it('returns null for non-matching command', () => {
    expect(matchTrigger(triggers, '/other')).toBeNull();
  });

  it('matches exact message trigger', () => {
    expect(matchTrigger(triggers, 'hello')).toBe('n2');
  });

  it('matches contains message trigger', () => {
    expect(matchTrigger(triggers, 'hello world')).toBe('n3');
  });

  it('matches regex message trigger', () => {
    expect(matchTrigger(triggers, 'abc123')).toBe('n4');
  });
});

describe('evaluateCondition', () => {
  const edges = [
    { condition: 'rule-eq', targetNodeId: 'target-eq' },
    { condition: 'rule-neq', targetNodeId: 'target-neq' },
    { condition: 'rule-gt', targetNodeId: 'target-gt' },
    { targetNodeId: 'default-target' },
  ];

  it('matches eq operator', () => {
    const rules = [{ variable: 'answer', operator: 'eq', value: 'yes', targetEdgeId: 'rule-eq' }];
    const result = evaluateCondition(rules, edges, { answer: 'yes' });
    expect(result).toEqual({ condition: 'rule-eq', targetNodeId: 'target-eq' });
  });

  it('matches neq operator', () => {
    const rules = [{ variable: 'answer', operator: 'neq', value: 'yes', targetEdgeId: 'rule-neq' }];
    const result = evaluateCondition(rules, edges, { answer: 'no' });
    expect(result).toEqual({ condition: 'rule-neq', targetNodeId: 'target-neq' });
  });

  it('matches gt operator', () => {
    const rules = [{ variable: 'score', operator: 'gt', value: '5', targetEdgeId: 'rule-gt' }];
    const result = evaluateCondition(rules, edges, { score: 10 });
    expect(result).toEqual({ condition: 'rule-gt', targetNodeId: 'target-gt' });
  });

  it('returns default edge when no rules match', () => {
    const rules = [{ variable: 'answer', operator: 'eq', value: 'yes', targetEdgeId: 'rule-eq' }];
    const result = evaluateCondition(rules, edges, { answer: 'no' }, 'default-target');
    expect(result).toEqual({ targetNodeId: 'default-target' });
  });

  it('returns null when no rules match and no default', () => {
    const rules = [{ variable: 'answer', operator: 'eq', value: 'yes', targetEdgeId: 'rule-eq' }];
    const result = evaluateCondition(rules, edges, { answer: 'no' });
    expect(result).toBeNull();
  });
});

describe('evaluateExpression', () => {
  it('resolves template references', () => {
    expect(evaluateExpression('{{x}}', { x: 'hello' })).toBe('hello');
  });

  it('parses numbers', () => {
    expect(evaluateExpression('42', {})).toBe(42);
  });

  it('parses booleans', () => {
    expect(evaluateExpression('true', {})).toBe(true);
  });

  it('returns plain strings as-is', () => {
    expect(evaluateExpression('hello', {})).toBe('hello');
  });
});

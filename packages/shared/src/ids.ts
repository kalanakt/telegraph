import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid(21);
}

export function tenantId(): string {
  return `ten_${nanoid(21)}`;
}

export function botId(): string {
  return `bot_${nanoid(21)}`;
}

export function flowId(): string {
  return `flw_${nanoid(21)}`;
}

export function userId(): string {
  return `usr_${nanoid(21)}`;
}

export function planId(): string {
  return `pln_${nanoid(21)}`;
}

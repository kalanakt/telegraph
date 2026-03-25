import { Queue } from "bullmq";
import { QUEUES, type ActionJob } from "@telegram-builder/shared";
import { getRedis } from "./redis";

let actionQueue: Queue<ActionJob> | null = null;
let deadLetterQueue: Queue | null = null;

export function getActionQueue(): Queue<ActionJob> {
  if (!actionQueue) {
    actionQueue = new Queue<ActionJob>(QUEUES.ACTIONS, {
      connection: getRedis()
    });
  }
  return actionQueue;
}

export function getDeadLetterQueue() {
  if (!deadLetterQueue) {
    deadLetterQueue = new Queue(QUEUES.DEAD_LETTER, {
      connection: getRedis()
    });
  }
  return deadLetterQueue;
}

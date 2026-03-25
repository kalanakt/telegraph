import { Queue } from "bullmq";
import { QUEUES, type ActionJob } from "@telegram-builder/shared";
import { getRedis } from "./redis";

function createActionQueueInstance() {
  return new Queue<ActionJob>(QUEUES.ACTIONS, {
    connection: getRedis()
  });
}

function createDeadLetterQueueInstance() {
  return new Queue(QUEUES.DEAD_LETTER, {
    connection: getRedis()
  });
}

type ActionQueueInstance = ReturnType<typeof createActionQueueInstance>;
type DeadLetterQueueInstance = ReturnType<typeof createDeadLetterQueueInstance>;

let actionQueue: ActionQueueInstance | null = null;
let deadLetterQueue: DeadLetterQueueInstance | null = null;

export function getActionQueue(): ActionQueueInstance {
  if (!actionQueue) {
    actionQueue = createActionQueueInstance();
  }

  return actionQueue;
}

export function getDeadLetterQueue(): DeadLetterQueueInstance {
  if (!deadLetterQueue) {
    deadLetterQueue = createDeadLetterQueueInstance();
  }

  return deadLetterQueue;
}

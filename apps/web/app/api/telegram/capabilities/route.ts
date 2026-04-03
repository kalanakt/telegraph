import { NextResponse } from "next/server";
import {
  WORKFLOW_ACTION_MANIFEST,
  WORKFLOW_CONDITION_MANIFEST,
  WORKFLOW_TRIGGER_MANIFEST,
  WORKFLOW_TRIGGER_TYPES
} from "@telegram-builder/shared";

export async function GET() {
  return NextResponse.json({
    triggers: WORKFLOW_TRIGGER_TYPES,
    triggerManifest: WORKFLOW_TRIGGER_MANIFEST,
    conditions: WORKFLOW_CONDITION_MANIFEST,
    actions: WORKFLOW_ACTION_MANIFEST
  });
}

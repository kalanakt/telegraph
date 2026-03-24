import { NextResponse } from "next/server";
import { TELEGRAM_CAPABILITIES_MANIFEST, TELEGRAM_TRIGGER_TYPES } from "@telegram-builder/shared";

export async function GET() {
  return NextResponse.json({
    triggers: TELEGRAM_TRIGGER_TYPES,
    methods: TELEGRAM_CAPABILITIES_MANIFEST
  });
}

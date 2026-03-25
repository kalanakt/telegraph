import { useMemo } from "react";
import { deriveButtonHandles } from "../utils";
import type { ActionEditorData, ButtonHandleSpec } from "../types";

export function useButtonHandles(action: ActionEditorData | null): ButtonHandleSpec[] {
  return useMemo(() => {
    if (!action || action.type !== "telegram.sendMessage") return [];
    return deriveButtonHandles(action.params);
  }, [action]);
}

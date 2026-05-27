"use client";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

type ActionState = { error?: string; success?: string | boolean } | undefined;

export function useActionToast(state: ActionState) {
  const prevRef = useRef(state);

  useEffect(() => {
    if (state === prevRef.current) return;
    prevRef.current = state;
    if (!state) return;
    if (state.error) toast.error(state.error);
    else if (state.success) {
      toast.success(
        typeof state.success === "string" ? state.success : "Saved successfully."
      );
    }
  }, [state]);
}

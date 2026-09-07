import { useEffect, useRef, useCallback } from "react";

export interface CollaborationTaskEvent {
  type: "SUBTASK_TOGGLE" | "SUBTASK_ADD" | "SUBTASK_DELETE" | "TASK_UPDATE";
  taskId?: string;
  subtaskId?: string;
}

interface UseTaskSyncOptions {
  enabled: boolean;
  onSilentSync: () => Promise<void>;
  pollIntervalMs?: number;
}

const BROADCAST_CHANNEL_NAME = "zalde_collaboration_events";

// ponytail: native BroadcastChannel for instant (<5ms) cross-tab sync + 2500ms visibility-aware polling. upgrade to WebSocket/SSE if server push is added.
export function useTaskSync({
  enabled,
  onSilentSync,
  pollIntervalMs = 2500,
}: UseTaskSyncOptions) {
  const syncRef = useRef(onSilentSync);
  syncRef.current = onSilentSync;
  const channelRef = useRef<BroadcastChannel | null>(null);

  const broadcastEvent = useCallback((event: CollaborationTaskEvent) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage(event);
      }
    } catch (err) {
      console.warn("Gagal broadcast event kolaborasi:", err);
    }
  }, []);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // 1. Setup native BroadcastChannel for instant same-browser sync
    let channel: BroadcastChannel | null = null;
    try {
      if ("BroadcastChannel" in window) {
        channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        channelRef.current = channel;
        channel.onmessage = () => {
          syncRef.current();
        };
      }
    } catch {
      // Fallback gracefully if BroadcastChannel not supported
    }

    // 2. Periodic sync when document is visible
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncRef.current();
      }
    }, pollIntervalMs);

    // 3. Immediate sync on window focus or visibility resume
    const handleFocusOrVisible = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncRef.current();
      }
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      if (channel) {
        channel.close();
        channelRef.current = null;
      }
    };
  }, [enabled, pollIntervalMs]);

  return { broadcastEvent };
}

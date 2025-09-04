"use client";
import { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';

/**
 * SettingsFormStatusBridge
 * Listens to the surrounding form's submission lifecycle via useFormStatus
 * and dispatches a custom 'settings:updated' event when a submission completes
 * successfully (transition from pending -> not pending). We rely on server
 * revalidation plus a small delay to ensure the updated data is available.
 */
export default function SettingsFormStatusBridge() {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) {
      // Completed a submit cycle
      setTimeout(() => {
        window.dispatchEvent(new Event('settings:updated'));
      }, 120);
    }
    wasPending.current = pending;
  }, [pending]);
  return null;
}

"use client";
import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const STORAGE_KEY = "ocia-hide-docs-fab";

function subscribe() {
  return () => {};
}

function getSnapshot() {
  return sessionStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot() {
  return false;
}

export function HelpButton() {
  // Reads the stored preference without causing an SSR/client hydration
  // mismatch (the button is always shown on the server, then hidden on
  // the client right away if the user dismissed it earlier this session).
  // sessionStorage (not localStorage) means it reappears next session —
  // intentional while everyone is still getting used to the system.
  const storedHidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [dismissed, setDismissed] = useState(false);

  if (storedHidden || dismissed) return null;

  return (
    <div className="group fixed bottom-6 right-6 z-50 print:hidden">
      <Link
        href="/docs"
        className="w-10 h-10 rounded-full bg-catecheo text-white flex items-center justify-center text-lg font-bold shadow-lg hover:bg-catecheo-dark transition-colors"
        aria-label="Documentation"
      >
        ?
      </Link>
      <button
        type="button"
        onClick={() => {
          sessionStorage.setItem(STORAGE_KEY, "true");
          setDismissed(true);
        }}
        aria-label="Hide documentation shortcut"
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-700 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-gray-900 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  );
}

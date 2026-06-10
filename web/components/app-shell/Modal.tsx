"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Animated modal shell — fades + pops the panel IN on mount and OUT on close
 * (keeps the node mounted through the exit animation, then calls onClose).
 * Pass children as a function to get the animated `close` for inner buttons.
 */
export default function Modal({
  onClose,
  z = 100,
  backdrop = "bg-ink/90",
  panelClassName = "",
  dismissable = true,
  children,
}: {
  onClose: () => void;
  z?: number;
  backdrop?: string;
  panelClassName?: string;
  dismissable?: boolean;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
}) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissable) close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close, dismissable]);

  return (
    <div
      onClick={dismissable ? close : undefined}
      className={`fixed inset-0 grid place-items-center p-3 sm:p-4 ${backdrop}`}
      style={{ zIndex: z, animation: `${closing ? "ovOut" : "ovIn"} .2s ease forwards` }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={panelClassName}
        style={{ animation: `${closing ? "popOut" : "popIn"} .26s cubic-bezier(.2,1,.3,1) forwards` }}
      >
        {typeof children === "function" ? (children as (c: () => void) => React.ReactNode)(close) : children}
      </div>
    </div>
  );
}

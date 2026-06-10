"use client";

import { useEffect, useRef } from "react";
import anime from "animejs";

// Re-mounts on every route change → plays a quick fade so page-to-page feels smooth.
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (anime && ref.current) anime({ targets: ref.current, opacity: [0, 1], easing: "easeOutQuad", duration: 440 });
  }, []);
  return <div ref={ref}>{children}</div>;
}

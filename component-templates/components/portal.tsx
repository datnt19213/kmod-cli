// components/PortalDropdown.tsx
"use client";

import {
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

type Props = {
  show: boolean;
  position: { top: number; left: number };
  children: React.ReactNode;
};

export default function PortalShow({ show, position, children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !show) return null;

  return createPortal(
    <div
      className="fixed z-[50] translate-y-[calc(100%-60px)] w-max max-w-[260px] rounded-md animate-fade-up bg-background p-2 shadow-xl"
      style={{ top: position.top, left: position.left + 60 }}
    >
      {children}
    </div>,
    document.body,
  );
}

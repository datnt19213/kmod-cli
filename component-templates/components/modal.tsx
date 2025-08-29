"use client";
import React, {
  ReactNode,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../lib/utils';

/** base z-100 */
type ModalProps = {
  open: boolean;
  type: "modal" | "drawer";
  onClose: () => void;
  title?: ReactNode | string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  pos?: "center" | "top" | "bottom" | "right" | "left";
  containerClassName?: string;
};

export default function Modal({
  open,
  type = "modal",
  onClose,
  title,
  children,
  footer,
  pos = "center",
  className = "",
  containerClassName = "",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onEsc);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  if (typeof window === "undefined") return null;

  if (type === "modal")
    return createPortal(
      open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className={cn("fixed inset-0 backdrop-blur-lg !z-[100] flex justify-center bg-black/10 p-6 transition-opacity duration-300", containerClassName)}
        >
          <div
            className={cn(
              pos === "center" && "top-1/2 -translate-y-1/2",
              pos === "top" && "top-0",
              pos === "bottom" && "bottom-0 translate-y-full",
              pos === "right" && "right-0",
              pos === "left" && "left-0",
              `animate-fade-up !animate-duration-500 relative mx-4 h-fit w-full max-w-lg scale-100 transform rounded-lg bg-white p-6 opacity-100 shadow-xl transition-all duration-300 dark:bg-zinc-900`,
              className,
            )}
          >
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {children}
            {footer && footer}
          </div>
        </div>
      ),
      document.body,
    );
  if (type === "drawer")
    return createPortal(
      open && (
        <div
          ref={overlayRef}
          onClick={handleOverlayClick}
          className={cn("fixed inset-0 !z-[100] flex justify-end bg-black/50 transition-opacity duration-300")}
        >
          <div
            className={cn(
              `animate-fade-up !animate-duration-500 h-full w-full max-w-full transform bg-white p-6 shadow-xl transition-all duration-300 dark:bg-zinc-900`,
              className,
            )}
          >
            {title && <div className="text-lg font-semibold">{title}</div>}
            {children}
            {footer && footer}
          </div>
        </div>
      ),
      document.body,
    );
}

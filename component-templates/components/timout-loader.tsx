"use client";
import React, {
  useEffect,
  useState,
} from "react";

type TimeoutLoaderProps = {
  children: React.ReactNode;
  fallback: React.ReactNode | (() => void);
  timeoutMs?: number;
  isLoaded?: boolean;
  isActive?: boolean;
  loadingComponent?: React.ReactNode;
};

export const TimeoutLoader: React.FC<TimeoutLoaderProps> = ({
  children,
  fallback,
  timeoutMs = 10000,
  isLoaded = false,
  isActive = true,
  loadingComponent = <div>Đang tải...</div>,
}) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!isActive || isLoaded) return;

    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => clearTimeout(timeout);
  }, [isLoaded, isActive, timeoutMs]);

  // Không active: render children ngay lập tức
  if (!isActive) return <>{children}</>;

  // Nếu đã load
  if (isLoaded) return <>{children}</>;

  // Nếu hết thời gian và fallback là hàm
  if (timedOut) {
    if (typeof fallback === 'function') {
      fallback(); // optional: có thể return fallback() nếu muốn hiện kết quả từ hàm
      return null;
    }
    return <>{fallback}</>;
  }

  return <>{loadingComponent}</>;
};

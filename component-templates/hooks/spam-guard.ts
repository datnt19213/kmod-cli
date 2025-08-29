import { useRef } from 'react';

export type SpamGuardProps = {
  limit?: number;
  timeFrame?: number;
  onSpam?: () => void;
}

export const useSpamGuard = ({
  limit = 1,
  timeFrame = 600,
  onSpam,
}: SpamGuardProps = {}): () => boolean => {
  const actionsRef = useRef<number[]>([]);

  const checkSpam = () => {
    const now = Date.now();
    const updatedActions = actionsRef.current.filter((t) => now - t < timeFrame);

    if (updatedActions.length >= limit) {
      onSpam?.();
      return false;
    }

    updatedActions.push(now);
    actionsRef.current = updatedActions;
    return true;
  };

  return checkSpam;
}

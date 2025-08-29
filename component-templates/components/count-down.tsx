import React, {
  ReactElement,
  useEffect,
} from 'react';

import { useCountdownStore } from '../hooks/count-down';

export type CountdownProps = {
  initialTime?: number;
  onComplete?: () => void;
  onCountDown?: () => void;
  blockInitialTime?: boolean; // Optional prop to control initial time setting
  freeze?: boolean; // Optional prop to freeze the countdown
  freezeAfter?: number; // Optional prop to freeze countdown after a certain time
}

/**
 * Countdown component
 * @param {number} initialTime - Initial time in seconds, defaults to 0
 * @param {boolean} blockInitialTime - If true, the initial time will not be set automatically
 * @param {boolean} freeze - If true, the countdown will freeze after it reaches 0
 * @param {number} freezeAfter - The time in seconds after which the countdown will freeze
 * @param {() => void} onComplete - Callback function that will be called when the countdown is completed
 * @param {() => void} onCountDown - Callback function that will be called every second while the countdown is running
 * @returns {ReactElement} The countdown component
 */
export const Countdown: React.FC<CountdownProps> = ({
  initialTime,
  blockInitialTime = false,
  freeze = false,
  freezeAfter,
  onComplete,
  onCountDown,
}: CountdownProps): ReactElement => {
    const {
    decrement,
    isRunning,
    setTime,
    stop,
    timeLeft,
    freezing,
    freeze: doFreeze,
  } = useCountdownStore();

  // Init time if not blocked and timeLeft is 0
  useEffect(() => {
    if (!blockInitialTime && timeLeft === 0 && initialTime) {
      setTime(initialTime);
    }
  }, [blockInitialTime, initialTime]);

  useEffect(() => {
    if (blockInitialTime) {
      return;
    }
    if (timeLeft === 0 && initialTime) {
      setTime(initialTime);
    }
  }, [initialTime]);

  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      stop();
      if (onComplete) {
        onComplete();
      }
    }
  }, [timeLeft, isRunning, onComplete]);

  useEffect(() => {
     if (!isRunning || freeze || freezing) return;

    // 🚦 Auto freeze
    if (freezeAfter !== undefined && timeLeft === freezeAfter) {
      doFreeze();
      return;
    }
    if (isRunning && timeLeft > 0) {
      const timer = setInterval(() => {
        decrement();
        onCountDown?.();
      }, 1000);

      return () => clearInterval(timer);
    }

    if (timeLeft === 0 && isRunning) {
      stop();
      onComplete?.();
    }
  },  [isRunning, freeze, freezing, timeLeft, freezeAfter]);

  return <>{timeLeft}</>;
};

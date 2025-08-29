"use client";
import React, {
  HTMLAttributes,
  useRef,
  useState,
} from 'react';

import {
  Minus,
  Plus,
} from 'lucide-react';

import { cn } from '../lib/utils';

export type CountingProps = {
  initialValue?: number;
  min?: number;
  max?: number;
  durations?: number; // delay every step when holding
  steps?: number;
  holdDelay?: number; // delay before starting to hold
  activeHolding?: boolean;
  activeIncrement?: boolean;
  activeDecrement?: boolean;
  onIncrement?: (value?: number, changeStatus?: "active" | "freeze") => void;
  onDecrement?: (value?: number, changeStatus?: "active" | "freeze") => void;
  onValueChange?: (
    value: number,
    changeStatus?: "inc" | "dec" | "freeze"
  ) => void;
  inputClass?: HTMLAttributes<HTMLInputElement>["className"];
  decreaseClass?: HTMLAttributes<HTMLButtonElement>["className"];
  increaseClass?: HTMLAttributes<HTMLButtonElement>["className"];
  containerClass?: HTMLAttributes<HTMLDivElement>["className"];
  inputWrapperClass?: HTMLAttributes<HTMLDivElement>["className"];
  inputProps?: HTMLAttributes<HTMLInputElement>;
  decreaseProps?: HTMLAttributes<HTMLButtonElement>;
  increaseProps?: HTMLAttributes<HTMLButtonElement>;
  containerProps?: HTMLAttributes<HTMLDivElement>;
  inputWrapperProps?: HTMLAttributes<HTMLDivElement>;
  increaseChildren?: React.ReactNode;
  decreaseChildren?: React.ReactNode;
  beforeInputRender?: () => React.ReactNode; // Optional prop to render before the input
  afterInputRender?: () => React.ReactNode; // Optional prop to render after the input
}

export const Counting: React.FC<CountingProps> = ({
  initialValue = 0,
  min = 0,
  max = 100,
  durations = 100,
  steps = 1,
  holdDelay = 500,
  activeHolding = true,
  activeIncrement = true,
  activeDecrement = true,
  onIncrement,
  onDecrement,
  onValueChange,
  inputClass,
  decreaseClass,
  increaseClass,
  containerClass,
  inputWrapperClass,
  inputProps,
  decreaseProps,
  increaseProps,
  containerProps,
  inputWrapperProps,
  increaseChildren = <Plus size={20} />,
  decreaseChildren = <Minus size={20} />,
  beforeInputRender,
  afterInputRender,
}) => {
  const [value, setValue] = useState(initialValue);
  const [inputValue, setInputValue] = useState(initialValue.toString());
  const isHolding = useRef(false);
  const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdStarted = useRef(false);

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

  const stopContinuousChange = (type: "inc" | "dec") => {
    isHolding.current = false;
    holdStarted.current = false;
    if (holdTimeout.current) clearTimeout(holdTimeout.current);

    if (type === "inc") onIncrement?.(value, "freeze");
    if (type === "dec") onDecrement?.(value, "freeze");
    onValueChange?.(value, "freeze");
  };

  const startContinuousChange = async (type: "inc" | "dec") => {
    if (!isHolding.current) return;
    while (isHolding.current) {
      setValue((prev) => {
        let next = prev;
        if (type === "inc" && prev < max) next = Math.min(prev + steps, max);
        if (type === "dec" && prev > min) next = Math.max(prev - steps, min);

        // callback
        if (type === "inc" && next !== prev && activeIncrement)
          onIncrement?.(next, "active");
        if (type === "dec" && next !== prev && activeDecrement)
          onDecrement?.(next, "active");
        if (next !== prev)
          onValueChange?.(next, type === "inc" ? "inc" : "dec");

        setInputValue(next.toString()); // đồng bộ input
        return next;
      });

      await sleep(durations);
    }
  };

  const handleMouseDown = (type: "inc" | "dec") => {
    if (!activeHolding) return;
    isHolding.current = true;

    holdTimeout.current = setTimeout(() => {
      holdStarted.current = true;
      startContinuousChange(type);
    }, holdDelay);
  };

  const handleMouseUp = (type: "inc" | "dec") => {
    if (!holdStarted.current) {
      // nhấn nháy đơn
      if (type === "inc" && value < max) {
        const next = Math.min(value + steps, max);
        setValue(next);
        setInputValue(next.toString());
        activeIncrement && onIncrement?.(next, "active");
        onValueChange?.(next, "inc");
      }
      if (type === "dec" && value > min) {
        const next = Math.max(value - steps, min);
        setValue(next);
        setInputValue(next.toString());
        activeDecrement && onDecrement?.(next, "active");
        onValueChange?.(next, "dec");
      }
    }
    stopContinuousChange(type);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^\d*$/.test(val)) {
      setInputValue(val);
      const num = parseInt(val, 10);
      if (!isNaN(num)) {
        if (num >= min && num <= max) {
          setValue(num);
          if (num > value) onIncrement?.(num, "active");
          if (num < value) onDecrement?.(num, "active");
          if (num !== value) onValueChange?.(num, num > value ? "inc" : "dec");
        }
      }
    }
  };

  const handleBlur = () => {
    // đồng bộ lại input với value
    setInputValue(value.toString());
    onValueChange?.(value, "freeze");
  };

  return (
    <div
      {...containerProps}
      className={cn(
        "flex items-center border border-[#DDDDE3] h-7 rounded-[4px] overflow-hidden",
        containerClass
      )}
    >
      <button
        onMouseDown={() => handleMouseDown("dec")}
        onMouseUp={() => handleMouseUp("dec")}
        onMouseLeave={() => stopContinuousChange("dec")}
        className={cn(
          "h-full bg-white w-7 flex items-center justify-center",
          decreaseClass
        )}
        disabled={value <= min}
        {...decreaseProps}
      >
        {decreaseChildren || <Minus size={20} />}
      </button>
      <div className={cn(inputWrapperClass)} {...inputWrapperProps}>
        {beforeInputRender && beforeInputRender()}
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            "w-10 h-full text-center bg-white text-sm font-medium focus:outline-none border-l border-r border-[#DDDDE3]",
            inputClass
          )}
          {...inputProps}
        />
        {afterInputRender && afterInputRender()}
      </div>
      <button
        onMouseDown={() => handleMouseDown("inc")}
        onMouseUp={() => handleMouseUp("inc")}
        onMouseLeave={() => stopContinuousChange("inc")}
        className={cn(
          "h-full bg-white w-7 flex items-center justify-center",
          increaseClass
        )}
        disabled={value >= max}
        {...increaseProps}
      >
        {increaseChildren || <Plus size={20} />}
      </button>
    </div>
  );
};

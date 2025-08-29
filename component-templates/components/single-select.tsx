"use client";

import * as React from 'react';

import {
  CheckIcon,
  ChevronDown,
  Loader2,
  Plus,
  WandSparkles,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Separator } from '../ui/separator';

interface SingleSelectProps {
  options: {
    label: string;
    value: string;
    icon?: React.ComponentType<{ className?: string }>;
  }[];

  value?: string;
  onValueChange: (value?: string) => void;

  placeholder?: string;
  animation?: number;
  modalPopover?: boolean;
  className?: string;

  createNewWhenEmpty?: boolean;
  onCreateNewWhenEmpty?: (
    value: string,
  ) => Promise<{ label: string; value: string; icon?: React.ComponentType<{ className?: string }> } | void>;
  emptyLabel?: string;
  newLabel?: React.ReactNode;
  contentClassName?: string;
}

export const SingleSelect: React.FC<SingleSelectProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  animation = 0,
  modalPopover = false,
  className,
  createNewWhenEmpty = false,
  onCreateNewWhenEmpty,
  emptyLabel = "No options available",
  contentClassName,
  newLabel,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const [searchInput, setSearchInput] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [isAnimating, setIsAnimating] = React.useState(false);
  
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>();

  const selectedOption = options.find((opt) => opt.value === value);


React.useEffect(() => {
  const trigger = triggerRef.current;
  if (!trigger) return;

  const updateWidth = () => {
    setTriggerWidth(trigger.offsetWidth);
  };

  updateWidth(); // set lần đầu

  const resizeObserver = new ResizeObserver(updateWidth);
  resizeObserver.observe(trigger);

  return () => resizeObserver.disconnect();
}, []);



  const handleClear = () => {
    onValueChange(undefined);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      setIsPopoverOpen(true);
    }
  };

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const newItem = await onCreateNewWhenEmpty?.(searchInput);
      if (newItem) {
        onValueChange(newItem.value);
        setSearchInput("");
        setIsPopoverOpen(false);
      }
    } catch (err) {
      console.error("create error:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          onClick={() => setIsPopoverOpen(true)}
          className={cn(
            "border-border flex h-auto min-h-10 w-full items-center justify-between rounded-md border bg-inherit p-1 hover:bg-inherit [&_svg]:pointer-events-auto",
            className,
          )}
        >
          {selectedOption ? (
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center">
                {selectedOption.icon && <selectedOption.icon className="mr-2 h-4 w-4" />}
                <span className="text-foreground mx-3 text-sm">{selectedOption.label}</span>
              </div>
              <div className="flex items-center justify-between">
                {/* <XIcon
                  className="text-muted-foreground mx-2 h-4 cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleClear();
                  }}
                />
                <Separator orientation="vertical" className="flex h-full min-h-6" /> */}
                <ChevronDown className="text-muted-foreground mx-2 h-4 cursor-pointer" />
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full items-center justify-between">
              <span className="text-muted-foreground mx-3 text-sm">{placeholder}</span>
              <ChevronDown className="text-muted-foreground mx-2 h-4 cursor-pointer" />
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent style={{ width: triggerWidth || "auto" }} className={cn("border-red-500 w-full p-0", contentClassName)} align="start">
        <Command>
          <CommandInput
            placeholder="Search..."
            value={searchInput}
            onValueChange={setSearchInput}
            onKeyDown={handleInputKeyDown}
          />
          <CommandList className={(createNewWhenEmpty && searchInput.trim() !== "" && "p-1") || ""}>
            <CommandEmpty className={(createNewWhenEmpty && searchInput.trim() !== "" && "py-0") || ""}>
              {createNewWhenEmpty && searchInput.trim() !== "" && onCreateNewWhenEmpty ? (
                <div
                  className={cn(
                    "text-muted-foreground hover:bg-accent flex h-10 cursor-pointer items-center justify-center rounded-md px-4 text-sm",
                    isCreating && "pointer-events-none opacity-50",
                  )}
                  onClick={() => handleCreate()}
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      {newLabel ?? <Plus className="mr-2 h-4 w-4" />}
                      <span className="font-medium">"{searchInput}"</span>
                    </>
                  )}
                </div>
              ) : (
                <div className="py-2 text-center text-sm text-muted-foreground">{emptyLabel}</div>
              )}
            </CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onValueChange(option.value);
                      setIsPopoverOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <div
                      className={cn(
                        "border-border mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        isSelected ? "bg-primary text-foreground" : "opacity-50 [&_svg]:invisible",
                      )}
                    >
                      <CheckIcon className="h-4 w-4" />
                    </div>
                    {option.icon && <option.icon className="text-muted-foreground mr-2 h-4 w-4" />}
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <div className="flex items-center justify-between">
                {value && (
                  <>
                    <CommandItem onSelect={handleClear} className="flex-1 cursor-pointer justify-center">
                      Clear
                    </CommandItem>
                    <Separator orientation="vertical" className="flex h-full min-h-6" />
                  </>
                )}
                <CommandItem onSelect={() => setIsPopoverOpen(false)} className="flex-1 cursor-pointer justify-center">
                  Close
                </CommandItem>
              </div>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>

      {animation > 0 && value && (
        <WandSparkles
          className={cn("text-foreground bg-background my-2 h-3 w-3 cursor-pointer", isAnimating ? "" : "text-muted-foreground")}
          onClick={() => setIsAnimating(!isAnimating)}
        />
      )}
    </Popover>
  );
};

import * as React from 'react';

import {
  cva,
  type VariantProps,
} from 'class-variance-authority';
import {
  CheckIcon,
  ChevronDown,
  Loader2,
  Plus,
  WandSparkles,
  XIcon,
} from 'lucide-react';

import { cn } from '../lib/utils';
import { Badge } from '../ui/badge';
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

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva("m-1 transition ease-in-out delay-150 duration-300 shadow-none", {
  variants: {
    variant: {
      default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
      secondary: "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
      inverted: "inverted",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof multiSelectVariants> {
  /**
   * An array of option objects to be displayed in the multi-select component.
   * Each option object has a label, value, and an optional icon.
   */
  options: {
    /** The text to display for the option. */
    label: string;
    /** The unique value associated with the option. */
    value: string;
    /** Optional icon component to display alongside the option. */
    icon?: React.ComponentType<{ className?: string }>;
    /** Optional has close button */
    hasClose?: boolean;
    /** className for badge */
    classBadge?: string;
  }[];

  /**
   * Callback function triggered when the selected values change.
   * Receives an array of the new selected values.
   */
  onValueChange: (value: string[]) => void;

  /** The default selected values when the component mounts. */
  defaultValue?: string[];

  /**
   * Placeholder text to be displayed when no values are selected.
   * Optional, defaults to "Select options".
   */
  placeholder?: string;

  /**
   * Animation duration in seconds for the visual effects (e.g., bouncing badges).
   * Optional, defaults to 0 (no animation).
   */
  animation?: number;

  /**
   * Maximum number of items to display. Extra selected items will be summarized.
   * Optional, defaults to 3.
   */
  maxCount?: number;

  /**
   * The modality of the popover. When set to true, interaction with outside elements
   * will be disabled and only popover content will be visible to screen readers.
   * Optional, defaults to false.
   */
  modalPopover?: boolean;

  /**
   * If true, renders the multi-select component as a child of another component.
   * Optional, defaults to false.
   */
  asChild?: boolean;

  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  className?: string;
  /**
   * Additional class names to apply custom styles to the multi-select component.
   * Optional, can be used to add custom styles.
   */
  classNames?: {
    trigger?: string;
    content?: string;
    list?: string;
    item?: string;
    group?: string;
    badge?: string;
    separator?: string;
    input?: string;
    empty?: string;
  }
  /**
   * If true, allows the user to create a new option when the input field is empty.
   * Optional, defaults to false.
   */
  createNewWhenEmpty?: boolean;
  /**
   * Callback function triggered when the user creates a new option.
   * Receives the new option value.
   * Optional, only used when createNewWhenEmpty is true.
   */
  onCreateNewWhenEmpty?: (
    value: string,
  ) => Promise<{ label: string; value: string; icon?: React.ComponentType<{ className?: string }> } | void>;
  /**
   * The empty label to display when no options are available.
   * Optional, defaults to "No options available".
   */
  emptyLabel?: string;
  /**
   * The label to display when creating a new option.
   * Optional, defaults to "Create new option".
   * */
  newLabel?: React.ReactNode;
}

export const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      options,
      onValueChange,
      variant,
      defaultValue = [],
      placeholder = "Select options",
      emptyLabel = "No options available",
      animation = 0,
      maxCount = 3,
      modalPopover = false,
      asChild = false,
      createNewWhenEmpty = false,
      onCreateNewWhenEmpty,
      newLabel,
      className,
      classNames,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [searchInput, setSearchInput] = React.useState("");
    const [isCreating, setIsCreating] = React.useState(false);

    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const [triggerWidth, setTriggerWidth] = React.useState<number | undefined>();

    React.useImperativeHandle(ref, () => triggerRef.current!, [triggerRef]);


    React.useEffect(() => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const updateWidth = () => {
        setTriggerWidth(trigger.offsetWidth);
      };

      updateWidth(); // initial set

      const resizeObserver = new ResizeObserver(updateWidth);
      resizeObserver.observe(trigger);

      return () => resizeObserver.disconnect();
    }, []);

    const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (option: string) => {
      const newSelectedValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev);
    };

    const clearExtraOptions = () => {
      const newSelectedValues = selectedValues.slice(0, maxCount);
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const toggleAll = () => {
      if (selectedValues.length === options.length) {
        handleClear();
      } else {
        const allValues = options.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }
    };

    function handleInputValueChange(search: string): void {
      setSearchInput(search);
    }

    const handleClickCreateNewTagWhenEmpty = async () => {
      try {
        setIsCreating(true);
        const newTag = await onCreateNewWhenEmpty?.(searchInput);

        if (newTag) {
          const updatedValues = [...selectedValues, newTag.value];

          setSelectedValues(updatedValues);
          onValueChange(updatedValues);
          setSearchInput("");
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
            {...props}
            onClick={handleTogglePopover}
            className={cn(
              "border-border flex h-auto min-h-10 w-full items-center justify-between rounded-md border bg-inherit p-1 hover:bg-inherit [&_svg]:pointer-events-auto",
              className, classNames?.trigger,
            )}
          >
            {selectedValues.length > 0 ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex flex-wrap items-center">
                  {selectedValues.slice(0, maxCount).map((value) => {
                    const option = options.find((o) => o.value === value);
                    const IconComponent = option?.icon;
                    return (
                      <Badge
                        key={value}
                        className={cn(isAnimating ? "" : "", multiSelectVariants({ variant }), option?.classBadge, classNames?.badge)}
                        style={{ animationDuration: `${animation}s` }}
                      >
                        {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
                        {option?.label}
                        {option?.hasClose && (
                          <XIcon
                            className="ml-2 h-4 w-4 cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleOption(value);
                            }}
                          />
                        )}
                      </Badge>
                    );
                  })}
                  {selectedValues.length > maxCount && (
                    <Badge
                      className={cn(
                        "text-foreground border-foreground/1 bg-transparent hover:bg-transparent",
                        isAnimating ? "" : "",
                        multiSelectVariants({ variant }),
                      )}
                      style={{ animationDuration: `${animation}s` }}
                    >
                      {`+ ${selectedValues.length - maxCount} more`}
                      <XIcon
                        className="ml-2 h-4 w-4 cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation();
                          clearExtraOptions();
                        }}
                      />
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <XIcon
                    className="text-muted-foreground mx-2 h-4 cursor-pointer"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleClear();
                    }}
                  />
                  <Separator orientation="vertical" className="flex h-full min-h-6" />
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
        <PopoverContent style={{ width: triggerWidth || "auto" }} className={cn("border-border w-full p-0", classNames?.content)} align="start" onEscapeKeyDown={() => setIsPopoverOpen(false)}>
          <Command className="border-border">
            <CommandInput
              placeholder="Search..."
              className={classNames?.input}
              value={searchInput}
              onValueChange={handleInputValueChange}
              onKeyDown={handleInputKeyDown}
            />
            <CommandList className={cn((createNewWhenEmpty && searchInput.trim() !== "" && "p-1") || "", classNames?.list)}>
              <CommandEmpty className={cn((createNewWhenEmpty && searchInput.trim() !== "" && "py-0") || "", classNames?.empty)}>
                {createNewWhenEmpty && searchInput.trim() !== "" && onCreateNewWhenEmpty ? (
                  <div
                    className={cn(
                      "text-muted-foreground hover:bg-accent flex h-10 cursor-pointer items-center justify-center rounded-md px-4 text-sm",
                      isCreating && "pointer-events-none opacity-50",
                    )}
                    onClick={() => handleClickCreateNewTagWhenEmpty()}
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

              <CommandGroup className={classNames?.group}>
                <CommandItem key="all" onSelect={toggleAll} className={cn("cursor-pointer", classNames?.item)}>
                  <div
                    className={cn(
                      "border-primary mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                      selectedValues.length === options.length ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
                    )}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </div>
                  <span>(Select All)</span>
                </CommandItem>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  return (
                    <CommandItem key={option.value} onSelect={() => toggleOption(option.value)} className={cn("cursor-pointer", classNames?.item)}>
                      <div
                        className={cn(
                          "border-border mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible",
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
              <CommandSeparator className={classNames?.separator} />
              <CommandGroup className={classNames?.group}>
                <div className="flex items-center justify-between">
                  {selectedValues.length > 0 && (
                    <>
                      <CommandItem onSelect={handleClear} className={cn("flex-1 cursor-pointer justify-center", classNames?.item)}>
                        Clear
                      </CommandItem>
                      <Separator orientation="vertical" className={cn("flex h-full min-h-6", classNames?.separator)} />
                    </>
                  )}
                  <CommandItem onSelect={() => setIsPopoverOpen(false)} className={cn("max-w-full flex-1 cursor-pointer justify-center", classNames?.item)}>
                    Close
                  </CommandItem>
                </div>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
        {animation > 0 && selectedValues.length > 0 && (
          <WandSparkles
            className={cn("text-foreground bg-background my-2 h-3 w-3 cursor-pointer", isAnimating ? "" : "text-muted-foreground")}
            onClick={() => setIsAnimating(!isAnimating)}
          />
        )}
      </Popover>
    );
  },
);

MultiSelect.displayName = "MultiSelect";

"use client";

import * as React from 'react';

import {
  add,
  format,
} from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '../../lib/utils';
import { Button } from './button';
import { Calendar } from './calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './popover';
import { TimePicker } from './time-picker';

export function DateTimePicker({
  date: selectedDate,
  onSelectDate,
}: {
  date: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
}) {
  const [date, setDate] = React.useState<Date | undefined>(selectedDate || new Date());
 
  /**
   * carry over the current time when a user clicks a new day
   * instead of resetting to 00:00
   */
  const handleSelect = (newDay: Date | undefined) => {
    if (!newDay) return;
    if (!date) {
      setDate(newDay);
      return;
    }
    const diff = newDay.getTime() - date.getTime();
    const diffInDays = diff / (1000 * 60 * 60 * 24);
    const newDateFull = add(date, { days: Math.ceil(diffInDays) });
    setDate(newDateFull);
    onSelectDate(newDateFull);
  };
 
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full shadow-none justify-start text-left ",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP HH:mm:ss") : <span>MM/DD/YYYY HH:MM:SS</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 !z-[120] overflow-hidden">
        <Calendar
          mode="single"
          selected={date}
          className="min-w-[250px]"
          onSelect={(d) => handleSelect(d)}
          initialFocus
        />
        <div className="p-3 border-t border-border">
          <TimePicker setDate={setDate} date={date} />
        </div>
      </PopoverContent>
    </Popover>
  );
}
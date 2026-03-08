import React, { useState } from "react";
import dayjs from "dayjs";

interface DatePickerProps {
  label: string;
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
}

export default function DatePicker({
  label,
  startDate,
  endDate,
  onChange,
}: DatePickerProps) {
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);

  const today = dayjs().format("YYYY-MM-DD");

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStart(newStart);
    onChange(newStart, end);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = e.target.value;
    setEnd(newEnd);
    onChange(start, newEnd);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex gap-3">
        <input
          type="date"
          value={start}
          min={today}
          onChange={handleStartChange}
          className="w-1/2 p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
        />
        <input
          type="date"
          value={end}
          min={start || today}
          onChange={handleEndChange}
          className="w-1/2 p-3 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800"
        />
      </div>
    </div>
  );
}
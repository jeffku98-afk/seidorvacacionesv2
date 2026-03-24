// ============================================
// DatePicker Personalizado - Estilo SEIDOR
// ============================================

"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { formatDateShort, getCalendarData, toISODateString } from "@/lib/dates";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAY_NAMES = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

interface DatePickerProps {
  label: string;
  value: string;           // ISO: YYYY-MM-DD
  onChange: (date: string) => void;
  isRequired?: boolean;
  minDate?: string;
}

export function DatePicker({
  label,
  value,
  onChange,
  isRequired,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const today = new Date();
  const parsed = value ? new Date(value + "T12:00:00") : null;

  const [viewMonth, setViewMonth] = useState(
    parsed ? parsed.getMonth() : today.getMonth()
  );
  const [viewYear, setViewYear] = useState(
    parsed ? parsed.getFullYear() : today.getFullYear()
  );

  // Sync view when opening
  useEffect(() => {
    if (open && parsed) {
      setViewMonth(parsed.getMonth());
      setViewYear(parsed.getFullYear());
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { startDayOfWeek, totalDays } = getCalendarData(viewMonth, viewYear);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    const dateStr = toISODateString(viewYear, viewMonth, day);
    onChange(dateStr);
    setOpen(false);
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    return toISODateString(viewYear, viewMonth, day) === value;
  };

  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === viewMonth &&
    today.getFullYear() === viewYear;

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    return toISODateString(viewYear, viewMonth, day) < minDate;
  };

  return (
    <div className="flex flex-col gap-1.5 relative" ref={ref}>
      <label className="text-[13px] font-semibold text-seidor-800 tracking-wide">
        {label}
        {isRequired && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`input-field flex items-center gap-2 text-left cursor-pointer ${
          open ? "!border-seidor-400" : ""
        } ${!value ? "!text-muted" : ""}`}
      >
        <CalendarDays size={16} className="text-seidor-400 shrink-0" />
        <span className="flex-1">
          {value ? formatDateShort(value) : "dd/mm/aaaa"}
        </span>
        <ChevronRight
          size={14}
          className={`text-muted transition-transform duration-200 ${
            open ? "rotate-90" : ""
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 z-[999] mt-1.5 w-[290px] animate-scale-in overflow-hidden rounded-[14px] border-[1.5px] border-seidor-400 bg-white shadow-[0_12px_40px_rgba(26,34,64,0.15),0_0_0_1px_#E2E8F4]">
          {/* Month header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F4] bg-gradient-to-br from-seidor-50 to-white px-4 pb-2.5 pt-3.5">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#E2E8F4] bg-white transition-colors hover:bg-seidor-50"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-display text-[15px] font-bold text-seidor-800">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-[#E2E8F4] bg-white transition-colors hover:bg-seidor-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-2 pb-1">
            {DAY_NAMES.map((d, i) => (
              <div
                key={d}
                className={`text-center text-[11px] font-bold uppercase tracking-wide py-1 ${
                  i === 0 || i === 6 ? "text-seidor-300" : "text-muted"
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5 px-3 pb-3.5">
            {/* Empty cells */}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {/* Day cells */}
            {Array.from({ length: totalDays }).map((_, i) => {
              const day = i + 1;
              const selected = isSelected(day);
              const todayDay = isToday(day);
              const disabled = isDisabled(day);
              const dayOfWeek = (startDayOfWeek + i) % 7;
              const weekend = dayOfWeek === 0 || dayOfWeek === 6;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={disabled}
                  onClick={() => selectDay(day)}
                  className={`flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[13px] transition-all duration-150
                    ${selected
                      ? "bg-gradient-to-br from-seidor-500 to-seidor-400 font-bold text-white shadow-sm"
                      : todayDay
                        ? "font-bold text-seidor-400 ring-2 ring-seidor-200 ring-inset"
                        : disabled
                          ? "cursor-not-allowed text-muted/40"
                          : weekend
                            ? "font-medium text-muted hover:bg-seidor-50"
                            : "font-medium text-seidor-800 hover:bg-seidor-50"
                    }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Today shortcut */}
          <div className="flex justify-center border-t border-[#E2E8F4] py-2">
            <button
              type="button"
              onClick={() => {
                setViewMonth(today.getMonth());
                setViewYear(today.getFullYear());
                selectDay(today.getDate());
              }}
              className="rounded-md px-3 py-1 text-xs font-semibold text-seidor-400 transition-colors hover:bg-seidor-50"
            >
              Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

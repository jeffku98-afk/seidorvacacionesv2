// ============================================
// Calendario de Vacaciones del Equipo
// ============================================

"use client";

import { useState, useMemo } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAllRequests } from "@/hooks/use-requests";
import { PageHeader } from "@/components/ui/page-header";
import {
  getCalendarData,
  getMonthYearLabel,
  toISODateString,
  formatDateShort,
  isDateInRange,
} from "@/lib/dates";
import type { VacationRequest } from "@/types";

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const USER_COLORS = [
  "#4464E2",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#14B8A6",
  "#6366F1",
];

export default function CalendarioPage() {
  const { data: allRequests, isLoading } = useAllRequests();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const requests = (allRequests ?? []).filter((r) => r.status === "approved");

  // Assign stable colors per user
  const userColors = useMemo(() => {
    const map: Record<string, string> = {};
    let idx = 0;
    requests.forEach((r) => {
      if (!map[r.userId]) {
        map[r.userId] = USER_COLORS[idx % USER_COLORS.length];
        idx++;
      }
    });
    return map;
  }, [requests]);

  const { startDayOfWeek, totalDays } = getCalendarData(month, year);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  };

  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  };

  const getVacationsForDay = (day: number): VacationRequest[] => {
    const dateStr = toISODateString(year, month, day);
    return requests.filter((r) =>
      isDateInRange(dateStr, r.startDate, r.endDate)
    );
  };

  const isTodayDay = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === month &&
    today.getFullYear() === year;

  return (
    <div className="mx-auto max-w-[1000px] animate-fade-in">
      <PageHeader
        icon="📅"
        iconGradient="from-cyan-500 to-cyan-400"
        title="Calendario de Vacaciones"
        subtitle="Vista general de las vacaciones del equipo"
      />

      <div className="card-base overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between border-b border-[#E2E8F4] bg-[#F4F7FB]/50 px-6 py-5">
          <button
            onClick={prevMonth}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E2E8F4] bg-white transition-colors hover:bg-seidor-50"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="font-display text-xl font-bold capitalize text-seidor-800">
            {getMonthYearLabel(month, year)}
          </h2>
          <button
            onClick={nextMonth}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#E2E8F4] bg-white transition-colors hover:bg-seidor-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-[#E2E8F4]">
              {DAY_NAMES.map((d, i) => (
                <div
                  key={d}
                  className={`py-2.5 text-center text-xs font-semibold uppercase tracking-wider ${
                    i === 0 || i === 6 ? "text-muted" : "text-muted/80"
                  }`}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Empty cells for offset */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-[96px] border-b border-r border-[#E2E8F4] bg-[#F4F7FB]/30"
                />
              ))}

              {/* Day cells */}
              {Array.from({ length: totalDays }).map((_, i) => {
                const day = i + 1;
                const vacations = getVacationsForDay(day);
                const dayOfWeek = (startDayOfWeek + i) % 7;
                const weekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isToday = isTodayDay(day);

                return (
                  <div
                    key={day}
                    className={`min-h-[96px] border-b border-[#E2E8F4] p-1.5 transition-colors ${
                      dayOfWeek < 6 ? "border-r" : ""
                    } ${
                      isToday
                        ? "bg-seidor-50/40"
                        : weekend
                          ? "bg-[#F4F7FB]/30"
                          : ""
                    }`}
                  >
                    {/* Day number */}
                    <div
                      className={`mb-1 flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[13px] ${
                        isToday
                          ? "bg-seidor-400 font-bold text-white"
                          : weekend
                            ? "font-medium text-muted"
                            : "font-medium text-seidor-800"
                      }`}
                    >
                      {day}
                    </div>

                    {/* Vacation pills */}
                    {vacations.slice(0, 2).map((v) => (
                      <div
                        key={v.id}
                        title={`${v.userName} (${formatDateShort(v.startDate)} — ${formatDateShort(v.endDate)})`}
                        className="mb-0.5 truncate rounded px-1.5 py-[2px] text-[10px] font-semibold text-white"
                        style={{
                          backgroundColor:
                            userColors[v.userId] || "#4464E2",
                        }}
                      >
                        {v.userName}
                      </div>
                    ))}
                    {vacations.length > 2 && (
                      <div className="text-[10px] font-medium text-muted">
                        +{vacations.length - 2} más
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
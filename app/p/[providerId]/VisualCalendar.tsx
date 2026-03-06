"use client";

import { useState } from "react";

type VisualCalendarProps = {
  onSelect: (date: Date) => void;
  selectedDate?: Date;
};

export default function VisualCalendar({ onSelect, selectedDate }: VisualCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const totalDays = daysInMonth(year, month);
  const startOffset = firstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));

  const monthName = currentMonth.toLocaleString('default', { month: 'long' });

  return (
    <div style={calendarContainer}>
      <div style={header}>
        <button onClick={() => setCurrentMonth(new Date(year, month - 1))} style={navBtn}>‹</button>
        <div style={monthLabel}>{monthName} {year}</div>
        <button onClick={() => setCurrentMonth(new Date(year, month + 1))} style={navBtn}>›</button>
      </div>

      <div style={weekdaysGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
          <div key={d} style={weekdayLabel}>{d}</div>
        ))}
      </div>

      <div style={daysGrid}>
        {days.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          
          const isSelected = selectedDate?.toDateString() === date.toDateString();
          const isToday = new Date().toDateString() === date.toDateString();
          const isPast = date < new Date(new Date().setHours(0,0,0,0));

          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onSelect(date)}
              style={{
                ...dayBtn,
                ...(isToday ? todayStyle : {}),
                ...(isSelected ? selectedStyle : {}),
                ...(isPast ? pastStyle : {}),
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const calendarContainer: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(10px)",
  borderRadius: 20,
  padding: 16,
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 16,
};

const monthLabel: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 15,
  color: "#D4AF37",
};

const navBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  color: "#fff",
  width: 32,
  height: 32,
  cursor: "pointer",
};

const weekdaysGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  textAlign: "center",
  marginBottom: 8,
};

const weekdayLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  opacity: 0.4,
};

const daysGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 6,
};

const dayBtn: React.CSSProperties = {
  aspectRatio: "1",
  background: "transparent",
  border: "1px solid transparent",
  borderRadius: 10,
  color: "#fff",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s ease",
};

const todayStyle: React.CSSProperties = {
  color: "#D4AF37",
  background: "rgba(212, 175, 55, 0.1)",
};

const selectedStyle: React.CSSProperties = {
  background: "#D4AF37",
  color: "#000",
  fontWeight: 800,
  boxShadow: "0 0 12px rgba(212, 175, 55, 0.4)",
};

const pastStyle: React.CSSProperties = {
  opacity: 0.2,
  cursor: "not-allowed",
};

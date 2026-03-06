"use client";

import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";

type Booking = {
  id: string;
  startAt: string; // ISO
  status: string;
  isMobile: boolean;
  totalCents: number;
  service: { name: string; durationMin: number };
  customer: { fullName: string };
};

export default function CalendarTab({ bookings }: { bookings: Booking[] }) {
  const events = bookings.map((b) => {
    const start = new Date(b.startAt);
    const end = new Date(start.getTime() + b.service.durationMin * 60 * 1000);
    const title = `${b.customer.fullName} • ${b.service.name}`;

    const color =
      b.status === "PENDING"
        ? "#F59E0B"
        : b.status === "APPROVED"
          ? "#10B981"
          : "rgba(255,255,255,0.35)";

    return {
      id: b.id,
      title,
      start,
      end,
      backgroundColor: "rgba(212,175,55,0.10)",
      borderColor: color,
      textColor: "#fff",
      extendedProps: { booking: b },
    };
  });

  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 18 }}>Calendar</div>
          <div style={{ opacity: 0.65, fontSize: 13, marginTop: 4 }}>
            Week view with your bookings. (Drag/drop rescheduling coming next.)
          </div>
        </div>
      </div>

      <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          height="auto"
          nowIndicator
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth",
          }}
          events={events as any}
          eventClick={(info) => {
            const b = (info.event.extendedProps as any)?.booking as Booking | undefined;
            if (!b) return;
            const dollars = (b.totalCents / 100).toFixed(2);
            alert(`${b.customer.fullName}\n${b.service.name}\n${b.status}\n$${dollars}`);
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          expandRows
          dayHeaderFormat={{ weekday: "short" }}
        />
      </div>

      <style>{`
        /* FullCalendar theme tweak */
        .fc { color: white; }
        .fc .fc-toolbar-title { font-size: 16px; font-weight: 900; }
        .fc .fc-button { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); }
        .fc .fc-button-primary:not(:disabled).fc-button-active { background: rgba(212,175,55,0.18); border-color: rgba(212,175,55,0.35); }
        .fc .fc-timegrid-slot { border-color: rgba(255,255,255,0.06); }
        .fc .fc-col-header-cell { border-color: rgba(255,255,255,0.08); }
        .fc-theme-standard td, .fc-theme-standard th { border-color: rgba(255,255,255,0.08); }
        .fc .fc-scrollgrid { border-color: rgba(255,255,255,0.08); }
      `}</style>
    </section>
  );
}

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 18,
  padding: 18,
  backdropFilter: "blur(10px)",
};

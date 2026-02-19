import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { listTasks } from "../../api/tasks";
import type { Task } from "../../api/tasks";

export default function CalendarPage() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      const res = await listTasks();
      const tasks: Task[] = res.items || [];

      const formatted = tasks
        .filter((t) => t.due_date)
        .map((t) => ({
          id: t.id,
          title: t.title,
          start: t.due_date!,
        }));

      setEvents(formatted);
    } catch (err) {
      console.error(err);
    }
  }

  function handleEventDrop(info: any) {
    console.log("Moved task", info.event.id, "to", info.event.startStr);
    // we keep it simple for now — no backend update
  }

  return (
    <div className="content">
      <div className="calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek",
          }}
          events={events}
          editable={true}
          eventDrop={handleEventDrop}
          height="auto"
        />
      </div>
    </div>
  );
}

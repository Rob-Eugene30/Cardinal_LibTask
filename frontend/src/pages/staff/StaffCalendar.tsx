import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { listTasks } from "../../api/tasks";
import type { Task } from "../../api/tasks";

export default function StaffCalendar() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    loadMyTasks();
  }, []);

  async function loadMyTasks() {
    try {
      const res = await listTasks();
      const tasks: Task[] = res.items || [];

      const rawStaffId =
        localStorage.getItem("clt_staff_id") ||
        localStorage.getItem("staff_id") ||
        localStorage.getItem("user_id");

      const myTasks = tasks.filter((task: any) => {
        const assignedId =
          task.assigned_to ??
          task.staff_id ??
          task.assigned_staff_id ??
          task.assignee_id;

        return String(assignedId ?? "") === String(rawStaffId ?? "");
      });

      const formatted = myTasks
        .filter((t: any) => t.due_date || t.assigned_date)
        .map((t: any) => ({
          id: String(t.id),
          title: t.title,
          start: t.assigned_date || t.due_date,
        }));

      setEvents(formatted);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="canvas-calendar-wrapper">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        nowIndicator={true}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek",
        }}
        allDaySlot={true}
        expandRows={true}
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="01:00:00"
        height="auto"
        events={events}
      />
    </div>
  );
}
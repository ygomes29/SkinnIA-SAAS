import { CalendarView } from "@/components/agenda/calendar-view";
import { getAppointments, getClients, getProfessionals, getServices } from "@/lib/dashboard-data";

export default async function AgendaPage() {
  const [appointments, clients, professionals, services] = await Promise.all([
    getAppointments(),
    getClients(),
    getProfessionals(),
    getServices()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Agenda</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">
          Semana operacional com remarcação por drag-and-drop
        </h1>
      </div>

      <CalendarView
        clients={clients}
        initialAppointments={appointments}
        professionals={professionals}
        services={services}
      />
    </div>
  );
}

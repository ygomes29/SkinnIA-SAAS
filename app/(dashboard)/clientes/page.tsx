import { ClientTable } from "@/components/clientes/client-table";
import { getAppointments, getClients, getProfessionals } from "@/lib/dashboard-data";

export default async function ClientesPage() {
  const [clients, appointments, professionals] = await Promise.all([
    getClients(),
    getAppointments(),
    getProfessionals()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-[--sk-text-brand]">Clientes</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sk-text-primary)]">
          Base viva com histórico, LTV e campanhas de retorno
        </h1>
      </div>

      <ClientTable appointments={appointments} clients={clients} professionals={professionals} />
    </div>
  );
}

import { getProfessionals, getServices } from "@/lib/dashboard-data";
import { ProfessionalsManager } from "@/components/equipe/professionals-manager";
import { ServicesManager } from "@/components/equipe/services-manager";

export default async function EquipePage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-pink-200/70">Equipe</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Profissionais, comissões e cobertura</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ProfessionalsManager initial={professionals} />
        <ServicesManager initial={services} />
      </div>
    </div>
  );
}

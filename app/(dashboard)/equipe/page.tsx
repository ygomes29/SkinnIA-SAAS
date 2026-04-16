import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProfessionals, getServices } from "@/lib/dashboard-data";
import { formatCurrency } from "@/lib/utils/currency";

export default async function EquipePage() {
  const [professionals, services] = await Promise.all([getProfessionals(), getServices()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.24em] text-pink-200/70">Equipe</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Profissionais, comissões e cobertura</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profissionais ativos</CardTitle>
            <CardDescription>Distribuição atual da equipe por atendimento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {professionals.map((professional) => (
              <div
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                key={professional.id}
              >
                <div>
                  <p className="font-semibold text-white">{professional.name}</p>
                  <p className="text-sm text-slate-400">{professional.phone ?? "Sem telefone"}</p>
                </div>
                <span className="text-sm text-slate-300">
                  Comissão {professional.commission_pct ?? 0}%
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Catálogo de serviços</CardTitle>
            <CardDescription>Base para agenda, cobrança de sinal e políticas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.map((service) => (
              <div
                className="flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/40 p-4"
                key={service.id}
              >
                <div>
                  <p className="font-semibold text-white">{service.name}</p>
                  <p className="text-sm text-slate-400">{service.duration_minutes} min</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{formatCurrency(service.price)}</p>
                  <p className="text-xs text-slate-400">
                    {service.deposit_required ? "Com sinal" : "Confirmação direta"}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

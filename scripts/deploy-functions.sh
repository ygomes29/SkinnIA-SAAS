#!/usr/bin/env bash
# Deploy das Supabase Edge Functions para o projeto SkinnIA
# Pré-requisito: supabase CLI instalado e `supabase link` já executado
#
# Uso:
#   ./scripts/deploy-functions.sh

set -e

PROJECT_REF="hddvalqnequzdtdsajro"

echo "🔗 Verificando link com o projeto Supabase..."
if ! supabase projects list 2>/dev/null | grep -q "$PROJECT_REF"; then
  echo "  Executando supabase link --project-ref $PROJECT_REF ..."
  supabase link --project-ref "$PROJECT_REF"
fi

echo ""
echo "🚀 Deployando Edge Functions..."

FUNCTIONS=(
  "webhook-payment"
  "check-availability"
  "setup-organization"
)

for fn in "${FUNCTIONS[@]}"; do
  echo "  → $fn"
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF"
done

echo ""
echo "✅ Edge Functions deployadas:"
for fn in "${FUNCTIONS[@]}"; do
  echo "   https://$PROJECT_REF.supabase.co/functions/v1/$fn"
done

echo ""
echo "⚠️  Lembre-se de configurar os secrets das funções:"
echo "   supabase secrets set --project-ref $PROJECT_REF \\"
echo "     MERCADOPAGO_ACCESS_TOKEN=<valor> \\"
echo "     MERCADOPAGO_WEBHOOK_SECRET=<valor> \\"
echo "     N8N_BASE_URL=<valor>"

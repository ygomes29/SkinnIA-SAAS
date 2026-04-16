const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function formatCurrency(value: number | null | undefined) {
  return brlFormatter.format(value ?? 0);
}

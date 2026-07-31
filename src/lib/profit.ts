export type CostLine = {
  id: string;
  name: string;
  quantity: number;
  unit_cost: number;
};

export function lineTotal(line: Pick<CostLine, "quantity" | "unit_cost">) {
  return Number(line.quantity || 0) * Number(line.unit_cost || 0);
}

export function totalIngredientCost(lines: Pick<CostLine, "quantity" | "unit_cost">[]) {
  return lines.reduce((sum, l) => sum + lineTotal(l), 0);
}

export function costPerUnit(totalCost: number, batchYield: number) {
  return batchYield > 0 ? totalCost / batchYield : 0;
}

export function profitMargin(revenue: number, profit: number) {
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}

export function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

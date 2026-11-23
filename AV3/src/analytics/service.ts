import { prisma } from '../db';
import { estimateRemainingMonths } from './metrics';

export async function getEfficiency(organizationId: string) {
  const completedLots = await prisma.lot.findMany({
    where: { organizationId, completedAt: { not: null } },
    select: { receivedAt: true, completedAt: true, operatorName: true }
  });

  const durations = completedLots.map((lot) => ({
    hours: (lot.completedAt!.getTime() - lot.receivedAt.getTime()) / 3_600_000,
    operator: lot.operatorName ?? 'Nao informado'
  }));
  const averageHours = durations.length
    ? durations.reduce((sum, item) => sum + item.hours, 0) / durations.length
    : null;
  const byOperator = Object.entries(
    durations.reduce<Record<string, { total: number; count: number }>>((result, item) => {
      const current = result[item.operator] ?? { total: 0, count: 0 };
      current.total += item.hours;
      current.count += 1;
      result[item.operator] = current;
      return result;
    }, {})
  ).map(([operator, value]) => ({
    operator,
    completedLots: value.count,
    averageHours: value.total / value.count
  }));
  const byMonth = Object.entries(
    completedLots.reduce<Record<string, { total: number; count: number }>>((result, lot) => {
      const month = lot.receivedAt.toISOString().slice(0, 7);
      const current = result[month] ?? { total: 0, count: 0 };
      current.total += (lot.completedAt!.getTime() - lot.receivedAt.getTime()) / 3_600_000;
      current.count += 1;
      result[month] = current;
      return result;
    }, {})
  ).map(([month, value]) => ({
    month,
    completedLots: value.count,
    averageHours: value.total / value.count
  }));

  return {
    completedLots: completedLots.length,
    averageProcessingHours: averageHours,
    byOperator,
    byMonth
  };
}

export async function getProfitability(organizationId: string) {
  const equipment = await prisma.equipment.findMany({
    where: { lot: { organizationId } },
    select: {
      category: true,
      brand: true,
      model: true,
      physicalCondition: true,
      estimatedRecoveryValue: true
    }
  });

  const groups = equipment.reduce<
    Record<string, { category: string; condition: string; total: number; count: number }>
  >((result, item) => {
    const key = `${item.category}|${item.physicalCondition}`;
    const current = result[key] ?? {
      category: item.category,
      condition: item.physicalCondition,
      total: 0,
      count: 0
    };
    current.total += item.estimatedRecoveryValue;
    current.count += 1;
    result[key] = current;
    return result;
  }, {});
  const byTypeAndModel = Object.values(equipment.reduce<
    Record<string, {
      category: string;
      brand: string;
      model: string;
      condition: string;
      total: number;
      count: number;
    }>
  >((result, item) => {
    const key = `${item.category}|${item.brand}|${item.model}|${item.physicalCondition}`;
    const current = result[key] ?? {
      category: item.category,
      brand: item.brand,
      model: item.model,
      condition: item.physicalCondition,
      total: 0,
      count: 0
    };
    current.total += item.estimatedRecoveryValue;
    current.count += 1;
    result[key] = current;
    return result;
  }, {})).map((group) => ({
    category: group.category,
    brand: group.brand,
    model: group.model,
    physicalCondition: group.condition,
    equipmentCount: group.count,
    averageRecoveryValue: group.total / group.count
  }));

  return {
    equipmentCount: equipment.length,
    byCategoryAndCondition: Object.values(groups).map((group) => ({
      category: group.category,
      physicalCondition: group.condition,
      equipmentCount: group.count,
      averageRecoveryValue: group.total / group.count
    })),
    byTypeAndModel
  };
}

export async function getUsefulLife(organizationId: string) {
  const equipment = await prisma.equipment.findMany({
    where: { lot: { organizationId } },
    include: { conditionRecords: true }
  });

  const byCategory = new Map<string, { ages: number[]; scores: number[]; count: number }>();
  for (const item of equipment) {
    const current = byCategory.get(item.category) ?? { ages: [], scores: [], count: 0 };
    for (const record of item.conditionRecords) {
      current.ages.push(record.ageMonths);
      current.scores.push(record.conditionScore);
    }
    current.count += 1;
    byCategory.set(item.category, current);
  }

  return Array.from(byCategory.entries()).map(([category, data]) => ({
    category,
    equipmentCount: data.count,
    observations: data.ages.map((ageMonths, index) => ({
      ageMonths,
      conditionScore: data.scores[index]
    })),
    estimatedRemainingMonths: estimateRemainingMonths(
      data.ages.map((ageMonths, index) => ({
        ageMonths,
        conditionScore: data.scores[index]
      }))
    )
  }));
}

export async function generateReport(organizationId: string, type: string) {
  const [efficiency, profitability, usefulLife] = await Promise.all([
    type === 'efficiency' || type === 'all' ? getEfficiency(organizationId) : null,
    type === 'profitability' || type === 'all' ? getProfitability(organizationId) : null,
    type === 'useful-life' || type === 'all' ? getUsefulLife(organizationId) : null
  ]);
  return { generatedAt: new Date().toISOString(), efficiency, profitability, usefulLife };
}

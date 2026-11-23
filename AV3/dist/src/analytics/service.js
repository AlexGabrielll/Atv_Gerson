"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEfficiency = getEfficiency;
exports.getProfitability = getProfitability;
exports.getUsefulLife = getUsefulLife;
exports.generateReport = generateReport;
const db_1 = require("../db");
const metrics_1 = require("./metrics");
async function getEfficiency(organizationId) {
    const completedLots = await db_1.prisma.lot.findMany({
        where: { organizationId, completedAt: { not: null } },
        select: { receivedAt: true, completedAt: true, operatorName: true }
    });
    const durations = completedLots.map((lot) => ({
        hours: (lot.completedAt.getTime() - lot.receivedAt.getTime()) / 3_600_000,
        operator: lot.operatorName ?? 'Nao informado'
    }));
    const averageHours = durations.length
        ? durations.reduce((sum, item) => sum + item.hours, 0) / durations.length
        : null;
    const byOperator = Object.entries(durations.reduce((result, item) => {
        const current = result[item.operator] ?? { total: 0, count: 0 };
        current.total += item.hours;
        current.count += 1;
        result[item.operator] = current;
        return result;
    }, {})).map(([operator, value]) => ({
        operator,
        completedLots: value.count,
        averageHours: value.total / value.count
    }));
    const byMonth = Object.entries(completedLots.reduce((result, lot) => {
        const month = lot.receivedAt.toISOString().slice(0, 7);
        const current = result[month] ?? { total: 0, count: 0 };
        current.total += (lot.completedAt.getTime() - lot.receivedAt.getTime()) / 3_600_000;
        current.count += 1;
        result[month] = current;
        return result;
    }, {})).map(([month, value]) => ({
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
async function getProfitability(organizationId) {
    const equipment = await db_1.prisma.equipment.findMany({
        where: { lot: { organizationId } },
        select: {
            category: true,
            brand: true,
            model: true,
            physicalCondition: true,
            estimatedRecoveryValue: true
        }
    });
    const groups = equipment.reduce((result, item) => {
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
    const byTypeAndModel = Object.values(equipment.reduce((result, item) => {
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
async function getUsefulLife(organizationId) {
    const equipment = await db_1.prisma.equipment.findMany({
        where: { lot: { organizationId } },
        include: { conditionRecords: true }
    });
    const byCategory = new Map();
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
        estimatedRemainingMonths: (0, metrics_1.estimateRemainingMonths)(data.ages.map((ageMonths, index) => ({
            ageMonths,
            conditionScore: data.scores[index]
        })))
    }));
}
async function generateReport(organizationId, type) {
    const [efficiency, profitability, usefulLife] = await Promise.all([
        type === 'efficiency' || type === 'all' ? getEfficiency(organizationId) : null,
        type === 'profitability' || type === 'all' ? getProfitability(organizationId) : null,
        type === 'useful-life' || type === 'all' ? getUsefulLife(organizationId) : null
    ]);
    return { generatedAt: new Date().toISOString(), efficiency, profitability, usefulLife };
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.linearRegression = linearRegression;
exports.estimateRemainingMonths = estimateRemainingMonths;
function linearRegression(points) {
    if (points.length < 2)
        return null;
    const meanX = points.reduce((sum, point) => sum + point.ageMonths, 0) / points.length;
    const meanY = points.reduce((sum, point) => sum + point.conditionScore, 0) / points.length;
    const numerator = points.reduce((sum, point) => sum + (point.ageMonths - meanX) * (point.conditionScore - meanY), 0);
    const denominator = points.reduce((sum, point) => sum + (point.ageMonths - meanX) ** 2, 0);
    if (denominator === 0)
        return null;
    const slope = numerator / denominator;
    return { slope, intercept: meanY - slope * meanX };
}
function estimateRemainingMonths(points) {
    const regression = linearRegression(points);
    if (!regression || regression.slope >= 0)
        return null;
    const latestAge = Math.max(...points.map((point) => point.ageMonths));
    const latestCondition = regression.intercept + regression.slope * latestAge;
    const monthsToFailure = -latestCondition / regression.slope;
    return Math.max(0, Math.round(monthsToFailure));
}

import { describe, expect, it } from 'vitest';
import { estimateRemainingMonths, linearRegression } from '../src/analytics/metrics';

describe('regressao para vida util', () => {
  it('estima o tempo ate a condicao inservivel usando pontos historicos', () => {
    const points = [
      { ageMonths: 0, conditionScore: 5 },
      { ageMonths: 10, conditionScore: 4 },
      { ageMonths: 20, conditionScore: 3 }
    ];

    expect(linearRegression(points)).toEqual({ slope: -0.1, intercept: 5 });
    expect(estimateRemainingMonths(points)).toBe(30);
  });

  it('retorna null quando nao ha tendencia de deterioracao suficiente', () => {
    expect(estimateRemainingMonths([{ ageMonths: 12, conditionScore: 4 }])).toBeNull();
    expect(estimateRemainingMonths([
      { ageMonths: 0, conditionScore: 2 },
      { ageMonths: 10, conditionScore: 4 }
    ])).toBeNull();
  });
});

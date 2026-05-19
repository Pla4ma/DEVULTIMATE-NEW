import { describe, it, expect } from 'vitest';
import { calculateRevenueProjection, generatePricingTiers, type PricingTier } from './monetization';

describe('monetization', () => {
  const mockReport = {
    id: '1',
    tool: 'mvp',
    payload: {
      data: {
        targetMarket: 'B2B',
        pricingModel: 'subscription',
        features: ['feature1', 'feature2', 'feature3'],
      },
    },
  };

  describe('calculateRevenueProjection', () => {
    it('should return projection for valid report', () => {
      const result = calculateRevenueProjection(mockReport as any);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('year1');
      expect(result).toHaveProperty('year2');
      expect(result).toHaveProperty('year3');
    });

    it('should handle different target markets', () => {
      const b2cReport = { ...mockReport, payload: { data: { targetMarket: 'B2C' } } };
      const result = calculateRevenueProjection(b2cReport as any);
      expect(result).toBeDefined();
    });

    it('should handle enterprise market', () => {
      const enterpriseReport = { ...mockReport, payload: { data: { targetMarket: 'enterprise' } } };
      const result = calculateRevenueProjection(enterpriseReport as any);
      expect(result).toBeDefined();
    });

    it('should return increasing projections', () => {
      const result = calculateRevenueProjection(mockReport as any);
      expect(result.year2).toBeGreaterThan(result.year1);
      expect(result.year3).toBeGreaterThan(result.year2);
    });

    it('should handle null payload', () => {
      const result = calculateRevenueProjection({ id: '1', tool: 'mvp', payload: null } as any);
      expect(result).toBeDefined();
    });
  });

  describe('generatePricingTiers', () => {
    it('should return array of pricing tiers', () => {
      const result = generatePricingTiers(mockReport as any);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should have required properties for each tier', () => {
      const result = generatePricingTiers(mockReport as any);
      result.forEach((tier: PricingTier) => {
        expect(tier).toHaveProperty('name');
        expect(tier).toHaveProperty('price');
        expect(tier).toHaveProperty('features');
        expect(tier).toHaveProperty('target');
      });
    });

    it('should have increasing prices for higher tiers', () => {
      const result = generatePricingTiers(mockReport as any);
      for (let i = 1; i < result.length; i++) {
        expect(result[i].price).toBeGreaterThan(result[i - 1].price);
      }
    });

    it('should include features for each tier', () => {
      const result = generatePricingTiers(mockReport as any);
      result.forEach((tier: PricingTier) => {
        expect(Array.isArray(tier.features)).toBe(true);
        expect(tier.features.length).toBeGreaterThan(0);
      });
    });
  });
});
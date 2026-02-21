import { describe, it, expect } from 'vitest';
import { getDefaultDomains } from '../../src/domains/defaults';

describe('default domains', () => {
  const domains = getDefaultDomains();

  it('provides exactly 13 default domains', () => {
    expect(domains).toHaveLength(13);
  });

  it('each domain has a unique id', () => {
    const ids = domains.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('each domain has required fields', () => {
    domains.forEach((d) => {
      expect(d.id).toBeTruthy();
      expect(d.name).toBeTruthy();
      expect(d.icon).toBeTruthy();
      expect(d.description).toBeTruthy();
      expect(Array.isArray(d.defaultBulletPoints)).toBe(true);
      // Travel domain uses custom fields instead of bullet points
      if (d.id !== 'travel' && d.id !== 'kickoff') {
        expect(d.defaultBulletPoints.length).toBeGreaterThan(0);
      }
      expect(d.isDefault).toBe(true);
    });
  });

  it('includes Procurement', () => {
    const procurement = domains.find((d) => d.name === 'Procurement');
    expect(procurement).toBeDefined();
    expect(procurement!.icon).toBe('fa-cart-shopping');
    expect(procurement!.description).toContain('purchasing process');
  });

  it('includes Inventory Management', () => {
    const inv = domains.find((d) => d.name === 'Inventory Management');
    expect(inv).toBeDefined();
    expect(inv!.icon).toBe('fa-boxes-stacked');
  });

  it('includes Production', () => {
    const prod = domains.find((d) => d.name.startsWith('Production'));
    expect(prod).toBeDefined();
    expect(prod!.icon).toBe('fa-industry');
  });

  it('includes Cutting & Joint Production', () => {
    const cut = domains.find((d) => d.name === 'Cutting & Joint Production');
    expect(cut).toBeDefined();
    expect(cut!.icon).toBe('fa-scissors');
  });

  it('includes Financial Accounting', () => {
    const fin = domains.find((d) => d.name === 'Financial Accounting');
    expect(fin).toBeDefined();
    expect(fin!.icon).toBe('fa-calculator');
  });

  it('includes Sales', () => {
    const sales = domains.find((d) => d.name === 'Sales');
    expect(sales).toBeDefined();
    expect(sales!.icon).toBe('fa-chart-line');
  });

  it('returns a fresh copy each time (not shared reference)', () => {
    const a = getDefaultDomains();
    const b = getDefaultDomains();
    expect(a).not.toBe(b);
    a[0].name = 'Modified';
    expect(b[0].name).not.toBe('Modified');
  });
});

import { describe, it, expect } from 'vitest'
import {
  convertFromHectares,
  convertToHectares,
  formatArea,
  getUnitLabel,
  getUnitNamePlural,
  ACRES_PER_HECTARE,
} from './areaUnits'

describe('convertFromHectares', () => {
  it('returns same value for hectares', () => {
    expect(convertFromHectares(10, 'hectares')).toBe(10)
    expect(convertFromHectares(0, 'hectares')).toBe(0)
    expect(convertFromHectares(100.5, 'hectares')).toBe(100.5)
  })

  it('converts to acres correctly', () => {
    expect(convertFromHectares(1, 'acres')).toBeCloseTo(ACRES_PER_HECTARE, 5)
    expect(convertFromHectares(10, 'acres')).toBeCloseTo(24.7105, 4)
    expect(convertFromHectares(0, 'acres')).toBe(0)
  })

  it('handles decimal hectares', () => {
    expect(convertFromHectares(2.5, 'acres')).toBeCloseTo(6.177625, 4)
  })
})

describe('convertToHectares', () => {
  it('returns same value for hectares', () => {
    expect(convertToHectares(10, 'hectares')).toBe(10)
    expect(convertToHectares(0, 'hectares')).toBe(0)
    expect(convertToHectares(100.5, 'hectares')).toBe(100.5)
  })

  it('converts from acres correctly', () => {
    expect(convertToHectares(ACRES_PER_HECTARE, 'acres')).toBeCloseTo(1, 5)
    expect(convertToHectares(24.7105, 'acres')).toBeCloseTo(10, 3)
    expect(convertToHectares(0, 'acres')).toBe(0)
  })

  it('round-trips correctly', () => {
    const original = 15.5
    const inAcres = convertFromHectares(original, 'acres')
    const backToHectares = convertToHectares(inAcres, 'acres')
    expect(backToHectares).toBeCloseTo(original, 10)
  })
})

describe('formatArea', () => {
  it('formats hectares with default decimals', () => {
    expect(formatArea(10, 'hectares')).toBe('10.0 ha')
    expect(formatArea(25.5, 'hectares')).toBe('25.5 ha')
    expect(formatArea(0, 'hectares')).toBe('0.0 ha')
  })

  it('formats acres with default decimals', () => {
    expect(formatArea(10, 'acres')).toBe('24.7 ac')
    expect(formatArea(1, 'acres')).toBe('2.5 ac')
  })

  it('respects custom decimal places', () => {
    expect(formatArea(10.123, 'hectares', 2)).toBe('10.12 ha')
    expect(formatArea(10.123, 'hectares', 0)).toBe('10 ha')
    expect(formatArea(10, 'acres', 3)).toBe('24.710 ac')
  })
})

describe('getUnitLabel', () => {
  it('returns ha for hectares', () => {
    expect(getUnitLabel('hectares')).toBe('ha')
  })

  it('returns ac for acres', () => {
    expect(getUnitLabel('acres')).toBe('ac')
  })
})

describe('getUnitNamePlural', () => {
  it('returns hectares for hectares', () => {
    expect(getUnitNamePlural('hectares')).toBe('hectares')
  })

  it('returns acres for acres', () => {
    expect(getUnitNamePlural('acres')).toBe('acres')
  })
})

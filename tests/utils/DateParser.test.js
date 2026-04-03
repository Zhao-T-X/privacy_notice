const DateParser = require('../../src/utils/DateParser');

describe('DateParser', () => {
  let parser;

  beforeEach(() => {
    parser = new DateParser();
  });

  test('should parse ISO date format', () => {
    const result = parser.parse('Last updated: 2024-03-15');
    expect(result).toBe('2024-03-15');
  });

  test('should parse English date format', () => {
    const result = parser.parse('Effective Date: March 26, 2025');
    expect(result).toBe('2025-03-26');
  });

  test('should parse Chinese date format', () => {
    const result = parser.parse('更新日期：2024年03月15日');
    expect(result).toBe('2024-03-15');
  });

  test('should return null for invalid date', () => {
    const result = parser.parse('No date here');
    expect(result).toBeNull();
  });
});

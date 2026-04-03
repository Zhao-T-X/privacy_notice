const TextCleaner = require('../../src/utils/TextCleaner');

describe('TextCleaner', () => {
  test('should clean extra spaces', () => {
    const input = 'Hello    World';
    expect(TextCleaner.clean(input)).toBe('Hello World');
  });

  test('should clean HTML tags', () => {
    const input = '<p>Hello World</p>';
    expect(TextCleaner.cleanHtml(input)).toBe('Hello World');
  });

  test('should handle empty input', () => {
    expect(TextCleaner.clean('')).toBe('');
    expect(TextCleaner.clean(null)).toBe('');
  });
});

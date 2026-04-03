const CheerioParser = require('../../src/parsers/CheerioParser');

describe('CheerioParser', () => {
  let parser;

  beforeEach(() => {
    parser = new CheerioParser({
      name: 'test',
      siteName: 'TEST'
    });
  });

  test('should parse HTML and extract content', () => {
    const html = `
      <html lang="en">
        <body>
          <main>
            <h1>Privacy Policy</h1>
            <p>Last updated: 2024-03-15</p>
            <p>This is the privacy policy content.</p>
          </main>
        </body>
      </html>
    `;

    const site = { url: 'https://test.com', name: 'test' };
    const result = parser.parse(html, site);

    expect(result.site).toBe('TEST');
    expect(result.last_updated).toBe('2024-03-15');
    expect(result.file_info.language).toBe('en');
    expect(result.content).toContain('Privacy Policy');
    expect(result.content).toContain('privacy policy content');
  });

  test('should extract language from html tag', () => {
    const html = '<html lang="zh-CN"><body>Content</body></html>';
    const site = { url: 'https://test.com', name: 'test' };
    const result = parser.parse(html, site);

    expect(result.file_info.language).toBe('zh-CN');
  });

  test('should handle missing language attribute', () => {
    const html = '<html><body>Content</body></html>';
    const site = { url: 'https://test.com', name: 'test' };
    const result = parser.parse(html, site);

    expect(result.file_info.language).toBe('unknown');
  });

  test('should use custom selectors', () => {
    const html = `
      <html>
        <body>
          <div class="custom-content">Custom content here</div>
          <main>Main content</main>
        </body>
      </html>
    `;

    const site = { 
      url: 'https://test.com', 
      name: 'test',
      selectors: ['.custom-content']
    };
    const result = parser.parse(html, site);

    expect(result.content).toContain('Custom content here');
  });

  test('should fallback to body when selectors not found', () => {
    const html = `
      <html>
        <body>
          <div>Fallback content</div>
        </body>
      </html>
    `;

    const site = { 
      url: 'https://test.com', 
      name: 'test',
      selectors: ['.non-existent']
    };
    const result = parser.parse(html, site);

    expect(result.content).toContain('Fallback content');
  });

  test('should generate content hash', () => {
    const html = '<html><body>Test content</body></html>';
    const site = { url: 'https://test.com', name: 'test' };
    const result = parser.parse(html, site);

    expect(result.metadata.content_hash).toBeDefined();
    expect(result.metadata.content_hash.length).toBe(32); // MD5 hash length
  });
});

import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildSandboxDocument,
  clampIframeHeight,
  sanitizeHtmlDocument,
  SandboxedHtmlRenderer
} from './SandboxedHtmlRenderer';
import { normalizeLucideIconName, resolveLucideIcons } from './LucideIconRenderer';

jest.mock('@lucide/icons', () => ({
  icons: {
    Search: { name: 'search', node: [['path', { d: 'M3 3h18v18H3z' }]] },
    CalendarDays: { name: 'calendar-days', node: [['rect', { width: '18', height: '18', x: '3', y: '4' }]] }
  }
}));

describe('SandboxedHtmlRenderer', () => {
  it('adds a restrictive inline CSP to a complete document', () => {
    const documentText = buildSandboxDocument('<!doctype html><html><head></head><body>sample</body></html>');

    expect(documentText).toContain("default-src 'none'");
    expect(documentText).toContain("script-src 'none'");
    expect(documentText).toContain("style-src 'unsafe-inline'");
    expect(documentText).toContain("connect-src 'none'");
    expect(documentText).toContain('img-src https:');
    expect(documentText).toContain('html, body { margin: 0; padding: 0; }');
  });

  it('removes scripts and other active HTML content', () => {
    const unsafeHref = ['java', 'script:alert(1)'].join('');
    const documentText = sanitizeHtmlDocument(`<html><body>
      <style>.ok { color: red; }</style>
      <script>document.body.dataset.ran = "yes";</script>
      <button onclick="alert(1)">bad</button>
      <a href="${unsafeHref}">bad link</a>
      <a href="data:text/html,bad">bad data link</a>
      <iframe src="https://example.com"></iframe>
      <object data="https://example.com"></object>
    </body></html>`);

    expect(documentText).toContain('<style>');
    expect(documentText).not.toContain('<script');
    expect(documentText).not.toContain('onclick');
    expect(documentText).not.toContain(['java', 'script:'].join(''));
    expect(documentText).not.toContain('data:text/html');
    expect(documentText).not.toContain('<iframe');
    expect(documentText).not.toContain('<object');
  });

  it('renders a fully sandboxed iframe without script permissions', () => {
    const markup = renderToStaticMarkup(
      <SandboxedHtmlRenderer htmlDocument="<html><head></head><body><style>body { color: red; }</style></body></html>" height={300} />
    );

    expect(markup).toContain('sandbox="allow-popups allow-popups-to-escape-sandbox"');
    expect(markup).toContain('srcDoc=');
    expect(markup).not.toContain('allow-scripts');
    expect(markup).not.toContain('allow-same-origin');
    expect(markup).not.toContain('allow-top-navigation');
    expect(markup).not.toContain('allow-top-navigation-by-user-activation');
    expect(markup).toContain('height:300px');
  });

  it('preserves HTTP(S) blank links and enforces safe opener metadata', () => {
    const documentText = sanitizeHtmlDocument(
      '<a href="https://example.com" target="_blank" rel="external">Open</a>'
    );

    expect(documentText).toContain('href="https://example.com"');
    expect(documentText).toContain('target="_blank"');
    expect(documentText).toContain('rel="external noopener noreferrer"');
  });

  it('keeps HTTPS images and their presentation attributes', () => {
    const documentText = sanitizeHtmlDocument(
      '<img src="https://example.com/photo.png" srcset="https://example.com/photo.png 1x" alt="Photo" width="320" height="120" loading="lazy" style="object-fit: cover">'
    );

    expect(documentText).toContain('src="https://example.com/photo.png"');
    expect(documentText).toContain('srcset="https://example.com/photo.png 1x"');
    expect(documentText).toContain('alt="Photo"');
    expect(documentText).toContain('loading="lazy"');
    expect(documentText).toContain('object-fit: cover');
  });

  it('normalizes and resolves a Lucide icon to safe static SVG', async () => {
    expect(normalizeLucideIconName(' Calendar_Days ')).toBe('calendar-days');
    const resolution = await resolveLucideIcons('<icon name="search" size="24" color="#2563eb"></icon>');

    expect(resolution.document).toContain('<svg');
    expect(resolution.document).toContain('data-lucide="search"');
    expect(resolution.document).toContain('stroke="#2563eb"');
    expect(resolution.document).not.toContain('<icon');
    expect(resolution.warnings).toHaveLength(0);
  });

  it('removes unknown icons and reports a warning', async () => {
    const resolution = await resolveLucideIcons('<icon name="not-a-real-icon"></icon>');

    expect(resolution.document).not.toContain('<icon');
    expect(resolution.warnings[0]).toContain('Unknown Lucide icon');
  });

  it('removes non-HTTPS images and unsafe SVG content', () => {
    const documentText = sanitizeHtmlDocument(`<html><body>
      <img src="http://example.com/http.png" alt="HTTP">
      <img src="data:image/png;base64,abc" alt="Data">
      <svg onclick="bad()"><foreignObject><div>bad</div></foreignObject><script>bad()</script><use href="https://example.com/icon.svg#x"></use><path href="#safe" d="M0 0"></path></svg>
    </body></html>`);

    expect(documentText).not.toContain('http://example.com/http.png');
    expect(documentText).not.toContain('data:image/png');
    expect(documentText).not.toContain('foreignObject');
    expect(documentText).not.toContain('<script');
    expect(documentText).not.toContain('https://example.com/icon.svg');
    expect(documentText).not.toContain('onclick');
    expect(documentText).toContain('href="#safe"');
  });

  it('keeps the preview height within safe limits', () => {
    expect(clampIframeHeight(undefined)).toBe(400);
    expect(clampIframeHeight(50)).toBe(200);
    expect(clampIframeHeight(5000)).toBe(1200);
  });
});

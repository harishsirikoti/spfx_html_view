import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildSandboxDocument,
  clampIframeHeight,
  sanitizeHtmlDocument,
  SandboxedHtmlRenderer
} from './SandboxedHtmlRenderer';

describe('SandboxedHtmlRenderer', () => {
  it('adds a restrictive inline CSP to a complete document', () => {
    const documentText = buildSandboxDocument('<!doctype html><html><head></head><body>sample</body></html>');

    expect(documentText).toContain("default-src 'none'");
    expect(documentText).toContain("script-src 'none'");
    expect(documentText).toContain("style-src 'unsafe-inline'");
    expect(documentText).toContain("connect-src 'none'");
    expect(documentText).toContain("img-src 'none'");
  });

  it('removes scripts and other active HTML content', () => {
    const documentText = sanitizeHtmlDocument(`<html><body>
      <style>.ok { color: red; }</style>
      <script>document.body.dataset.ran = "yes";</script>
      <button onclick="alert(1)">bad</button>
      <a href={['java', 'script:alert(1)'].join('')}>bad link</a>
      <iframe src="https://example.com"></iframe>
      <object data="https://example.com"></object>
    </body></html>`);

    expect(documentText).toContain('<style>');
    expect(documentText).not.toContain('<script');
    expect(documentText).not.toContain('onclick');
    expect(documentText).not.toContain(['java', 'script:'].join(''));
    expect(documentText).not.toContain('<iframe');
    expect(documentText).not.toContain('<object');
  });

  it('renders a fully sandboxed iframe without script permissions', () => {
    const markup = renderToStaticMarkup(
      <SandboxedHtmlRenderer htmlDocument="<html><head></head><body><style>body { color: red; }</style></body></html>" height={300} />
    );

    expect(markup).toContain('sandbox=""');
    expect(markup).toContain('srcDoc=');
    expect(markup).not.toContain('allow-scripts');
    expect(markup).not.toContain('allow-same-origin');
    expect(markup).not.toContain('allow-top-navigation');
    expect(markup).not.toContain('allow-popups');
    expect(markup).toContain('height:300px');
  });

  it('keeps the preview height within safe limits', () => {
    expect(clampIframeHeight(undefined)).toBe(400);
    expect(clampIframeHeight(50)).toBe(200);
    expect(clampIframeHeight(5000)).toBe(1200);
  });
});

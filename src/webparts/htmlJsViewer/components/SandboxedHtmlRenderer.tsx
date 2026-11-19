import * as React from 'react';
import styles from './HtmlJsViewer.module.scss';

export const DEFAULT_IFRAME_HEIGHT = 400;
export const MIN_IFRAME_HEIGHT = 200;
export const MAX_IFRAME_HEIGHT = 1200;

const CONTENT_SECURITY_POLICY = [
  "default-src 'none'", "base-uri 'none'", "connect-src 'none'", "child-src 'none'",
  "font-src 'none'", "frame-src 'none'", "form-action 'none'", "img-src 'none'",
  "manifest-src 'none'", "media-src 'none'", "object-src 'none'", "script-src 'none'",
  "script-src-elem 'none'", "script-src-attr 'none'", "style-src 'unsafe-inline'", "worker-src 'none'"
].join('; ');

const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`;

export interface ISandboxedHtmlRendererProps {
  htmlDocument: string;
  height?: number;
}

export function clampIframeHeight(height: number | undefined): number {
  const value = Number.isFinite(height) ? Number(height) : DEFAULT_IFRAME_HEIGHT;
  return Math.min(MAX_IFRAME_HEIGHT, Math.max(MIN_IFRAME_HEIGHT, value));
}

export function sanitizeHtmlDocument(htmlDocument: string): string {
  const parsedDocument = new DOMParser().parseFromString(htmlDocument, 'text/html');
  const blockedElements = 'script, iframe, frame, frameset, object, embed, applet, portal, link, base, form';

  parsedDocument.querySelectorAll(blockedElements).forEach(element => element.remove());
  parsedDocument.querySelectorAll('meta[http-equiv]').forEach(element => element.remove());

  parsedDocument.querySelectorAll('*').forEach(element => {
    Array.from(element.attributes).forEach(attribute => {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim().toLowerCase();
      const blockedScriptUrl = ['java', 'script:'].join('');
      if (attributeName.startsWith('on') ||
        (['href', 'src', 'action', 'formaction', 'poster', 'cite', 'xlink:href'].indexOf(attributeName) !== -1 &&
          attributeValue.startsWith(blockedScriptUrl))) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return `<!doctype html>${parsedDocument.documentElement.outerHTML}`;
}

export function buildSandboxDocument(htmlDocument: string): string {
  const documentText = sanitizeHtmlDocument(htmlDocument).trim();
  const headMatch = documentText.match(/<head\b[^>]*>/i);

  if (headMatch && headMatch.index !== undefined) {
    const insertionPoint = headMatch.index + headMatch[0].length;
    return `${documentText.slice(0, insertionPoint)}${CSP_META_TAG}${documentText.slice(insertionPoint)}`;
  }

  const htmlMatch = documentText.match(/<html\b[^>]*>/i);
  if (htmlMatch && htmlMatch.index !== undefined) {
    const insertionPoint = htmlMatch.index + htmlMatch[0].length;
    return `${documentText.slice(0, insertionPoint)}<head>${CSP_META_TAG}</head>${documentText.slice(insertionPoint)}`;
  }

  return `<!doctype html><html><head>${CSP_META_TAG}</head><body>${documentText}</body></html>`;
}

export const SandboxedHtmlRenderer: React.FunctionComponent<ISandboxedHtmlRendererProps> = ({
  htmlDocument,
  height
}) => (
  <iframe
    className={styles.previewFrame}
    title="HTML preview"
    sandbox=""
    srcDoc={buildSandboxDocument(htmlDocument)}
    style={{ height: `${clampIframeHeight(height)}px` }}
  />
);

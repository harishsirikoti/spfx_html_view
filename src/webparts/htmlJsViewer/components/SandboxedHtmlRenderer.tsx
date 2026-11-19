import * as React from 'react';
import styles from './HtmlJsViewer.module.scss';
import { resolveLucideIcons } from './LucideIconRenderer';

export const DEFAULT_IFRAME_HEIGHT = 400;
export const MIN_IFRAME_HEIGHT = 200;
export const MAX_IFRAME_HEIGHT = 1200;

const CONTENT_SECURITY_POLICY = [
  "default-src 'none'", "base-uri 'none'", "connect-src 'none'", "child-src 'none'",
  "font-src 'none'", "frame-src 'none'", "form-action 'none'", "img-src https:",
  "manifest-src 'none'", "media-src 'none'", "object-src 'none'", "script-src 'none'",
  "script-src-elem 'none'", "script-src-attr 'none'", "style-src 'unsafe-inline'", "worker-src 'none'"
].join('; ');

const CSP_META_TAG = `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}">`;
const CANVAS_RESET_STYLE = '<style>html, body { margin: 0; padding: 0; }</style>';

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
  const blockedElements = 'script, icon, iframe, frame, frameset, object, embed, applet, portal, link, base, form, foreignObject, svg image, svg use, svg animate, svg animateMotion, svg animateTransform, svg set, svg a';

  parsedDocument.querySelectorAll(blockedElements).forEach(element => element.remove());
  parsedDocument.querySelectorAll('meta[http-equiv]').forEach(element => element.remove());

  parsedDocument.querySelectorAll('img').forEach(element => {
    const source = element.getAttribute('src')?.trim() || '';
    if (!/^https:\/\//i.test(source)) {
      element.remove();
      return;
    }

    const sourceSet = element.getAttribute('srcset');
    if (sourceSet) {
      const safeCandidates = sourceSet.split(',').map(candidate => candidate.trim()).filter(candidate => {
        const candidateUrl = candidate.split(/\s+/)[0];
        return /^https:\/\//i.test(candidateUrl);
      });
      if (safeCandidates.length) {
        element.setAttribute('srcset', safeCandidates.join(', '));
      } else {
        element.removeAttribute('srcset');
      }
    }
  });

  parsedDocument.querySelectorAll('*').forEach(element => {
    const isAnchor = element.tagName.toLowerCase() === 'a';
    const isSvgElement = element.closest('svg') !== null;
    const target = element.getAttribute('target');
    if (isAnchor && target && target.toLowerCase() === '_blank') {
      const relTokens = new Set((element.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
      relTokens.add('noopener');
      relTokens.add('noreferrer');
      element.setAttribute('rel', Array.from(relTokens).join(' '));
    }

    Array.from(element.attributes).forEach(attribute => {
      const attributeName = attribute.name.toLowerCase();
      const attributeValue = attribute.value.trim().toLowerCase();
      const blockedScriptUrl = ['java', 'script:'].join('');
      const hasExplicitScheme = /^[a-z][a-z0-9+.-]*:/i.test(attributeValue);
      const unsafeHyperlink = isAnchor && attributeName === 'href' && hasExplicitScheme &&
        !attributeValue.startsWith('http:') && !attributeValue.startsWith('https:');
      const unsafeSvgReference = isSvgElement &&
        (attributeName === 'href' || attributeName === 'xlink:href') &&
        !attributeValue.startsWith('#');
      if (attributeName.startsWith('on') ||
        unsafeHyperlink ||
        unsafeSvgReference ||
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
    return `${documentText.slice(0, insertionPoint)}${CSP_META_TAG}${CANVAS_RESET_STYLE}${documentText.slice(insertionPoint)}`;
  }

  const htmlMatch = documentText.match(/<html\b[^>]*>/i);
  if (htmlMatch && htmlMatch.index !== undefined) {
    const insertionPoint = htmlMatch.index + htmlMatch[0].length;
    return `${documentText.slice(0, insertionPoint)}<head>${CSP_META_TAG}${CANVAS_RESET_STYLE}</head>${documentText.slice(insertionPoint)}`;
  }

  return `<!doctype html><html><head>${CSP_META_TAG}${CANVAS_RESET_STYLE}</head><body>${documentText}</body></html>`;
}

export const SandboxedHtmlRenderer: React.FunctionComponent<ISandboxedHtmlRendererProps> = ({
  htmlDocument,
  height
}) => {
  const [sourceDocument, setSourceDocument] = React.useState<string>(() => buildSandboxDocument(htmlDocument));

  React.useEffect(() => {
    let disposed = false;
    setSourceDocument(buildSandboxDocument(htmlDocument));
    resolveLucideIcons(htmlDocument).then(resolution => {
      if (!disposed) {
        setSourceDocument(buildSandboxDocument(resolution.document));
      }
    }).catch(() => undefined);
    return () => {
      disposed = true;
    };
  }, [htmlDocument]);

  return (
    <iframe
      className={styles.previewFrame}
      title="HTML preview"
      sandbox="allow-popups allow-popups-to-escape-sandbox"
      srcDoc={sourceDocument}
      style={{ height: `${clampIframeHeight(height)}px` }}
    />
  );
};

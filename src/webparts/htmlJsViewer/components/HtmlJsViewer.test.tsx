import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import HtmlJsViewer from './HtmlJsViewer';

describe('HtmlJsViewer canvas', () => {
  it('renders only the sandboxed HTML/CSS canvas without web-part chrome', () => {
    const markup = renderToStaticMarkup(
      <HtmlJsViewer htmlDocument="<html><body><h1>Canvas</h1></body></html>" iframeHeight={400} />
    );

    expect(markup).toContain('<iframe');
    expect(markup).not.toContain('HTML and CSS Viewer');
    expect(markup).not.toContain('Preview runs');
    expect(markup).not.toContain('<section');
  });
});

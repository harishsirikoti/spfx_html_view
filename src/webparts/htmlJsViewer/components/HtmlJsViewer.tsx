import * as React from 'react';
import styles from './HtmlJsViewer.module.scss';
import type { IHtmlJsViewerProps } from './IHtmlJsViewerProps';
import { SandboxedHtmlRenderer } from './SandboxedHtmlRenderer';

export const DEFAULT_HTML_DOCUMENT = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>HTML and CSS preview</title>
  <style>
    body { font-family: sans-serif; margin: 24px; color: #1f2937; background: #f3f4f6; }
    .card { max-width: 420px; padding: 20px; border-radius: 8px; background: white; box-shadow: 0 2px 8px #0002; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; color: #075985; background: #e0f2fe; }
  </style>
</head>
<body>
  <article class="card">
    <span class="badge">HTML + CSS</span>
    <h2>Isolated preview</h2>
    <p>This sample contains markup and styles only.</p>
  </article>
</body>
</html>`;

export default class HtmlJsViewer extends React.Component<IHtmlJsViewerProps> {
  public render(): React.ReactElement<IHtmlJsViewerProps> {
    return (
      <section className={styles.htmlJsViewer}>
        <h2 className={styles.heading}>HTML and CSS Viewer</h2>
        <p className={styles.securityNote}>
          Preview runs in an isolated iframe. Scripts and external resources are blocked.
        </p>
        <SandboxedHtmlRenderer
          htmlDocument={this.props.htmlDocument}
          height={this.props.iframeHeight}
        />
      </section>
    );
  }
}

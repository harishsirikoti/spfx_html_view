import * as React from 'react';
import type { IHtmlJsViewerProps } from './IHtmlJsViewerProps';
import { SandboxedHtmlRenderer } from './SandboxedHtmlRenderer';

export const DEFAULT_HTML_DOCUMENT = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width, initial-scale=1">

  <title>HTML CSS Viewer - Final Test</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      font-family: Arial, sans-serif;
      color: #1e293b;
      background: transparent;
    }

    .dashboard {
      width: 100%;
      border: 4px solid #2563eb;
      border-radius: 16px;
      overflow: hidden;
      background: #f8fafc;
      animation: fadeIn 0.8s ease;
    }

    .header {
      background: linear-gradient(
        120deg, #1d4ed8, #7c3aed
      );
      color: white;
      padding: 26px;
    }

    .header h1 {
      margin: 0 0 8px;
      font-size: 26px;
    }

    .header p {
      margin: 0;
      opacity: 0.9;
    }

    .content {
      padding: 22px;
    }

    .grid {
      display: grid;
      grid-template-columns:
        repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
    }

    .card {
      background: white;
      border: 1px solid #dbe3ef;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 4px 12px #00000012;
      transition:
        transform 0.3s ease,
        box-shadow 0.3s ease,
        border-color 0.3s ease;
      animation: slideUp 0.6s ease both;
    }

    .card:hover {
      transform: translateY(-6px);
      border-color: #2563eb;
      box-shadow: 0 12px 25px #00000022;
    }

    .card:nth-child(2) {
      animation-delay: 0.15s;
    }

    .card:nth-child(3) {
      animation-delay: 0.3s;
    }

    .photo {
      width: 100%;
      height: 150px;
      object-fit: cover;
      display: block;
      background: #e2e8f0;
    }

    .card-body {
      padding: 20px;
    }

    .card-body h2 {
      font-size: 18px;
      margin: 10px 0;
    }

    .card-body p {
      font-size: 14px;
      color: #64748b;
      line-height: 1.5;
    }

    .icon-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #dbeafe;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 22px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: bold;
      transition:
        transform 0.3s ease,
        background 0.3s ease;
    }

    .btn:hover {
      transform: translateY(-3px);
    }

    .btn-primary {
      background: #2563eb;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: white;
      color: #2563eb;
      border: 2px solid #2563eb;
    }

    .status {
      margin-top: 24px;
      padding: 18px;
      border: 2px dashed #16a34a;
      border-radius: 10px;
      background: #f0fdf4;
    }

    .status p {
      margin: 8px 0 0;
      color: #166534;
      font-size: 14px;
    }

    .pulse {
      display: inline-block;
      width: 12px;
      height: 12px;
      margin-right: 8px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }

    .footer {
      padding: 15px 22px;
      background: #e2e8f0;
      color: #475569;
      font-size: 12px;
      text-align: center;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 #22c55e88;
      }
      70% {
        box-shadow: 0 0 0 12px #22c55e00;
      }
      100% {
        box-shadow: 0 0 0 0 #22c55e00;
      }
    }

    @media (max-width: 600px) {
      .header { padding: 18px; }
      .header h1 { font-size: 21px; }
      .content { padding: 12px; }
      .grid { grid-template-columns: 1fr; }
    }

    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
    }
  </style>
</head>

<body>
  <main class="dashboard">

    <header class="header">
      <h1>
        <icon name="layout-dashboard"
              size="28" color="#ffffff"></icon>
        HTML CSS Viewer
      </h1>
      <p>
        Final feature testing dashboard
      </p>
    </header>

    <div class="content">

      <div class="grid">

        <!-- Card 1: Lucide icon -->
        <article class="card">
          <div class="card-body">

            <div class="icon-box">
              <icon name="search"
                    size="28"
                    color="#2563eb"></icon>
            </div>

            <h2>Lucide Icons</h2>
            <p>
              Testing custom icon tags,
              size and color.
            </p>

            <icon name="house"
                  size="22"
                  color="#16a34a"></icon>

            <icon name="calendar-days"
                  size="22"
                  color="#9333ea"></icon>

            <icon name="heart"
                  size="22"
                  color="#ef4444"></icon>

          </div>
        </article>

        <!-- Card 2: External image -->
        <article class="card">

          <img
            class="photo"
            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800"
            alt="Office workspace"
            loading="lazy">

          <div class="card-body">
            <h2>External Images</h2>
            <p>
              Image loaded using an HTTPS URL.
            </p>
          </div>

        </article>

        <!-- Card 3: Image + icon -->
        <article class="card">

          <img
            class="photo"
            src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800"
            alt="Team collaboration"
            loading="lazy">

          <div class="card-body">

            <div class="icon-box">
              <icon name="users"
                    size="26"
                    color="#2563eb"></icon>
            </div>

            <h2>Employee Collaboration</h2>
            <p>
              Testing image URLs, SVG icons,
              and responsive card layout.
            </p>

          </div>
        </article>

      </div>

      <!-- External navigation -->
      <nav class="actions"
           aria-label="Test external links">

        <a class="btn btn-primary"
           href="https://lucide.dev/icons/"
           target="_blank"
           rel="noopener noreferrer">

          <icon name="external-link"
                size="18"
                color="#ffffff"></icon>

          Browse Lucide Icons
        </a>

        <a class="btn btn-secondary"
           href="https://www.microsoft.com"
           target="_blank"
           rel="noopener noreferrer">

          <icon name="arrow-up-right"
                size="18"
                color="#2563eb"></icon>

          Open Microsoft
        </a>

      </nav>

      <!-- CSS animation test -->
      <section class="status">
        <h3>
          <span class="pulse"></span>
          CSS Animation Test
        </h3>
        <p>
          The green indicator should pulse
          continuously without JavaScript.
        </p>
      </section>

    </div>

    <footer class="footer">
      HTML CSS Viewer |
      Icons • Images • Navigation • Animation
    </footer>

  </main>
</body>
</html>
`;

export default class HtmlJsViewer extends React.Component<IHtmlJsViewerProps> {
  public render(): React.ReactElement<IHtmlJsViewerProps> {
    return <SandboxedHtmlRenderer htmlDocument={this.props.htmlDocument} height={this.props.iframeHeight} />;
  }
}

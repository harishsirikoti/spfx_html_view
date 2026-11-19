# HTML and CSS Viewer

An SPFx 1.24.1 React web part for editing and previewing complete HTML documents with CSS.

## Features

- CodeMirror 6 editor in the SharePoint Property Pane
- HTML with embedded `<style>` blocks and inline CSS
- HTTPS `<img>` elements and static inline SVG icons
- Simple Lucide icons with `<icon name="search" size="24" color="#2563eb"></icon>`
- Line numbers, syntax highlighting, indentation, Run Preview, Save, and Cancel
- Configurable isolated preview height
- `srcDoc` preview in a borderless, isolated iframe with no sandbox permissions
- Published output is only the user's HTML/CSS canvas; no web-part title, header, footer, padding, margin, border, or background is added
- Strict CSP blocks scripts, external resources, forms, frames, workers, and objects
- Removes `<script>` elements, inline event handlers, `javascript:` URLs, and other active elements before rendering
- Image URLs are limited to HTTPS; SVG scripts, event handlers, external references, and `<foreignObject>` are removed

JavaScript is not supported or executed. Saved HTML is stored in the web part properties and restored when the page is reopened.

## Development

Prerequisites: Node.js compatible with SPFx 1.24.1 and npm.

```powershell
npm install
npm start
```

Build the production package with:

```powershell
npm run build
```

The preview intentionally keeps iframe isolation and does not access SharePoint page DOM, cookies, context, or authenticated APIs. Any remaining spacing outside the web part is owned by the SharePoint page layout.

Use images such as `<img src="https://example.com/image.png" alt="Description">`. Static icons can use inline SVG paths, for example `<svg viewBox="0 0 24 24"><path d="..."></path></svg>`. SharePoint's page-level CSP may still block an HTTPS image host that is not allowed by the tenant policy.

Lucide icons are resolved from the installed generated Lucide registry and converted to safe static SVG before the sandbox document is built. Browse names at [lucide.dev/icons](https://lucide.dev/icons/). Unknown names are removed and reported in the editor.

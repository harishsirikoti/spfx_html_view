# HTML and CSS Viewer

An SPFx 1.24.1 React web part for editing and previewing complete HTML documents with CSS.

## Features

- CodeMirror 6 editor in the SharePoint Property Pane
- HTML with embedded `<style>` blocks and inline CSS
- Line numbers, syntax highlighting, indentation, Run Preview, Save, and Cancel
- Configurable isolated preview height
- `srcDoc` preview in an iframe with no sandbox permissions
- Strict CSP blocks scripts, external resources, forms, frames, workers, and objects
- Removes `<script>` elements, inline event handlers, `javascript:` URLs, and other active elements before rendering

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

The preview intentionally keeps iframe isolation and does not access SharePoint page DOM, cookies, context, or authenticated APIs.

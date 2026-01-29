# Build Fix Plan

## Problem
The Angular 17+ build system puts `index.html` in `dist/portal/browser/` but deployment platforms (like Render) expect it in `dist/portal/`.

Error: `❌ index.html not found at: /opt/render/project/src/tphpa/dist/portal/index.html`

## Solution
Add a post-build script to copy `index.html` from `browser/` to the parent `dist/portal/` folder.

## Tasks
1. [ ] Update package.json to add post-build script for copying index.html
2. [ ] Update server.js to serve static files from correct location
3. [ ] Rebuild the project and verify index.html exists in dist/portal/


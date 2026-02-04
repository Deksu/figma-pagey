# Release

## Versioning
- Uses semver in `package.json`.
- UI version label uses `__PLUGIN_VERSION__` from webpack.

## Release flow
1. Update templates or UI as needed.
2. Update `CHANGELOG.md`.
3. Run `npm run preflight`.
4. Use one of:
   - `npm run release:patch`
   - `npm run release:minor`
   - `npm run release:major`

## Notes
- Figma loads `dist/ui.html` and `dist/code.js`.
- Always build before importing into Figma.

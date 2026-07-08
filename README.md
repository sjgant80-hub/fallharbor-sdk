# @ai-native-solutions/fallharbor-sdk

Sovereign estate directory · manifest-driven registry with fork lineage.

FallHarbor turns a repo's `manifest.json` into a searchable, filterable directory of tools with declared fork ancestry. This SDK is the pure-JS extraction from [fallharbor](https://github.com/sjgant80-hub/fallharbor)'s browser code — same match/filter/lineage logic, usable in Node and browsers.

**Playground:** https://sjgant80-hub.github.io/fallharbor-sdk/

## Install

```bash
npm install @ai-native-solutions/fallharbor-sdk
```

## Quick start

```js
import fh from '@ai-native-solutions/fallharbor-sdk';

const manifest = await fh.fetchManifest('https://sjgant80-hub.github.io/fallharbor/manifest.json');

console.log(fh.stats(manifest));
// { total, public, private, categories, forks, generation, root }

const results = fh.filterTools(manifest, { q: 'signature', vis: 'public' });
const tool    = fh.getTool(manifest, 'fallsignature');
const groups  = fh.groupByCategory(manifest, { cat: 'all' });
const tree    = fh.lineage(manifest);            // { roots, orphans }
console.log(fh.renderLineageAscii(manifest));    // pretty print

const check = fh.validate(manifest);
if (!check.ok) console.error(check.errors);
```

## Manifest schema

```json
{
  "operator":   { "name": "...", "hub": "...", "did": "..." },
  "lineage":    { "root": "...", "generation": 1 },
  "categories": [{ "slug": "core", "name": "Core", "desc": "..." }],
  "tools": [{
    "slug": "my-tool",
    "name": "My Tool",
    "glyph": "◇",
    "category": "core",
    "description": "...",
    "capabilities": ["cap1", "cap2"],
    "license": "MIT",
    "public": true,
    "shipped": "2026-01-01",
    "url": "https://...",
    "repo": "https://github.com/...",
    "forks_from": null,
    "forks": ["downstream-slug"]
  }],
  "peer_estates": [
    { "did": "did:web:...", "name": "...", "manifest_url": "https://...", "generation": 2 }
  ],
  "provenance": {
    "issued": "2026-01-01",
    "issuer": "did:web:...",
    "signature_format": "fallsignature-v1",
    "signature_algorithm": "Ed25519",
    "signature": null
  }
}
```

## API

| Function | Purpose |
|---|---|
| `matchTool(tool, filters)` | Boolean match against `{q, vis, cat}` |
| `filterTools(manifest, filters)` | Apply filters, return tools[] |
| `getTool(manifest, slug)` | Single tool lookup |
| `groupByCategory(manifest, filters)` | `Map<catSlug, tool[]>` |
| `stats(manifest)` | Directory summary counts |
| `lineage(manifest)` | `{ roots, orphans }` walked tree |
| `renderLineageAscii(manifest)` | Pretty-print the tree |
| `peers(manifest)` | Peer estates list |
| `operator(manifest)` | Operator block |
| `provenance(manifest)` | Provenance + `signed` flag |
| `validate(manifest)` | `{ ok, errors[] }` schema check |
| `fetchManifest(url)` | Fetch + parse remote manifest |
| `summary(manifest)` | Everything above, bundled |

## License

MIT

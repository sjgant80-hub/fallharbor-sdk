// @ai-native-solutions/fallharbor-sdk
// Sovereign estate directory · manifest-driven registry with fork lineage
// REAL extraction from fallharbor/index.html · MIT

/**
 * Match a tool against filters (mirrors index.html match())
 * @param {object} tool
 * @param {{q?:string, vis?:'all'|'public'|'private', cat?:string}} filters
 */
export function matchTool(tool, filters = {}) {
  const { q = '', vis = 'all', cat = 'all' } = filters;
  if (vis === 'public' && !tool.public) return false;
  if (vis === 'private' && tool.public) return false;
  if (cat !== 'all' && tool.category !== cat) return false;
  const query = String(q).trim().toLowerCase();
  if (!query) return true;
  return (
    tool.name.toLowerCase().includes(query) ||
    (tool.description || '').toLowerCase().includes(query) ||
    (tool.capabilities || []).some((c) => c.toLowerCase().includes(query)) ||
    tool.category.toLowerCase().includes(query) ||
    tool.slug.toLowerCase().includes(query)
  );
}

/** Filter the manifest's tools list by search/vis/category. */
export function filterTools(manifest, filters = {}) {
  return (manifest.tools || []).filter((t) => matchTool(t, filters));
}

/** Look up a single tool by slug. */
export function getTool(manifest, slug) {
  return (manifest.tools || []).find((t) => t.slug === slug) || null;
}

/** Group tools by their category slug. Returns Map<catSlug, tool[]>. */
export function groupByCategory(manifest, filters = {}) {
  const tools = filterTools(manifest, filters);
  const out = new Map();
  for (const cat of manifest.categories || []) out.set(cat.slug, []);
  for (const t of tools) {
    if (!out.has(t.category)) out.set(t.category, []);
    out.get(t.category).push(t);
  }
  return out;
}

/** Stats block (mirrors index.html renderMeta()). */
export function stats(manifest) {
  const tools = manifest.tools || [];
  const total = tools.length;
  const pub = tools.filter((t) => t.public).length;
  const priv = total - pub;
  const categories = new Set(tools.map((t) => t.category)).size;
  const forks = tools.filter((t) => t.forks_from).length;
  return {
    total,
    public: pub,
    private: priv,
    categories,
    forks,
    generation: manifest.lineage?.generation ?? null,
    root: manifest.lineage?.root ?? null,
  };
}

/**
 * Build the fork-lineage tree (mirrors index.html renderLineage()).
 * Returns { roots: Node[], orphans: Node[] } where Node = { tool, depth, children }.
 * Orphans = tools whose declared forks_from points outside the estate.
 */
export function lineage(manifest) {
  const tools = manifest.tools || [];
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  const roots = tools.filter((t) => !t.forks_from);
  const orphans = tools.filter(
    (t) => t.forks_from && !bySlug.has(t.forks_from)
  );

  function walk(tool, depth = 0) {
    const kids = (tool.forks || [])
      .map((s) => bySlug.get(s))
      .filter(Boolean)
      .map((k) => walk(k, depth + 1));
    return { tool, depth, children: kids };
  }
  return {
    roots: roots.map((r) => walk(r, 0)),
    orphans: orphans.map((o) => walk(o, 0)),
  };
}

/** Render the lineage tree as an ASCII string. */
export function renderLineageAscii(manifest) {
  const { roots, orphans } = lineage(manifest);
  const lines = [];
  const rootLabel = `◇ ${manifest.lineage?.root || '(root)'} · generation ${
    manifest.lineage?.generation ?? '?'
  }`;
  lines.push(rootLabel);
  const renderNode = (node, depth, last) => {
    const prefix =
      depth === 0
        ? ''
        : ' '.repeat((depth - 1) * 2) + (last ? '└─ ' : '├─ ');
    const vis = node.tool.public ? '' : ' · private';
    lines.push(
      `${prefix}${node.tool.glyph || '·'} ${node.tool.name} [${
        node.tool.category
      }]${vis}`
    );
    node.children.forEach((k, i) =>
      renderNode(k, depth + 1, i === node.children.length - 1)
    );
  };
  roots.forEach((r, i) => renderNode(r, 1, i === roots.length - 1));
  if (orphans.length) {
    lines.push('');
    lines.push('◇ orphan forks (ancestor outside this estate)');
    orphans.forEach((o, i) => renderNode(o, 1, i === orphans.length - 1));
  }
  return lines.join('\n');
}

/** Peer estates list. */
export function peers(manifest) {
  return manifest.peer_estates || [];
}

/** Operator block. */
export function operator(manifest) {
  return manifest.operator || {};
}

/** Provenance block + signed flag. */
export function provenance(manifest) {
  const p = manifest.provenance || {};
  return {
    ...p,
    signed: Boolean(p.signature),
    signature_algorithm: p.signature_algorithm || 'Ed25519',
    signature_format: p.signature_format || 'fallsignature-v1',
  };
}

/**
 * Validate a manifest against the FallHarbor schema.
 * Returns { ok:boolean, errors:string[] }.
 */
export function validate(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== 'object') {
    return { ok: false, errors: ['manifest is not an object'] };
  }
  if (!Array.isArray(manifest.tools)) errors.push('tools[] missing');
  if (!Array.isArray(manifest.categories)) errors.push('categories[] missing');
  if (!manifest.lineage) errors.push('lineage{} missing');
  if (!manifest.operator) errors.push('operator{} missing');

  const catSlugs = new Set((manifest.categories || []).map((c) => c.slug));
  const toolSlugs = new Set();
  for (const t of manifest.tools || []) {
    if (!t.slug) errors.push(`tool missing slug: ${t.name || '?'}`);
    if (toolSlugs.has(t.slug)) errors.push(`duplicate slug: ${t.slug}`);
    toolSlugs.add(t.slug);
    if (!t.name) errors.push(`tool ${t.slug} missing name`);
    if (!t.category) errors.push(`tool ${t.slug} missing category`);
    else if (!catSlugs.has(t.category))
      errors.push(`tool ${t.slug} category "${t.category}" not in categories[]`);
    if (typeof t.public !== 'boolean')
      errors.push(`tool ${t.slug} public must be boolean`);
  }
  return { ok: errors.length === 0, errors };
}

/**
 * Fetch a remote manifest.json (any FallHarbor-compatible URL).
 * Works in browser + Node 18+.
 */
export async function fetchManifest(url, opts = {}) {
  const res = await fetch(url, { cache: 'no-cache', ...opts });
  if (!res.ok) throw new Error(`fetch ${url} failed: ${res.status}`);
  return await res.json();
}

/** Convenience: complete summary object for a manifest. */
export function summary(manifest) {
  return {
    stats: stats(manifest),
    categories: manifest.categories || [],
    operator: operator(manifest),
    provenance: provenance(manifest),
    peers: peers(manifest),
  };
}

export default {
  matchTool,
  filterTools,
  getTool,
  groupByCategory,
  stats,
  lineage,
  renderLineageAscii,
  peers,
  operator,
  provenance,
  validate,
  fetchManifest,
  summary,
};

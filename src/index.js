// fallharbor SDK · sovereign single-file library · MIT · AI-Native Solutions
// Extracted from fallharbor/index.html · 10828 bytes of source logic
// Public-safe: no primes/glyphs/dyad references

const esc=(s)=>String(s==null?'':s).replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));
let MANIFEST=null;
let filters={q:'',vis:'all',cat:'all'};
async function load(){
  try{
    const r=await fetch('./manifest.json',{cache:'no-cache'});
    MANIFEST=await r.json();
  }catch(e){
    $('dir-body').innerHTML='<div class="empty">could not load manifest.json · '+esc(e.message)+'</div>';
    return;
  }
  renderMeta();renderCatPills();renderDirectory();renderLineage();renderPeers();renderAbout();
}
function renderMeta(){
  const total=MANIFEST.tools.length;
  const pub=MANIFEST.tools.filter(t=>t.public).length;
  const priv=total-pub;
  const cats=new Set(MANIFEST.tools.map(t=>t.category)).size;
  const forks=MANIFEST.tools.filter(t=>t.forks_from).length;
  $('meta-row').innerHTML=`
    <span><strong>${total}</strong> tools</span>
    <span><strong>${pub}</strong> public</span>
    <span><strong>${priv}</strong> private</span>
    <span><strong>${cats}</strong> categories</span>
    <span><strong>${forks}</strong> forks</span>
    <span>lineage · gen <strong>${MANIFEST.lineage.generation}</strong></span>
    <span>root · <strong>${esc(MANIFEST.lineage.root)}</strong></span>`;
}
function renderCatPills(){
  const el=$('cat-pills');
  const cats=MANIFEST.categories||[];
  el.innerHTML='<button class="pill on" data-cat="all">All</button>'+cats.map(c=>`<button class="pill" data-cat="${esc(c.slug)}">${esc(c.name)}</button>`).join('');
  el.querySelectorAll('.pill').forEach(p=>p.addEventListener('click',()=>{
    el.querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));p.classList.add('on');
    filters.cat=p.dataset.cat;renderDirectory();
  }));
}
function match(t){
  if(filters.vis==='public'&&!t.public)return false;
  if(filters.vis==='private'&&t.public)return false;
  if(filters.cat!=='all'&&t.category!==filters.cat)return false;
  const q=filters.q.trim().toLowerCase();
  if(!q)return true;
  return t.name.toLowerCase().includes(q)||(t.description||'').toLowerCase().includes(q)||(t.capabilities||[]).some(c=>c.toLowerCase().includes(q))||t.category.toLowerCase().includes(q)||t.slug.toLowerCase().includes(q);
}
function renderDirectory(){
  const el=$('dir-body');
  const matched=MANIFEST.tools.filter(match);
  if(!matched.length){el.innerHTML='<div class="empty">no tools match those filters</div>';return;}
  const cats=MANIFEST.categories||[];
  const html=cats.map(c=>{
    const items=matched.filter(t=>t.category===c.slug);
    if(!items.length)return '';
    return `<section class="cat-section"><div class="cat-heading"><span class="n">${esc(c.name)}</span><span class="desc">${esc(c.desc||'')}</span><span class="c">${items.length} · ${esc(c.slug)}</span></div><div class="grid">${items.map(cardHtml).join('')}</div></section>`;
  }).join('');
  el.innerHTML=html||'<div class="empty">no tools in matching categories</div>';
  el.querySelectorAll('.card').forEach(c=>c.addEventListener('click',()=>openDetail(c.dataset.slug)));
}
function cardHtml(t){
  const caps=(t.capabilities||[]).slice(0,4).map(c=>`<span class="cap">${esc(c)}</span>`).join('');
  const forkBadge=t.forks_from?`<span class="badge fork">↳ ${esc(t.forks_from)}</span>`:'';
  const visBadge=t.public?'<span class="badge public">public</span>':'<span class="badge private">private</span>';
  return `<div class="card" data-slug="${esc(t.slug)}">
    <div class="desc">${esc(t.description||'')}</div>
    <div class="caps">${caps}${forkBadge}</div>
  </div>`;
}
function openDetail(slug){
  const t=MANIFEST.tools.find(x=>x.slug===slug);if(!t)return;
  const caps=(t.capabilities||[]).map(c=>`<span class="cap">${esc(c)}</span>`).join(' ');
  const forks=(t.forks||[]).map(f=>`<a href="#" data-slug="${esc(f)}" class="fork-link">${esc(f)}</a>`).join(', ')||'<span style="color:var(--dim)">none</span>';
  const forksFrom=t.forks_from?`<a href="#" data-slug="${esc(t.forks_from)}" class="fork-link">${esc(t.forks_from)}</a>`:'<span style="color:var(--dim)">root (no ancestor)</span>';
  $('detail-box').innerHTML=`
    <div class="desc">${esc(t.description||'')}</div>
    <div class="row"><div class="k">Slug</div><div class="v"><code style="font-family:var(--mono);color:var(--sage)">${esc(t.slug)}</code></div></div>
    <div class="row"><div class="k">Category</div><div class="v">${esc(t.category)}</div></div>
    <div class="row"><div class="k">Capabilities</div><div class="v">${caps||'<span style="color:var(--dim)">none declared</span>'}</div></div>
    <div class="row"><div class="k">License</div><div class="v">${esc(t.license)}</div></div>
    <div class="row"><div class="k">Visibility</div><div class="v">${t.public?'public · everyone can use':'private · estate-only'}</div></div>
    <div class="row"><div class="k">Shipped</div><div class="v">${esc(t.shipped)}</div></div>
    <div class="row"><div class="k">Forks from</div><div class="v">${forksFrom}</div></div>
    <div class="row"><div class="k">Downstream forks</div><div class="v">${forks}</div></div>
    <div class="row"><div class="k">Live</div><div class="v"><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.url)}</a></div></div>
    <div class="row"><div class="k">Source</div><div class="v"><a href="${esc(t.repo)}" target="_blank" rel="noopener">${esc(t.repo)}</a></div></div>
    <div class="actions"><a href="${esc(t.url)}" target="_blank" rel="noopener">Open live ↗</a><a href="${esc(t.repo)}" target="_blank" rel="noopener" class="ghost">View source ↗</a></div>`;
  $('detail-modal').classList.add('on');
  $('close-detail').addEventListener('click',closeDetail);
  $('detail-box').querySelectorAll('.fork-link').forEach(a=>a.addEventListener('click',(e)=>{e.preventDefault();openDetail(a.dataset.slug);}));
}
function closeDetail(){$('detail-modal').classList.remove('on');}
$('detail-modal').addEventListener('click',(e)=>{if(e.target.id==='detail-modal')closeDetail();});
function renderLineage(){
  const el=$('lineage-tree');
  const tools=MANIFEST.tools;
  const roots=tools.filter(t=>!t.forks_from);
  const orphans=tools.filter(t=>t.forks_from&&!tools.find(x=>x.slug===t.forks_from));
  function line(t,depth,last){
    const prefix=depth===0?'':' '.repeat((depth-1)*2)+(last?'└─ ':'├─ ');
    const vis=t.public?'':'<span class="priv"> · private</span>';
  }
  function walk(t,depth,last){
    let out=line(t,depth,last);
    const kids=(t.forks||[]).map(s=>tools.find(x=>x.slug===s)).filter(Boolean);
    kids.forEach((k,i)=>{out+=walk(k,depth+1,i===kids.length-1);});
    return out;
  }
  let out=`<span class="root">◇ ${esc(MANIFEST.lineage.root)} · generation ${MANIFEST.lineage.generation}</span>\n`;
  roots.forEach((r,i)=>{out+=walk(r,1,i===roots.length-1&&!orphans.length);});
  if(orphans.length){
    out+='\n<span class="root">◇ orphan forks (ancestor outside this estate)</span>\n';
    orphans.forEach((o,i)=>{out+=walk(o,1,i===orphans.length-1);});
  }
  el.innerHTML=out;
  el.querySelectorAll('.node').forEach(n=>n.addEventListener('click',()=>openDetail(n.dataset.slug)));
}
function renderPeers(){
  const el=$('peers-body');
  const peers=MANIFEST.peer_estates||[];
  if(!peers.length){
    el.innerHTML=`<div class="empty-peers">No peer estates registered yet.<div class="hint">Open a PR against <a href="https://github.com/sjgant80-hub/fallharbor">fallharbor</a> with your DID + manifest URL</div></div>`;
    return;
  }
  el.innerHTML='<div class="grid">'+peers.map(p=>`<div class="card"><div class="top"><div class="nm">${esc(p.name||p.did)}</div><span class="badge">gen ${p.generation||'?'}</span></div><div class="desc"><code style="font-family:var(--mono);font-size:11px;color:var(--muted)">${esc(p.did)}</code></div><div class="caps"><a href="${esc(p.manifest_url)}" target="_blank" rel="noopener" style="font-family:var(--mono);font-size:11px">${esc(p.manifest_url)}</a></div></div>`).join('')+'</div>';
}
function renderAbout(){
  const o=MANIFEST.operator||{};
  $('operator-block').innerHTML=`<div><span class="k">Name</span>${esc(o.name)}</div><div style="margin-top:6px"><span class="k">Hub</span>${esc(o.hub)}</div><div style="margin-top:6px"><span class="k">DID</span>${esc(o.did)}</div>${o.repo_org?`<div style="margin-top:6px"><span class="k">Repo Org</span>${esc(o.repo_org)}</div>`:''}`;
  const p=MANIFEST.provenance||{};
  const sig=p.signature?`<span style="color:var(--sage)">✓ signed · ${esc(p.signature_algorithm||'Ed25519')}</span><br><code style="word-break:break-all;color:var(--muted);font-size:10.5px">${esc(p.signature)}</code>`:`<span class="unsigned">◇ unsigned · signature slot open for FallSignature</span>`;
  $('prov-block').innerHTML=`<div><span class="k">Issued</span>${esc(p.issued)}</div><div style="margin-top:6px"><span class="k">Issuer</span>${esc(p.issuer)}</div><div style="margin-top:6px"><span class="k">Format</span>${esc(p.signature_format||'fallsignature-v1')}</div><div style="margin-top:6px"><span class="k">Signature</span>${sig}</div>`;
}
$('q').addEventListener('input',(e)=>{filters.q=e.target.value;renderDirectory();});
$('vis-pills').querySelectorAll('.pill').forEach(p=>p.addEventListener('click',()=>{$('vis-pills').querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));p.classList.add('on');filters.vis=p.dataset.vis;renderDirectory();}));
  t.classList.add('on');$('view-'+t.dataset.view).classList.add('on');
}));
$('download-btn').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(MANIFEST,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='fallharbor-manifest.json';a.click();URL.revokeObjectURL(url);
});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape')closeDetail();});
if('serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{});}
load();

// Named exports for the primary API surface
export { load };
export { renderMeta };
export { renderCatPills };
export { match };
export { renderDirectory };
export { cardHtml };
export { openDetail };
export { closeDetail };
export { renderLineage };
export { line };



// Builds v6/s0_brand.js (Solar icons used by the product, Triplanet logo) and v6/brand-fonts.css
// (Public Sans + Barlow, the product's typefaces). Run: cd tools/brand && npm install && node build_brand.mjs
// Icons: Solar by 480 Design, CC BY 4.0 (https://github.com/480-Design/Solar-Icon-Set).
import fs from 'node:fs';
const root = new URL('../../', import.meta.url).pathname;
const solar = JSON.parse(fs.readFileSync('node_modules/@iconify-json/solar/icons.json', 'utf8'));
const WANT = {
  // navigation (product uses bold-duotone in the nav)
  home: ['home-angle-bold-duotone'], quotes: ['bill-list-bold-duotone'], templates: ['notebook-bold-duotone', 'document-add-bold-duotone'],
  hotels: ['buildings-2-bold-duotone'], suppliers: ['box-bold-duotone'], activities: ['flag-bold-duotone'],
  users: ['users-group-rounded-bold-duotone'], studio: ['map-arrow-square-bold-duotone', 'routing-2-bold-duotone'],
  leaks: ['chart-square-bold-duotone'], gaps: ['bill-check-bold-duotone', 'document-text-bold-duotone'], finance: ['wad-of-money-bold-duotone'],
  ai: ['stars-bold-duotone', 'magic-stick-3-bold-duotone'],
  // header and actions
  bell: ['bell-bing-bold-duotone'], settings: ['settings-bold-duotone'], play: ['play-circle-bold'], present: ['presentation-graph-bold-duotone', 'monitor-bold-duotone'],
  check: ['check-circle-bold'], close: ['close-circle-bold'], x: ['close-square-linear', 'close-circle-linear'], star: ['star-bold'], pin: ['map-point-bold'],
  clock: ['clock-circle-bold'], danger: ['danger-triangle-bold'], hourglass: ['hourglass-bold-duotone'], pen: ['pen-bold'], printer: ['printer-bold'],
  lock: ['lock-bold'], mail: ['letter-bold'], inbox: ['inbox-in-bold-duotone', 'inbox-bold-duotone'], up: ['alt-arrow-up-linear'], down: ['alt-arrow-down-linear'],
  right: ['arrow-right-linear'], left: ['arrow-left-linear'], restart: ['restart-bold'], refresh: ['refresh-bold'], trendup: ['graph-up-bold', 'chart-2-bold'],
  trenddown: ['graph-down-bold', 'chart-bold'], magic: ['magic-stick-3-bold'], plane: ['plain-bold', 'plain-2-bold'], sparkle: ['stars-minimalistic-bold'],
  // home tiles
  folder: ['folder-with-files-bold-duotone'], draft: ['pen-new-square-bold-duotone'], ops: ['bus-bold-duotone'], wallet: ['wallet-money-bold-duotone'],
  done: ['check-circle-bold-duotone'], bed: ['bed-bold'], users2: ['users-group-two-rounded-bold'], calendar: ['calendar-bold-duotone'],
  // itinerary kinds
  show: ['music-note-2-bold', 'music-notes-bold'], museum: ['library-bold', 'buildings-bold'], landmark: ['map-point-wave-bold', 'map-point-bold'],
  tour: ['walking-bold', 'routing-bold'], cruise: ['sailing-boat-bold', 'ship-bold', 'water-bold'], dining: ['chef-hat-bold', 'cup-hot-bold'],
  park: ['tree-bold', 'leaf-bold'], travel: ['plain-bold'], hotel: ['bed-bold'], meal: ['chef-hat-bold', 'cup-hot-bold'], free: ['sun-2-bold', 'sun-bold'],
  search: ['magnifer-linear'], widget: ['widget-5-bold-duotone', 'widget-bold-duotone'], checklist: ['checklist-minimalistic-bold-duotone'], document: ['document-text-bold-duotone'],
  filter: ['filter-bold'], chev: ['alt-arrow-right-linear'], idcard: ['user-id-bold-duotone'], chart2: ['chart-2-bold-duotone'], clients: ['users-group-two-rounded-bold-duotone'],
  ticket: ['ticket-bold-duotone'], receipt: ['bill-list-bold-duotone'], export: ['export-bold'], link: ['link-round-angle-bold', 'link-bold'], sync: ['refresh-circle-bold-duotone'],
  cloud: ['cloud-upload-bold-duotone'], card: ['card-bold-duotone'], plug: ['plug-circle-bold-duotone'], invoice: ['document-add-bold-duotone'], tag: ['tag-horizontal-bold-duotone'],
  copy: ['copy-bold'], userplus: ['user-plus-bold'], mapsq: ['map-point-wave-bold-duotone'], cash: ['dollar-minimalistic-bold'],
  flag: ['flag-bold'], bus: ['bus-bold'], money: ['dollar-minimalistic-bold'], percent: ['sale-bold', 'tag-price-bold'], shield: ['shield-check-bold-duotone'],
};
const icons = {}, missing = [];
for (const [k, cands] of Object.entries(WANT)) {
  const id = cands.find(c => solar.icons[c] || (solar.aliases && solar.aliases[c]));
  if (!id) { missing.push(k + ':' + cands.join('|')); continue; }
  const ic = solar.icons[id] || solar.icons[solar.aliases[id].parent];
  icons[k] = ic.body.replace(/\s+/g, ' ');
}
if (missing.length) { console.error('missing icons', missing); process.exit(1); }
const b64 = f => fs.readFileSync(f).toString('base64');
const logo = 'data:image/png;base64,' + b64('logo-480.png');
const plane = `<svg viewBox="70 98 276 228" aria-hidden="true" class="tp-plane"><defs><linearGradient id="tpg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5DFCE0"/><stop offset="1" stop-color="#1FE3F7"/></linearGradient></defs><path fill="url(#tpg)" d="M338.594 148.158C344.119 142.952 341.005 133.659 333.436 132.768L83.903 103.389C76.8246 102.556 71.676 109.883 74.8696 116.245L113.408 193.019C113.986 194.17 115.238 194.825 116.514 194.644L208.39 181.591C209.38 181.451 209.828 182.788 208.95 183.263L127.471 227.338C126.339 227.95 125.732 229.218 125.964 230.484L141.433 314.86C142.715 321.852 151.262 324.666 156.429 319.797L338.594 148.158Z"/></svg>`;
// Product assets copied from the live app (dev.triplanet.io/assets): navbar icons, finance-tab icons, dashboard art.
const NAVF = {home:'ic-dashboard', quotes:'ic-solar', templates:'ic-blog', hotels:'ic-banking', suppliers:'ic-man-card', activities:'ic-tour', users:'ic-user', clients:'ic-clients',
  fdash:'ic-dashboard', income:'fin-income', tfin:'fin-expenses', vouchers:'fin-vouchers', docs:'fin-document-settings'};
const navic = {};
for (const [k, f] of Object.entries(NAVF)) navic[k] = 'data:image/svg+xml;base64,' + b64('product/' + f + '.svg');
const art = {open: 'data:image/png;base64,' + b64('product/open-img.png'), closed: 'data:image/png;base64,' + b64('product/closed-img.png')};
const js = `/* GENERATED by tools/brand/build_brand.mjs. Triplanet logo; icons: Solar (480 Design, CC BY 4.0). */
const ICONS=${JSON.stringify(icons)};
const ic=(n,cls)=>ICONS[n]?'<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" class="ic'+(cls?' '+cls:'')+'">'+ICONS[n]+'</svg>':'';
const TP_LOGO=${JSON.stringify(logo)};
const TP_PLANE=${JSON.stringify(plane)};
const NAVIC=${JSON.stringify(navic)};
const nic=k=>NAVIC[k]?'<span class="nic" aria-hidden="true" style="-webkit-mask-image:url('+NAVIC[k]+');mask-image:url('+NAVIC[k]+')"></span>':'';
const TP_ART=${JSON.stringify(art)};
`;
fs.writeFileSync(root + 'v6/s0_brand.js', js);
const font = (fam, file, w) => `@font-face{font-family:'${fam}';font-style:normal;font-display:swap;font-weight:${w};src:url(data:font/woff2;base64,${b64(file)}) format('woff2')}`;
const css = ['/* GENERATED by tools/brand/build_brand.mjs: Public Sans (variable) and Barlow, SIL OFL 1.1 */',
  font('Public Sans', 'node_modules/@fontsource-variable/public-sans/files/public-sans-latin-wght-normal.woff2', '100 900'),
  font('Public Sans', 'node_modules/@fontsource-variable/public-sans/files/public-sans-latin-ext-wght-normal.woff2', '100 900').replace("format('woff2')}", "format('woff2');unicode-range:U+0100-02AF,U+1E00-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF}"),
  ...[600, 700, 800].map(w => font('Barlow', `node_modules/@fontsource/barlow/files/barlow-latin-${w}-normal.woff2`, w))].join('\n');
fs.writeFileSync(root + 'v6/brand-fonts.css', css + '\n');
console.log('icons', Object.keys(icons).length, 'js', js.length, 'css', css.length);

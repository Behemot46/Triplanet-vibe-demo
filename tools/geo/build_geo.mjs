// Build v6/s0_geo.js : pre-projected maps for the offline demo.
// Run: cd tools/geo && npm install && node build_geo.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as topo from 'topojson-client';
import {presimplify, simplify, quantile} from 'topojson-simplify';
import {geoPath, geoMercator, geoConicConformal, geoAlbersUsa} from 'd3-geo';

const here = path.dirname(fileURLToPath(import.meta.url));
const rd = p => JSON.parse(fs.readFileSync(path.join(here, 'node_modules', p), 'utf8'));
const W = 960, PAD = 24;

function simp(t, q) { const p = presimplify(t); return simplify(p, quantile(p, q)); }
const states = simp(rd('us-atlas/states-10m.json'), 0.35);
const nation = simp(rd('us-atlas/nation-10m.json'), 0.35);
const world = rd('world-atlas/countries-50m.json');

const CITIES = {
  tulsa:['Tulsa',-95.99,36.15], branson:['Branson',-93.22,36.64], nashville:['Nashville',-86.78,36.16],
  memphis:['Memphis',-90.05,35.15], washington:['Washington DC',-77.04,38.91], mountvernon:['Mount Vernon',-77.09,38.71],
  boston:['Boston',-71.06,42.36], northconway:['North Conway',-71.13,44.05], stowe:['Stowe',-72.69,44.47],
  barharbor:['Bar Harbor',-68.2,44.39], portlandme:['Portland, ME',-70.26,43.66], grandcanyon:['Grand Canyon',-112.11,36.06],
  sedona:['Sedona',-111.76,34.87], phoenix:['Phoenix',-112.07,33.45], niagarafalls:['Niagara Falls',-79.07,43.09],
  toronto:['Toronto',-79.38,43.65], buffalo:['Buffalo',-78.88,42.89], newyork:['New York',-74.01,40.71],
  philadelphia:['Philadelphia',-75.17,39.95], gatlinburg:['Gatlinburg',-83.51,35.71], pigeonforge:['Pigeon Forge',-83.55,35.79],
  knoxville:['Knoxville',-83.92,35.96], sanantonio:['San Antonio',-98.49,29.42], austin:['Austin',-97.74,30.27],
  chicago:['Chicago',-87.63,41.88], neworleans:['New Orleans',-90.07,29.95], jerusalem:['Jerusalem',35.21,31.77],
  telaviv:['Tel Aviv',34.78,32.08], tiberias:['Tiberias',35.53,32.79], nazareth:['Nazareth',35.3,32.7],
  bethlehem:['Bethlehem',35.2,31.7], deadsea:['Dead Sea',35.36,31.2], masada:['Masada',35.35,31.32],
  rome:['Rome',12.5,41.9], vatican:['Vatican',12.45,41.9], assisi:['Assisi',12.62,43.07], florence:['Florence',11.25,43.77],
  athens:['Athens',23.73,37.98], corinth:['Corinth',22.93,37.94], delphi:['Delphi',22.5,38.48],
  dublin:['Dublin',-6.26,53.35], galway:['Galway',-9.05,53.27], killarney:['Killarney',-9.5,52.06],
  moher:['Cliffs of Moher',-9.43,52.97], london:['London',-0.13,51.51], oxford:['Oxford',-1.26,51.75],
  stratford:['Stratford-upon-Avon',-1.71,52.19]
};

const box = ([l0, p0, l1, p1]) => {
  const ring = [], n = 24;
  for (let i = 0; i <= n; i++) ring.push([l0 + (l1 - l0) * i / n, p0]);
  for (let i = 1; i <= n; i++) ring.push([l1, p0 + (p1 - p0) * i / n]);
  for (let i = 1; i <= n; i++) ring.push([l1 - (l1 - l0) * i / n, p1]);
  for (let i = 1; i <= n; i++) ring.push([l0, p1 - (p1 - p0) * i / n]);
  return {type:'Polygon', coordinates:[ring.reverse()]};
};

const VIEWS = {
  euro:   {b:[-11,29,37,57],      proj:()=>geoConicConformal().parallels([35,50]).rotate([-13,0]).center([0,43])},
  levant: {b:[33.7,30.9,36.4,33.35], proj:()=>geoMercator()},
  italy:  {b:[9.5,40.8,14.5,44.3], proj:()=>geoMercator()},
  isles:  {b:[-11,50,2,56],       proj:()=>geoMercator()},
  greece: {b:[19.5,35,28.5,41.5], proj:()=>geoMercator()},
  ontario:{b:[-80.6,42.6,-78.4,44.0], proj:()=>geoMercator()},
};

const views = {}, projs = {};
const f1 = s => s; // digits handled by geoPath

// USA
{
  const proj = geoAlbersUsa().fitExtent([[PAD, PAD], [W - PAD, 600 - PAD]], topo.feature(nation, nation.objects.nation));
  const gp = geoPath(proj).digits(1);
  views.usa = {w:W, h:600,
    land: gp(topo.feature(nation, nation.objects.nation)),
    lines: gp(topo.mesh(states, states.objects.states, (a, b) => a !== b))};
  projs.usa = proj;
}
// world-based views
const worldS = simp(world, 0.05); // lighter copy for the wide Europe view
// hand-traced Lake Ontario shoreline (lon,lat), used as a hole in the land fill
const LAKE_ONTARIO = [[-79.8,43.31],[-79.55,43.2],[-79.27,43.21],[-79.07,43.26],[-78.7,43.37],[-78.0,43.36],[-77.0,43.3],[-76.6,43.5],[-76.5,44.1],[-77.5,44.0],[-78.0,43.93],[-78.3,43.94],[-78.6,43.89],[-78.8,43.86],[-79.1,43.82],[-79.2,43.68],[-79.38,43.61],[-79.58,43.55],[-79.67,43.43]];
const geomFor = (w) => ({land: topo.merge(w, w.objects.countries.geometries), borders: topo.mesh(w, w.objects.countries, (a, b) => a !== b)});
const G50 = geomFor(world), GS = geomFor(worldS);
for (const [k, v] of Object.entries(VIEWS)) {
  const bx = box(v.b);
  const proj = v.proj();
  proj.fitWidth(W - 2 * PAD, bx);
  const [[x0, y0], [x1, y1]] = geoPath(proj).bounds(bx);
  const [tx, ty] = proj.translate();
  proj.translate([tx + PAD - x0, ty + PAD - y0]);
  const h = Math.ceil(y1 - y0 + 2 * PAD);
  proj.clipExtent([[0, 0], [W, h]]);
  const gp = geoPath(proj).digits(1);
  let g = k === 'euro' ? GS : G50, land = g.land, lines = g.borders;
  let landD = gp(land) || '';
  if (k === 'ontario') { // country polygons include the lakes: cut Lake Ontario out as an evenodd hole
    landD += 'M' + LAKE_ONTARIO.map(c => proj(c).map(n => Math.round(n * 10) / 10).join(' ')).join('L') + 'Z';
    lines = null;
  }
  views[k] = {w:W, h, land:landD, lines:lines ? gp(lines)||'' : ''};
  projs[k] = proj; projs[k]._h = h;
}

const cities = {};
for (const [id, [n, lon, lat]] of Object.entries(CITIES)) {
  const p = {};
  for (const [k, proj] of Object.entries(projs)) {
    const xy = proj([lon, lat]);
    if (!xy) continue;
    const [x, y] = xy, h = views[k].h;
    if (x >= 0 && x <= W && y >= 0 && y <= h) p[k] = [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  }
  cities[id] = {n, lon, lat, p};
}

const lib = fs.readFileSync(path.join(here, 'geo_runtime.js'), 'utf8');
const out = '/* Generated by tools/geo/build_geo.mjs - do not edit by hand. */\nconst GEO=' +
  JSON.stringify({views, cities}) + ';\n' + lib;
const dest = path.join(here, '..', '..', 'v6', 's0_geo.js');
fs.writeFileSync(dest, out);
console.log('wrote', dest, out.length, 'bytes');
for (const [k, v] of Object.entries(views)) console.log(k, v.h, v.land.length + v.lines.length);

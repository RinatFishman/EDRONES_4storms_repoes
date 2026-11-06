#!/usr/bin/env python3
"""Rebuild grid_fleet_dashboard.html.

Reads the project data (grid_segments.csv, grid_nodes.csv, scenario_public_config.json),
injects it into fleet_v2.html, applies the source fixes, and appends the three.js 3D scene
from add3d.js. The result is a single self-contained HTML file.

Usage:  python3 build_data.py [project_dir] [output_html]
"""
import csv, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PROJ = sys.argv[1] if len(sys.argv) > 1 else '/mnt/project/'
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, '..', 'grid_fleet_dashboard.html')

S = list(csv.DictReader(open(os.path.join(PROJ, 'grid_segments.csv'), encoding='utf-8')))
N = list(csv.DictReader(open(os.path.join(PROJ, 'grid_nodes.csv'), encoding='utf-8')))
C = json.load(open(os.path.join(PROJ, 'scenario_public_config.json'), encoding='utf-8'))
names = {n['node_id']: (n['name'] or n['node_id']) for n in N}

def wkt(w):
    """Simplify a LINESTRING to 6 vertices (endpoints kept) for the browser."""
    pts = [tuple(map(float, p)) for p in re.findall(r'(-?\d+\.\d+) (-?\d+\.\d+)', w)]
    if len(pts) > 6:
        pts = [pts[round(i * (len(pts) - 1) / 5)] for i in range(6)]
    return [[round(x, 4), round(y, 4)] for x, y in pts]

def inside(p, poly):
    """Ray-casting point-in-polygon test."""
    x, y = p; c = False
    for i in range(len(poly) - 1):
        x1, y1 = poly[i]; x2, y2 = poly[i + 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c

segs = []
for r in S:
    mid = ((float(r['from_connection_lon']) + float(r['to_connection_lon'])) / 2,
           (float(r['from_connection_lat']) + float(r['to_connection_lat'])) / 2)
    segs.append({'id': r['segment_id'], 'fi': r['from_node'], 'ti': r['to_node'],
                 'c': r['component_id'].split('_')[1],
                 'f': names.get(r['from_node'], r['from_node']), 't': names.get(r['to_node'], r['to_node']),
                 'kv': float(r['voltage_kv']), 'km': round(float(r['length_km']), 3),
                 'pts': wkt(r['geometry_wkt']), '_m': mid})

short = ['Broad strong gusts (weather desk)',
         'Branch across access track; tree near a route (area only)',
         'Protection event + reclose (area); LINE_024 known de-energized',
         'Orange flash near industrial site (low confidence)',
         'Ticking + thermal contrast (area only)',
         'Span moved more than neighbours (area only)']

def mins(s):
    h, m = s[2:].split(':'); return int(h) * 60 + int(m)

reps = []
for i, r in enumerate(C['public_context']['reports']):
    poly = r['location_area_coordinates']
    reps.append({'id': r['information_id'], 'short': short[i], 't': mins(r['timestamp_relative_to_storm']),
                 'poly': poly, 'lines': [g['id'] for g in segs if inside(g['_m'], poly)]})
for g in segs:
    del g['_m']

subs = [{'id': n['node_id'], 'name': n['name'], 'lon': float(n['lon']), 'lat': float(n['lat'])}
        for n in N if n['node_type'] == 'abstract_substation']
DATA = {'segs': segs, 'subs': subs, 'reps': reps,
        'storm': C['public_context']['storm_footprint']['coordinates'], 'de': ['LINE_024']}

def patch_template(s):
    """Source fixes that were applied to the published page."""
    reps_ = [
        ('Math.exp(-(dA/a.r)**2)', 'Math.exp(-Math.pow(dA/a.r,2))'),
        ("{k:'fly',pid,t0,t1:tt,ed,sS}", "{k:'fly',pid,t0,t1:tt,ed,sS,tgt:so.seg}"),
        ('departs hub for ${p.ed.at(-1).sid}', 'departs hub for ${p.tgt}'),
        ('${jit(s.gs,.8)} km/h', '${Math.max(0,+jit(s.gs,.8)).toFixed(1)} km/h'),
        ('<script>\nconst D=', '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script>\nconst D='),
        ('<svg id="map" viewBox="-6 -6 300 302" role="img" aria-label="Network control map"></svg>',
         '<svg id="map" style="display:none" viewBox="-6 -6 300 302" role="img" aria-label="Network control map"></svg>'
         '<div id="g3" style="position:relative;width:100%;height:600px;border-radius:8px;border:1px solid var(--ln);overflow:hidden"></div>'),
        ('setInterval(()=>{if(!playing)render()},1000);\nrender();\n</script>',
         'setInterval(()=>{if(!playing)render()},1000);\nrender();\n' + open(os.path.join(HERE, 'add3d.js'), encoding='utf-8').read() + '\n</script>'),
    ]
    for old, new in reps_:
        assert s.count(old) == 1, 'patch anchor not unique: ' + old[:60]
        s = s.replace(old, new)
    return s

tpl = open(os.path.join(HERE, 'fleet_v2.html'), encoding='utf-8').read()
tpl = patch_template(tpl)
assert '/*__DATA__*/null' in tpl
out = tpl.replace('/*__DATA__*/null', json.dumps(DATA, separators=(',', ':'), ensure_ascii=False))
os.makedirs(os.path.dirname(os.path.abspath(OUT)), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(out)
print('wrote', OUT, len(out.encode()), 'bytes')

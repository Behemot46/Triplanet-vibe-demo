# Builds the single-file demo: v6/triplanet-booth.html
# Run from the repo root: python3 build.py
import os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
V6 = ROOT / 'v6'

def read(p):
    return (ROOT / p).read_text(encoding='utf8')

css = read('v6/base.css')
fonts = read('fonts.css')
extra = read('v6/extra.css') + '\n' + read('v6/v7.css') + '\n' + read('v6/brand-fonts.css') + '\n' + read('v6/theme.css') + '\n' + (read('v6/lists.css') if (V6 / 'lists.css').exists() else '') + '\n' + ''.join(read('v6/' + f.name) + '\n' for f in sorted(V6.glob('m_*.css')))
JS_ORDER = ['s0_brand.js', 's0_photos.js', 's0_avatars.js', 's0_video.js', 's0_geo.js', 's1_core.js', 's1c_catalog.js', 's1d_data.js', 's1e_people.js', 's1b_labels.js', 's2_i18n.js',
            's3_shell.js', 's4_views.js', 's5_fin.js', 's6_rest.js', 's6b_dnd.js',
            's7_leak.js', 's7b_product.js', 's7c_lists.js', 's8_gen.js', 's9a_books.js','s9b_status.js','s9c_live.js', 's9d_maya.js', 's10_forms.js', 's10_fbuild.js', 's10_prop.js', 's10_tbday.js', 's10_tbcomp.js', 's10_sup.js', 's10_ops.js', 's10_settings.js', 's10_dacct.js', 's10_dash.js', 's11_trdata.js', 's11_next.js', 's11_search.js', 's11_uikit.js', 's11_spec.js', 's11_spec_trip.js', 's9_meet.js', 's9_boot.js']
# optional modules may be absent while they are being built
SKIP = set(os.environ.get('TP_SKIP', '').split(','))
js = ''.join(read('v6/' + f) + '\n' for f in JS_ORDER if (V6 / f).exists() and f not in SKIP)

out = f'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Triplanet Demo</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Triplanet booth demo: group tour operations with automatic supplier invoice checking.">
<style>
{fonts}
{css}
{extra}
</style>
<div id="app"></div>
<div id="toast" role="status"></div>
<script>
{js}
</script>
'''
(V6 / 'triplanet-booth.html').write_text(out, encoding='utf8')
print(len(out), 'bytes written to v6/triplanet-booth.html')

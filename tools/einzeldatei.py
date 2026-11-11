#!/usr/bin/env python3
"""Baut das Spiel als eine einzige HTML-Datei (CSS, JavaScript und Bilder eingebettet).

Aufruf:  python3 tools/einzeldatei.py [ausgabe.html]
Standard-Ausgabe: gewoelbe-des-pythagoras.html im Projektordner.
Die Datei läuft offline per Doppelklick oder auf jedem Webspace.
"""
import base64, json, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'gewoelbe-des-pythagoras.html'
html = (root / 'index.html').read_text(encoding='utf-8')

def safe_js(code):
    return code.replace('</script', '<\\/script')

# Bilder als data-URLs
assets = {}
for f in sorted((root / 'assets').rglob('*.png')):
    rel = f.relative_to(root).as_posix()
    assets[rel] = 'data:image/png;base64,' + base64.b64encode(f.read_bytes()).decode('ascii')
asset_js = 'window.RM = window.RM || {}; window.RM.ASSET_DATA = ' + json.dumps(assets) + ';'

# Stylesheet einbetten
def css_repl(m):
    return '<style>\n' + (root / m.group(1)).read_text(encoding='utf-8') + '\n</style>'
html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', css_repl, html)

# Skripte einbetten; Bilddaten vor dem ersten Skript
first = [True]
def js_repl(m):
    code = safe_js((root / m.group(1)).read_text(encoding='utf-8'))
    pre = ''
    if first[0]:
        first[0] = False
        pre = '<script>' + asset_js + '</script>\n  '
    return pre + '<script>/* ' + m.group(1) + ' */\n' + code + '\n</script>'
html = re.sub(r'<script src="([^"]+)"></script>', js_repl, html)

assert 'src="js/' not in html and 'href="css/' not in html
out.write_text(html, encoding='utf-8')
print(f'{out} ({out.stat().st_size / 1e6:.1f} MB, {len(assets)} Bilder)')

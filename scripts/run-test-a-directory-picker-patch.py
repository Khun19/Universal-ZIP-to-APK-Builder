from pathlib import Path
import runpy

legacy = Path('scripts/patch-test-a-directory-picker.py')
s = legacy.read_text()
old = "rep(marker, marker + js, 'page finished')"
new = '''if marker in s:
    s = s.replace(marker, marker + js, 1)
else:
    import re
    pattern = r'(return assetLoader\\.shouldInterceptRequest\\(Uri\\.parse\\(url\\)\\);\\n\\s*\\})'
    match = re.search(pattern, s)
    if not match:
        raise SystemExit("page finished: asset-loader method anchor not found")
    replacement = match.group(1) + "\\n" + js
    s = s[:match.start()] + replacement + s[match.end():]'''
if old not in s:
    raise SystemExit('legacy patch script anchor not found')
s = s.replace(old, new, 1)
legacy.write_text(s)
runpy.run_path(str(legacy), run_name='__main__')

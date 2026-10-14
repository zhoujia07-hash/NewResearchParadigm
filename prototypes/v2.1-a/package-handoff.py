"""Package only explicit visual deliverables; never include dependencies or user data."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

root=Path(__file__).resolve().parent
public=root.parents[1]/'showcase-web'/'public'/'visual-prototype'
public.mkdir(parents=True,exist_ok=True)
for name in ['README.md','asset-manifest.json']:
    shutil.copy2(root/name,public/name)
archive=public/'v2.1-a-package.zip'
with ZipFile(archive,'w',ZIP_DEFLATED,compresslevel=9) as z:
    for folder in ['src','browser','previews']:
        for file in sorted((root/folder).rglob('*')):
            if file.is_file(): z.write(file,'v2.1-a/'+str(file.relative_to(root)))
    for name in ['README.md','asset-manifest.json','package.json','package-lock.json','tsconfig.json','build.mjs','verify-browser.cjs']:
        z.write(root/name,'v2.1-a/'+name)
with ZipFile(archive) as z:
    assert z.testzip() is None
    assert 'v2.1-a/browser/index.html' in z.namelist()
    assert not any('/node_modules/' in n or '.env' in n for n in z.namelist())
print(f'Created portable visual handoff: {archive.name} ({archive.stat().st_size:,} bytes)')

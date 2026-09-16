"""Regenerate responsive exports and posters after adding media.

Optional authoring tool: Python + Pillow; ffmpeg for video poster generation.
Normal builds use the checked-in exports and do not require these tools.
"""
import hashlib
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

def read_json(name):
    return json.loads((ROOT / 'content' / name).read_text(encoding='utf-8'))

def write_json(name, value):
    (ROOT / 'content' / name).write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')

assets = read_json('assets.json')
projects = read_json('projects.json')
sources = {asset['src'] for asset in assets} | {project['cover'] for project in projects}
sources.add('images/brand/coastal-architecture.webp')
sources.update(artwork['file'] for artwork in read_json('brand-artwork.json')['assets'])
(ROOT / 'images/responsive').mkdir(exist_ok=True)
(ROOT / 'images/video-posters').mkdir(exist_ok=True)
manifest = {}
for source in sorted(sources):
    with Image.open(ROOT / source) as original:
        image = original.convert('RGB')
        variants = []
        for width in (480, 960):
            if image.width <= width:
                continue
            target = f'images/responsive/{hashlib.sha1(source.encode()).hexdigest()[:12]}-{width}.webp'
            image.resize((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS).save(ROOT / target, quality=80, method=6)
            variants.append({'src': target, 'width': width})
        variants.append({'src': source, 'width': image.width})
        manifest[source] = variants
write_json('responsive-images.json', manifest)

for video in (ROOT / 'Videos').glob('*.mp4'):
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '1', '-i', str(video), '-frames:v', '1', '-vf', 'scale=960:-1', '-quality', '80', str(ROOT / 'images/video-posters' / (video.stem + '.webp'))], check=True)
for project in projects:
    for index, demo in enumerate(project['demos']):
        with Image.open(ROOT / demo['src']) as original:
            frame = original.convert('RGB')
            frame.thumbnail((1000, 800))
            frame.save(ROOT / f"images/video-posters/{project['id']}-{index}.webp", quality=80)

sizes = {}
for folder in ('images', 'gifs'):
    for image in (ROOT / folder).rglob('*'):
        if image.suffix.lower() in {'.png', '.jpg', '.jpeg', '.webp', '.gif'}:
            with Image.open(image) as original:
                sizes[image.relative_to(ROOT).as_posix()] = list(original.size)
write_json('image-sizes.json', sizes)
print(f'Prepared responsive images for {len(manifest)} sources, video posters, and dimensions.')

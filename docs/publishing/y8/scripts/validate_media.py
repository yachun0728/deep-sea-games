#!/usr/bin/env python3
"""Local Y8 media preflight; requires Pillow and ffprobe. No network or upload."""
import argparse
from fractions import Fraction
import json
import math
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlparse

IMAGES = {
    'standard': (760, 570, 2_000_000, 6),
    'widescreen': (1280, 720, 5_000_000, 6),
    'landscape_promo': (1920, 1080, 5_000_000, 3),
    'portrait_promo': (1080, 1920, 5_000_000, 3),
    'card_promo': (760, 570, 2_000_000, 3),
}
VIDEOS = {'gameplay': 1, 'gameplay_4_3': 0}


def check_video(data, optional=False):
    """Return metadata or raise on invalid ffprobe output."""
    fmt = data['format']
    if not {'mov', 'mp4'}.intersection(fmt['format_name'].split(',')):
        raise ValueError('Container must be MP4/MOV')
    streams = [s for s in data['streams'] if s.get('codec_type') == 'video'
               and not s.get('disposition', {}).get('attached_pic')]
    if len(streams) != 1:
        raise ValueError('Expected one video stream')
    s = streams[0]
    w, h = s['width'], s['height']
    rotation = float(s.get('tags', {}).get('rotate', 0))
    rotations = [float(x['rotation']) for x in s.get('side_data_list', []) if 'rotation' in x]
    if rotation % 360 or any(r % 360 for r in rotations):
        raise ValueError('Normalize rotation before validation (local policy)')
    if s.get('sample_aspect_ratio', '1:1') not in ('1:1', 'N/A'):
        raise ValueError('Normalize non-square pixels (local policy)')
    if optional:
        if (w, h) != (960, 720):
            raise ValueError('4:3 video must be exactly 960x720')
    elif w < 1280 or h < 720 or w * 9 != h * 16:
        raise ValueError('Gameplay video must be 16:9 and at least 1280x720')
    dar = s.get('display_aspect_ratio')
    if dar and dar != 'N/A' and Fraction(dar.replace(':', '/')) != Fraction(w, h):
        raise ValueError('Display aspect ratio differs from pixel dimensions')
    # Stream duration is mandatory so a long audio track cannot hide short gameplay.
    duration = float(s['duration'])
    if not math.isfinite(duration) or duration < 15:
        raise ValueError('Video stream must be at least 15 seconds')
    return {'width': w, 'height': h, 'duration_seconds': duration,
            'codec': s.get('codec_name'), 'container': fmt['format_name']}


def validate(manifest):
    report = {'technical_pass': False, 'submission_ready': False,
              'rules_verified_on': '2026-11-23', 'errors': [], 'files': [],
              'manual_checks_required': ['Current official rules', 'Real gameplay and continuous footage',
                  'Rights and prohibited promotional content', 'Portal previews and game/SDK QA',
                  'Explicit authorization before external actions']}
    errors = report['errors']
    try:
        obj = json.loads(manifest.read_text(encoding='utf-8'))
        if not isinstance(obj, dict):
            raise ValueError('Manifest must be an object')
        for key in ('game_name', 'game_url', 'asset_path'):
            if not isinstance(obj.get(key), str) or not obj[key].strip():
                raise ValueError(f'Missing nonempty string: {key}')
        url = urlparse(obj['game_url'])
        if url.scheme not in ('http', 'https') or not url.hostname or url.hostname.endswith('.invalid'):
            raise ValueError('Set a real HTTP(S) game_url, not the example URL')
        report['game_name'] = obj['game_name']
        report['game_url'] = obj['game_url']
        root = (manifest.parent / obj['asset_path']).resolve()
        if not root.is_dir():
            raise ValueError('asset_path directory is missing')
        media = obj['media']
        if not isinstance(media, dict):
            raise ValueError('media must be an object')
        for key in set(media) - set(IMAGES) - set(VIDEOS):
            errors.append(f'Unknown media slot: {key}')
        seen = set()
        for slot in (*IMAGES, *VIDEOS):
            names = media.get(slot, [])
            minimum = 1 if slot in IMAGES else VIDEOS[slot]
            maximum = IMAGES[slot][3] if slot in IMAGES else 1
            if not isinstance(names, list):
                errors.append(f'{slot}: expected an array')
                continue
            if not minimum <= len(names) <= maximum:
                errors.append(f'{slot}: count {len(names)}; expected {minimum}..{maximum}')
            for name in names:
                entry = {'slot': slot, 'path': name, 'pass': False}
                report['files'].append(entry)
                try:
                    if not isinstance(name, str) or not name or Path(name).is_absolute():
                        raise ValueError('File must be a relative path')
                    p = (root / name).resolve()
                    if root not in p.parents:
                        raise ValueError('File escapes asset_path')
                    # A file may serve multiple slots but each slot must list it only once.
                    identity = (slot, p)
                    if identity in seen:
                        raise ValueError('Duplicate file within slot')
                    seen.add(identity)
                    size = p.stat().st_size
                    entry['bytes'] = size
                    limit = IMAGES[slot][2] if slot in IMAGES else 50_000_000
                    if not 0 < size <= limit:
                        raise ValueError(f'File size {size} outside 1..{limit} bytes')
                    ext = p.suffix.lower()
                    if slot in IMAGES:
                        from PIL import Image
                        if ext not in ('.jpg', '.jpeg', '.png'):
                            raise ValueError('Image extension must be JPG/PNG')
                        with Image.open(p) as im:
                            actual_format, dimensions = im.format, im.size
                            im.verify()
                        expected = 'PNG' if ext == '.png' else 'JPEG'
                        if actual_format != expected:
                            raise ValueError('Extension does not match decoded image format')
                        if dimensions != IMAGES[slot][:2]:
                            raise ValueError(f'Wrong dimensions: {dimensions}; expected {IMAGES[slot][:2]}')
                        with Image.open(p) as im:
                            im.load()
                            if getattr(im, 'n_frames', 1) != 1:
                                raise ValueError('Animated images require a static export (local policy)')
                            if im.getexif().get(274, 1) != 1:
                                raise ValueError('Normalize EXIF orientation (local policy)')
                        entry.update(width=dimensions[0], height=dimensions[1], format=actual_format)
                    else:
                        if ext not in ('.mp4', '.mov'):
                            raise ValueError('Video extension must be MP4/MOV')
                        proc = subprocess.run(['ffprobe', '-v', 'error', '-show_streams',
                            '-show_format', '-of', 'json', str(p)], capture_output=True,
                            text=True, check=True, timeout=60)
                        entry.update(check_video(json.loads(proc.stdout), slot == 'gameplay_4_3'))
                    entry['pass'] = True
                except Exception as exc:
                    entry['error'] = str(exc)
                    errors.append(f'{slot}/{name}: {exc}')
    except Exception as exc:
        errors.append(str(exc))
    report['technical_pass'] = not errors
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    args = parser.parse_args()
    result = validate(args.manifest.resolve())
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['technical_pass'] else 1


if __name__ == '__main__':
    sys.exit(main())

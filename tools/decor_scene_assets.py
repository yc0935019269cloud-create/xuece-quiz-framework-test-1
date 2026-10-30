"""Shared scene validation: opacity, pixel grid, and measured floor alignment."""
from pathlib import Path
import numpy as np
from PIL import Image

TIMES = ('morning', 'day', 'dusk', 'night')
SIZE = (1536, 384)


def scene_image(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root) or not path.is_file():
        raise ValueError(f'missing scene: {relative}')
    with Image.open(path) as opened:
        if opened.mode not in ('RGB', 'RGBA'):
            raise ValueError(f'{relative}: expected RGB or RGBA')
        image = opened.convert('RGBA')
    if image.size != SIZE:
        raise ValueError(f'{relative}: expected 1536x384')
    if image.getchannel('A').getextrema() != (255, 255):
        raise ValueError(f'{relative}: expected full opacity')
    small = image.resize((512, 128), Image.Resampling.NEAREST)
    if small.resize(SIZE, Image.Resampling.NEAREST).tobytes() != image.tobytes():
        raise ValueError(f'{relative}: expected exact 3x pixel blocks')
    if small.convert('RGB').getcolors(128) is None:
        raise ValueError(f'{relative}: expected at most 128 palette colours')
    return image.convert('RGB')


def ground_edges(image, anchor=None):
    """Strong horizontal transition in 48 column bands in the bottom 35%.

    Locate the floor in the original first; measure the SAME boundary in each
    variant within +/-24px. RGB distance retains edges under hue/light changes.
    Averaging narrow column bands suppresses grass/snow speckles. Returning all
    column positions catches sloping or locally shifted floors as well as offsets.
    """
    a = np.asarray(image, dtype=float).reshape(384, 48, 32, 3).mean(axis=2)
    a = (a[:-2] + a[1:-1] + a[2:]) / 3
    edge = np.linalg.norm(a[3:] - a[:-3], axis=2)
    # Index corresponds to the centre of the transition, in full-size pixels.
    rows = np.arange(len(edge)) + 2
    if anchor is None:
        mask = (rows >= 250) & (rows <= 318)
        score = np.median(edge, axis=1)
        anchor = int(rows[np.where(mask)[0][np.argmax(score[mask])]])
    mask = (rows >= anchor - 24) & (rows <= anchor + 24)
    indices = np.where(mask)[0]
    return rows[indices[np.argmax(edge[mask], axis=0)]], anchor


def validate_scene(root, entry):
    problems = []
    details = {}
    try:
        scene_image(root, entry['file'])
        original = scene_image(root, f"assets/decor/scenes/{entry['id']}.png")
        reference, anchor = ground_edges(original)
        tod = entry.get('tod', {})
        if set(tod) != set(TIMES):
            raise ValueError('tod must contain exactly morning/day/dusk/night')
        measured = {}
        for time in TIMES:
            expected = f"assets/decor/scenes/{entry['id']}_{time}.png"
            if tod[time] != expected:
                raise ValueError(f'{time}: expected {expected}')
            image = scene_image(root, tod[time])
            measured[time], _ = ground_edges(image, anchor)
        pairs = {}
        # Include the untouched original, so four equally shifted variants fail.
        all_edges = {'original': reference, **measured}
        names = list(all_edges)
        for i, first in enumerate(names):
            for second in names[i + 1:]:
                delta = float(np.median(np.abs(all_edges[first] - all_edges[second])))
                pairs[f'{first}/{second}'] = delta
                if delta > 3:
                    problems.append(f'ground alignment {first}/{second}: {delta}px > 3px')
        details = {'anchorRow': anchor, 'method': 'RGB edge detection in 48 column bands; pairwise median absolute row distance',
                   'medianRows': {k: float(np.median(v)) for k, v in all_edges.items()},
                   'pairwiseMedianDeltaPx': pairs, 'tolerancePx': 3}
    except (OSError, ValueError, KeyError, TypeError) as exc:
        problems.append(str(exc))
    return problems, details

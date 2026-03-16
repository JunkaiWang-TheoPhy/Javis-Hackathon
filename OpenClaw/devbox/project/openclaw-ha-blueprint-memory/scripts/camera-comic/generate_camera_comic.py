#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from typing import Any


VALID_SOURCES = {"localpc", "localmac"}
DEFAULT_OUTPUT_DIR = Path.home() / ".openclaw" / "workspace" / "comic"


def build_comic_prompt() -> str:
    return (
        "Transform the source photo into a vivid comic-style illustration. "
        "Keep the main scene recognizable, boost linework and posterized color, "
        "and add a clearly visible lobster in a prominent position."
    )


def _parse_timestamp(raw_value: str) -> datetime:
    value = raw_value.strip()
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def build_output_stem(source: str, captured_at: str) -> str:
    if source not in VALID_SOURCES:
        raise ValueError(f"Unsupported source: {source}")
    stamp = _parse_timestamp(captured_at).strftime("%Y%m%dT%H%M%SZ")
    return f"{stamp}-{source}-comic"


def _load_metadata(metadata_path: Path | None) -> dict[str, Any]:
    if metadata_path is None or not metadata_path.exists():
        return {}
    with metadata_path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, dict):
        raise ValueError(f"Metadata must be an object: {metadata_path}")
    return data


def _resolve_captured_at(metadata: dict[str, Any], override: str | None) -> str:
    if override:
        return _parse_timestamp(override).isoformat().replace("+00:00", "Z")

    for key in ("capturedAt", "captured_at", "timestamp", "createdAt"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            return _parse_timestamp(value).isoformat().replace("+00:00", "Z")

    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _require_pillow():
    try:
        from PIL import Image  # noqa: F401
        from PIL import ImageChops  # noqa: F401
        from PIL import ImageDraw  # noqa: F401
        from PIL import ImageEnhance  # noqa: F401
        from PIL import ImageFilter  # noqa: F401
        from PIL import ImageOps  # noqa: F401
    except ImportError as exc:
        raise SystemExit(
            "Pillow is not installed on this machine. Install it with `python3 -m pip install --user pillow`."
        ) from exc


def _starburst_points(cx: float, cy: float, outer_r: float, inner_r: float, spikes: int) -> list[tuple[float, float]]:
    import math

    points: list[tuple[float, float]] = []
    for index in range(spikes * 2):
        angle = (math.pi / spikes) * index - math.pi / 2
        radius = outer_r if index % 2 == 0 else inner_r
        points.append((cx + math.cos(angle) * radius, cy + math.sin(angle) * radius))
    return points


def _draw_lobster_overlay(image):
    from PIL import ImageDraw

    width, height = image.size
    overlay = image.copy()
    draw = ImageDraw.Draw(overlay, "RGBA")

    badge_size = int(min(width, height) * 0.22)
    badge_padding = max(18, badge_size // 8)
    badge_cx = width - badge_padding - badge_size // 2
    badge_cy = badge_padding + badge_size // 2

    burst = _starburst_points(
        badge_cx,
        badge_cy,
        outer_r=badge_size * 0.6,
        inner_r=badge_size * 0.38,
        spikes=12,
    )
    draw.polygon(burst, fill=(255, 245, 110, 220), outline=(255, 255, 255, 255))

    body_color = (214, 38, 38, 255)
    body_shadow = (110, 10, 10, 130)
    outline = (255, 255, 255, 255)

    left = badge_cx - badge_size * 0.18
    right = badge_cx + badge_size * 0.18
    top = badge_cy - badge_size * 0.18
    bottom = badge_cy + badge_size * 0.18

    draw.ellipse((left + 3, top + 5, right + 3, bottom + 5), fill=body_shadow)
    draw.ellipse((left, top, right, bottom), fill=body_color, outline=outline, width=4)

    tail = [
        (badge_cx, bottom + badge_size * 0.12),
        (badge_cx - badge_size * 0.11, bottom - badge_size * 0.02),
        (badge_cx + badge_size * 0.11, bottom - badge_size * 0.02),
    ]
    draw.polygon([(x + 3, y + 5) for x, y in tail], fill=body_shadow)
    draw.polygon(tail, fill=body_color, outline=outline)

    claw_y = badge_cy - badge_size * 0.08
    claw_offset = badge_size * 0.33
    claw_radius = badge_size * 0.11

    for direction in (-1, 1):
        arm_x = badge_cx + direction * badge_size * 0.12
        outer_x = badge_cx + direction * claw_offset
        draw.line(
            [(arm_x, badge_cy - badge_size * 0.08), (outer_x, claw_y)],
            fill=outline,
            width=8,
        )
        draw.line(
            [(arm_x, badge_cy - badge_size * 0.08), (outer_x, claw_y)],
            fill=body_color,
            width=4,
        )
        draw.ellipse(
            (
                outer_x - claw_radius,
                claw_y - claw_radius,
                outer_x + claw_radius,
                claw_y + claw_radius,
            ),
            fill=body_color,
            outline=outline,
            width=3,
        )
        pinch = [
            (outer_x, claw_y),
            (outer_x + direction * badge_size * 0.16, claw_y - badge_size * 0.08),
            (outer_x + direction * badge_size * 0.09, claw_y + badge_size * 0.02),
        ]
        pinch_2 = [
            (outer_x, claw_y),
            (outer_x + direction * badge_size * 0.16, claw_y + badge_size * 0.08),
            (outer_x + direction * badge_size * 0.09, claw_y - badge_size * 0.02),
        ]
        draw.polygon(pinch, fill=body_color, outline=outline)
        draw.polygon(pinch_2, fill=body_color, outline=outline)

    for leg_index in range(4):
        leg_y = badge_cy + badge_size * (-0.03 + leg_index * 0.08)
        leg_span = badge_size * (0.2 + leg_index * 0.03)
        for direction in (-1, 1):
            start_x = badge_cx + direction * badge_size * 0.08
            mid_x = badge_cx + direction * leg_span
            end_x = badge_cx + direction * (leg_span + badge_size * 0.1)
            points = [(start_x, leg_y), (mid_x, leg_y + badge_size * 0.05), (end_x, leg_y + badge_size * 0.1)]
            draw.line(points, fill=outline, width=6)
            draw.line(points, fill=body_color, width=3)

    for direction in (-1, 1):
        eye_x = badge_cx + direction * badge_size * 0.07
        eye_top = top - badge_size * 0.12
        eye_bottom = top + badge_size * 0.02
        draw.line([(eye_x, top + badge_size * 0.02), (eye_x, eye_top)], fill=outline, width=4)
        draw.line([(eye_x, top + badge_size * 0.02), (eye_x, eye_top)], fill=body_color, width=2)
        draw.ellipse(
            (eye_x - badge_size * 0.025, eye_top - badge_size * 0.025, eye_x + badge_size * 0.025, eye_top + badge_size * 0.025),
            fill=(255, 255, 255, 255),
            outline=outline,
            width=2,
        )
        draw.ellipse(
            (eye_x - badge_size * 0.01, eye_top - badge_size * 0.01, eye_x + badge_size * 0.01, eye_top + badge_size * 0.01),
            fill=(20, 20, 20, 255),
        )

    return overlay


def render_comic_image(input_path: Path, output_path: Path) -> None:
    _require_pillow()

    from PIL import Image
    from PIL import ImageChops
    from PIL import ImageEnhance
    from PIL import ImageFilter
    from PIL import ImageOps

    with Image.open(input_path) as opened:
        image = opened.convert("RGB")

    if max(image.size) > 1600:
        image.thumbnail((1600, 1600))

    base = ImageOps.posterize(image, 3)
    base = ImageEnhance.Color(base).enhance(1.55)
    base = ImageEnhance.Contrast(base).enhance(1.35)
    base = base.filter(ImageFilter.MedianFilter(size=3))

    edges = image.convert("L").filter(ImageFilter.FIND_EDGES)
    edges = ImageOps.autocontrast(edges)
    edges = ImageOps.invert(edges)
    edges = edges.point(lambda px: 255 if px > 96 else 0)
    edge_rgb = Image.merge("RGB", (edges, edges, edges))

    comic = ImageChops.multiply(base, edge_rgb).convert("RGBA")
    comic = _draw_lobster_overlay(comic)

    border = max(12, min(comic.size) // 60)
    framed = ImageOps.expand(comic, border=border, fill=(255, 255, 255, 255))
    framed.save(output_path)


def render_camera_comic(
    *,
    source: str,
    input_path: Path,
    output_dir: Path,
    metadata_path: Path | None = None,
    captured_at: str | None = None,
) -> tuple[Path, Path]:
    metadata = _load_metadata(metadata_path)
    resolved_captured_at = _resolve_captured_at(metadata, captured_at)
    output_dir.mkdir(parents=True, exist_ok=True)

    stem = build_output_stem(source, resolved_captured_at)
    output_path = output_dir / f"{stem}.png"
    sidecar_path = output_dir / f"{stem}.json"

    render_comic_image(input_path, output_path)

    sidecar = {
        "source": source,
        "capturedAt": resolved_captured_at,
        "inputPath": str(input_path),
        "metadataPath": str(metadata_path) if metadata_path else None,
        "outputPath": str(output_path),
        "renderMode": "local-pillow-comic",
        "prompt": build_comic_prompt(),
        "lobsterTheme": True,
        "createdAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    sidecar_path.write_text(json.dumps(sidecar, indent=2), encoding="utf-8")

    return output_path, sidecar_path


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Render a cached camera image into a comic with a lobster overlay.")
    parser.add_argument("--source", required=True, choices=sorted(VALID_SOURCES))
    parser.add_argument("--input", required=True, dest="input_path")
    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
    parser.add_argument("--metadata", dest="metadata_path")
    parser.add_argument("--captured-at")
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    input_path = Path(args.input_path).expanduser().resolve()
    if not input_path.exists():
        print(f"Input image not found: {input_path}", file=sys.stderr)
        return 1

    metadata_path = None
    if args.metadata_path:
        metadata_path = Path(args.metadata_path).expanduser().resolve()
        if not metadata_path.exists():
            print(f"Metadata file not found: {metadata_path}", file=sys.stderr)
            return 1

    output_dir = Path(args.output_dir).expanduser().resolve()

    output_path, sidecar_path = render_camera_comic(
        source=args.source,
        input_path=input_path,
        output_dir=output_dir,
        metadata_path=metadata_path,
        captured_at=args.captured_at,
    )
    print(json.dumps({"output": str(output_path), "sidecar": str(sidecar_path)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

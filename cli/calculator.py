#!/usr/bin/env python3
"""Compute tonearm offset angle and overhang from pivot-to-spindle distance and null points."""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from math import asin, degrees, sqrt
from typing import Dict, Tuple


# Inner/outer null points in millimetres for common alignment schemes.
SCHEMES: Dict[str, Tuple[float, float]] = {
    "Löfgren A / Baerwald": (66.0, 120.9),
    "Löfgren B": (70.3, 116.6),
    "Stevenson": (60.0, 117.0),
    "Rega (factory)": (60.0, 120.0),
    "Technics (JIS-based)": (60.0, 116.0),
}


@dataclass
class Geometry:
    pivot_to_spindle: float
    inner_null: float
    outer_null: float
    effective_length: float
    offset_angle_deg: float
    overhang: float
    linear_offset: float


def calculate_geometry(pivot_to_spindle: float, inner_null: float, outer_null: float) -> Geometry:
    """Return geometry values for the given pivot-to-spindle distance and null points."""
    if pivot_to_spindle <= 0:
        raise ValueError("Pivot-to-spindle distance must be positive.")
    if inner_null <= 0 or outer_null <= 0:
        raise ValueError("Null points must be positive.")
    if inner_null >= outer_null:
        raise ValueError("Inner null must be smaller than outer null.")

    # The math comes from solving the two-null condition:
    #   linear_offset = (r1 + r2) / 2
    #   effective_length = sqrt(S^2 + r1 * r2)
    #   offset_angle = asin(linear_offset / effective_length)
    #   overhang = effective_length - S
    r_product = inner_null * outer_null
    effective_length = sqrt(pivot_to_spindle * pivot_to_spindle + r_product)

    linear_offset = 0.5 * (inner_null + outer_null)
    if linear_offset > effective_length:
        raise ValueError("Geometry impossible: linear offset exceeds effective length.")

    offset_angle_deg = degrees(asin(linear_offset / effective_length))
    overhang = effective_length - pivot_to_spindle

    return Geometry(
        pivot_to_spindle=pivot_to_spindle,
        inner_null=inner_null,
        outer_null=outer_null,
        effective_length=effective_length,
        offset_angle_deg=offset_angle_deg,
        overhang=overhang,
        linear_offset=linear_offset,
    )


def format_geometry(values: Geometry) -> str:
    lines = [
        f"Pivot-to-spindle:  {values.pivot_to_spindle:.2f} mm",
        f"Null points:       {values.inner_null:.2f} mm / {values.outer_null:.2f} mm",
        f"Effective length:  {values.effective_length:.2f} mm",
        f"Offset angle:      {values.offset_angle_deg:.3f} deg",
        f"Overhang:          {values.overhang:.3f} mm",
        f"Linear offset:     {values.linear_offset:.3f} mm",
    ]
    return "\n".join(lines)


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Calculate offset angle and overhang from effective length and null points."
    )
    parser.add_argument(
        "pivot_to_spindle",
        type=float,
        nargs="?",
        help="Pivot-to-spindle distance in millimetres.",
    )

    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--scheme",
        choices=sorted(SCHEMES.keys()),
        help="Alignment scheme to pull null points from schemes.md.",
    )
    group.add_argument(
        "--nulls",
        type=float,
        nargs=2,
        metavar=("INNER", "OUTER"),
        help="Custom inner and outer null points in millimetres.",
    )

    parser.add_argument(
        "--list-schemes",
        action="store_true",
        help="Show the built-in schemes and exit.",
    )
    return parser.parse_args(argv)


def main(argv: list[str]) -> int:
    args = parse_args(argv)

    if args.list_schemes:
        for name, (inner, outer) in SCHEMES.items():
            print(f"{name}: {inner} mm / {outer} mm")
        return 0

    if args.pivot_to_spindle is None:
        print(
            "error: pivot-to-spindle distance is required unless --list-schemes is used",
            file=sys.stderr,
        )
        return 1

    if args.nulls:
        inner, outer = args.nulls
    elif args.scheme:
        inner, outer = SCHEMES[args.scheme]
    else:
        print("error: choose --scheme or provide --nulls", file=sys.stderr)
        return 1

    try:
        geometry = calculate_geometry(args.pivot_to_spindle, inner, outer)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    print(format_geometry(geometry))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

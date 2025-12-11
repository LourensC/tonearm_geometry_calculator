#!/usr/bin/env node
"use strict";

// Compute tonearm offset angle and overhang from pivot-to-spindle distance and null points.

const SCHEMES = {
  "Löfgren A / Baerwald": [66.0, 120.9],
  "Löfgren B": [70.3, 116.6],
  Stevenson: [60.0, 117.0],
  "Rega (factory)": [60.0, 120.0],
  "Technics (JIS-based)": [60.0, 116.0],
};

function calculateGeometry(pivotToSpindle, innerNull, outerNull) {
  if (!(pivotToSpindle > 0)) throw new Error("Pivot-to-spindle distance must be positive.");
  if (!(innerNull > 0 && outerNull > 0)) throw new Error("Null points must be positive.");
  if (innerNull >= outerNull) throw new Error("Inner null must be smaller than outer null.");

  const rProduct = innerNull * outerNull;
  const effectiveLength = Math.sqrt(pivotToSpindle * pivotToSpindle + rProduct);

  const linearOffset = 0.5 * (innerNull + outerNull);
  if (linearOffset > effectiveLength) {
    throw new Error("Geometry impossible: linear offset exceeds effective length.");
  }

  const offsetAngleDeg = (Math.asin(linearOffset / effectiveLength) * 180) / Math.PI;
  const overhang = effectiveLength - pivotToSpindle;

  return {
    pivotToSpindle,
    innerNull,
    outerNull,
    effectiveLength,
    offsetAngleDeg,
    overhang,
    linearOffset,
  };
}

function formatGeometry(values) {
  const fmt = (n, digits = 3) => n.toFixed(digits);
  return [
    `Pivot-to-spindle:  ${fmt(values.pivotToSpindle, 2)} mm`,
    `Null points:       ${fmt(values.innerNull, 2)} mm / ${fmt(values.outerNull, 2)} mm`,
    `Effective length:  ${fmt(values.effectiveLength, 2)} mm`,
    `Offset angle:      ${fmt(values.offsetAngleDeg)} deg`,
    `Overhang:          ${fmt(values.overhang)} mm`,
    `Linear offset:     ${fmt(values.linearOffset)} mm`,
  ].join("\n");
}

function parseArgs(argv) {
  const args = { pivotToSpindle: null, scheme: null, nulls: null, listSchemes: false };
  const rest = [...argv];

  while (rest.length > 0) {
    const token = rest.shift();
    switch (token) {
      case "--scheme": {
        if (args.scheme || args.nulls) throw new Error("Choose only one of --scheme or --nulls.");
        const name = rest.shift();
        if (!name) throw new Error("--scheme requires a value.");
        args.scheme = name;
        break;
      }
      case "--nulls": {
        if (args.scheme || args.nulls) throw new Error("Choose only one of --scheme or --nulls.");
        const inner = parseFloat(rest.shift());
        const outer = parseFloat(rest.shift());
        if (!Number.isFinite(inner) || !Number.isFinite(outer)) {
          throw new Error("--nulls requires two numeric values.");
        }
        args.nulls = [inner, outer];
        break;
      }
      case "--list-schemes":
        args.listSchemes = true;
        break;
      default: {
        if (token.startsWith("--")) throw new Error(`Unknown flag: ${token}`);
        if (args.pivotToSpindle !== null) throw new Error("Pivot-to-spindle distance already provided.");
        const len = parseFloat(token);
        if (!Number.isFinite(len)) throw new Error("Pivot-to-spindle distance must be numeric.");
        args.pivotToSpindle = len;
      }
    }
  }

  return args;
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }

  if (args.listSchemes) {
    Object.entries(SCHEMES).forEach(([name, [inner, outer]]) => {
      console.log(`${name}: ${inner} mm / ${outer} mm`);
    });
    return;
  }

  if (args.pivotToSpindle === null) {
    console.error("error: pivot-to-spindle distance is required unless --list-schemes is used");
    process.exit(1);
  }

  let innerNull;
  let outerNull;
  if (args.nulls) {
    [innerNull, outerNull] = args.nulls;
  } else if (args.scheme) {
    if (!Object.prototype.hasOwnProperty.call(SCHEMES, args.scheme)) {
      console.error(`error: unknown scheme '${args.scheme}'`);
      process.exit(1);
    }
    [innerNull, outerNull] = SCHEMES[args.scheme];
  } else {
    console.error("error: choose --scheme or provide --nulls");
    process.exit(1);
  }

  try {
    const geometry = calculateGeometry(args.pivotToSpindle, innerNull, outerNull);
    console.log(formatGeometry(geometry));
  } catch (err) {
    console.error(`error: ${err.message}`);
    process.exit(1);
  }
}

main();

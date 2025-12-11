# Alignment Schemes

| Alignment Scheme     | Inner Null Point (mm) | Outer Null Point (mm) |
| -------------------- | --------------------- | --------------------- |
| Löfgren A / Baerwald | 66.0 mm               | 120.9 mm              |
| Löfgren B            | 70.3 mm               | 116.6 mm              |
| Stevenson            | 60.0 mm               | 117.0 mm              |
| Rega (factory)       | 60.0 mm               | 120.0 mm              |
| Technics (JIS-based) | 60 mm                 | 116 mm                |

## Calculating offset and overhang

Let `S` be the pivot-to-spindle distance and `r1`, `r2` be the inner and outer null points:

- Linear offset = `(r1 + r2) / 2`
- Effective length = `sqrt(S^2 + r1 * r2)`
- Offset angle (deg) = `asin(linear offset / effective length)`
- Overhang = `effective length - S`

Run `calculator.py` to do the math for you, e.g.:

```
python calculator.py 212 --scheme "Löfgren A / Baerwald"
```

Or use the JavaScript version:

```
node calculator.js 212 --scheme "Löfgren A / Baerwald"
```

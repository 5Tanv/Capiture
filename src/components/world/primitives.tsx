// Small SVG building blocks for the pixel worlds. All coordinates are in
// world pixels. The core composition lives in x 0–320; scenes extend to
// x −100–420 (2.6:1, the stage's widest) so wide stages reveal more world instead of cropping it.

export function R({ x, y, w, h, c }: { x: number; y: number; w: number; h: number; c: string }) {
  return <rect x={x} y={y} width={w} height={h} fill={c} />
}

/** A pixel circle built from one rect per row. */
export function Disc({ cx, cy, r, c }: { cx: number; cy: number; r: number; c: string }) {
  const rows = []
  for (let dy = -r; dy <= r; dy++) {
    const half = Math.floor(Math.sqrt(r * r - dy * dy))
    rows.push(<rect key={dy} x={cx - half} y={cy + dy} width={half * 2} height={1} fill={c} />)
  }
  return <>{rows}</>
}

/** Horizontal bands from top to bottom; each entry is [height, color]. */
export function Bands({ y = 0, bands }: { y?: number; bands: [number, string][] }) {
  let top = y
  return (
    <>
      {bands.map(([h, c], i) => {
        const el = <rect key={i} x={-100} y={top} width={520} height={h} fill={c} />
        top += h
        return el
      })}
    </>
  )
}

export function Cloud({ x, y, className }: { x: number; y: number; className?: string }) {
  return (
    <g className={className}>
      <Disc cx={x} cy={y + 2} r={7} c="#d6eef6" />
      <Disc cx={x + 11} cy={y - 2} r={9} c="#d6eef6" />
      <Disc cx={x + 23} cy={y + 2} r={7} c="#d6eef6" />
      <Disc cx={x} cy={y} r={7} c="#ffffff" />
      <Disc cx={x + 11} cy={y - 4} r={9} c="#ffffff" />
      <Disc cx={x + 23} cy={y} r={7} c="#ffffff" />
      <R x={x - 4} y={y + 2} w={34} h={6} c="#ffffff" />
      <R x={x - 4} y={y + 8} w={34} h={2} c="#d6eef6" />
    </g>
  )
}

export function Tree({ x, base, size = 1, sway }: { x: number; base: number; size?: number; sway?: boolean }) {
  const r = Math.round(14 * size)
  const trunkH = Math.round(16 * size)
  const top = base - trunkH
  return (
    <g>
      <R x={x - 3} y={top} w={6} h={trunkH} c="#6b4026" />
      <R x={x - 3} y={top} w={2} h={trunkH} c="#8c5a34" />
      <R x={x - 7} y={base - 1} w={14} h={2} c="#2f8a3b" />
      <g className={sway ? 'anim-sway' : undefined}>
        <Disc cx={x} cy={top - r + 4} r={r} c="#24713a" />
        <Disc cx={x - 2} cy={top - r + 2} r={r - 2} c="#2f8a3b" />
        <Disc cx={x - 4} cy={top - r} r={Math.max(3, r - 6)} c="#46a84a" />
        <Disc cx={x - 6} cy={top - r - 3} r={Math.max(2, r - 10)} c="#7ad35a" />
      </g>
    </g>
  )
}

export function Window({ x, y, lit, flicker }: { x: number; y: number; lit?: boolean; flicker?: boolean }) {
  return (
    <g>
      <R x={x} y={y} w={12} h={16} c="#f6e7c8" />
      <R x={x + 2} y={y + 2} w={8} h={12} c={lit ? '#ffe28a' : '#3a6f9a'} />
      {lit && flicker && <R x={x + 2} y={y + 2} w={8} h={12} c="#fff6c8" />}
      {!lit && <R x={x + 2} y={y + 2} w={3} h={5} c="#7fb4d6" />}
      <R x={x + 5} y={y + 2} w={2} h={12} c="#f6e7c8" />
      <R x={x + 2} y={y + 7} w={8} h={2} c="#f6e7c8" />
      <R x={x - 1} y={y + 16} w={14} h={2} c="#c9b48a" />
    </g>
  )
}

export function Flowers({ spots }: { spots: [number, number, string][] }) {
  return (
    <>
      {spots.map(([x, y, c], i) => (
        <g key={i}>
          <R x={x} y={y + 2} w={1} h={2} c="#2f8a3b" />
          <R x={x - 1} y={y} w={3} h={2} c={c} />
        </g>
      ))}
    </>
  )
}

/** Deterministic pseudo-random sequence so scenes render identically every time. */
export function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

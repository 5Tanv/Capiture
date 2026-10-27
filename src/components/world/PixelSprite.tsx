import { memo, useMemo } from 'react'

export type Palette = Record<string, string>

export interface SpriteDef {
  grid: string[]
  palette: Palette
}

interface Run {
  x: number
  y: number
  w: number
  fill: string
}

// Merge horizontal runs of the same color into one rect to keep the DOM small.
function toRuns(grid: string[], palette: Palette): Run[] {
  const runs: Run[] = []
  grid.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      const ch = row[x]
      let end = x + 1
      while (end < row.length && row[end] === ch) end++
      const fill = palette[ch]
      if (fill) runs.push({ x, y, w: end - x, fill })
      x = end
    }
  })
  return runs
}

/** Pixel art drawn inside an existing <svg>. Coordinates are in sprite pixels. */
export const PixelGroup = memo(function PixelGroup({
  sprite,
  rows,
  x = 0,
  y = 0,
  scale = 1,
  className,
}: {
  sprite: SpriteDef
  rows?: [number, number]
  x?: number
  y?: number
  scale?: number
  className?: string
}) {
  const runs = useMemo(() => {
    const grid = rows ? sprite.grid.slice(rows[0], rows[1]) : sprite.grid
    return toRuns(grid, sprite.palette)
  }, [sprite, rows])
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className={className}>
        {runs.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
        ))}
      </g>
    </g>
  )
})

/** Standalone pixel sprite, scaled crisply to whatever size CSS gives it. */
export function PixelSprite({
  sprite,
  rows,
  className,
  label,
}: {
  sprite: SpriteDef
  rows?: [number, number]
  className?: string
  label?: string
}) {
  const grid = rows ? sprite.grid.slice(rows[0], rows[1]) : sprite.grid
  const width = Math.max(...grid.map((r) => r.length))
  return (
    <svg
      viewBox={`0 0 ${width} ${grid.length}`}
      shapeRendering="crispEdges"
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <PixelGroup sprite={sprite} rows={rows} />
    </svg>
  )
}

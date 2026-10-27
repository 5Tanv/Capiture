import type { TitleIcon, TitleItem } from '../../data/shop'

const ICONS: Record<TitleIcon, string[]> = {
  coin: ['.xxx.', 'x...x', 'x.x.x', 'x...x', '.xxx.'],
  leaf: ['...xx', '..xxx', '.xxx.', 'xxx..', 'x....'],
  star: ['..x..', '..x..', 'xxxxx', '.xxx.', 'x...x'],
  crown: ['x.x.x', 'xxxxx', 'xxxxx', 'xxxxx', '.xxx.'],
}

function PixelIcon({ name, color }: { name: TitleIcon; color: string }) {
  const rows = ICONS[name]
  return (
    <svg viewBox="0 0 5 5" shapeRendering="crispEdges" className="h-[1.05em] w-[1.05em] shrink-0" aria-hidden>
      {rows.flatMap((row, y) => [...row].map((c, x) => (c === 'x' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null)))}
    </svg>
  )
}

const NOTCH = (n: string) =>
  `polygon(0 ${n}, ${n} ${n}, ${n} 0, calc(100% - ${n}) 0, calc(100% - ${n}) ${n}, 100% ${n}, 100% calc(100% - ${n}), calc(100% - ${n}) calc(100% - ${n}), calc(100% - ${n}) 100%, ${n} 100%, ${n} calc(100% - ${n}), 0 calc(100% - ${n}))`

/**
 * A purchased cosmetic title: real text on a pixel plaque with its own opaque backing, so it
 * reads over every background. The text is always rendered as a text node (React escapes it).
 * Sized from the stage it sits in (container query units) and wraps to two short lines.
 */
export function TitlePlaque({ item, className = '', fixed = false }: { item: TitleItem; className?: string; fixed?: boolean }) {
  return (
    <span className={`inline-flex max-w-full drop-shadow-[0_2px_0_rgb(0_0_0/0.55)] ${className}`} data-title-plaque>
      <span className="block max-w-full p-[2px]" style={{ background: '#1b1210', clipPath: NOTCH('3px') }}>
        <span
          className="flex max-w-full items-center justify-center gap-[0.45em] px-[0.8em] py-[0.35em] text-center font-pixel leading-[1.08] font-bold"
          style={{
            background: item.bg,
            color: item.fg,
            clipPath: NOTCH('2px'),
            boxShadow: 'inset 0 2px 0 rgb(255 255 255 / 0.16), inset 0 -2px 0 rgb(0 0 0 / 0.28)',
            fontSize: fixed ? '14px' : 'clamp(11px, 4.2cqw, 16px)',
          }}
        >
          <PixelIcon name={item.icon} color={item.fg} />
          <span className="min-w-0 [overflow-wrap:anywhere] [text-wrap:balance]">{item.text}</span>
        </span>
      </span>
    </span>
  )
}

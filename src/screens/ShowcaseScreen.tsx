import type { ReactNode } from 'react'
import { CharacterPortrait, CharacterSprite, SvgCharacter } from '../components/sprite/CharacterSprite'
import { Icon } from '../components/ui/Icon'
import { scenes } from '../components/world/scenes'
import { icons, type IconName } from '../components/world/sprites'
import { lifeOrder } from '../data/lives'
import { accountPreset, hairStyles, lifePresets, randomAppearance, tops, type Appearance } from '../sprites/catalog'
import { lifeThemes } from '../theme/lifeThemes'
import type { SceneId } from '../types/game'

const swatches: { group: string; items: [string, string][] }[] = [
  { group: 'Identity', items: [['Forest', '#263d35'], ['Sage', '#63866f'], ['Warm gold', '#e8b452'], ['Cream', '#f1e6cc'], ['Wood', '#9a6545'], ['Ink', '#241a16']] },
  { group: 'Financial meaning (never themed)', items: [['Gain', '#4bb36b'], ['Loss / debt', '#d65a3f'], ['Learning', '#3f9fd6'], ['FiCoins', '#e8b452']] },
]

function Sheet({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="txt-game-sm text-xl">{title}</h2>
        {note && <p className="text-[13px] font-semibold text-sage-300">{note}</p>}
      </div>
      {children}
    </section>
  )
}

/**
 * The art-direction sheet (#/showcase): tokens, surfaces, icons, sprites and
 * scenes side by side, so anything that does not belong is obvious.
 */
export function ShowcaseScreen() {
  const base = { ...lifePresets.freshman, pack: 'none' as const }
  const looks: Appearance[] = [...lifeOrder.map((id) => lifePresets[id]), accountPreset, ...[11, 23, 37, 51, 64, 88].map((s) => randomAppearance(s))]
  const sceneIds: SceneId[] = ['campus', 'dorm', 'suburb', 'city', 'arena']
  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 py-6 lg:px-6">
      <header>
        <p className="font-pixel text-[13px] text-brass-400">CAPITURE · ART DIRECTION SHEET</p>
        <h1 className="txt-game text-4xl">One world, four lives</h1>
        <p className="mt-1 max-w-[46rem] text-[14px] font-semibold text-sage-300">
          Everything on this page comes from the same tokens, the same 16 px icon grid and the same 32×48 sprite system. See ART_DIRECTION.md.
        </p>
      </header>

      <Sheet title="Palette">
        <div className="grid gap-4 md:grid-cols-2">
          {swatches.map((g) => (
            <div key={g.group} className="surface-utility p-3">
              <p className="mb-2 text-[12px] font-extrabold tracking-wide text-sage-300 uppercase">{g.group}</p>
              <div className="flex flex-wrap gap-2">
                {g.items.map(([n, c]) => (
                  <span key={n} className="flex flex-col items-center gap-1">
                    <span className="h-12 w-16 rounded-[8px] border-2 border-ink" style={{ background: c }} />
                    <span className="text-[11px] font-bold">{n}</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {lifeOrder.map((id) => {
            const t = lifeThemes[id]
            return (
              <div key={id} className="surface-utility flex items-center gap-3 p-3">
                <CharacterPortrait appearance={lifePresets[id]} className="h-12 w-12 shrink-0 rounded-[8px] border-2 border-ink" />
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold">{t.mood}</p>
                  <div className="mt-1 flex gap-1">
                    {[t.accent, t.accent2, t.deep, t.tint].map((c) => (
                      <span key={c} className="h-5 w-7 rounded-[4px] border-2 border-ink" style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Sheet>

      <Sheet title="Surfaces" note="Each surface has one job. Wood frames only the world and the event.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="panel-wood grid h-28 place-items-center text-[14px] font-extrabold">Game frame</div>
          <div className="surface-reading grid h-28 place-items-center text-[14px] font-extrabold">Reading</div>
          <div className="surface-hud grid h-28 place-items-center text-[14px] font-extrabold">HUD</div>
          <div className="surface-collection grid h-28 grid-cols-3 gap-2 p-3">
            <span className="slot grid place-items-center">
              <Icon name="medal" className="h-8 w-8" />
            </span>
            <span className="slot grid place-items-center">
              <Icon name="gift" className="h-8 w-8" />
            </span>
            <span className="slot-empty grid place-items-center">
              <Icon name="lock" className="h-6 w-6 opacity-60" />
            </span>
          </div>
          <div className="surface-utility grid h-28 place-items-center text-[14px] font-extrabold text-sage-300">Utility</div>
          <div className="flex h-28 flex-wrap items-center justify-center gap-3">
            <span className="btn-3d btn-gold min-h-12 rounded-[12px] px-5">
              <span className="txt-game text-lg leading-none">PRIMARY</span>
            </span>
            <span className="btn-3d btn-teal min-h-12 rounded-[12px] px-4 text-white">
              <span className="txt-game-sm text-[15px]">Secondary</span>
            </span>
            <span className="btn-3d btn-parch min-h-12 rounded-[12px] px-4 text-[14px] font-extrabold">Quiet</span>
          </div>
        </div>
      </Sheet>

      <Sheet title="Icons" note="16×16 grid, generated 1 px ink outline, light from the top-left.">
        <div className="surface-collection grid grid-cols-4 gap-3 p-3 sm:grid-cols-8 lg:grid-cols-12">
          {(Object.keys(icons) as IconName[]).filter((n) => n !== 'arrow' && n !== 'cap').map((n) => (
            <figure key={n} className="slot flex flex-col items-center gap-1 p-2">
              <Icon name={n} className="h-10 w-10" />
              <figcaption className="text-[11px] font-bold text-sage-300">{n}</figcaption>
            </figure>
          ))}
        </div>
      </Sheet>

      <Sheet title="Characters" note="One layered 32×48 sprite system for every life, the account and NPCs.">
        <div className="flex flex-wrap items-end gap-5 rounded-[16px] border-[3px] border-ink bg-[#8fd6ee] p-5">
          {looks.map((a, i) => (
            <CharacterSprite key={i} appearance={a} className="w-24" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="surface-reading flex flex-wrap gap-3 p-4">
            {hairStyles.map((h) => (
              <figure key={h.id} className="flex flex-col items-center gap-1">
                <CharacterPortrait appearance={{ ...base, hair: h.id }} className="h-16 w-16 rounded-[8px] border-2 border-ink bg-[#cfe9f3]" />
                <figcaption className="text-[11px] font-bold">{h.name}</figcaption>
              </figure>
            ))}
          </div>
          <div className="surface-reading flex flex-wrap gap-3 p-4">
            {tops.map((t) => (
              <figure key={t.id} className="flex flex-col items-center gap-1">
                <CharacterSprite appearance={{ ...base, top: t.id }} animate={false} className="w-14" />
                <figcaption className="text-[11px] font-bold">{t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </Sheet>

      <Sheet title="Scenes" note="Reusable locations. Events point at one with sceneId.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sceneIds.map((id) => {
            const scene = scenes[id]()
            return (
              <figure key={id} className="overflow-hidden rounded-[14px] border-[3px] border-ink">
                <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" className="block aspect-[16/10] w-full" aria-hidden>
                  {scene.backdrop}
                  <SvgCharacter appearance={lifePresets.freshman} x={scene.standAt.x} y={scene.standAt.y} />
                  {scene.foreground}
                </svg>
                <figcaption className="font-pixel bg-ink px-2 py-1 text-[12px] text-parch-200">
                  {id} · {scene.label}
                </figcaption>
              </figure>
            )
          })}
        </div>
      </Sheet>
    </div>
  )
}

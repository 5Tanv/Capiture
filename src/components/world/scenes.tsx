import type { ReactNode } from 'react'
import arenaArt from '../../assets/scenes/arena.webp'
import campusArt from '../../assets/scenes/campus.webp'
import suburbArt from '../../assets/scenes/suburb.webp'
import cityArt from '../../assets/scenes/city.webp'
import type { SceneId } from '../../types/game'
import { Bands, Cloud, Disc, Flowers, R, Tree, Window } from './primitives'

// Each scene draws everything except people. It reports where the player stands
// and where supporting characters may stand, if an event brings any. A scene
// never places a character on its own.
export interface SceneLayout {
  backdrop: ReactNode
  foreground?: ReactNode
  standAt: { x: number; y: number }
  /** Marks for event NPCs, used in order. */
  npcSpots: { x: number; y: number; flip?: boolean }[]
  /** Top edge of the event window's letterbox, when the default strip would crop something important. */
  windowTop?: number
  /** Which side of the world a narrow stage keeps. Default: the middle. */
  align?: 'mid' | 'max'
  groundShadow: string
  /** Where this is, shown on the stage. */
  label: string
}

/** Painted Maple Hall quad: 1774×887 source laid 520 wide, sky-to-path band. */
function Campus(): SceneLayout {
  return {
    standAt: { x: 158, y: 182 },
    npcSpots: [{ x: 118, y: 176, flip: true }],
    groundShadow: '#c99a52',
    label: 'Main Quad · Riverbend State',
    backdrop: <image href={campusArt} x={-100} y={-23} width={520} height={260} preserveAspectRatio="none" />,
  }
}

/** Painted suburban home: 1790×879 source laid 520 wide, roofline-to-walkway band. */
function Suburb(): SceneLayout {
  return {
    standAt: { x: 147, y: 182 },
    npcSpots: [{ x: 196, y: 182, flip: true }],
    groundShadow: '#a89f8f',
    label: 'Linden Street · Oakview',
    backdrop: <image href={suburbArt} x={-100} y={-26} width={520} height={255} preserveAspectRatio="none" />,
  }
}

export function CampusDrawn(): SceneLayout {
  const pathRows = []
  for (let i = 0; i < 12; i++) {
    const y = 154 + i * 4
    const half = 10 + i * 4
    pathRows.push(<R key={i} x={160 - half - 1} y={y} w={half * 2 + 2} h={4} c="#c99a52" />)
    pathRows.push(<R key={`f${i}`} x={160 - half} y={y} w={half * 2} h={4} c="#e8c27a" />)
  }
  return {
    standAt: { x: 172, y: 180 },
    npcSpots: [{ x: 122, y: 170, flip: true }],
    groundShadow: '#c99a52',
    label: 'Main Quad · Riverbend State',
    backdrop: (
      <>
        <Bands bands={[[46, '#5cc3e4'], [40, '#7ad2ec'], [40, '#a6e3f3'], [74, '#bfeaf5']]} />
        <Disc cx={276} cy={34} r={13} c="#ffe28a" />
        <Disc cx={276} cy={34} r={10} c="#fff1b0" />
        <Cloud x={-10} y={26} className="anim-drift" />
        <Cloud x={110} y={18} className="anim-drift anim-drift-slow" />
        <g className="anim-bird">
          <R x={250} y={44} w={2} h={1} c="#2a1a12" />
          <R x={252} y={45} w={1} h={1} c="#2a1a12" />
          <R x={253} y={44} w={2} h={1} c="#2a1a12" />
        </g>
        {/* far hills */}
        <Disc cx={-30} cy={166} r={60} c="#86cf66" />
        <Disc cx={30} cy={160} r={52} c="#86cf66" />
        <Disc cx={300} cy={158} r={56} c="#86cf66" />
        <Disc cx={370} cy={164} r={50} c="#86cf66" />
        <Disc cx={160} cy={176} r={70} c="#9ad877" />
        {/* tree line behind the hall */}
        {[70, 84, 236, 252, 266].map((x, i) => (
          <Disc key={x} cx={x} cy={128 - (i % 2) * 3} r={9} c="#3d9a47" />
        ))}
        {/* Maple Hall */}
        <R x={146} y={26} w={28} h={34} c="#b4553a" />
        <R x={150} y={12} w={20} h={14} c="#3f5560" />
        <R x={154} y={6} w={12} h={6} c="#3f5560" />
        <R x={158} y={2} w={4} h={4} c="#3f5560" />
        <R x={159} y={0} w={2} h={2} c="#f7c948" />
        <Disc cx={160} cy={40} r={7} c="#2a1a12" />
        <Disc cx={160} cy={40} r={6} c="#f6e7c8" />
        <R x={160} y={35} w={1} h={5} c="#2a1a12" />
        <R x={160} y={40} w={4} h={1} c="#2a1a12" />
        <R x={96} y={50} w={128} h={10} c="#3f5560" />
        <R x={92} y={56} w={136} h={4} c="#4f6a76" />
        <R x={100} y={60} w={120} h={90} c="#b4553a" />
        {Array.from({ length: 22 }, (_, i) => (
          <R key={i} x={100} y={64 + i * 4} w={120} h={1} c="#9a4530" />
        ))}
        {Array.from({ length: 44 }, (_, i) => (
          <R key={`v${i}`} x={104 + (i % 11) * 11 + (Math.floor(i / 11) % 2) * 5} y={64 + Math.floor(i / 11) * 22} w={1} h={4} c="#9a4530" />
        ))}
        <R x={98} y={60} w={124} h={3} c="#f6e7c8" />
        <R x={98} y={144} w={124} h={6} c="#c9b48a" />
        <Window x={108} y={70} lit />
        <Window x={126} y={70} />
        <Window x={182} y={70} lit flicker />
        <Window x={200} y={70} />
        <Window x={108} y={100} />
        <Window x={126} y={100} lit />
        <Window x={182} y={100} />
        <Window x={200} y={100} lit />
        <Window x={154} y={70} lit />
        {/* entrance */}
        <R x={138} y={98} w={44} h={10} c="#2f6f4f" />
        <R x={138} y={98} w={44} h={1} c="#5fae7a" />
        <text x={160} y={105.5} textAnchor="middle" className="font-pixel" fontSize="6.5" fill="#f6e7c8">
          MAPLE HALL
        </text>
        <R x={148} y={114} w={24} h={32} c="#2a1a12" />
        <R x={150} y={118} w={20} h={28} c="#8c5a34" />
        <R x={152} y={116} w={16} h={2} c="#8c5a34" />
        <R x={159} y={118} w={2} h={28} c="#6b4026" />
        <R x={156} y={130} w={2} h={2} c="#f7c948" />
        <R x={162} y={130} w={2} h={2} c="#f7c948" />
        <R x={144} y={146} w={32} h={4} c="#d9c69a" />
        <R x={140} y={150} w={40} h={4} c="#c9b48a" />
        {/* ivy */}
        {[[100, 120], [102, 128], [100, 134], [104, 138], [216, 118], [218, 126], [214, 132]].map(([x, y], i) => (
          <R key={i} x={x} y={y} w={4} h={6} c="#2f8a3b" />
        ))}
        {/* lawn */}
        <R x={-100} y={150} w={520} h={50} c="#5dbb46" />
        <R x={-100} y={150} w={520} h={2} c="#7ad35a" />
        {[12, 40, 66, 96, 214, 240, 268, 300].map((x, i) => (
          <R key={x} x={x} y={160 + (i % 3) * 12} w={3} h={2} c="#46a84a" />
        ))}
        {pathRows}
        <Flowers spots={[[28, 170, '#e0603a'], [34, 174, '#f7c948'], [112, 166, '#e0603a'], [214, 168, '#f6e7c8'], [284, 172, '#f7c948'], [292, 166, '#e0603a']]} />
        {/* notice board */}
        <R x={86} y={156} w={2} h={18} c="#6b4026" />
        <R x={106} y={156} w={2} h={18} c="#6b4026" />
        <R x={84} y={148} w={26} h={14} c="#8c5a34" />
        <R x={86} y={150} w={8} h={9} c="#f6e7c8" />
        <R x={96} y={151} w={11} h={7} c="#ffe28a" />
        <R x={87} y={152} w={6} h={1} c="#2a1a12" />
        <R x={87} y={154} w={5} h={1} c="#2a1a12" />
        <R x={98} y={153} w={7} h={1} c="#e0603a" />
        {/* lamp */}
        <R x={232} y={140} w={3} h={36} c="#2a1a12" />
        <R x={228} y={134} w={11} h={7} c="#2a1a12" />
        <R x={230} y={136} w={7} h={4} c="#ffe28a" />
        {/* bench */}
        <R x={244} y={166} w={24} h={3} c="#8c5a34" />
        <R x={244} y={160} w={24} h={3} c="#a8703f" />
        <R x={246} y={169} w={2} h={6} c="#2a1a12" />
        <R x={264} y={169} w={2} h={6} c="#2a1a12" />
        <Tree x={36} base={184} size={1.3} sway />
        <Tree x={74} base={162} size={0.9} />
        <Tree x={256} base={158} size={0.85} />
        <Tree x={292} base={190} size={1.35} sway />
        <Tree x={-30} base={168} size={1} />
        <Tree x={-78} base={180} size={1.2} sway />
        <Tree x={396} base={178} size={1.15} />
        <Disc cx={-90} cy={168} r={50} c="#86cf66" />
        <Disc cx={410} cy={170} r={46} c="#86cf66" />
        <Tree x={348} base={164} size={1.05} sway />
        <Disc cx={-40} cy={186} r={8} c="#46a84a" />
        <Disc cx={364} cy={190} r={9} c="#46a84a" />
      </>
    ),
  }
}

export function SuburbDrawn(): SceneLayout {
  return {
    standAt: { x: 132, y: 182 },
    npcSpots: [{ x: 196, y: 182, flip: true }],
    groundShadow: '#a89f8f',
    label: 'Linden Street · Oakview',
    backdrop: (
      <>
        <Bands bands={[[50, '#6fcde9'], [40, '#9fdcef'], [40, '#ffe2b0'], [70, '#ffd08a']]} />
        <Disc cx={274} cy={40} r={12} c="#ffd08a" />
        <Disc cx={274} cy={40} r={9} c="#fff1b0" />
        <Cloud x={30} y={30} className="anim-drift anim-drift-slow" />
        <Disc cx={40} cy={170} r={60} c="#86cf66" />
        <Disc cx={290} cy={170} r={60} c="#86cf66" />
        {/* house */}
        <R x={186} y={30} w={10} h={24} c="#7a3a2a" />
        <R x={184} y={28} w={14} h={4} c="#5a2a1e" />
        {Array.from({ length: 14 }, (_, i) => (
          <R key={i} x={150 - 8 - i * 6} y={40 + i * 4} w={16 + i * 12} h={4} c={i % 2 ? '#a8472f' : '#b4553a'} />
        ))}
        <R x={60} y={96} w={180} h={4} c="#7a3a2a" />
        <R x={70} y={100} w={160} h={54} c="#f0d9a8" />
        {Array.from({ length: 13 }, (_, i) => (
          <R key={i} x={70} y={103 + i * 4} w={160} h={1} c="#d9bf8a" />
        ))}
        <Window x={84} y={110} lit />
        <Window x={104} y={110} />
        <Window x={186} y={110} lit flicker />
        <Window x={206} y={110} />
        <R x={80} y={110} w={3} h={16} c="#2f8a7a" />
        <R x={117} y={110} w={3} h={16} c="#2f8a7a" />
        <Disc cx={150} cy={74} r={7} c="#f6e7c8" />
        <Disc cx={150} cy={74} r={5} c="#ffe28a" />
        <R x={138} y={116} w={24} h={38} c="#2a1a12" />
        <R x={140} y={118} w={20} h={36} c="#b8472a" />
        <R x={155} y={134} w={2} h={3} c="#f7c948" />
        <R x={132} y={110} w={36} h={4} c="#f6e7c8" />
        {/* garage + car */}
        <R x={230} y={118} w={70} h={36} c="#e6cf9c" />
        <R x={226} y={112} w={78} h={6} c="#a8472f" />
        {Array.from({ length: 6 }, (_, i) => (
          <R key={i} x={238} y={122 + i * 5} w={54} h={4} c={i % 2 ? '#e9e2d0' : '#d6cdb6'} />
        ))}
        <R x={-100} y={154} w={520} h={46} c="#5dbb46" />
        <R x={-100} y={154} w={520} h={2} c="#7ad35a" />
        <R x={232} y={156} w={188} h={44} c="#c9c2b4" />
        {/* the car, parked nose-in toward the garage: we see it from behind */}
        <R x={241} y={181} w={48} h={3} c="#a89f8f" />
        <R x={245} y={174} w={7} h={9} c="#2a1a12" />
        <R x={278} y={174} w={7} h={9} c="#2a1a12" />
        <R x={248} y={150} w={34} h={15} c="#2f8a7a" />
        <R x={248} y={150} w={34} h={2} c="#46b0a0" />
        <R x={251} y={153} w={28} h={9} c="#bfe6f0" />
        <R x={253} y={154} w={6} h={2} c="#e9f8fc" />
        <R x={242} y={164} w={46} h={13} c="#2f8a7a" />
        <R x={242} y={164} w={46} h={2} c="#46b0a0" />
        <R x={243} y={167} w={7} h={4} c="#e0603a" />
        <R x={280} y={167} w={7} h={4} c="#e0603a" />
        <R x={259} y={169} w={12} h={5} c="#f6efe0" />
        <R x={261} y={171} w={8} h={1} c="#2a1a12" />
        <R x={242} y={176} w={46} h={3} c="#24584e" />
        {/* walkway and fence */}
        <R x={140} y={154} w={20} h={46} c="#d9d1c0" />
        {Array.from({ length: 11 }, (_, i) => (
          <R key={i} x={140} y={158 + i * 4} w={20} h={1} c="#b9b0a0" />
        ))}
        {Array.from({ length: 34 }, (_, i) => {
          const x = -98 + i * 7
          return x > 132 ? null : <R key={i} x={x} y={160} w={4} h={14} c="#f6efe0" />
        })}
        <R x={-100} y={164} w={234} h={2} c="#e2d8c2" />
        <R x={110} y={168} w={2} h={14} c="#2a1a12" />
        <R x={104} y={162} w={14} h={7} c="#3b5d9a" />
        <R x={116} y={160} w={2} h={4} c="#e0603a" />
        <Flowers spots={[[20, 186, '#e0603a'], [52, 190, '#f7c948'], [90, 186, '#f6e7c8'], [180, 182, '#e0603a'], [204, 188, '#f7c948']]} />
        <Tree x={36} base={156} size={1.2} sway />
        <Tree x={306} base={156} size={1} />
        <Tree x={-34} base={160} size={1.1} sway />
        <Tree x={-80} base={160} size={0.9} />
        <Tree x={392} base={160} size={1.1} sway />
      </>
    ),
  }
}

/**
 * The studio's top-floor office: a painted illustration cropped to the
 * ceiling-to-floor-slab band, with just a sliver of the floor below showing.
 * 1692×714 source laid 520 wide (≈219 tall) with its bottom on the ground line.
 */
const CITY = { x: -100, y: -19, w: 520, h: 219 }

function City(): SceneLayout {
  return {
    standAt: { x: 100, y: 162 },
    npcSpots: [{ x: 262, y: 164, flip: true }],
    groundShadow: '#0d1a24',
    label: 'The Studio · Harbor City',
    backdrop: (
      <>
        <R x={-100} y={0} w={520} h={200} c="#141c2b" />
        <image href={cityArt} x={CITY.x} y={CITY.y} width={CITY.w} height={CITY.h} preserveAspectRatio="none" />
      </>
    ),
  }
}

/**
 * Rookie night at Summit Arena: a painted arena illustration rather than drawn
 * rects. 1672×941 source, laid 500 wide so the stands, the scoreboard and the
 * floor all fit the stage; the hoop sits on the right of the court.
 */
const ARENA = { x: -90, y: -10, w: 510, h: 287 }

function Arena(): SceneLayout {
  return {
    standAt: { x: 200, y: 180 },
    npcSpots: [{ x: 290, y: 178, flip: true }],
    windowTop: 62,
    // The hoop is at the right edge of the picture; narrow stages crop from the left, not the right.
    align: 'max',
    groundShadow: '#8a5228',
    label: 'Summit Arena · Rivertown',
    backdrop: (
      <>
        <R x={-100} y={0} w={520} h={200} c="#0b1430" />
        <image href={arenaArt} x={ARENA.x} y={ARENA.y} width={ARENA.w} height={ARENA.h} preserveAspectRatio="none" />
      </>
    ),
  }
}

/** The freshman's dorm room: the second college location, for events that happen at home. */
function Dorm(): SceneLayout {
  const lights = Array.from({ length: 26 }, (_, i) => ({
    x: -94 + i * 20,
    y: 16 + Math.round(Math.sin(i * 0.9) * 3),
    c: ['#ffe28a', '#f19ac0', '#a6e3f3', '#b4e8c2'][i % 4],
  }))
  const notes: [number, number, string][] = [[212, 42, '#fbf5e6'], [238, 46, '#f4d58d'], [262, 40, '#a6e3f3'], [218, 64, '#f19ac0'], [252, 66, '#fbf5e6']]
  const spines = ['#3f9fd6', '#d0673f', '#e8b452', '#7c9f7e', '#7a4a86', '#efe3c6']
  return {
    standAt: { x: 160, y: 186 },
    npcSpots: [{ x: 100, y: 186 }],
    groundShadow: '#7a4c32',
    label: 'Room 214 · Maple Hall',
    backdrop: (
      <>
        {/* wallpaper: sage with a quiet stripe */}
        <R x={-100} y={0} w={520} h={142} c="#9bb59a" />
        {Array.from({ length: 66 }, (_, i) => (
          <R key={i} x={-100 + i * 8} y={8} w={2} h={126} c="#8faa8e" />
        ))}
        <R x={-100} y={0} w={520} h={8} c="#efe3c6" />
        <R x={-100} y={8} w={520} h={2} c="#c4b08a" />
        {/* string lights */}
        {lights.map((l, i) => (
          <g key={i}>
            <R x={l.x} y={l.y - 1} w={20} h={1} c="#4a362b" />
            <R x={l.x + 9} y={l.y} w={3} h={4} c={l.c} />
            <R x={l.x + 10} y={l.y + 1} w={1} h={1} c="#ffffff" />
          </g>
        ))}
        <g className="anim-twinkle">
          {lights
            .filter((_, i) => i % 3 === 0)
            .map((l, i) => (
              <R key={i} x={l.x + 8} y={l.y - 1} w={5} h={6} c={l.c} />
            ))}
        </g>
        {/* window onto the quad */}
        <R x={24} y={30} w={92} h={76} c="#efe3c6" />
        <R x={28} y={34} w={84} h={68} c="#8fd6ee" />
        <R x={28} y={74} w={84} h={28} c="#bfeaf5" />
        <Disc cx={52} cy={110} r={34} c="#86cf66" />
        <Disc cx={98} cy={106} r={28} c="#9ad877" />
        <R x={82} y={52} w={14} h={30} c="#b4553a" />
        <R x={85} y={44} w={8} h={8} c="#3f5560" />
        <R x={88} y={40} w={2} h={4} c="#3f5560" />
        <Disc cx={42} cy={70} r={8} c="#3d9a47" />
        <Disc cx={60} cy={74} r={6} c="#2f8a3b" />
        <R x={69} y={34} w={2} h={68} c="#efe3c6" />
        <R x={28} y={67} w={84} h={2} c="#efe3c6" />
        <R x={20} y={104} w={100} h={5} c="#c4b08a" />
        <R x={20} y={104} w={100} h={1} c="#efe3c6" />
        {/* curtains */}
        <R x={12} y={24} w={14} h={84} c="#d0673f" />
        <R x={12} y={24} w={3} h={84} c="#e88a62" />
        <R x={114} y={24} w={14} h={84} c="#d0673f" />
        <R x={124} y={24} w={4} h={84} c="#a8452c" />
        <R x={8} y={22} w={124} h={3} c="#6e4530" />
        {/* a plant on the sill */}
        <R x={98} y={96} w={10} h={8} c="#d0673f" />
        <Disc cx={103} cy={92} r={5} c="#3f8a48" />
        <Disc cx={101} cy={90} r={3} c="#5fae5a" />
        {/* pennant and poster above the bed */}
        <R x={-70} y={34} w={2} h={30} c="#6e4530" />
        {Array.from({ length: 12 }, (_, i) => (
          <R key={i} x={-68} y={34 + i} w={36 - i * 3} h={1} c="#d0673f" />
        ))}
        <text x={-64} y={42} className="font-pixel" fontSize="7" fill="#fbf5e6">
          RSU
        </text>
        <R x={-26} y={36} w={30} h={40} c="#2e3f6b" />
        <R x={-24} y={38} w={26} h={36} c="#e8b452" />
        <Disc cx={-11} cy={52} r={7} c="#d0673f" />
        <R x={-20} y={64} w={18} h={2} c="#2e3f6b" />
        <R x={-18} y={68} w={14} h={2} c="#2e3f6b" />
        {/* corkboard over the desk, with a budget sheet pinned up */}
        <R x={204} y={34} w={84} h={56} c="#6e4530" />
        <R x={207} y={37} w={78} h={50} c="#c79a64" />
        {notes.map(([x, y, c], i) => (
          <g key={i}>
            <R x={x} y={y} w={18} h={14} c={c} />
            <R x={x + 8} y={y - 1} w={2} h={2} c="#d65a3f" />
          </g>
        ))}
        <R x={214} y={46} w={12} h={1} c="#4a362b" />
        <R x={214} y={49} w={9} h={1} c="#4a362b" />
        <R x={214} y={52} w={11} h={1} c="#4bb36b" />
        <R x={214} y={55} w={6} h={1} c="#d65a3f" />
        {/* bookshelf */}
        <R x={356} y={40} w={54} h={100} c="#7a4c32" />
        <R x={360} y={44} w={46} h={92} c="#5e3a27" />
        {[58, 88, 118].map((y) => (
          <R key={y} x={360} y={y} w={46} h={3} c="#9a6545" />
        ))}
        {Array.from({ length: 18 }, (_, i) => {
          const shelf = Math.floor(i / 6)
          const h = 9 + ((i * 5) % 5)
          return <R key={i} x={362 + (i % 6) * 7} y={58 + shelf * 30 - h} w={6} h={h} c={spines[i % 6]} />
        })}
        {/* baseboard and floorboards */}
        <R x={-100} y={134} w={520} h={8} c="#efe3c6" />
        <R x={-100} y={140} w={520} h={2} c="#c4b08a" />
        <R x={-100} y={142} w={520} h={58} c="#b07a4a" />
        {Array.from({ length: 6 }, (_, i) => (
          <R key={i} x={-100} y={150 + i * 9} w={520} h={1} c="#946238" />
        ))}
        {Array.from({ length: 30 }, (_, i) => (
          <R key={`s${i}`} x={-96 + ((i * 47) % 516)} y={142 + (i % 6) * 9} w={1} h={8} c="#946238" />
        ))}
        {/* bed */}
        <R x={-96} y={96} w={8} h={78} c="#6e4530" />
        <R x={-96} y={96} w={8} h={3} c="#9a6545" />
        <R x={-90} y={130} w={152} h={30} c="#efe3c6" />
        <R x={-88} y={124} w={30} h={14} c="#fbf5e6" />
        <R x={-88} y={136} w={30} h={2} c="#e3d2ad" />
        <R x={-56} y={126} w={120} h={36} c="#4b6ea8" />
        {Array.from({ length: 5 }, (_, i) => (
          <R key={i} x={-52 + i * 24} y={128} w={2} h={32} c="#3d5a8a" />
        ))}
        <R x={-56} y={126} w={120} h={3} c="#7c9bd0" />
        <R x={-56} y={142} w={120} h={2} c="#3d5a8a" />
        <R x={-90} y={160} w={154} h={6} c="#7a4c32" />
        <R x={-88} y={166} w={4} h={10} c="#5e3a27" />
        <R x={58} y={166} w={4} h={10} c="#5e3a27" />
        {/* rug */}
        <R x={98} y={170} w={128} h={26} c="#a8452c" />
        <R x={102} y={173} w={120} h={20} c="#d0673f" />
        {Array.from({ length: 10 }, (_, i) => (
          <R key={i} x={108 + i * 12} y={182} w={6} h={2} c="#f4d58d" />
        ))}
        <R x={102} y={176} w={120} h={1} c="#e88a62" />
        <R x={102} y={189} w={120} h={1} c="#a8452c" />
        {/* desk with the laptop, a lamp and the textbook question */}
        <R x={196} y={120} w={112} h={6} c="#9a6545" />
        <R x={196} y={120} w={112} h={2} c="#b9835f" />
        <R x={200} y={126} w={6} h={50} c="#6e4530" />
        <R x={298} y={126} w={6} h={50} c="#6e4530" />
        <R x={262} y={126} w={36} h={22} c="#7a4c32" />
        <R x={264} y={136} w={32} h={1} c="#5e3a27" />
        <R x={278} y={130} w={4} h={2} c="#e8b452" />
        <R x={224} y={98} w={34} h={22} c="#2e2b38" />
        <R x={226} y={100} w={30} h={17} c="#3f9fd6" />
        <g className="anim-screen">
          <R x={229} y={103} w={14} h={2} c="#c3e6f7" />
          <R x={229} y={107} w={20} h={1} c="#c3e6f7" />
          <R x={229} y={110} w={10} h={1} c="#c3e6f7" />
          <R x={244} y={103} w={8} h={8} c="#e8b452" />
        </g>
        <R x={220} y={118} w={42} h={3} c="#474552" />
        <R x={204} y={110} w={16} h={4} c="#d0673f" />
        <R x={205} y={106} w={14} h={4} c="#3f9fd6" />
        <R x={206} y={102} w={12} h={4} c="#e8b452" />
        <R x={206} y={103} w={12} h={1} c="#fbf5e6" />
        <R x={284} y={92} w={2} h={28} c="#474552" />
        <R x={276} y={88} w={14} h={6} c="#e8b452" />
        <R x={278} y={94} w={10} h={2} c="#fff1c4" />
        {/* desk chair */}
        <R x={232} y={134} w={22} h={4} c="#2f8a86" />
        <R x={232} y={138} w={22} h={14} c="#1f5e5a" />
        <R x={240} y={152} w={4} h={18} c="#474552" />
        <R x={232} y={170} w={20} h={3} c="#474552" />
        {/* the mini-fridge from move-in day, microwave on top */}
        <R x={318} y={112} w={30} h={62} c="#e2e4ea" />
        <R x={318} y={112} w={30} h={2} c="#ffffff" />
        <R x={318} y={136} w={30} h={2} c="#b8bcc8" />
        <R x={342} y={118} w={2} h={12} c="#8b8fa0" />
        <R x={342} y={142} w={2} h={16} c="#8b8fa0" />
        <R x={324} y={120} w={6} h={6} c="#d0673f" />
        <R x={346} y={112} w={2} h={62} c="#b8bcc8" />
        <R x={320} y={104} w={26} h={8} c="#474552" />
        <R x={322} y={106} w={14} h={4} c="#2e2b38" />
        <R x={338} y={106} w={6} h={4} c="#4bb36b" />
      </>
    ),
    foreground: (
      <>
        {/* backpack slumped by the bed */}
        <R x={70} y={172} w={18} h={20} c="#2f8a86" />
        <R x={72} y={168} w={14} h={6} c="#2f8a86" />
        <R x={74} y={176} w={10} h={8} c="#1f5e5a" />
        <R x={70} y={172} w={3} h={20} c="#46a8a0" />
      </>
    ),
  }
}

/** Reusable locations, keyed by SceneId. Events pick one; a life's home is its worldId. */
export const scenes: Record<SceneId, () => SceneLayout> = {
  dorm: Dorm,
  campus: Campus,
  suburb: Suburb,
  city: City,
  arena: Arena,
}

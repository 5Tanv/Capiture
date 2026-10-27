import athleteRoad from '../assets/roads/basketball-neighborhood.webp'
import freshmanRoad from '../assets/roads/college-campus.webp'
import entrepreneurRoad from '../assets/roads/urban-neighborhood.webp'
import professionalRoad from '../assets/roads/working-adult-neighborhood.webp'
import type { LifeId } from '../types/game'

/** Every road image is 887 × 1774 (1:2 portrait); the map box uses this ratio so nothing stretches or crops. */
export const ROAD_ASPECT = { w: 887, h: 1774 }

export type RoutePoint = readonly [x: number, y: number]

export interface RoadMap {
  art: string
  /** Describes the picture for screen readers. */
  alt: string
  /**
   * The centerline of the image's own paved path, from the first event (near the
   * bottom entrance) to the finale (just below the main building's steps).
   * Normalized to the image: x across, y down, both 0..1. Traced from the
   * artwork's path pixels, so each map has its own route.
   */
  route: RoutePoint[]
}

export const roadMaps: Record<LifeId, RoadMap> = {
  freshman: {
    art: freshmanRoad,
    alt: 'A winding brick path through campus, from the front gate up to Maple Hall',
    route: [[0.5054,0.9307],[0.509,0.9126],[0.5116,0.8946],[0.5121,0.8766],[0.5123,0.8585],[0.5102,0.8405],[0.5001,0.8224],[0.476,0.8044],[0.4432,0.7864],[0.4172,0.7683],[0.4059,0.7503],[0.4081,0.7322],[0.423,0.7142],[0.4522,0.6962],[0.4951,0.6781],[0.5471,0.6601],[0.598,0.6421],[0.6382,0.624],[0.6631,0.606],[0.6741,0.5879],[0.6747,0.5699],[0.6651,0.5519],[0.6408,0.5338],[0.6022,0.5158],[0.5569,0.4977],[0.5075,0.4797],[0.4679,0.4617],[0.4403,0.4436],[0.4343,0.4256],[0.4432,0.4076],[0.4679,0.3895],[0.5087,0.3715],[0.5583,0.3534],[0.6052,0.3354],[0.6415,0.3174],[0.6626,0.2993],[0.6689,0.2813],[0.6629,0.2632],[0.641,0.2452],[0.6033,0.2272],[0.5579,0.2091],[0.5223,0.1911],[0.5041,0.1731],[0.5024,0.1685]],
  },
  professional: {
    art: professionalRoad,
    alt: 'A dirt lane through a quiet neighborhood, past houses and a pond, up to the town hall gate',
    route: [[0.5033,0.9442],[0.5076,0.9262],[0.5087,0.9081],[0.5126,0.8901],[0.5158,0.872],[0.523,0.854],[0.5293,0.836],[0.5418,0.8179],[0.5392,0.7999],[0.5372,0.7818],[0.5095,0.7638],[0.4757,0.7458],[0.4161,0.7277],[0.3571,0.7097],[0.3204,0.6917],[0.3041,0.6736],[0.2975,0.6556],[0.3074,0.6375],[0.3413,0.6195],[0.4044,0.6015],[0.4644,0.5834],[0.5184,0.5654],[0.5629,0.5474],[0.5987,0.5293],[0.6273,0.5113],[0.6459,0.4932],[0.6482,0.4752],[0.6335,0.4572],[0.5951,0.4391],[0.5435,0.4211],[0.5059,0.403],[0.461,0.385],[0.4308,0.367],[0.4132,0.3489],[0.4095,0.3309],[0.4272,0.3129],[0.4543,0.2948],[0.5102,0.2768],[0.5754,0.2587],[0.6222,0.2407],[0.6538,0.2227],[0.6676,0.2046],[0.6505,0.1866],[0.6194,0.1685],[0.5837,0.1505],[0.5502,0.1325],[0.5244,0.1189]],
  },
  entrepreneur: {
    art: entrepreneurRoad,
    alt: 'A stone walkway winding between city blocks and cafés, up to an office entrance',
    route: [[0.5331,0.894],[0.5326,0.876],[0.5298,0.8579],[0.5263,0.8399],[0.5237,0.8219],[0.5222,0.8038],[0.5218,0.7858],[0.5242,0.7678],[0.5297,0.7497],[0.5356,0.7317],[0.5445,0.7136],[0.5608,0.6956],[0.5781,0.6776],[0.5934,0.6595],[0.6048,0.6415],[0.6076,0.6234],[0.598,0.6054],[0.5768,0.5874],[0.5443,0.5693],[0.5061,0.5513],[0.4695,0.5333],[0.4372,0.5152],[0.4189,0.4972],[0.4244,0.4791],[0.4501,0.4611],[0.4846,0.4431],[0.5167,0.425],[0.5382,0.407],[0.5479,0.389],[0.5524,0.3709],[0.5649,0.3529],[0.582,0.3348],[0.6088,0.3168],[0.6368,0.2988],[0.661,0.2807],[0.6748,0.2627],[0.6794,0.2446],[0.6739,0.2266],[0.6582,0.2086],[0.6295,0.1905],[0.5925,0.1725],[0.5577,0.1545],[0.5341,0.1364],[0.5224,0.1184]],
  },
  athlete: {
    art: athleteRoad,
    alt: 'A sandy path through a sports neighborhood, past courts and gyms, up to the arena',
    route: [[0.5084,0.9487],[0.516,0.9307],[0.5144,0.9126],[0.5164,0.8946],[0.5174,0.8766],[0.5162,0.8585],[0.5171,0.8405],[0.5098,0.8224],[0.4965,0.8044],[0.4768,0.7864],[0.4434,0.7683],[0.4024,0.7503],[0.3706,0.7322],[0.3678,0.7142],[0.3748,0.6962],[0.3898,0.6781],[0.4409,0.6601],[0.5055,0.6421],[0.564,0.624],[0.6163,0.606],[0.6583,0.5879],[0.686,0.5699],[0.6992,0.5519],[0.7047,0.5338],[0.7093,0.5158],[0.699,0.4977],[0.6584,0.4797],[0.6247,0.4617],[0.5884,0.4436],[0.5418,0.4256],[0.493,0.4076],[0.4739,0.3895],[0.4693,0.3715],[0.4775,0.3534],[0.5005,0.3354],[0.54,0.3174],[0.5884,0.2993],[0.6265,0.2813],[0.6451,0.2632],[0.6458,0.2452],[0.6347,0.2272],[0.6213,0.2091],[0.6027,0.1911],[0.582,0.1731],[0.5632,0.155],[0.5398,0.137],[0.5286,0.128]],
  },
}

/**
 * `count` stops spaced evenly by distance along the route, first to last.
 * Distance is measured in image proportions (y counts double on a 1:2 image),
 * so stops stay evenly spaced on screen at any size.
 */
export function stopsAlong(route: RoutePoint[], count: number): { x: number; y: number }[] {
  const yScale = ROAD_ASPECT.h / ROAD_ASPECT.w
  const seg = route.slice(1).map(([x, y], i) => Math.hypot(x - route[i][0], (y - route[i][1]) * yScale))
  const total = seg.reduce((a, b) => a + b, 0)
  return Array.from({ length: count }, (_, k) => {
    let t = count > 1 ? (total * k) / (count - 1) : 0
    let i = 0
    while (i < seg.length - 1 && t > seg[i]) t -= seg[i++]
    const f = seg[i] ? Math.min(1, t / seg[i]) : 0
    return { x: route[i][0] + (route[i + 1][0] - route[i][0]) * f, y: route[i][1] + (route[i + 1][1] - route[i][1]) * f }
  })
}

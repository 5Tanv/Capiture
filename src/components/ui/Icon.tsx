import { PixelSprite } from '../world/PixelSprite'
import { icons, type IconName } from '../world/sprites'

export function Icon({ name, className = 'h-6 w-6', label }: { name: IconName; className?: string; label?: string }) {
  return <PixelSprite sprite={icons[name]} className={className} label={label} />
}

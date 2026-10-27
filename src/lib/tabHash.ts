import type { TabId } from '../types/game'

// 'showcase' is the art-direction sheet: reachable by URL, not in the nav.
const tabs: TabId[] = ['home', 'life', 'learn', 'compete', 'shop', 'profile', 'showcase']

// Tabs live in the URL hash (#/learn) so refresh, back/forward, and shared
// links work on static hosting like GitHub Pages without server rewrites.
export function tabFromHash(hash: string): TabId {
  const id = hash.replace(/^#\/?/, '')
  return (tabs as string[]).includes(id) ? (id as TabId) : 'home'
}

export const hashFor = (tab: TabId) => (tab === 'home' ? '' : `#/${tab}`)

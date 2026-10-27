import { useEffect, useLayoutEffect, useState } from 'react'
import { recordVisit } from './lib/daily'
import { CharacterCreator } from './components/creator/CharacterCreator'
import { CampaignSummary } from './components/campaign/CampaignSummary'
import { CampaignEventModal } from './components/event/CampaignEventModal'
import { BottomNav } from './components/hud/BottomNav'
import { TopBar } from './components/hud/TopBar'
import { Onboarding } from './components/tutorial/Onboarding'
import { UnlockPrompt } from './components/lobby/UnlockPrompt'
import { Tutorial } from './components/tutorial/Tutorial'
import { useChromeMetrics } from './lib/useChromeMetrics'
import { useTabHash } from './lib/useTabHash'
import { HomeScreen } from './screens/HomeScreen'
import { LifeRoadScreen } from './screens/LifeRoadScreen'
import { CompeteScreen } from './screens/CompeteScreen'
import { LearnScreen } from './screens/LearnScreen'
import { ProfileScreen } from './screens/ProfileScreen'
import { ShopScreen } from './screens/ShopScreen'
import { ShowcaseScreen } from './screens/ShowcaseScreen'
import { useGame } from './state/GameProvider'
import { themeVars } from './theme/lifeThemes'

export default function App() {
  const { tab, activeLifeId } = useGame()
  useTabHash()
  useChromeMetrics()
  useEffect(() => recordVisit(), [])
  // The active life tints the app (accents and ambient light), never its financial colors.
  // Profile, Shop and Compete are about the player's account, not a life, so they stay neutral gray.
  const themeId = tab === 'profile' || tab === 'shop' || tab === 'compete' ? 'neutral' : activeLifeId
  useLayoutEffect(() => {
    for (const [k, v] of Object.entries(themeVars(themeId))) document.documentElement.style.setProperty(k, String(v))
  }, [themeId])
  // Bumped after each event so the character on stage can react.
  const [reactKey, setReactKey] = useState(0)

  return (
    // The page scrolls as one document at every size; the fixed nav's real height is reserved below it.
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main key={tab} className="anim-rise flex-1 pb-[calc(var(--nav-h)+0.75rem)]">
        {tab === 'home' && <HomeScreen reactKey={reactKey} />}
        {tab === 'life' && <LifeRoadScreen />}
        {tab === 'learn' && <LearnScreen />}
        {tab === 'compete' && <CompeteScreen />}
        {tab === 'shop' && <ShopScreen />}
        {tab === 'profile' && <ProfileScreen />}
        {tab === 'showcase' && <ShowcaseScreen />}
      </main>
      <BottomNav />
      <CampaignEventModal onComplete={() => setReactKey((k) => k + 1)} />
      <CampaignSummary />
      <UnlockPrompt />
      <Tutorial />
      <Onboarding />
      <CharacterCreator />
    </div>
  )
}

import { useEffect } from 'react'
import { useGame, useGameDispatch } from '../state/GameProvider'
import { hashFor, tabFromHash } from './tabHash'

/** Keeps the active tab and the URL hash in step, in both directions. */
export function useTabHash() {
  const { tab } = useGame()
  const dispatch = useGameDispatch()

  useEffect(() => {
    const follow = () => dispatch({ type: 'setTab', tab: tabFromHash(window.location.hash) })
    window.addEventListener('popstate', follow)
    window.addEventListener('hashchange', follow)
    return () => {
      window.removeEventListener('popstate', follow)
      window.removeEventListener('hashchange', follow)
    }
  }, [dispatch])

  useEffect(() => {
    if (tabFromHash(window.location.hash) === tab) return
    const { pathname, search } = window.location
    window.history.pushState(null, '', hashFor(tab) || pathname + search)
  }, [tab])
}

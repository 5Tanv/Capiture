const KEY = 'filife.tutorial'

// Storage can be blocked or throw (private windows, cleared site data), so the
// tour simply shows again when it can't remember.
export function tutorialSeen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'done'
  } catch {
    return false
  }
}

export function markTutorialSeen() {
  try {
    window.localStorage.setItem(KEY, 'done')
  } catch {
    // Nothing to do: the tour just isn't remembered.
  }
}

// The welcome tour is remembered on its own, so finishing it doesn't skip the gameplay tour after it.
const ONBOARDING_KEY = 'filife.onboarding'

export function onboardingSeen(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === 'done'
  } catch {
    return false
  }
}

export function markOnboardingSeen() {
  try {
    window.localStorage.setItem(ONBOARDING_KEY, 'done')
  } catch {
    // Nothing to do: the tour just isn't remembered.
  }
}

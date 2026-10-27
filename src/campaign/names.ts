import type { RoleId } from './types'

// Protagonist names are stored per role and substituted at render time. The text
// stays plain text (React escapes it); NPC names in the content are never touched.

const TOKENS: Record<RoleId, string> = { college: '{collegeName}', adult: '{adultName}', business: '{businessName}', athlete: '{athleteName}' }

export type RoleNames = Record<RoleId, string>

/** Replace the protagonist name tokens with the current display names. */
export function fillName(text: string, names: RoleNames, role: RoleId): string {
  let out = text
  for (const r of Object.keys(TOKENS) as RoleId[]) out = out.split(TOKENS[r]).join(names[r])
  // Early college drafts used a generic token for the same protagonist.
  return out.split('{playerName}').join(names[role])
}

import type { NegligenceType } from '../types/incident.ts'

/**
 * Keyword map from how citizens describe a hazard to the categories the database
 * constraint accepts. Order matters: the more specific rules must come first, or
 * "no street lights" gets swallowed by the electrical bucket.
 */
const KEYWORDS: Array<{ type: NegligenceType; keys: string[] }> = [
  { type: 'Street_Light', keys: ['streetlight', 'street light', 'lighting', 'no light', 'andhera', 'lamp'] },
  { type: 'Road_Design', keys: ['blind turn', 'sharp turn', '90 degree', 'junction', 'signage', 'divider', 'barrier', 'crossing'] },
  { type: 'Dangerous_Structure', keys: ['metro pillar', 'pillar', 'crack', 'leaning', 'facade', 'unsafe building'] },
  { type: 'Garbage_Waste', keys: ['garbage', 'kachra', 'stink', 'smell', 'badbu', 'dumping', 'sewage'] },
  { type: 'Water_Leak', keys: ['leak', 'burst', 'pipeline', 'water main'] },
  { type: 'Waterlogging', keys: ['waterlog', 'flood', 'standing water', 'paani'] },
  { type: 'Broken_Footpath', keys: ['footpath', 'pavement', 'sidewalk'] },
  { type: 'Debris', keys: ['debris', 'rubble', 'malba', 'garbage', 'kachra'] },
  { type: 'Electrocution', keys: ['wire', 'current', 'shock', 'electric', 'bijli', 'karant', 'transformer', 'cable', 'pole'] },
  { type: 'Open_Pit', keys: ['pit', 'khadda', 'gaddha', 'trench', 'excavat', 'dug', 'borewell', 'shaft'] },
  { type: 'Open_Drain', keys: ['drain', 'nala', 'nallah', 'sewer', 'manhole', 'gutter', 'chamber', 'culvert'] },
  { type: 'Collapse', keys: ['collapse', 'building', 'wall', 'slab', 'bridge', 'girder', 'ceiling', 'flyover'] },
  { type: 'Pothole', keys: ['pothole', 'gadde', 'road', 'sadak', 'crater', 'tar', 'asphalt', 'speed breaker'] },
]

/**
 * Map free text onto a valid `NegligenceType`.
 *
 * The `incidents.negligence_type` column has a CHECK constraint permitting only
 * the canonical values, so a citizen's custom label can never be written
 * there directly — doing so makes Postgres reject the whole insert. Callers
 * should keep the citizen's original wording elsewhere (we prepend it to the
 * description) and use this to satisfy the constraint.
 */
export function guessNegligenceType(text: string): NegligenceType {
  const t = text.toLowerCase()
  const match = KEYWORDS.find((k) => k.keys.some((key) => t.includes(key)))
  return match?.type ?? 'Pothole'
}

/**
 * Distinguish pre-loaded demo rows from things a real person filed.
 *
 * Reports created through the app get a `crypto.randomUUID()` id; the bundled
 * examples in `data/seed.ts` use short ids like `h1` and `2`. Labelling the
 * difference in the UI keeps the demo honest — a reviewer can see at a glance
 * which entries are ours and which are theirs.
 */
export function isSampleRecord(id: string): boolean {
  return !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Preserve a citizen's own category wording inside the description so that
 * mapping it onto a canonical type loses nothing.
 */
export function annotateCustomType(description: string, customType: string): string {
  const label = customType.trim()
  if (!label) return description
  return `[Citizen-reported hazard type: ${label}]\n\n${description}`
}

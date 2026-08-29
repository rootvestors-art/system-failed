import type { ResponsibleEntities } from '../types/incident.ts'

interface HierarchyLevel {
  label: string
  name: string
  borderColor: string
  note?: string
}

function buildLevels(entities: ResponsibleEntities): HierarchyLevel[] {
  const levels: HierarchyLevel[] = [
    {
      label: 'EXECUTION AGENCY',
      name: entities.agency,
      borderColor: 'border-blood',
      note: 'Failed to secure site or install warnings.',
    },
  ]

  if (entities.ward) {
    levels.push({
      label: 'WARD / LOCAL BODY',
      name: entities.ward,
      borderColor: 'border-yellow-600',
      note: 'Failed to audit road safety.',
    })
  }

  levels.push({
    label: 'CONSTITUENCY MLA',
    name: entities.mla ?? 'Investigation Required',
    borderColor: 'border-line',
  })

  levels.push({
    label: 'MEMBER OF PARLIAMENT',
    name: entities.mp ?? 'Investigation Required',
    borderColor: 'border-line',
  })

  levels.push({
    label: 'HEAD OF STATE (CM)',
    name: entities.cm ?? 'Chief Minister',
    borderColor: 'border-white',
    note: 'Ultimate administrative responsibility.',
  })

  return levels
}

interface HierarchyCardProps {
  entities: ResponsibleEntities
}

export default function HierarchyCard({ entities }: HierarchyCardProps) {
  const levels = buildLevels(entities)

  return (
    <div>
      <h2 className="text-2xl font-header font-bold text-ink mb-6 uppercase">
        Hierarchy of Failure
      </h2>

      <div className="relative pl-8 border-l-2 border-line space-y-8">
        {levels.map((level, i) => {
          const isLast = i === levels.length - 1
          return (
            <div key={level.label} className="relative">
              <span
                className={`absolute -left-[41px] top-0 rounded-full h-5 w-5 border-4 border-black ${
                  isLast ? 'bg-blood animate-pulse' : 'bg-raised-2'
                }`}
              />
              <div
                className={`bg-raised-2 p-4 rounded border-l-4 ${level.borderColor}`}
              >
                <p className="text-xs text-ink-faint uppercase font-bold tracking-widest mb-1">
                  {level.label}
                </p>
                <h4 className="text-xl font-bold text-ink">{level.name}</h4>
                {level.note && (
                  <p className="text-sm text-ink-muted mt-2">{level.note}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

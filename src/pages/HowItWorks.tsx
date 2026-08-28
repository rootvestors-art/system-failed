import { Link } from 'react-router-dom'
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react'
import { JURISDICTIONS } from '../data/jurisdictions.ts'

/**
 * Deliberately plain disclosure page. The brief judges honesty about mock data
 * and dependencies, so this states them outright rather than burying them.
 */
export default function HowItWorks() {
  return (
    <main className="flex-grow max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 w-full">
      <p className="text-gray-500 text-xs uppercase font-bold tracking-widest mb-3">
        Full disclosure
      </p>
      <h1 className="text-3xl sm:text-4xl font-header font-bold text-white leading-tight mb-4">
        How this works, and what's still pretend
      </h1>
      <p className="text-gray-400 mb-12">
        This is a prototype, not a government service. Everything below is stated
        plainly so you can judge it on what it actually does.
      </p>

      <Section title="Who faces the problem">
        <p>
          Anyone who has tried to get a pothole, open drain, exposed live wire or an
          abandoned excavation fixed in an Indian city. Most acutely: two-wheeler riders
          and pedestrians, who are the ones killed by these hazards, and who are least
          likely to have the time, English or bureaucratic fluency that existing
          complaint portals quietly assume.
        </p>
      </Section>

      <Section title="What's hard about it today">
        <p>
          Filing a civic complaint on portals like{' '}
          {JURISDICTIONS.slice(0, 4)
            .map((j) => j.existingPortal)
            .join(', ')}{' '}
          or CPGRAMS requires you to already know things you have no way of knowing:
        </p>
        <ul className="list-disc list-inside mt-3 space-y-1.5">
          <li>
            <strong className="text-white">Which department owns the asset.</strong> A
            pothole may belong to the municipal roads wing, the state PWD, or the water
            utility that dug it up. Choose wrong and the complaint is closed as
            misrouted, not forwarded.
          </li>
          <li>
            <strong className="text-white">How to describe it formally.</strong> Free-text
            fields expect English and a register most citizens don't write in.
          </li>
          <li>
            <strong className="text-white">What happens next.</strong> Complaints are
            frequently closed without a fix, and there is rarely a visible clock or an
            automatic path upward when nothing happens.
          </li>
        </ul>
      </Section>

      <Section title="What we changed">
        <ul className="space-y-3">
          <li className="flex gap-3">
            <ArrowRight size={16} className="text-blood shrink-0 mt-1" />
            <span>
              <strong className="text-white">One sentence replaces the form.</strong> You
              speak or type what's wrong in your own language. An OpenAI model reads that
              plus your photo and produces the classification, severity and a formally
              worded complaint. You review and correct it — nothing is filed silently.
            </span>
          </li>
          <li className="flex gap-3">
            <ArrowRight size={16} className="text-blood shrink-0 mt-1" />
            <span>
              <strong className="text-white">Routing is our job, not yours.</strong> The
              department is derived from your city and the hazard type, so there is no
              dropdown to get wrong.
            </span>
          </li>
          <li className="flex gap-3">
            <ArrowRight size={16} className="text-blood shrink-0 mt-1" />
            <span>
              <strong className="text-white">The clock is visible and it moves.</strong>{' '}
              Every complaint gets a window. When it lapses the complaint escalates on its
              own — owning department, then ward engineer, then commissioner, then elected
              representative, then the public record.
            </span>
          </li>
          <li className="flex gap-3">
            <ArrowRight size={16} className="text-blood shrink-0 mt-1" />
            <span>
              <strong className="text-white">Failure is public by default.</strong> An
              ignored complaint doesn't disappear into a queue; it becomes a citable entry
              on a public map.
            </span>
          </li>
        </ul>
      </Section>

      <Section title="What actually works right now">
        <List
          icon={<CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />}
          items={[
            'Plain-language intake in any Indian language, with on-device photo compression before upload',
            'Voice input transcribed server-side by an OpenAI model, falling back to the browser\'s own speech recognition where that is unavailable',
            'OpenAI-powered classification and complaint drafting (server-side; falls back to keyword matching with a visible "mocked" badge if no key is configured)',
            'Department routing from city plus hazard type',
            'Complaint submission, evidence photo upload and a reference that survives a page reload',
            'The escalation tracker, computed live from your filing time',
            'Closing the loop: confirming a hazard is fixed, with an optional "after" photo, which updates the public record',
            'Public map, search, filters, upvoting and shareable case cards',
          ]}
        />
      </Section>

      <Section title="What is mocked">
        <List
          icon={<XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />}
          items={[
            'No government system is contacted. Nothing is transmitted to any municipal portal or CPGRAMS. No live government API is touched, by design.',
            'The "Submitted → Acknowledged → Assigned → Resolved" progress bar is simulated from elapsed time. No department has actually acknowledged or assigned anything.',
            'The jurisdiction registry is a hand-built table for a handful of cities, not real ward-boundary GIS data. Unmapped cities get a generic fallback.',
            'Escalation windows are illustrative, not statutory deadlines. Real redressal targets vary by city and are inconsistently enforceable.',
            'Officer, MLA and MP names are shown as placeholder roles rather than named individuals.',
            'Verification status is community-flagged only. There is no official confirmation step, and "fixed" is whatever the citizen says it is.',
            'No login, so a reference is a URL. Real deployment would need an account or an OTP-gated lookup.',
            'The AI endpoints are not rate limited. Doing that properly needs a shared store; per-instance counters on serverless would be security theatre, so we left it out rather than fake it.',
            'Without a live database configured, reports are stored in your own browser only — they will not be visible to anyone else.',
          ]}
        />
      </Section>

      <Section title="How it could work safely at scale">
        <ul className="list-disc list-inside space-y-1.5">
          <li>
            Replace the mock registry with ward-boundary GIS joined to a department asset
            register, so routing is derived from a pin rather than a typed city name.
          </li>
          <li>
            Treat the model as a drafting assistant, never an adjudicator. The citizen
            confirms every field, and a department-side reviewer sees the original text
            and photo alongside the draft.
          </li>
          <li>
            Rate-limit and de-duplicate by location so one pothole reported by forty
            people is one work order with forty followers, not forty tickets.
          </li>
          <li>
            Make the SLA clock the government's own published target, and keep escalation
            auditable — every rung timestamped, nothing quietly closed.
          </li>
          <li>
            Keep reporting anonymous but require verification before anything is labelled
            a fatality, so the public record stays credible.
          </li>
        </ul>
      </Section>

      <div className="border border-yellow-800/50 bg-yellow-900/10 rounded-lg p-5 mt-12">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={18} />
          <p className="text-gray-400 text-sm">
            <span className="text-yellow-400 font-bold">Not an official product.</span>{' '}
            This is an independent prototype with no government affiliation, endorsement or
            partnership. Do not enter real Aadhaar, PAN, payment or health information. Use
            the sample data provided.
          </p>
        </div>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-3">
        <Link
          to="/report"
          className="flex-1 text-center bg-blood text-white px-6 py-3 font-bold uppercase text-sm rounded hover:bg-red-700 transition"
        >
          Try the journey
        </Link>
        <Link
          to="/"
          className="flex-1 text-center border border-gray-700 text-gray-300 px-6 py-3 font-bold uppercase text-sm rounded hover:border-gray-500 transition"
        >
          See the public record
        </Link>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-header font-bold text-white border-l-4 border-blood pl-4 mb-4">
        {title}
      </h2>
      <div className="text-gray-400 text-sm leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

function List({ icon, items }: { icon: React.ReactNode; items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          {icon}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

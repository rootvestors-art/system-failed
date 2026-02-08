import type { Incident } from '../types/incident.ts'
import type { Hazard } from '../types/incident.ts'

export const seedHazards: Hazard[] = [
  {
    id: 'h1',
    location: {
      lat: 28.5921,
      lng: 77.0460,
      address: 'Sector 6, Near Dwarka Metro Station',
      city: 'Dwarka, Delhi',
      state: 'Delhi',
    },
    negligence_type: 'Open_Drain',
    severity: 'Critical',
    description:
      'Large uncovered manhole on a busy pedestrian path near Dwarka Sector 6 metro station. No barricades or warning signs. Multiple near-misses reported by residents, especially dangerous after dark with no street lighting.',
    evidence_links: [
      'https://www.ndtv.com/delhi-news/uncovered-manholes-delhi-dwarka',
    ],
    status: 'Verified',
    reported_by: 'Anonymous',
    upvote_count: 7,
    created_at: '2026-02-06T14:00:00Z',
  },
  {
    id: 'h2',
    location: {
      lat: 12.9352,
      lng: 77.6245,
      address: '1st Cross, Koramangala 4th Block',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
    negligence_type: 'Electrocution',
    severity: 'High',
    description:
      'Exposed high-voltage wires hanging at head height from a broken BESCOM transformer pole. Sparks visible during rain. Residents have complained multiple times with no action taken.',
    evidence_links: [],
    status: 'Reported',
    upvote_count: 3,
    created_at: '2026-02-05T09:30:00Z',
  },
  {
    id: 'h3',
    location: {
      lat: 19.0632,
      lng: 72.8358,
      address: 'Linking Road, near Shoppers Stop',
      city: 'Mumbai',
      state: 'Maharashtra',
    },
    negligence_type: 'Pothole',
    severity: 'High',
    description:
      'Crater-sized pothole spanning half the lane on Linking Road. At least 3 feet deep and filled with stagnant water, making it invisible to drivers. Several two-wheelers have crashed here in the past week.',
    evidence_links: [],
    status: 'Reported',
    upvote_count: 5,
    created_at: '2026-02-04T16:00:00Z',
  },
]

export const seedIncidents: Incident[] = [
  {
    id: '1',
    case_id: 'DL-2026-001',
    title: 'Bank Manager Falls Into Uncovered DJB Pit',
    victims: [
      {
        name: 'Kamal Dhyani',
        age: 25,
        occupation: 'HDFC Bank Assistant Manager',
        outcome: 'Death',
      },
    ],
    date_of_incident: '2026-02-06',
    location: {
      lat: 28.6303,
      lng: 77.0825,
      address: 'Near Andhra School, Joginder Singh Marg',
      city: 'Janakpuri, Delhi',
      state: 'Delhi',
    },
    negligence_type: 'Open_Pit',
    responsible_entities: {
      agency: 'Delhi Jal Board (DJB)',
      ward: 'Janakpuri Ward',
      mla: 'Unknown',
      mp: 'Unknown',
      cm: 'Chief Minister, Delhi',
    },
    status: 'Verified',
    evidence_links: [
      'https://www.ndtv.com/delhi-news/delhi-man-falls-into-15-foot-pit-dug-by-jal-board-dies-7670389',
      'https://timesofindia.indiatimes.com/city/delhi/25-year-old-banker-falls-into-15-foot-deep-djb-pit-in-delhis-janakpuri-dies/articleshow/128003498.cms',
    ],
    description:
      'A 25-year-old HDFC Bank Assistant Manager fell into a 15-foot deep pit dug by the Delhi Jal Board (DJB) for construction work near Andhra School on Joginder Singh Marg in Janakpuri. The pit had no barricades, warning signs, or lighting. He was returning home at night when he fell in. He was pulled out and rushed to DDU Hospital but was declared dead on arrival. DJB had left the pit open and unguarded despite it being on a public road.',
    image_url: '/images/WhatsApp Image 2026-02-07 at 1.19.07 PM.jpeg',
    upvote_count: 12,
    created_at: '2026-02-07T08:00:00Z',
  },
  {
    id: '2',
    case_id: 'DL-2026-002',
    title: 'Biker Dies in Open DJB Pit, Police Argue Over Jurisdiction',
    victims: [
      {
        name: 'Abhishek',
        age: 28,
        occupation: 'Private Employee',
        outcome: 'Death',
      },
    ],
    date_of_incident: '2026-02-05',
    location: {
      lat: 28.6480,
      lng: 77.2506,
      address: 'Shanti Van Area',
      city: 'Delhi',
      state: 'Delhi',
    },
    negligence_type: 'Open_Pit',
    responsible_entities: {
      agency: 'Delhi Jal Board (DJB)',
      ward: 'Civil Lines Ward',
      mla: 'Unknown',
      mp: 'Unknown',
      cm: 'Chief Minister, Delhi',
    },
    status: 'Verified',
    evidence_links: [
      'https://timesofindia.indiatimes.com/city/delhi/after-noida-techies-death-delhi-biker-falls-into-pit-dies-family-spent-night-shuttling-between-police-stations/articleshow/127973494.cms',
    ],
    description:
      'Biker fell into an open Delhi Jal Board pit left without signage near Shanti Van. While the victim lay dying, police from two stations argued over jurisdiction. The family spent the night shuttling between stations instead of grieving.',
    upvote_count: 8,
    created_at: '2026-02-06T05:00:00Z',
  },
  {
    id: '3',
    case_id: 'KA-2026-015',
    title: 'Two-Wheeler Rider Killed After Hitting Pothole',
    victims: [
      {
        age: 45,
        outcome: 'Death',
      },
    ],
    date_of_incident: '2026-02-04',
    location: {
      lat: 12.9566,
      lng: 77.7010,
      address: 'Outer Ring Road, Marathahalli',
      city: 'Bengaluru',
      state: 'Karnataka',
    },
    negligence_type: 'Pothole',
    responsible_entities: {
      agency: 'BBMP (Bruhat Bengaluru Mahanagara Palike)',
      ward: 'Marathahalli Ward',
    },
    status: 'Community_Flagged',
    evidence_links: [],
    description:
      'Two-wheeler rider lost control after hitting a large pothole on the Outer Ring Road. No street lighting in the area. BBMP had been notified about the pothole weeks earlier.',
    upvote_count: 5,
    created_at: '2026-02-05T10:00:00Z',
  },
]

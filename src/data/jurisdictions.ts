import type { NegligenceType } from '../types/incident.ts'

/**
 * Hazard-to-authority routing, derived from
 * `docs/india-city-hazard-authority-matrix.md` (research snapshot 28 Aug 2026).
 *
 * That document is emphatic about two things, and this module honours both:
 *
 * 1. Ownership in Indian cities depends on the exact road, ward and asset — not
 *    just the city. City plus hazard type yields a *suggested first router*, never
 *    a jurisdictional fact. Every result carries a confidence level, and the UI is
 *    required to present it as a suggestion.
 *
 * 2. For a utility or transport asset, the owner of the asset outranks the owner
 *    of the surrounding road. A metro pillar belongs to the metro corporation even
 *    when it stands on a municipal street; a pothole on a national highway is
 *    NHAI's. `detectSpecialAsset` applies those overrides.
 *
 * What the matrix specifies and this prototype does NOT implement: ward polygons,
 * an asset register, per-department complaint channels, and source-freshness
 * dates. Those are disclosed as gaps rather than faked.
 *
 * SLA windows are ILLUSTRATIVE. Civic bodies publish varying redressal targets and
 * they are not consistently enforceable; these demonstrate the escalation
 * mechanic, not a statutory deadline.
 */

export interface EscalationLevel {
  /** How this rung is described to the citizen */
  label: string
  /** Who the complaint sits with at this rung */
  authority: string
  /** Days this rung gets before the complaint escalates again */
  windowDays: number
}

export interface Jurisdiction {
  city: string
  state: string
  /** Department that owns the asset, per hazard type */
  agencyByType: Partial<Record<NegligenceType, string>>
  /** Other bodies that commonly share ownership, per hazard type */
  coResponsibleByType?: Partial<Record<NegligenceType, string>>
  /** Used when the hazard type has no specific owner mapped */
  defaultAgency: string
  wardOffice: string
  mla: string
  mp: string
  cm: string
  /** The real service this prototype is proposing to replace */
  existingPortal: string
  /** Days the owning department gets before the first escalation */
  slaDays: number
  /**
   * 'verified' — the mapping comes from the authority matrix document.
   * 'unverified' — a reasonable guess we have not cross-checked.
   */
  sourceConfidence: 'verified' | 'unverified'
}

/**
 * Life-safety instructions that must come BEFORE a complaint is filed.
 *
 * A live wire is not a three-day ticket. The matrix lists emergency numbers for
 * exactly this reason, and surfacing them is the difference between a reporting
 * tool and a safety tool.
 */
export const EMERGENCY_GUIDANCE: Partial<Record<NegligenceType, string>> = {
  Electrocution:
    'If a wire is live, sparking or down: call the electricity emergency line 1912 now, and 112 if anyone is hurt or there is a fire. Do not touch it, or any water near it.',
  Collapse:
    'If a structure has fallen or looks about to, call 112 and Fire 101 first. File this report afterwards.',
  Dangerous_Structure:
    'If collapse looks imminent, or pieces are already falling, call 112 and Fire 101 before filing. Keep people from underneath it.',
  Open_Pit:
    'If someone has fallen in, call 112 immediately. Do not climb into a deep or waterlogged pit to attempt a rescue.',
  Water_Leak:
    'If a main has burst and water is flooding fast, call the water utility helpline too — that is handled as an emergency.',
}

/**
 * Assets whose owner overrides the municipal route entirely, from the matrix's
 * "National specialist routes" section.
 */
export interface SpecialAsset {
  kind: 'metro' | 'highway' | 'railway' | 'airport' | 'cantonment'
  authority: string
  reason: string
  emergency?: string
}

const METRO_BY_CITY: Record<string, string> = {
  Bengaluru: 'BMRCL (Bangalore Metro Rail Corporation)',
  Delhi: 'DMRC (Delhi Metro Rail Corporation)',
  Mumbai: 'MMRDA / Mumbai Metro operator',
  Chennai: 'CMRL (Chennai Metro Rail Limited)',
  Kolkata: 'Metro Railway Kolkata',
  Ahmedabad: 'GMRC (Gujarat Metro Rail Corporation)',
  Hyderabad: 'HMRL (Hyderabad Metro Rail Limited)',
  Pune: 'Maha-Metro (Pune Metro)',
  Gurugram: 'DMRC / Rapid Metro Gurugram',
}

/**
 * Detect an asset that changes who owns the problem, from the citizen's own words.
 *
 * Deliberately conservative and keyword-based: a wrong override sends the
 * complaint to the wrong body, so it only fires on unambiguous mentions.
 */
export function detectSpecialAsset(text: string, city: string): SpecialAsset | null {
  const t = text.toLowerCase()

  if (/metro pillar|metro station|metro viaduct|metro line|\bmetro\b/.test(t)) {
    return {
      kind: 'metro',
      authority: METRO_BY_CITY[city] ?? 'The city metro rail corporation',
      reason:
        'Metro structures — pillars, viaducts and stations — belong to the metro corporation, not the municipal body, even when they stand on a city street.',
      emergency: 'If a metro structure looks unsafe, call 112 as well as reporting it.',
    }
  }

  if (/national highway|\bnh[-\s]?\d+|\bnhai\b|expressway/.test(t)) {
    return {
      kind: 'highway',
      authority: 'NHAI (National Highways Authority of India) or its concessionaire',
      reason:
        'A hazard on a national highway carriageway, median or service road belongs to NHAI, not the city corporation.',
      emergency: 'Highway incidents: call the NHAI helpline 1033.',
    }
  }

  if (/railway|rail track|level crossing|railway gate/.test(t)) {
    return {
      kind: 'railway',
      authority: 'The relevant zonal railway',
      reason:
        'Track, gates, signalling and structures inside the railway boundary belong to the zonal railway, not the municipality.',
      emergency: 'Railway danger: RailMadad 139, or 112 if there is immediate risk.',
    }
  }

  if (/\bairport\b/.test(t)) {
    return {
      kind: 'airport',
      authority: 'The airport operator / AAI',
      reason: 'Hazards inside an airport estate are the airport operator’s responsibility.',
    }
  }

  if (/cantonment/.test(t)) {
    return {
      kind: 'cantonment',
      authority: 'The Cantonment Board / Defence Estates',
      reason:
        'Cantonment land is administered by the Cantonment Board, not the city corporation.',
    }
  }

  return null
}

const NATIONAL_FALLBACK: Jurisdiction = {
  city: 'Unmapped city',
  state: 'India',
  agencyByType: {},
  defaultAgency: 'Local Municipal Corporation',
  wardOffice: 'Ward Office',
  mla: 'Area MLA',
  mp: 'Area MP',
  cm: 'Chief Minister',
  existingPortal: 'CPGRAMS (pgportal.gov.in)',
  slaDays: 7,
  sourceConfidence: 'unverified',
}

export const JURISDICTIONS: Jurisdiction[] = [
  {
    city: 'Bengaluru',
    state: 'Karnataka',
    // Mid-transition from BBMP to the Greater Bengaluru Authority.
    agencyByType: {
      Pothole: 'City corporation / GBA roads division',
      Road_Design: 'Road owner + Bengaluru Traffic Police',
      Broken_Footpath: 'City corporation zonal engineering',
      Street_Light: 'City corporation / GBA street-light division',
      Electrocution: 'BESCOM',
      Open_Drain: 'City corporation storm-water-drain division',
      Waterlogging: 'City corporation storm-water-drain division',
      Water_Leak: 'BWSSB',
      Open_Pit: 'BWSSB (or whichever utility dug it)',
      Collapse: 'City corporation building-control / town planning',
      Dangerous_Structure: 'City corporation building-control / town planning',
      Debris: 'City corporation solid-waste-management division',
      Garbage_Waste: 'City corporation solid-waste-management division',
    },
    coResponsibleByType: {
      Pothole: 'Karnataka PWD (state roads), NHAI (national highways), BDA (retained layouts)',
      Road_Design: 'BMLTA/DULT for network planning; NHAI/PWD/BDA on their corridors',
      Street_Light: 'BESCOM where the supply or service line failed',
      Electrocution: 'City corporation for street-light fixtures; KPTCL for transmission',
      Open_Drain: 'BWSSB for sewage overflow; lake authority for outfalls',
      Dangerous_Structure: 'BDA, BMRCL or railway land depending on the site',
      Garbage_Waste: 'KSPCB for hazardous or industrial waste',
    },
    defaultAgency: 'BBMP / Greater Bengaluru Authority',
    wardOffice: 'Ward office (Assistant Engineer)',
    mla: 'Area MLA, Karnataka Assembly',
    mp: 'Area MP, Karnataka',
    cm: 'Chief Minister, Karnataka',
    existingPortal: 'BBMP Sahaaya 2.0',
    slaDays: 2,
    sourceConfidence: 'verified',
  },
  {
    city: 'Delhi',
    state: 'Delhi',
    agencyByType: {
      Pothole: 'MCD engineering (colony roads) / PWD Delhi (arterial roads)',
      Road_Design: 'Owning road agency + Delhi Traffic Police',
      Broken_Footpath: 'Owning road agency (MCD / PWD / NDMC)',
      Street_Light: 'Owning civic or road agency lighting wing',
      Electrocution: 'Area DISCOM (BSES Rajdhani, BSES Yamuna or Tata Power-DDL)',
      Open_Drain: 'Owning civic agency (MCD / PWD / NDMC)',
      Waterlogging: 'Owning civic agency (MCD / PWD / NDMC)',
      Water_Leak: 'Delhi Jal Board (DJB)',
      Open_Pit: 'Delhi Jal Board (DJB), or whichever utility dug it',
      Collapse: 'MCD building department',
      Dangerous_Structure: 'MCD building department',
      Debris: 'MCD sanitation',
      Garbage_Waste: 'MCD sanitation',
    },
    coResponsibleByType: {
      Pothole: 'NDMC, DDA, NHAI or Delhi Cantonment by ownership; DJB for failed restoration',
      Road_Design: 'NHAI on national highways; DDA for transport approvals',
      Street_Light: 'DISCOM when the supply or distribution equipment is at fault',
      Electrocution: 'NDMC electricity in its supply area; DTL for transmission',
      Open_Drain: 'DJB for sewage; Irrigation & Flood Control for major drains',
      Dangerous_Structure: 'NDMC/DDA in their jurisdictions; Delhi Fire Service in an emergency',
      Garbage_Waste: 'DPCC for hazardous or industrial waste',
    },
    defaultAgency: 'Municipal Corporation of Delhi (MCD)',
    wardOffice: 'MCD Zonal Office',
    mla: 'Area MLA, Delhi Assembly',
    mp: 'Area MP, Delhi',
    cm: 'Chief Minister, Delhi',
    existingPortal: 'MCD311 / PWD Delhi grievance portal',
    slaDays: 3,
    sourceConfidence: 'verified',
  },
  {
    city: 'Mumbai',
    state: 'Maharashtra',
    agencyByType: {
      Pothole: 'BMC Roads & Traffic Department / ward office',
      Road_Design: 'Road owner + Mumbai Traffic Police',
      Broken_Footpath: 'BMC ward roads & maintenance',
      Street_Light: 'BMC / BEST, or the corridor owner',
      Electrocution: 'Supply licensee by area (BEST, Adani Electricity, Tata Power or MSEDCL)',
      Open_Drain: 'BMC Storm Water Drains Department',
      Waterlogging: 'BMC Storm Water Drains Department',
      Water_Leak: 'BMC Hydraulic Engineer / Sewerage Operations',
      Open_Pit: 'BMC ward office, or whichever utility dug it',
      Collapse: 'BMC Building Proposals / ward building & factory',
      Dangerous_Structure: 'BMC Building Proposals / ward building & factory',
      Debris: 'BMC Solid Waste Management',
      Garbage_Waste: 'BMC Solid Waste Management',
    },
    coResponsibleByType: {
      Pothole: 'MMRDA, MSRDC, Maharashtra PWD, NHAI, port or utility-cut owner',
      Road_Design: 'MMRDA/MSRDC/NHAI on controlled corridors',
      Electrocution: 'Maharashtra transmission utility for high-voltage assets',
      Dangerous_Structure: 'MHADA, SRA, MMRDA, port or railway land by jurisdiction',
      Garbage_Waste: 'MPCB for hazardous or industrial waste',
    },
    defaultAgency: 'BMC / MCGM',
    wardOffice: 'BMC Ward Office (Assistant Commissioner)',
    mla: 'Area MLA, Maharashtra Assembly',
    mp: 'Area MP, Maharashtra',
    cm: 'Chief Minister, Maharashtra',
    existingPortal: 'MyBMC Citizen Portal',
    slaDays: 2,
    sourceConfidence: 'verified',
  },
  {
    city: 'Chennai',
    state: 'Tamil Nadu',
    agencyByType: {
      Pothole: 'GCC Roads / Bus Route Roads and zonal office',
      Road_Design: 'Road owner + Greater Chennai Traffic Police',
      Broken_Footpath: 'GCC zonal engineering',
      Street_Light: 'GCC Electrical Department',
      Electrocution: 'TANGEDCO / TNPDCL',
      Open_Drain: 'GCC Storm Water Drains and zonal office',
      Waterlogging: 'GCC Storm Water Drains and zonal office',
      Water_Leak: 'Chennai Metro Water (CMWSSB)',
      Open_Pit: 'CMWSSB, or whichever utility dug it',
      Collapse: 'GCC Buildings / Town Planning',
      Dangerous_Structure: 'GCC Buildings / Town Planning',
      Debris: 'GCC Solid Waste Management',
      Garbage_Waste: 'GCC Solid Waste Management / zonal conservancy',
    },
    coResponsibleByType: {
      Pothole: 'Tamil Nadu Highways, NHAI, port, CMRL or utility-cut owner',
      Street_Light: 'TANGEDCO where supply equipment failed',
      Dangerous_Structure: 'CMDA planning enforcement; Fire & Rescue in an emergency',
      Garbage_Waste: 'TNPCB for hazardous or industrial waste',
    },
    defaultAgency: 'Greater Chennai Corporation (GCC)',
    wardOffice: 'GCC Zonal Office',
    mla: 'Area MLA, Tamil Nadu Assembly',
    mp: 'Area MP, Tamil Nadu',
    cm: 'Chief Minister, Tamil Nadu',
    existingPortal: 'Namma Chennai app',
    slaDays: 3,
    sourceConfidence: 'verified',
  },
  {
    city: 'Kolkata',
    state: 'West Bengal',
    agencyByType: {
      Pothole: 'KMC Roads Department / borough',
      Road_Design: 'Road owner + Kolkata Traffic Police',
      Broken_Footpath: 'KMC Roads / borough',
      Street_Light: 'KMC Lighting Department',
      Electrocution: 'CESC (within its Kolkata licence area)',
      Open_Drain: 'KMC Sewerage & Drainage / borough',
      Waterlogging: 'KMC Sewerage & Drainage / borough',
      Water_Leak: 'KMC Water Supply',
      Open_Pit: 'KMC borough engineering, or whichever utility dug it',
      Collapse: 'KMC Building Department / borough',
      Dangerous_Structure: 'KMC Building Department / borough',
      Debris: 'KMC Solid Waste Management / borough',
      Garbage_Waste: 'KMC Solid Waste Management / borough',
    },
    coResponsibleByType: {
      Pothole: 'West Bengal PWD, KMDA, HRBC or NHAI by road and structure',
      Electrocution: 'WBSEDCL outside the CESC area; KMC Lighting for fixtures',
      Open_Drain: 'Irrigation & Waterways or KMDA for major channels',
      Garbage_Waste: 'WBPCB for hazardous or industrial waste',
    },
    defaultAgency: 'Kolkata Municipal Corporation (KMC)',
    wardOffice: 'KMC Borough Office',
    mla: 'Area MLA, West Bengal Assembly',
    mp: 'Area MP, West Bengal',
    cm: 'Chief Minister, West Bengal',
    existingPortal: 'KMC grievance portal',
    slaDays: 3,
    sourceConfidence: 'verified',
  },
  {
    city: 'Ahmedabad',
    state: 'Gujarat',
    agencyByType: {
      Pothole: 'AMC Roads / Engineering and zone',
      Road_Design: 'Road owner + Ahmedabad Traffic Police',
      Broken_Footpath: 'AMC zonal engineering',
      Street_Light: 'AMC Light Department / zonal office',
      Electrocution: 'Torrent Power (Ahmedabad distribution area)',
      Open_Drain: 'AMC Drainage / Storm Water and zone',
      Waterlogging: 'AMC Drainage / Storm Water and zone',
      Water_Leak: 'AMC Water Supply / Water Project',
      Open_Pit: 'AMC Engineering, or whichever utility dug it',
      Collapse: 'AMC Estate / Building Permission',
      Dangerous_Structure: 'AMC Estate / Town Development and Building Permission',
      Debris: 'AMC Solid Waste Management',
      Garbage_Waste: 'AMC Solid Waste Management',
    },
    coResponsibleByType: {
      Pothole: 'AUDA, Gujarat Roads & Buildings, NHAI or utility-cut owner',
      Electrocution: 'UGVCL in peripheral areas; GETCO for transmission',
      Garbage_Waste: 'GPCB for hazardous or industrial waste',
    },
    defaultAgency: 'Ahmedabad Municipal Corporation (AMC)',
    wardOffice: 'AMC Zonal Office',
    mla: 'Area MLA, Gujarat Assembly',
    mp: 'Area MP, Gujarat',
    cm: 'Chief Minister, Gujarat',
    existingPortal: 'AMC citizen grievance portal',
    slaDays: 3,
    sourceConfidence: 'verified',
  },
  {
    city: 'Gurugram',
    state: 'Haryana',
    // The matrix flags Gurugram as unusually fragmented — MCG, GMDA, HSVP,
    // Haryana PWD, NHAI and private developers all own roads inside the city.
    agencyByType: {
      Pothole: 'MCG (transferred municipal roads)',
      Road_Design: 'Road owner + Gurugram Traffic Police',
      Broken_Footpath: 'Actual road owner (MCG / GMDA / HSVP / PWD / NHAI)',
      Street_Light: 'MCG or GMDA, by corridor',
      Electrocution: 'DHBVN',
      Open_Drain: 'MCG or GMDA, by drain ownership',
      Waterlogging: 'MCG or GMDA, by drain ownership',
      Water_Leak: 'GMDA (master services) / MCG (distribution)',
      Open_Pit: 'MCG, or whichever utility dug it',
      Collapse: 'MCG building branch / DTCP Haryana',
      Dangerous_Structure: 'MCG building branch / DTCP Haryana',
      Debris: 'MCG sanitation',
      Garbage_Waste: 'MCG Solid Waste Management',
    },
    coResponsibleByType: {
      Pothole: 'GMDA master roads, HSVP sectors, Haryana PWD, NHAI (NH-48), private developers',
      Street_Light: 'HSVP / developer / NHAI on their assets; DHBVN for supply failure',
      Electrocution: 'MCG/GMDA for street-light hardware; HVPNL for transmission',
      Garbage_Waste: 'HSPCB for hazardous waste; private bulk generators',
    },
    defaultAgency: 'Municipal Corporation Gurugram (MCG)',
    wardOffice: 'MCG Ward / Zonal Office',
    mla: 'Area MLA, Haryana Assembly',
    mp: 'Area MP, Haryana',
    cm: 'Chief Minister, Haryana',
    existingPortal: 'MCG / ULB Haryana grievance portal',
    slaDays: 3,
    sourceConfidence: 'verified',
  },
  {
    city: 'Hyderabad',
    state: 'Telangana',
    // Not covered by the authority matrix — plausible but unverified.
    agencyByType: {
      Pothole: 'GHMC Engineering Wing',
      Road_Design: 'GHMC Engineering Wing + Hyderabad Traffic Police',
      Broken_Footpath: 'GHMC Engineering Wing',
      Street_Light: 'GHMC Street Lighting Wing',
      Electrocution: 'TGSPDCL',
      Open_Drain: 'GHMC Nala Maintenance',
      Waterlogging: 'GHMC Nala Maintenance',
      Water_Leak: 'HMWSSB',
      Open_Pit: 'HMWSSB, or whichever utility dug it',
      Collapse: 'GHMC Town Planning',
      Dangerous_Structure: 'GHMC Town Planning',
      Debris: 'GHMC Sanitation Wing',
      Garbage_Waste: 'GHMC Sanitation Wing',
    },
    defaultAgency: 'GHMC (Greater Hyderabad Municipal Corporation)',
    wardOffice: 'GHMC Circle Office (Deputy Commissioner)',
    mla: 'Area MLA, Telangana Assembly',
    mp: 'Area MP, Telangana',
    cm: 'Chief Minister, Telangana',
    existingPortal: 'MyGHMC app',
    slaDays: 3,
    sourceConfidence: 'unverified',
  },
  {
    city: 'Pune',
    state: 'Maharashtra',
    // Not covered by the authority matrix — plausible but unverified.
    agencyByType: {
      Pothole: 'PMC Road Department',
      Road_Design: 'PMC Road Department + Pune Traffic Police',
      Broken_Footpath: 'PMC Road Department',
      Street_Light: 'PMC Electrical Department',
      Electrocution: 'MSEDCL',
      Open_Drain: 'PMC Drainage Department',
      Waterlogging: 'PMC Drainage Department',
      Water_Leak: 'PMC Water Supply Dept',
      Open_Pit: 'PMC Water Supply Dept, or whichever utility dug it',
      Collapse: 'PMC Building Permission Dept',
      Dangerous_Structure: 'PMC Building Permission Dept',
      Debris: 'PMC Solid Waste Management',
      Garbage_Waste: 'PMC Solid Waste Management',
    },
    defaultAgency: 'Pune Municipal Corporation (PMC)',
    wardOffice: 'PMC Ward Office (Junior Engineer)',
    mla: 'Area MLA, Maharashtra Assembly',
    mp: 'Area MP, Maharashtra',
    cm: 'Chief Minister, Maharashtra',
    existingPortal: 'PMC CARE',
    slaDays: 3,
    sourceConfidence: 'unverified',
  },
]

/**
 * Resolve a jurisdiction from a free-text city/state pair.
 * Matching is deliberately fuzzy — citizens type "Janakpuri, Delhi" or
 * "Bangalore", not canonical city names.
 */
export function resolveJurisdiction(city: string, state: string): Jurisdiction {
  const haystack = `${city} ${state}`.toLowerCase()

  const aliases: Record<string, string> = {
    bangalore: 'Bengaluru',
    bengaluru: 'Bengaluru',
    bombay: 'Mumbai',
    mumbai: 'Mumbai',
    'new delhi': 'Delhi',
    delhi: 'Delhi',
    ncr: 'Delhi',
    hyderabad: 'Hyderabad',
    secunderabad: 'Hyderabad',
    chennai: 'Chennai',
    madras: 'Chennai',
    pune: 'Pune',
    poona: 'Pune',
    kolkata: 'Kolkata',
    calcutta: 'Kolkata',
    ahmedabad: 'Ahmedabad',
    amdavad: 'Ahmedabad',
    gurugram: 'Gurugram',
    gurgaon: 'Gurugram',
  }

  for (const [alias, canonical] of Object.entries(aliases)) {
    if (haystack.includes(alias)) {
      const match = JURISDICTIONS.find((j) => j.city === canonical)
      if (match) return match
    }
  }

  const byState = JURISDICTIONS.find((j) => haystack.includes(j.state.toLowerCase()))
  if (byState) return byState

  return {
    ...NATIONAL_FALLBACK,
    city: city || NATIONAL_FALLBACK.city,
    state: state || NATIONAL_FALLBACK.state,
  }
}

/** The department that owns this hazard type in this city. */
export function resolveAgency(
  city: string,
  state: string,
  type: NegligenceType | '',
): string {
  const j = resolveJurisdiction(city, state)
  if (!type) return j.defaultAgency
  return j.agencyByType[type] ?? j.defaultAgency
}

export interface Routing {
  /** Suggested first router — never asserted as definitive */
  primaryAuthority: string
  /** Bodies that commonly share ownership of this hazard */
  coResponsible: string | null
  /** Plain-language explanation the citizen can read */
  whyThisRoute: string
  /** How much to trust the suggestion */
  confidence: 'low' | 'medium'
  /** Life-safety instruction to act on before filing, if any */
  emergency: string | null
  /** Set when an asset owner overrode the municipal route */
  overriddenBy: SpecialAsset | null
  jurisdiction: Jurisdiction
}

/**
 * Full routing decision, including its reasoning and its limits.
 *
 * The matrix requires the product to return the authority, its co-owners, why
 * that route was chosen, and a confidence — so a guess is visibly a guess.
 * Confidence is never 'high': without ward polygons and an asset register we can
 * suggest an owner, not know one.
 */
export function resolveRouting(
  city: string,
  state: string,
  type: NegligenceType | '',
  description = '',
): Routing {
  const jurisdiction = resolveJurisdiction(city, state)
  const special = detectSpecialAsset(description, jurisdiction.city)
  const emergency = (type ? EMERGENCY_GUIDANCE[type] : undefined) ?? special?.emergency ?? null

  if (special) {
    return {
      primaryAuthority: special.authority,
      coResponsible: `${jurisdiction.defaultAgency}, for the surrounding road`,
      whyThisRoute: special.reason,
      confidence: 'low',
      emergency,
      overriddenBy: special,
      jurisdiction,
    }
  }

  const primaryAuthority = type
    ? jurisdiction.agencyByType[type] ?? jurisdiction.defaultAgency
    : jurisdiction.defaultAgency
  const coResponsible = type ? jurisdiction.coResponsibleByType?.[type] ?? null : null

  const label = type ? type.replace(/_/g, ' ').toLowerCase() : 'this issue'
  const whyThisRoute =
    jurisdiction.sourceConfidence === 'verified'
      ? `In ${jurisdiction.city}, ${label} is normally this department's responsibility. Ownership can still differ by road and ward.`
      : `We have not verified department ownership for ${jurisdiction.city}, so this is a best guess based on how most Indian city corporations are organised.`

  return {
    primaryAuthority,
    coResponsible,
    whyThisRoute,
    confidence: jurisdiction.sourceConfidence === 'verified' ? 'medium' : 'low',
    emergency,
    overriddenBy: null,
    jurisdiction,
  }
}

/**
 * The escalation ladder for a jurisdiction — the "chain of accountability",
 * made stateful. Each rung gets a window; when it lapses the complaint moves up.
 */
export function buildEscalationLadder(
  j: Jurisdiction,
  agency: string,
): EscalationLevel[] {
  return [
    {
      label: 'Owning department',
      authority: agency,
      windowDays: j.slaDays,
    },
    {
      label: 'Ward / zonal engineer',
      authority: j.wardOffice,
      windowDays: j.slaDays * 2,
    },
    {
      label: 'Municipal commissioner',
      authority: `Commissioner, ${j.defaultAgency}`,
      windowDays: j.slaDays * 3,
    },
    {
      label: 'Elected representative',
      authority: `${j.mla} / ${j.mp}`,
      windowDays: j.slaDays * 4,
    },
    {
      label: 'Published as unresolved',
      authority: `${j.cm} — and the public record`,
      windowDays: Number.POSITIVE_INFINITY,
    },
  ]
}

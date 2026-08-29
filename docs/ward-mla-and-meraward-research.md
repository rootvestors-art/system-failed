# Ward, MLA, and MeraWard research

Last researched: 29 August 2026

## Executive conclusion

A single `ward -> MLA` table is not geographically correct. Municipal wards elect
councillors and Assembly constituencies elect MLAs. Their boundaries overlap but are
not nested consistently. The reliable lookup is:

1. Capture a latitude/longitude.
2. Point-in-polygon lookup against the current municipal ward boundary.
3. A separate point-in-polygon lookup against the current Assembly constituency.
4. Join the Assembly constituency code to a versioned representative directory.

Every result shown to a citizen should include `source`, `source_date`,
`boundary_version`, `verified_at`, and a "report incorrect routing" action.

## What is safely usable now

| City | Municipal geography | Assembly geography | Product status |
|---|---|---|---|
| Delhi | 250 MCD electoral wards from the 2022 delimitation. NDMC and Delhi Cantonment are separate local bodies. | 70 Assembly constituencies; 2025 election winners listed below. | Best first city. Use MCD ward polygons only inside MCD jurisdiction and explicitly detect NDMC/Cantonment. |
| Mumbai | 24 BMC administrative wards. Electoral wards are a different, election-specific layer (227 in the 2017 scheme); do not call the 24 wards councillor wards. | 36 Assembly constituencies in Mumbai City and Mumbai Suburban; 2024 winners listed below. | Good second city. Route operations by 24 administrative wards and show MLA separately. |
| Bengaluru | BBMP was replaced by the Greater Bengaluru Authority and five city corporations. Public 198- and 243-ward files are legacy snapshots, not a safe current routing layer. | 28 Bengaluru-area Assembly constituencies; 2023 winners listed below. | Do not silently ship the old BBMP layer. Show city corporation plus Assembly constituency until the final ward gazette/geometry is ingested. |

## Delhi

### Municipal structure

- Municipal Corporation of Delhi: 250 electoral wards.
- New Delhi Municipal Council: separate civic authority; not an MCD ward.
- Delhi Cantonment Board: separate civic authority; not an MCD ward.
- The complete numbered 2022 MCD list is in
  [delhi-mcd-wards-2022.csv](./delhi-mcd-wards-2022.csv).
- `(W)`, `(SC)`, and `(SC-W)` in that file are 2022 election reservation
  annotations, not part of the locality name.

Primary source: [State Election Commission, NCT of Delhi reports](https://sec.delhi.gov.in/doit/tab-content/reports).
The extracted list was cross-checked against the ward-wise 2022 election table.

### Current Delhi MLAs

These are the 2025 election winners. Before production launch, check the Delhi
Assembly directory for vacancies, deaths, resignations, or by-elections.

| No. | Constituency | MLA |
|---:|---|---|
| 1 | Narela | Raj Karan Khatri |
| 2 | Burari | Sanjeev Jha |
| 3 | Timarpur | Surya Prakash Khatri |
| 4 | Adarsh Nagar | Raj Kumar Bhatia |
| 5 | Badli | Deepak Chaudhary |
| 6 | Rithala | Kulwant Rana |
| 7 | Bawana | Ravinder Indraj Singh |
| 8 | Mundka | Gajender Drall |
| 9 | Kirari | Anil Jha Vats |
| 10 | Sultanpur Majra | Mukesh Kumar Ahlawat |
| 11 | Nangloi Jat | Manoj Kumar Shokeen |
| 12 | Mangolpuri | Raj Kumar Chauhan |
| 13 | Rohini | Vijendra Gupta |
| 14 | Shalimar Bagh | Rekha Gupta |
| 15 | Shakur Basti | Karnail Singh |
| 16 | Tri Nagar | Tilak Ram Gupta |
| 17 | Wazirpur | Poonam Sharma |
| 18 | Model Town | Ashok Goel |
| 19 | Sadar Bazar | Som Dutt |
| 20 | Chandni Chowk | Punardeep Singh Sawhney |
| 21 | Matia Mahal | Aaley Mohammad Iqbal |
| 22 | Ballimaran | Imran Hussain |
| 23 | Karol Bagh | Vishesh Ravi |
| 24 | Patel Nagar | Pravesh Ratn |
| 25 | Moti Nagar | Harish Khurana |
| 26 | Madipur | Kailash Gangwal |
| 27 | Rajouri Garden | Manjinder Singh Sirsa |
| 28 | Hari Nagar | Shyam Sharma |
| 29 | Tilak Nagar | Jarnail Singh |
| 30 | Janakpuri | Ashish Sood |
| 31 | Vikaspuri | Pankaj Kumar Singh |
| 32 | Uttam Nagar | Pawan Sharma |
| 33 | Dwarka | Parduymn Rajput |
| 34 | Matiala | Sandeep Sehrawat |
| 35 | Najafgarh | Neelam Pahalwan |
| 36 | Bijwasan | Kailash Gahlot |
| 37 | Palam | Kuldeep Solanki |
| 38 | Delhi Cantonment | Virender Singh Kadian |
| 39 | Rajinder Nagar | Umang Bajaj |
| 40 | New Delhi | Parvesh Verma |
| 41 | Jangpura | Tarvinder Singh Marwah |
| 42 | Kasturba Nagar | Neeraj Basoya |
| 43 | Malviya Nagar | Satish Upadhyay |
| 44 | R. K. Puram | Anil Kumar Sharma |
| 45 | Mehrauli | Gajender Singh Yadav |
| 46 | Chhatarpur | Kartar Singh Tanwar |
| 47 | Deoli | Prem Chauhan |
| 48 | Ambedkar Nagar | Ajay Dutt |
| 49 | Sangam Vihar | Chandan Kumar Choudhary |
| 50 | Greater Kailash | Shikha Roy |
| 51 | Kalkaji | Atishi Marlena |
| 52 | Tughlakabad | Sahi Ram |
| 53 | Badarpur | Ram Singh Netaji |
| 54 | Okhla | Amanatullah Khan |
| 55 | Trilokpuri | Ravi Kant Ujjain |
| 56 | Kondli | Kuldeep Kumar |
| 57 | Patparganj | Ravinder Singh Negi |
| 58 | Laxmi Nagar | Abhay Verma |
| 59 | Vishwas Nagar | Om Prakash Sharma |
| 60 | Krishna Nagar | Anil Goyal |
| 61 | Gandhi Nagar | Arvinder Singh Lovely |
| 62 | Shahdara | Sanjay Goyal |
| 63 | Seemapuri | Veer Singh Dhingan |
| 64 | Rohtas Nagar | Jitender Mahajan |
| 65 | Seelampur | Chaudhary Zubair Ahmad |
| 66 | Ghonda | Ajay Mahawar |
| 67 | Babarpur | Gopal Rai |
| 68 | Gokalpur | Surendra Kumar |
| 69 | Mustafabad | Mohan Singh Bisht |
| 70 | Karawal Nagar | Kapil Mishra |

Result cross-check: [2025 Delhi Legislative Assembly election](https://en.wikipedia.org/wiki/2025_Delhi_Legislative_Assembly_election#Results_by_constituency).
For production, prefer the Election Commission result archive and current Assembly
member directory over the cross-check page.

## Mumbai

### BMC administrative wards

These 24 wards are operational/administrative areas:

| Ward | Common area label |
|---|---|
| A | Colaba, Fort |
| B | Dongri, Masjid Bunder |
| C | Marine Lines, Bhuleshwar |
| D | Malabar Hill, Grant Road |
| E | Byculla |
| F/N | Matunga, Sion |
| F/S | Parel, Sewri |
| G/N | Dadar, Mahim, Dharavi |
| G/S | Worli, Prabhadevi |
| H/E | Bandra East, Khar East, Santacruz East |
| H/W | Bandra West, Khar West, Santacruz West |
| K/E | Andheri East, Jogeshwari East |
| K/W | Andheri West, Jogeshwari West |
| L | Kurla |
| M/E | Govandi, Mankhurd |
| M/W | Chembur |
| N | Ghatkopar |
| P/N | Malad |
| P/S | Goregaon |
| R/N | Dahisar |
| R/C | Borivali |
| R/S | Kandivali |
| S | Bhandup |
| T | Mulund |

Geometry fallback: [DataMeet BMC administrative wards](https://github.com/datameet/Municipal_Spatial_Data/blob/master/Mumbai/BMC_Wards.geojson).
It contains 24 polygons and should be source-dated in the database. BMC electoral
wards are not interchangeable with this layer.

### Mumbai MLAs

The 36 Mumbai City and Mumbai Suburban winners from the 2024 Maharashtra election:

| No. | Constituency | MLA |
|---:|---|---|
| 152 | Borivali | Sanjay Upadhyay |
| 153 | Dahisar | Manisha Chaudhary |
| 154 | Magathane | Prakash Surve |
| 155 | Mulund | Mihir Kotecha |
| 156 | Vikhroli | Sunil Raut |
| 157 | Bhandup West | Ashok Patil |
| 158 | Jogeshwari East | Anant Nar |
| 159 | Dindoshi | Sunil Prabhu |
| 160 | Kandivali East | Atul Bhatkhalkar |
| 161 | Charkop | Yogesh Sagar |
| 162 | Malad West | Aslam Shaikh |
| 163 | Goregaon | Vidya Thakur |
| 164 | Versova | Haroon Rashid Khan |
| 165 | Andheri West | Ameet Satam |
| 166 | Andheri East | Murji Patel |
| 167 | Vile Parle | Parag Alavani |
| 168 | Chandivali | Dilip Lande |
| 169 | Ghatkopar West | Ram Kadam |
| 170 | Ghatkopar East | Parag Shah |
| 171 | Mankhurd Shivaji Nagar | Abu Azmi |
| 172 | Anushakti Nagar | Sana Malik |
| 173 | Chembur | Tukaram Kate |
| 174 | Kurla | Mangesh Kudalkar |
| 175 | Kalina | Sanjay Potnis |
| 176 | Vandre East | Varun Sardesai |
| 177 | Vandre West | Ashish Shelar |
| 178 | Dharavi | Jyoti Gaikwad |
| 179 | Sion Koliwada | R. Tamil Selvan |
| 180 | Wadala | Kalidas Kolambkar |
| 181 | Mahim | Mahesh Sawant |
| 182 | Worli | Aaditya Thackeray |
| 183 | Shivadi | Ajay Choudhari |
| 184 | Byculla | Manoj Jamsutkar |
| 185 | Malabar Hill | Mangal Lodha |
| 186 | Mumbadevi | Amin Patel |
| 187 | Colaba | Rahul Narwekar |

Result cross-check: [2024 Maharashtra Legislative Assembly election](https://en.wikipedia.org/wiki/2024_Maharashtra_Legislative_Assembly_election#Results_by_constituency).

## Bengaluru

### Current municipal warning

The old BBMP model should no longer be described as current. The official GBA
public portal lists:

1. Bengaluru Central City Corporation
2. Bengaluru North City Corporation
3. Bengaluru South City Corporation
4. Bengaluru East City Corporation
5. Bengaluru West City Corporation

Official notice portal: [Greater Bengaluru Authority public documents](https://updates.bbmpgov.in/public).

The widely available [DataMeet BBMP file](https://github.com/datameet/Municipal_Spatial_Data/blob/master/Bangalore/BBMP.geojson)
contains 243 named wards (for example, `Kempegowda Ward`) and useful geometry, but
it is a legacy pre-GBA snapshot. Older products may use 198 wards. Neither number
should be labelled current without the final five-corporation gazette and boundary
version. MeraWard currently reports 198 BBMP wards and has generic/duplicate ward
records, so it is not a source for this migration.

Recommended launch behavior:

- ingest the five city-corporation polygons first;
- label the ward result "awaiting final ward boundary verification" where needed;
- retain the 243-ward file only as `legacy_bbmp_243`, never as an unqualified
  `bengaluru_wards` table;
- replace it when the GBA gazette and GIS layer are available.

### Bengaluru-area MLAs

These are the 28 constituencies commonly used for the Bengaluru/BBMP-area set in
the 2023 Karnataka election dataset. Anekal extends beyond the old core-city idea,
so the polygon lookup, not the city label, should decide whether to display it.

| No. | Constituency | MLA |
|---:|---|---|
| 150 | Yelahanka | S. R. Vishwanath |
| 151 | Krishnarajapuram | Byrati Basavaraj |
| 152 | Byatarayanapura | Krishna Byre Gowda |
| 153 | Yeshwantpur | S. T. Somashekhar |
| 154 | Rajarajeshwarinagar | Munirathna |
| 155 | Dasarahalli | S. Muniraju |
| 156 | Mahalakshmi Layout | K. Gopalaiah |
| 157 | Malleshwaram | C. N. Ashwath Narayan |
| 158 | Hebbal | Byrathi Suresh |
| 159 | Pulakeshinagar | A. C. Srinivasa |
| 160 | Sarvagnanagar | K. J. George |
| 161 | C. V. Raman Nagar | S. Raghu |
| 162 | Shivajinagar | Rizwan Arshad |
| 163 | Shanti Nagar | N. A. Haris |
| 164 | Gandhi Nagar | Dinesh Gundu Rao |
| 165 | Rajaji Nagar | S. Suresh Kumar |
| 166 | Govindraj Nagar | Priya Krishna |
| 167 | Vijay Nagar | M. Krishnappa |
| 168 | Chamrajpet | B. Z. Zameer Ahmed Khan |
| 169 | Chickpet | Uday Garudachar |
| 170 | Basavanagudi | L. A. Ravi Subramanya |
| 171 | Padmanabhanagar | R. Ashoka |
| 172 | B.T.M. Layout | Ramalinga Reddy |
| 173 | Jayanagar | C. K. Ramamurthy |
| 174 | Mahadevapura | Manjula S. |
| 175 | Bommanahalli | M. Satish Reddy |
| 176 | Bangalore South | M. Krishnappa |
| 177 | Anekal | B. Shivanna |

Result source/cross-check: the Election Commission detailed Karnataka 2023 result
linked from [the constituency result table](https://en.wikipedia.org/wiki/2023_Karnataka_Legislative_Assembly_election#Results_by_constituency).

## What MeraWard does

Research target: [meraward.in](https://meraward.in/)

The site is more than a static report form. Its public frontend and API expose:

- GPS-based corporation and ward detection with manual correction;
- corporation pages, ward pages, a public complaint map, and tracking IDs;
- issue photo and location evidence;
- "I have seen this" neighbour corroboration/prioritisation;
- officer workflow, resolution notes, proof images, and citizen feedback;
- a citizen satisfaction score by ward;
- councillor, MLA, MP, mayor, and commissioner display fields;
- English, Hindi, Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, and Gujarati;
- optional WhatsApp forwarding to a corporation;
- stale cached-boundary disclosure;
- a recyclable-waste buyer marketplace;
- category-specific search pages such as potholes, garbage, drainage, sewage,
  streetlights, water leakage, dumping, road damage, and open manholes.

Its public API advertises corporation, ward, complaint, feedback, satisfaction,
and nearby-buyer endpoints. The corporation catalog has hundreds of entries.

### Important data-quality finding

MeraWard is a product reference, not a representative-data source. Examples found
in its public records:

- Bengaluru is still modelled as 198 BBMP wards.
- Many Bengaluru wards are generic (`Ward 3`) or duplicated and MLA/MP values say
  "Under Review."
- Its NDMC record incorrectly reports 250 wards, conflating NDMC with MCD.
- Some mayor/commissioner fields contain placeholders or inconsistent names.

The UI does acknowledge unverified councillor data and potentially stale boundary
caches. SystemFailed should go further by displaying the exact source and date
beside every routing result.

## What SystemFailed should learn from it

Adopt:

1. GPS first, then ask the citizen to confirm or correct the detected place.
2. Separate civic authority, municipal ward, Assembly constituency, and
   representative cards.
3. Public issue map, neighbour corroboration, and duplicate-report joining.
4. Before/after resolution evidence and citizen confirmation that the fix is real.
5. Full-interface Indian-language support, not only translated complaint text.
6. Visible boundary confidence, source date, and manual correction.
7. Deep links to the correct official grievance channel with a generated,
   copy-ready complaint.

Improve:

1. Never say "sent to the officer" unless a documented integration actually sent it.
2. Show `suggested authority` versus `officially submitted` as different states.
3. Keep elected representatives as escalation/context, not the default operational
   owner of potholes, drains, wires, or waste.
4. Version representative and boundary data; automatically expire records for
   manual review.
5. Keep the hackathon journey focused. A scrap marketplace is useful but distracts
   from the life-safety report-to-resolution loop.

## Suggested database model

```text
jurisdictions(id, name, type, parent_id, source_url, source_date)
boundary_versions(id, jurisdiction_id, version, valid_from, valid_to, geometry)
constituencies(id, name, number, state, boundary_version_id)
representatives(id, constituency_id, role, name, party, valid_from, valid_to,
                source_url, verified_at)
authority_rules(city_id, hazard_category, road_owner_type, authority_id,
                official_channel_url, confidence, verified_at)
routing_results(report_id, lat, lng, ward_id, constituency_id, authority_id,
                boundary_version, rule_version, confidence)
```

Do not permanently materialise ward-to-MLA as if it were a legal relationship.
Resolve both polygons from the incident coordinate and cache the result with its
boundary versions.

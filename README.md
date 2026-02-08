# SystemFailed - Value of Life

A platform to document and track incidents of negligence-related deaths and injuries in India, along with preventive hazard reporting to save lives before tragedies occur.

## 🎯 Mission

To create accountability by documenting every life lost or injured due to government and civic negligence, while empowering citizens to report dangerous conditions before they become fatal.

## ✨ Features

### Incident Reporting
- **Multiple Victims Support**: Report incidents with multiple victims (deaths and/or injuries)
- **Detailed Documentation**: Title, description, victim information, date, location
- **Evidence Collection**: Upload photos and link news articles/sources
- **Responsible Entities**: Track agencies, MLAs, MPs responsible
- **Custom Negligence Types**: Predefined types (Pothole, Open Drain, Electrocution, etc.) + custom options
- **Community Verification**: Status tracking (Community Flagged, Verified, Official Denial)

### Death Trap Reporting (Preventive)
- Report dangerous hazards before they cause harm
- Severity levels: Low, Medium, High, Critical
- Photo evidence and location tracking
- Help prevent future incidents

### Interactive Features
- **Upvoting System**: Highlight critical cases
- **Live Map View**: Visualize incidents and hazards geographically
- **Search & Filter**: Find incidents by location, type, status
- **Pagination**: Browse through cases efficiently (7 per page)
- **Real-time Counter**: Track total deaths from negligence

### Data Visualization
- Death counter with animated digits
- Most upvoted incidents
- Recent cases timeline
- Responsible entity hierarchy
- Geographic distribution map

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Leaflet** for interactive maps
- **Lucide React** for icons

### Backend & Database
- **Supabase** (PostgreSQL)
  - Database with Row Level Security
  - Storage for evidence photos
  - Real-time subscriptions
  - RESTful API

### Key Libraries
- `react-leaflet` - Map integration
- `date-fns` - Date formatting
- `@supabase/supabase-js` - Database client

## 📁 Project Structure

```
ValueOfLife/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── IncidentCard.tsx
│   │   ├── HazardCard.tsx
│   │   ├── DeathCounter.tsx
│   │   ├── ReportForm.tsx
│   │   └── layout/
│   ├── features/            # Feature-specific components
│   │   └── incidents/
│   │       ├── IncidentList.tsx
│   │       ├── IncidentDetail.tsx
│   │       └── MapView.tsx
│   ├── services/            # API & business logic
│   │   ├── incidents.ts
│   │   └── supabase.ts
│   ├── types/               # TypeScript definitions
│   │   └── incident.ts
│   ├── utils/               # Helper functions
│   │   ├── formatters.ts
│   │   └── victims.ts
│   ├── data/                # Seed data
│   │   └── seed.ts
│   └── App.tsx
├── supabase/                # Database schema & migrations
│   ├── schema.sql
│   ├── add_upvotes.sql
│   └── add_victims_support.sql
├── context/                 # Project documentation
│   └── changes.md
└── public/                  # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ValueOfLife
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run `supabase/schema.sql`
   - Run migrations:
     - `supabase/add_upvotes.sql`
     - `supabase/add_victims_support.sql`
   - Create storage bucket named `evidence` (public)

4. **Configure environment variables**
   
   Create `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

## 📊 Database Schema

### Tables

**incidents**
- `id` (uuid, primary key)
- `case_id` (text) - Auto-generated case identifier
- `title` (text) - Incident headline
- `victims` (jsonb) - Array of victim objects
- `date_of_incident` (date)
- `location` (jsonb) - Coordinates, address, city, state
- `negligence_type` (text)
- `responsible_entities` (jsonb) - Agency, MLA, MP, etc.
- `status` (text) - Verified, Community_Flagged, Official_Denial
- `description` (text)
- `evidence_links` (text[])
- `image_url` (text)
- `upvote_count` (integer)
- `created_at` (timestamptz)

**hazards**
- `id` (uuid, primary key)
- `location` (jsonb)
- `negligence_type` (text)
- `severity` (text) - Low, Medium, High, Critical
- `description` (text)
- `image_url` (text)
- `evidence_links` (text[])
- `status` (text) - Reported, Verified, Fixed
- `reported_by` (text)
- `upvote_count` (integer)
- `created_at` (timestamptz)

### RPC Functions
- `increment_upvote(incident_id)` - Atomic upvote counter
- `increment_hazard_upvote(hazard_id)` - Atomic hazard upvote counter

## 🌐 Deployment

### Free Hosting Options

**Recommended: Vercel (FREE)**

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

**Alternative: Netlify**
- Similar process to Vercel
- Build command: `npm run build`
- Publish directory: `dist`

### Cost Breakdown
- **Supabase Free Tier**: 500MB DB, 1GB storage, 2GB bandwidth
- **Vercel Free Tier**: Unlimited bandwidth, automatic SSL
- **Total**: $0/month for moderate traffic

### Custom Domain
- Purchase domain (~$10-15/year)
- Connect via Vercel/Netlify dashboard
- SSL certificate included free

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Tailwind CSS for styling
- Component-based architecture

### Adding New Features

1. **New Incident Type**
   - Add to `NegligenceType` in `src/types/incident.ts`
   - Update `negligenceTypes` array in `ReportForm.tsx`
   - Update database constraint (optional)

2. **New Field**
   - Add to `Incident` interface in `src/types/incident.ts`
   - Update `CreateIncidentInput` in `src/services/incidents.ts`
   - Add to form in `ReportForm.tsx`
   - Update database schema

## 📝 Key Concepts

### Victim Structure
```typescript
interface Victim {
  name?: string        // Optional for unknown victims
  age?: number
  occupation?: string
  outcome: 'Death' | 'Serious_Injury'
}
```

### Incident Flow
1. User fills report form (title, victims, location, evidence)
2. Data validated on client side
3. Photo uploaded to Supabase Storage
4. Address geocoded via Nominatim API
5. Incident created in database
6. Case ID auto-generated (STATE-YEAR-SEQ)
7. Status set to "Community_Flagged"

### Upvote System
- Stored in database (`upvote_count` column)
- Tracked locally via localStorage (prevent double voting)
- Atomic increment via RPC function
- Real-time UI updates

## 🗺️ Map Integration

- **Library**: Leaflet + React Leaflet
- **Tiles**: OpenStreetMap
- **Geocoding**: Nominatim API (free, no API key)
- **Features**:
  - Red markers for incidents
  - Yellow markers for hazards
  - Clickable markers with details
  - Layer toggles
  - System status overlay

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Public read access for transparency
- Anonymous reporting allowed
- File uploads restricted to `evidence` bucket
- Environment variables for sensitive data
- No authentication required (by design)

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
- Verify Supabase URL and anon key in `.env.local`
- Check if RLS policies allow public access
- Ensure migrations are run

### Map Not Loading
- Check internet connection (requires OSM tiles)
- Verify Leaflet CSS is imported
- Check browser console for errors

### Images Not Uploading
- Verify `evidence` bucket exists in Supabase Storage
- Check bucket is set to public
- Verify storage policies allow anonymous uploads

## 📄 License

This project is open source and available for public use to promote transparency and accountability.

## 🤝 Contributing

Contributions are welcome! Areas for improvement:
- Additional negligence types
- Better data visualization
- Map improvement -> accuracy and data visualization
- Mobile app version
- API for third-party integrations
- Automated/Community verification system
- Search for an incident on the platform
- User registration/authentication/verification
- Multi-language support


## 📞 Contact

For questions, suggestions, or collaboration:
- Create an issue on GitHub
- Submit a pull request

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Nominatim for geocoding
- Supabase for backend infrastructure
- All contributors documenting incidents

---

**Remember**: Every incident documented is a step toward accountability. Every hazard reported could save a life.

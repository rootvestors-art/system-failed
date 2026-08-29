import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar.tsx'
import Footer from './components/layout/Footer.tsx'
import IncidentList from './features/incidents/IncidentList.tsx'
import IncidentDetail from './features/incidents/IncidentDetail.tsx'
import MapView from './features/incidents/MapView.tsx'
import ReportForm from './components/ReportForm.tsx'
import DeathTrapList from './features/hazards/DeathTrapList.tsx'
import DeathTrapDetail from './features/hazards/DeathTrapDetail.tsx'
import TrackComplaint from './features/tracking/TrackComplaint.tsx'
import HowItWorks from './pages/HowItWorks.tsx'
import Home from './pages/Home.tsx'
import Toast from './components/Toast.tsx'
import { LangProvider, useT } from './i18n/index.tsx'

/**
 * Wraps the citizen-facing journey in the light civic treatment.
 *
 * A dark interface reads as unofficial or alarming to many Indian users, and the
 * services this replaces (MCD311, Sahaaya, MyBMC) are all light. The memorial at
 * /accountability keeps the dark treatment, where a grave tone is correct.
 */
function Journey({ children }: { children: React.ReactNode }) {
  return <div className="theme-light bg-surface flex-1 flex flex-col">{children}</div>
}

export default function App() {
  return (
    <LangProvider>
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* The memorial record moved off the homepage — it is a different product
              from the reporting journey. /cases stays as an alias for old links. */}
          <Route path="/accountability" element={<AccountabilityPage />} />
          <Route path="/cases" element={<AccountabilityPage />} />
          <Route path="/incident/:id" element={<DetailPage />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/deathtraps" element={<DeathTrapListPage />} />
          <Route path="/deathtraps/:id" element={<DeathTrapDetailPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/track/:id" element={<TrackPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
        </Routes>
      </div>
      <Toast />
    </BrowserRouter>
    </LangProvider>
  )
}

function HomePage() {
  return (
    <Journey>
      <Home />
      <Footer />
    </Journey>
  )
}

function AccountabilityPage() {
  return (
    <>
      <IncidentList />
      <Footer />
    </>
  )
}

function DetailPage() {
  return (
    <>
      <IncidentDetail />
      <Footer />
    </>
  )
}

function ReportPage() {
  const t = useT()
  return (
    <Journey>
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <h1 className="text-2xl sm:text-3xl font-header font-bold text-ink mb-2 text-center">
          {t('report.title')}
        </h1>
        <p className="text-ink-muted text-center mb-8 sm:mb-10 text-sm max-w-xl mx-auto">
          {t('report.sub')}
        </p>
        <ReportForm />
      </main>
      <Footer />
    </Journey>
  )
}

function DeathTrapListPage() {
  return (
    <Journey>
      <DeathTrapList />
      <Footer />
    </Journey>
  )
}

function DeathTrapDetailPage() {
  return (
    <Journey>
      <DeathTrapDetail />
      <Footer />
    </Journey>
  )
}

function TrackPage() {
  return (
    <Journey>
      <TrackComplaint />
      <Footer />
    </Journey>
  )
}

function HowItWorksPage() {
  return (
    <Journey>
      <HowItWorks />
      <Footer />
    </Journey>
  )
}

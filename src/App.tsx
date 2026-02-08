import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar.tsx'
import Footer from './components/layout/Footer.tsx'
import IncidentList from './features/incidents/IncidentList.tsx'
import IncidentDetail from './features/incidents/IncidentDetail.tsx'
import MapView from './features/incidents/MapView.tsx'
import ReportForm from './components/ReportForm.tsx'
import DeathTrapList from './features/hazards/DeathTrapList.tsx'
import DeathTrapDetail from './features/hazards/DeathTrapDetail.tsx'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/incident/:id" element={<DetailPage />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/deathtraps" element={<DeathTrapListPage />} />
          <Route path="/deathtraps/:id" element={<DeathTrapDetailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

function HomePage() {
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
  return (
    <>
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <h1 className="text-4xl font-header font-bold text-white mb-2 text-center">
          REPORT AN INCIDENT
        </h1>
        <p className="text-gray-500 text-center mb-10">
          Document systemic negligence. Hold the system accountable.
        </p>
        <ReportForm />
      </main>
      <Footer />
    </>
  )
}

function DeathTrapListPage() {
  return (
    <>
      <DeathTrapList />
      <Footer />
    </>
  )
}

function DeathTrapDetailPage() {
  return (
    <>
      <DeathTrapDetail />
      <Footer />
    </>
  )
}

import { useEffect, useState } from 'react'
import { getAllIncidents, getMostUpvoted, getIncidentsPaginated } from '../../services/incidents.ts'
import IncidentCard from '../../components/IncidentCard.tsx'
import HierarchyCard from '../../components/HierarchyCard.tsx'
import DeathCounter from '../../components/DeathCounter.tsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Incident } from '../../types/incident.ts'

export default function IncidentList() {
  const [latest, setLatest] = useState<Incident | null>(null)
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([])
  const [topUpvoted, setTopUpvoted] = useState<Incident[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const pageSize = 7

  const loadData = async () => {
    // Get latest incident separately
    const allIncidents = await getAllIncidents()
    if (allIncidents.length > 0) {
      setLatest(allIncidents[0])
    }
    
    getMostUpvoted(5).then(setTopUpvoted)
  }

  const loadRecentCases = async (pageNum: number) => {
    const { incidents, total: totalCount, hasMore: more } = await getIncidentsPaginated(pageNum, pageSize)
    // Skip the first incident only on page 1 (it's shown as "Latest")
    const filtered = pageNum === 1 ? incidents.slice(1) : incidents
    setRecentIncidents(filtered)
    setHasMore(more)
    setTotal(totalCount)
    setPage(pageNum)
  }

  useEffect(() => {
    loadData()
    loadRecentCases(1)
  }, [])

  const handleNextPage = () => {
    if (hasMore) {
      loadRecentCases(page + 1)
    }
  }

  const handlePrevPage = () => {
    if (page > 1) {
      loadRecentCases(page - 1)
    }
  }

  return (
    <>
      <DeathCounter />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            {latest && (
              <>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="text-3xl font-header font-bold text-white border-l-8 border-blood pl-4">
                    LATEST CASE FILE
                  </h2>
                  <span className="text-red-500 font-mono text-sm">
                    CASE ID: {latest.case_id}
                  </span>
                </div>
                <IncidentCard incident={latest} onUpvote={loadData} />
              </>
            )}

            {/* More Recent Cases */}
            {recentIncidents.length > 0 && (
              <div className="mt-12">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-header font-bold text-white border-l-4 border-gray-700 pl-4">
                    RECENT CASES
                  </h2>
                  <span className="text-gray-500 text-sm">
                    Page {page}
                  </span>
                </div>
                
                {recentIncidents.map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} compact onUpvote={() => loadRecentCases(page)} />
                ))}

                {/* Pagination Controls */}
                {(page > 1 || hasMore) && (
                  <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                      onClick={handlePrevPage}
                      disabled={page === 1}
                      className={`flex items-center gap-2 px-4 py-2 rounded font-bold uppercase text-sm transition ${
                        page === 1
                          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      <ChevronLeft size={16} /> Previous
                    </button>
                    
                    <span className="text-gray-400 text-sm">
                      Showing {recentIncidents.length} cases
                    </span>
                    
                    <button
                      onClick={handleNextPage}
                      disabled={!hasMore}
                      className={`flex items-center gap-2 px-4 py-2 rounded font-bold uppercase text-sm transition ${
                        !hasMore
                          ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                          : 'bg-gray-800 text-white hover:bg-gray-700'
                      }`}
                    >
                      Next <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {latest && (
              <HierarchyCard entities={latest.responsible_entities} />
            )}

            {/* Most Upvoted */}
            {topUpvoted.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-header font-bold text-white border-l-4 border-blood pl-4 mb-4">
                  MOST UPVOTED
                </h3>
                {topUpvoted.slice(0, 3).map((incident) => (
                  <IncidentCard key={incident.id} incident={incident} compact onUpvote={loadData} />
                ))}
              </div>
            )}

            <div className="mt-10 bg-blood p-6 rounded text-center">
              <h3 className="text-white font-header font-bold text-2xl uppercase">
                Don't let them hide
              </h3>
              <p className="text-red-100 text-sm mb-4">
                Upload photos of negligence in your area before someone dies.
              </p>
              <a
                href="/report"
                className="block bg-black text-white px-6 py-3 font-bold uppercase w-full hover:bg-gray-900 transition text-center"
              >
                Report
              </a>
            </div>

            <a
              href="/deathtraps"
              className="block mt-4 text-yellow-500 hover:text-yellow-400 font-header font-bold uppercase tracking-wide text-sm text-center transition"
            >
              View Death Traps &rarr;
            </a>
          </div>
        </div>
      </main>
    </>
  )
}

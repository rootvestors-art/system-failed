export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-10 mt-10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-600 font-mono text-sm">
          CivicFix — Report · Route · Resolve &copy; {new Date().getFullYear()}
        </p>
        <p className="text-gray-700 text-xs mt-2 max-w-xl mx-auto">
          An independent prototype built for a hackathon. Not affiliated with or endorsed by any
          government authority.
        </p>
      </div>
    </footer>
  )
}

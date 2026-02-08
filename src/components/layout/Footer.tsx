export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800 py-10 mt-10">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-gray-600 font-mono text-sm">
          SystemFailed.in &copy; {new Date().getFullYear()}. Data sourced from
          Citizens, not the State.
        </p>
      </div>
    </footer>
  )
}

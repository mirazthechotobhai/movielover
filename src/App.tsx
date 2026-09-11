import { useState, useEffect } from 'react';
import { Tv, Home } from 'lucide-react';

function App() {
  const [showSmartTV, setShowSmartTV] = useState(
    typeof window !== 'undefined' && window.location.hash === '#smart-tv'
  );

  useEffect(() => {
    setShowSmartTV(window.location.hash === '#smart-tv');
  }, []);

  const openTVInNewTab = () => {
    window.open(`${window.location.origin}${window.location.pathname}#smart-tv`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-slate-900/80 border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/30">
              <Tv className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">
              WebTV
            </span>
          </div>

          <nav className="flex items-center gap-3">
            {showSmartTV && (
              <a
                href={window.location.pathname}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-slate-300 hover:text-white hover:bg-slate-700/40 transition-all duration-300"
              >
                <Home className="w-4 h-4" />
                Home
              </a>
            )}
            <button
              onClick={openTVInNewTab}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
            >
              <Tv className="w-4 h-4" />
              TV
            </button>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      <main className="min-h-[calc(100vh-73px)]">
        {showSmartTV ? (
          <div className="min-h-full flex items-center justify-center px-6">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold text-white tracking-wider select-none animate-pulse">
              Smart TV
            </h1>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
                Welcome to WebTV
              </h1>
              <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
                Click the <span className="text-cyan-400 font-semibold">TV</span> button in the
                header above to open your Smart TV in a new tab.
              </p>
              <button
                onClick={openTVInNewTab}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold text-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 transition-all duration-300"
              >
                <Tv className="w-5 h-5" />
                Open Smart TV
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;

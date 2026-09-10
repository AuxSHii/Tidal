function App() {
  return (
    <main className="tidal-shell">
      <div className="mx-auto flex min-h-screen max-w-[1800px] flex-col px-6 py-5">
        {/* Header */}
        <header className="flex items-center justify-between border-b tidal-divider pb-4">
          <div className="flex items-baseline gap-4">
            <h1 className="tidal-display text-2xl tracking-[0.08em]">
              TIDAL
            </h1>

            <span className="tidal-label">
              Maritime navigation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  'var(--tidal-accent)',
              }}
            />

            <span className="tidal-label">
              Ready
            </span>
          </div>
        </header>

        {/* Main workspace */}
        <section className="relative flex flex-1 py-5">
          {/* Navigation rail */}
          <nav className="hidden w-28 shrink-0 border-r tidal-divider pr-6 md:block">
            <div className="tidal-label mb-7">
              Navigation
            </div>

            <div className="relative space-y-7">
              <div
                className="absolute left-[3px] top-2 h-[calc(100%-16px)] w-px"
                style={{
                  backgroundColor:
                    'var(--tidal-border)',
                }}
              />

              <div className="relative flex items-center gap-3">
                <span
                  className="relative z-10 h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      'var(--tidal-accent)',
                    boxShadow:
                      '0 0 0 3px var(--tidal-background)',
                  }}
                />

                <span className="tidal-label text-[9px]">
                  Route
                </span>
              </div>

              <div className="relative flex items-center gap-3">
                <span
                  className="relative z-10 h-2 w-2 rounded-full border"
                  style={{
                    borderColor:
                      'var(--tidal-text-faint)',
                    backgroundColor:
                      'var(--tidal-background)',
                  }}
                />

                <span className="tidal-label text-[9px]">
                  Vessel
                </span>
              </div>

              <div className="relative flex items-center gap-3">
                <span
                  className="relative z-10 h-2 w-2 rounded-full border"
                  style={{
                    borderColor:
                      'var(--tidal-text-faint)',
                    backgroundColor:
                      'var(--tidal-background)',
                  }}
                />

                <span className="tidal-label text-[9px]">
                  Ocean
                </span>
              </div>

              <div className="relative flex items-center gap-3">
                <span
                  className="relative z-10 h-2 w-2 rounded-full border"
                  style={{
                    borderColor:
                      'var(--tidal-text-faint)',
                    backgroundColor:
                      'var(--tidal-background)',
                  }}
                />

                <span className="tidal-label text-[9px]">
                  Optimize
                </span>
              </div>
            </div>
          </nav>

          {/* Navigation display */}
          <div className="relative min-h-[620px] flex-1 overflow-hidden">
            {/* Atmospheric map surface */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor:
                  'var(--tidal-surface)',
              }}
            />
            {/* Cartographic grid */}
            <div className="absolute inset-0 opacity-[0.12]">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(190, 207, 211, 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(190, 207, 211, 0.5) 1px, transparent 1px)',
                  backgroundSize:
                    '90px 90px',
                }}
              />
            </div>

            {/* Map heading */}
            <div className="absolute left-6 top-6">
              <div className="tidal-label">
                Navigation view
              </div>

              <div className="tidal-display mt-2 text-3xl">
                Philippine Sea
              </div>
            </div>

            {/* Coordinate readout */}
            <div className="absolute bottom-6 left-6">
              <div className="tidal-label mb-2">
                Reference position
              </div>

              <div className="tidal-data text-sm">
                07.6979° N&nbsp;&nbsp;·&nbsp;&nbsp;
                121.3978° E
              </div>
            </div>

            {/* Map scale */}
            <div className="absolute right-6 top-6 text-right">
              <div className="tidal-label">
                Grid
              </div>

              <div className="tidal-data mt-2 text-xs">
                10.0 KM
              </div>
            </div>

            {/* Temporary route visualization */}
            <div className="absolute inset-x-[15%] top-1/2">
              <div
                className="h-px w-full"
                style={{
                  background:
                    'repeating-linear-gradient(to right, var(--tidal-text-faint) 0 5px, transparent 5px 11px)',
                }}
              />

              <div
                className="absolute -left-1 -top-1 h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    'var(--tidal-accent)',
                }}
              />

              <div
                className="absolute -right-1 -top-1 h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    'var(--tidal-text)',
                }}
              />

              <div className="absolute -left-1 top-4 tidal-label text-[9px]">
                Origin
              </div>

              <div className="absolute -right-1 top-4 tidal-label text-[9px]">
                Destination
              </div>
            </div>

            {/* Floating route information */}
            <div
              className="absolute bottom-6 right-6 w-64 border p-5 backdrop-blur-md"
              style={{
                borderColor:
                  'var(--tidal-border)',
                backgroundColor:
                  'rgba(7, 16, 24, 0.78)',
              }}
            >
              <div className="tidal-label">
                Current route
              </div>

              <div className="tidal-display mt-2 text-xl">
                Geographic baseline
              </div>

              <div
                className="mt-4 border-t pt-4"
                style={{
                  borderColor:
                    'var(--tidal-border)',
                }}
              >
                <div className="tidal-label">
                  Status
                </div>

                <div className="tidal-data mt-1 text-xs">
                  Awaiting calculation
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instrument strip */}
        <footer className="grid grid-cols-3 border-t tidal-divider">
          <div className="py-4 pr-6">
            <div className="tidal-label">
              Distance
            </div>

            <div className="tidal-data mt-2 text-lg">
              —
            </div>
          </div>
          <div className="border-l tidal-divider px-6 py-4">
            <div className="tidal-label">
              Travel time
            </div>

            <div className="tidal-data mt-2 text-lg">
              —
            </div>
          </div>

          <div className="border-l tidal-divider px-6 py-4">
            <div className="tidal-label">
              Fuel
            </div>

            <div className="tidal-data mt-2 text-lg">
              —
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default App
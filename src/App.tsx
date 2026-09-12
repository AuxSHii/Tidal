import { useState } from 'react'
import type { FormEvent } from 'react'

import { TidalMap } from './components/TidalMap'
import type { Location } from './domain/location'

function App() {
  const [
    cursorCoordinate,
    setCursorCoordinate,
  ] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState<Location | null>(null)

  const [
    coordinateInput,
    setCoordinateInput,
  ] = useState('')

  function handleCoordinateSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const parts = coordinateInput
      .split(',')
      .map((part) => part.trim())

    if (parts.length !== 2) {
      return
    }

    const latitude = Number(parts[0])
    const longitude = Number(parts[1])

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return
    }

    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return
    }

    setSelectedLocation({
      coordinate: {
        latitude,
        longitude,
      },
      source: 'coordinates',
    })
  }

  return (
    <main className="tidal-app">
      {/* TIDAL identity */}
      <header className="tidal-header">
        <div className="tidal-brand">
          <div className="tidal-brand__name">
            TIDAL
          </div>

          <div className="tidal-brand__meta">
            Maritime navigation
          </div>
        </div>

        {/* Unified geographic location input */}
        <form
          className="tidal-coordinate-input"
          onSubmit={handleCoordinateSubmit}
        >
          <label
            htmlFor="tidal-coordinate-field"
            className="tidal-coordinate-input__label"
          >
            Location
          </label>

          <input
            id="tidal-coordinate-field"
            type="text"
            value={coordinateInput}
            onChange={(event) =>
              setCoordinateInput(
                event.target.value,
              )
            }
            placeholder="PLACE OR LAT, LON"
            aria-label="Search for a place or enter latitude and longitude"
          />

          <button type="submit">
            Locate
          </button>
        </form>
      </header>

      {/* Primary navigation environment */}
      <section className="tidal-map">
        <TidalMap
          className="tidal-map__leaflet"
          onCoordinateChange={
            setCursorCoordinate
          }
          selectedLocation={
            selectedLocation
          }
          onLocationSelect={
            setSelectedLocation
          }
        />

        {/* Geographic title */}
        <div className="tidal-location tidal-location--ocean">
          <div className="tidal-location__annotation">
            <div className="tidal-label">
              Navigation region
            </div>

            <h1 className="tidal-location__title">
              Philippine Sea
            </h1>
          </div>
        </div>

        {/* Temporary route */}
        <div className="tidal-route">
          <div className="tidal-route__line" />

          <div className="tidal-route__origin">
            <span className="tidal-route__marker" />
            <span>Origin</span>
          </div>

          <div className="tidal-route__destination">
            <span className="tidal-route__marker" />
            <span>Destination</span>
          </div>
        </div>

        {/* Route information */}
        <aside className="tidal-route-card">
          <div className="tidal-label">
            Current route
          </div>

          <h2 className="tidal-route-card__title">
            Geographic baseline
          </h2>

          <div className="tidal-route-card__data">
            <div>
              <span className="tidal-label">
                Status
              </span>

              <span className="tidal-data">
                Awaiting calculation
              </span>
            </div>

            <div>
              <span className="tidal-label">
                Grid
              </span>

              <span className="tidal-data">
                10.0 KM
              </span>
            </div>
          </div>
        </aside>

        {/* Geographic coordinate readout */}
        <div className="tidal-coordinate">
          <div>
            <div className="tidal-coordinate__label">
              Position
            </div>

            <div className="tidal-coordinate__value">
              {cursorCoordinate
                ? `${Math.abs(cursorCoordinate.latitude).toFixed(4)}° ${
                    cursorCoordinate.latitude >= 0
                      ? 'N'
                      : 'S'
                  } · ${Math.abs(cursorCoordinate.longitude).toFixed(4)}° ${
                    cursorCoordinate.longitude >= 0
                      ? 'E'
                      : 'W'
                  }`
                : 'Move cursor over map'}
            </div>
          </div>
        </div>

        {/* Voyage progression */}
        <div className="tidal-leg-control">
          <button
            type="button"
            aria-label="Previous stage"
          >
            ‹
          </button>

          <span className="tidal-leg-control__index">
            01 / 04
          </span>

          <button
            type="button"
            aria-label="Next stage"
          >
            ›
          </button>
        </div>
      </section>
    </main>
  )
}

export default App
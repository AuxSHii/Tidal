import { useState } from 'react'
import { useEffect } from 'react'
import type { FormEvent } from 'react'

import { TidalMap } from './components/TidalMap'
import type { Location } from './domain/location'
import type { PlaceSearchResult } from './location/placeSearch'
import { placeSearchService } from './location/placeSearchService'

//calc voyage
import type { NavigableBaselineRouteAnalysis } from './computation/navigableBaselineRouteAnalysis'
import { calculateVoyage } from './features/navigation/calculateVoyage' 


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

  const [origin, setOrigin] =
    useState<Location | null>(null)

  const [destination, setDestination] =
    useState<Location | null>(null)


//voyage STATE
  const [voyageResult , setVoyageResult] = useState<NavigableBaselineRouteAnalysis | null>(null)

  const [isCalculating , setIsCalculating] = useState(false)





  const [
    coordinateInput,
    setCoordinateInput,
  ] = useState('')

  const [
    searchResults,
    setSearchResults,
  ] = useState<PlaceSearchResult[]>([])

  const [
    isSearching,
    setIsSearching,
  ] = useState(false)

  const [
    searchError,
    setSearchError,
  ] = useState<string | null>(null)




  useEffect(() => {
  console.log('ORIGIN STATE:', origin)
  console.log('DESTINATION STATE:', destination)
}, [origin, destination])




  function handleLocationSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const input =
      coordinateInput.trim()

    if (!input) {
      return
    }

    /*
     * First try to interpret the input as
     * latitude, longitude.
     */
    const parts = input
      .split(',')
      .map((part) => part.trim())

    if (parts.length === 2) {
      const latitude = Number(parts[0])
      const longitude = Number(parts[1])

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      ) {
        setSearchResults([])
        setSearchError(null)

        setSelectedLocation({
          coordinate: {
            latitude,
            longitude,
          },
          source: 'coordinates',
        })

        return
      }
    }

    /*
     * If the input is not valid coordinates,
     * treat it as a place search.
     */
    setIsSearching(true)
    setSearchError(null)
    setSearchResults([])

    placeSearchService
      .search(input)
      .then((results) => {
        setSearchResults(results)
      })
      .catch((error) => {
        console.error(
          'Failed to search for location:',
          error,
        )

        setSearchError(
          'Unable to search for this location.',
        )
      })
      .finally(() => {
        setIsSearching(false)
      })
  }

  /*
   * Format coordinates shown in search results.
   */
  function formatCoordinate(
    coordinate: PlaceSearchResult['coordinate'],
  ) {
    const latitude =
      `${Math.abs(coordinate.latitude).toFixed(4)}° ${
        coordinate.latitude >= 0 ? 'N' : 'S'
      }`

    const longitude =
      `${Math.abs(coordinate.longitude).toFixed(4)}° ${
        coordinate.longitude >= 0 ? 'E' : 'W'
      }`

    return `${latitude} · ${longitude}`
  }

  function handleSearchResultSelect(
    result: PlaceSearchResult,
  ) {
    setSelectedLocation({
      coordinate: result.coordinate,
      name: result.name,
      source: 'search',
    })

    setSearchResults([])
    setSearchError(null)
    setCoordinateInput(result.name)
  }

 function handleSetOrigin() {   //to set origin
  console.log('SET ORIGIN CLICKED')

  if (!selectedLocation) {
    console.log('NO SELECTED LOCATION')
    return
  }

  console.log('SETTING ORIGIN:', selectedLocation)

  setOrigin(selectedLocation)
  setVoyageResult(null)
}

function handleSetDestination() {    //to set destination
  console.log('SET DESTINATION CLICKED')

  if (!selectedLocation) {
    console.log('NO SELECTED LOCATION')
    return
  }
    console.log(
    'SETTING DESTINATION:',
    selectedLocation,
  )

  setDestination(selectedLocation)
  setVoyageResult(null)
}
  

function handleRemoveOrigin() {  //to remove origin pt.
  setOrigin(null)
  setSelectedLocation(null)
  setVoyageResult(null)
}

function handleRemoveDestination() {  //to remove destination pt.
  setDestination(null)
  setSelectedLocation(null)
  setVoyageResult(null)
}

//voyag calculation handler  
const handleCalculateRoute = async () => {
  if (!origin || !destination) 
    return setIsCalculating(true)
  
  try{
    const result = await calculateVoyage(origin.coordinate, destination.coordinate ,)
    setVoyageResult(result)
  }
  finally { setIsCalculating(false)  }
}



 






  /*
   * Format coordinates for the selected-location panel.
   */
  function formatLocationCoordinate(
    location: Location,
  ) {
    const { latitude, longitude } =
      location.coordinate

    const latitudeText =
      `${Math.abs(latitude).toFixed(4)}° ${
        latitude >= 0 ? 'N' : 'S'
      }`

    const longitudeText =
      `${Math.abs(longitude).toFixed(4)}° ${
        longitude >= 0 ? 'E' : 'W'
      }`

    return `${latitudeText} · ${longitudeText}`
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
          onSubmit={handleLocationSubmit}
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
            autoComplete="off"
            value={coordinateInput}
            onChange={(event) => {
              setCoordinateInput(
                event.target.value,
              )

              setSearchResults([])
              setSearchError(null)
            }}
            placeholder="PLACE OR LAT, LON"
            aria-label="Search for a place or enter latitude and longitude"
          />

          <button type="submit">
            Locate
          </button>

          {isSearching && (
            <div className="tidal-location-results">
              Searching...
            </div>
          )}

          {!isSearching &&
            searchResults.length > 0 && (
              <div className="tidal-location-results">
                {searchResults.map(
                  (result, index) => (
                    <button
                      key={`${result.name}-${index}`}
                      type="button"
                      className="tidal-location-result"
                      onClick={() =>
                        handleSearchResultSelect(
                          result,
                        )
                      }
                    >
                      <span className="tidal-location-result__name">
                        {result.name}
                      </span>

                      {result.country && (
                        <span className="tidal-location-result__country">
                          {result.country}
                        </span>
                      )}

                      <span className="tidal-location-result__coordinates">
                        {formatCoordinate(
                          result.coordinate,
                        )}
                      </span>
                    </button>
                  ),
                )}
              </div>
            )}

          {searchError && (
            <div className="tidal-location-results">
              {searchError}
            </div>
          )}
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
        origin={origin}
        destination={destination}
        onRemoveOrigin={handleRemoveOrigin}
        onRemoveDestination={handleRemoveDestination}
        route={voyageResult?.route ?? null}
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


{/* Selected location information */}
{selectedLocation &&
  !(
    (origin &&
      origin.coordinate.latitude ===
        selectedLocation.coordinate.latitude &&
      origin.coordinate.longitude ===
        selectedLocation.coordinate.longitude) ||
    (destination &&
      destination.coordinate.latitude ===
        selectedLocation.coordinate.latitude &&
      destination.coordinate.longitude ===
        selectedLocation.coordinate.longitude)
  ) && (
    <div

    className="tidal-selected-location"
    onMouseDown={(event) => {
      event.stopPropagation()
    }}
    onMouseUp={(event) => {
      event.stopPropagation()
    }}
    onClick={(event) => {
      event.stopPropagation()
    }}
  >
    <div className="tidal-label">
      {origin &&
      origin.coordinate.latitude ===
        selectedLocation.coordinate.latitude &&
      origin.coordinate.longitude ===
        selectedLocation.coordinate.longitude
        ? 'Origin'
        : destination &&
            destination.coordinate.latitude ===
              selectedLocation.coordinate.latitude &&
            destination.coordinate.longitude ===
              selectedLocation.coordinate.longitude
          ? 'Destination'
          : 'Selected location'}
    </div>

    <div className="tidal-selected-location__name">
      {selectedLocation.name ??
        'Selected location'}
    </div>

    <div className="tidal-selected-location__coordinates">
      {formatLocationCoordinate(
        selectedLocation,
      )}
    </div>

    {!(
      (
        origin &&
        origin.coordinate.latitude ===
          selectedLocation.coordinate.latitude &&
        origin.coordinate.longitude ===
          selectedLocation.coordinate.longitude
      ) ||
      (
        destination &&
        destination.coordinate.latitude ===
          selectedLocation.coordinate.latitude &&
        destination.coordinate.longitude ===
          selectedLocation.coordinate.longitude
      )
    ) && (
      <div className="tidal-selected-location__actions">
        <button
          type="button"
          onMouseDown={(event) => {
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.stopPropagation()
            handleSetOrigin()
          }}
        >
          Set origin
        </button>

        <button
          type="button"
          onMouseDown={(event) => {
            event.stopPropagation()
          }}
          onClick={(event) => {
            event.stopPropagation()
            handleSetDestination()
          }}
        >
          Set destination
        </button>
      </div>
    )}
  </div>
)}


       
        {/* Route information */}
        {origin && destination && (
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
                {isCalculating
                  ? 'Calculating route' : voyageResult
                  ? 'Route calculated' : 'Awaiting calculation'
                   }
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
          { !isCalculating && !voyageResult && ( 
             <button 
                  className="tidal-route-card__action"
                  type="button"
                  onClick={handleCalculateRoute}>
            </button>
            )}
          </aside>
      )}


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
      </section>
    </main>
  )
}

export default App
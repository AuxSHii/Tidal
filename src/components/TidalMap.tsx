import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  Tooltip,
  useMap,
} from 'react-leaflet'

import type {
  GeoJsonObject,
  FeatureCollection,
} from 'geojson'
import type { LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'

import type { Location } from '../domain/location'

interface TidalMapProps {
  className?: string

  onCoordinateChange?: (
    coordinate: {
      latitude: number
      longitude: number
    } | null,
  ) => void

  selectedLocation?: Location | null

  onLocationSelect?: (
    location: Location,
  ) => void

  origin?: Location | null

  destination?: Location | null
}

function MapView({
  selectedLocation,
}: {
  selectedLocation?: Location | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!selectedLocation) {
      map.setView(
        [7.6979, 124.0],
        5,
      )

      return
    }

    map.setView([
      selectedLocation.coordinate.latitude,
      selectedLocation.coordinate.longitude,
    ])
  }, [
    map,
    selectedLocation,
  ])

  return null
}

function LocationTooltipPane() {
  const map = useMap()

  useEffect(() => {
    if (!map.getPane('tidal-location-tooltip')) {
      const pane = map.createPane('tidal-location-tooltip')
      pane.style.zIndex = '1000'
    }
  }, [map])

  return null
}


/*
 * Geographic reference layer.
 *
 * The lines are geographic coordinates, not screen-positioned
 * decorations, so Leaflet keeps them aligned with the Earth
 * while the user pans and zooms.
 */
function Graticule() {
  const latitudeLines: [number, number][][] = []

  for (
    let latitude = -80;
    latitude <= 80;
    latitude += 10
  ) {
    latitudeLines.push([
      [latitude, -180],
      [latitude, 180],
    ])
  }

  const longitudeLines: [number, number][][] = []

  for (
    let longitude = -180;
    longitude <= 180;
    longitude += 10
  ) {
    longitudeLines.push([
      [-85, longitude],
      [85, longitude],
    ])
  }

  return (
    <>
      {latitudeLines.map((line, index) => (
        <Polyline
          key={`latitude-${index}`}
          positions={line}
          pathOptions={{
            color:
              'rgba(0, 0, 0, 0.12)',
            weight: 1,
            opacity: 0.5,
            interactive: false,
          }}
        />
      ))}

      {longitudeLines.map((line, index) => (
        <Polyline
          key={`longitude-${index}`}
          positions={line}
          pathOptions={{
            color:
              'rgba(0, 0, 0, 0.12)',
            weight: 1,
            opacity: 0.5,
            interactive: false,
          }}
        />
      ))}
    </>
  )
}

/*
 * Tracks the geographic position beneath the pointer.
 *
 * Hovering only reports position. It does not create a custom
 * cursor or select a navigation location.
 */
function MapCoordinateTracker({
  onCoordinateChange,
}: {
  onCoordinateChange?: TidalMapProps['onCoordinateChange']
}) {
  const map = useMap()

  useEffect(() => {
    let lastUpdate = 0

    function handleMouseMove(
      event: LeafletMouseEvent,
    ) {
      const now = performance.now()

      if (now - lastUpdate < 50) {
        return
      }

      lastUpdate = now

      onCoordinateChange?.({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      })
    }

    function handleMouseOut() {
      onCoordinateChange?.(null)
    }

    map.on(
      'mousemove',
      handleMouseMove,
    )

    map.on(
      'mouseout',
      handleMouseOut,
    )

    return () => {
      map.off(
        'mousemove',
        handleMouseMove,
      )

      map.off(
        'mouseout',
        handleMouseOut,
      )
    }
  }, [
    map,
    onCoordinateChange,
  ])

  return null
}

/*
 * Selects a new geographic location when the map itself
 * is clicked.
 *
 * Marker clicks do not reach this handler because the
 * role markers disable mouse-event bubbling.
 */
function MapClickTracker({
  onLocationSelect,
}: {
  onLocationSelect: (
    location: Location,
  ) => void
}) {
  const map = useMap()

  useEffect(() => {
    function handleClick(
      event: LeafletMouseEvent,
    ) {
      onLocationSelect({
        coordinate: {
          latitude: event.latlng.lat,
          longitude: event.latlng.lng,
        },
        source: 'map',
      })
    }

    map.on(
      'click',
      handleClick,
    )

    return () => {
      map.off(
        'click',
        handleClick,
      )
    }
  }, [
    map,
    onLocationSelect,
  ])

  return null
}

function sameCoordinate(
  first: Location | null | undefined,
  second: Location | null | undefined,
) {
  if (!first || !second) {
    return false
  }

  return (
    first.coordinate.latitude ===
      second.coordinate.latitude &&
    first.coordinate.longitude ===
      second.coordinate.longitude
  )
}

export function TidalMap({
  className,
  onCoordinateChange,
  selectedLocation,
  onLocationSelect,
  origin,
  destination,
}: TidalMapProps) {
  const [
    land,
    setLand,
  ] = useState<FeatureCollection | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadLand() {
      const response = await fetch(
        '/data/geography/natural-earth/land.geojson',
      )

      if (!response.ok) {
        throw new Error(
          `Failed to load Natural Earth land: ${response.status}`,
        )
      }

      const data =
        (await response.json()) as FeatureCollection

      if (!cancelled) {
        setLand(data)
      }
    }

    loadLand().catch((error) => {
      console.error(
        'Failed to load Natural Earth land:',
        error,
      )
    })

    return () => {
      cancelled = true
    }
  }, [])

  const showSelectedMarker =
    selectedLocation &&
    !sameCoordinate(
      selectedLocation,
      origin,
    ) &&
    !sameCoordinate(
      selectedLocation,
      destination,
    )

  return (
    <div className={className}>
      <MapContainer
        center={[7.6979, 124.0]}
        zoom={5}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={false}
        minZoom={2}
        maxZoom={10}
        className="tidal-leaflet-map"

      >

      <LocationTooltipPane/>
        <MapView
          selectedLocation={
            selectedLocation
          }
        />

        <Graticule />

        <MapCoordinateTracker
          onCoordinateChange={
            onCoordinateChange
          }
        />

        <MapClickTracker
          onLocationSelect={
            onLocationSelect ?? (() => {})
          }
        />

        {land && (
          <GeoJSON
            data={
              land as GeoJsonObject
            }
            style={{
              color:
                'rgba(228, 220, 200, 0.18)',
              weight: 1,
              fillColor:
                'var(--tidal-land)',
              fillOpacity: 0.92,
            }}
          />
        )}

        {/* Origin marker */}

        {origin && (
          <CircleMarker
            center={[
              origin.coordinate.latitude,
              origin.coordinate.longitude,
            ]}
            radius={8}
            pane="tidal-location-tooltip"

            bubblingMouseEvents={false}
            pathOptions={{
              color: '#d9a441',
              weight: 2,
              fillColor: '#d9a441',
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => {
                onLocationSelect?.(
                  origin,
                )
              },
            }}
          >
            <Tooltip
              permanent
              direction="right"
              offset={[12, 0]}
              pane="tidal-location-tooltip"

              className="tidal-location-tooltip"
            >
              <div className="tidal-location-tooltip__content">
                <div className="tidal-location-tooltip__label">
                  ORIGIN
                </div>

                {origin.name && (
                  <div className="tidal-location-tooltip__name">
                    {origin.name}
                  </div>
                )}

                <div className="tidal-location-tooltip__value">
                  {Math.abs(
                    origin.coordinate.latitude,
                  ).toFixed(4)}
                  °{' '}
                  {origin.coordinate.latitude >=
                  0
                    ? 'N'
                    : 'S'}{' '}
                  ·{' '}
                  {Math.abs(
                    origin.coordinate.longitude,
                  ).toFixed(4)}
                  °{' '}
                  {origin.coordinate.longitude >=
                  0
                    ? 'E'
                    : 'W'}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Destination marker */}

        {destination && (
          <CircleMarker
            center={[
              destination.coordinate.latitude,
              destination.coordinate.longitude,
            ]}
            radius={6}
            pane="tidal-location-tooltip"
            bubblingMouseEvents={false}
            pathOptions={{
              color: '#e4dcc8',
              weight: 2,
              fillColor: '#e4dcc8',
              fillOpacity: 0.9,
            }}
            eventHandlers={{
              click: () => {
                onLocationSelect?.(
                  destination,
                )
              },
            }}
          >
            <Tooltip
              permanent
              direction="right"
              offset={[12, 0]}
              pane="tidal-location-tooltip"
              className="tidal-location-tooltip"
            >
              <div className="tidal-location-tooltip__content">
                <div className="tidal-location-tooltip__label">
                  DESTINATION
                </div>

                {destination.name && (
                  <div className="tidal-location-tooltip__name">
                    {destination.name}
                  </div>
                )}

                <div className="tidal-location-tooltip__value">
                  {Math.abs(
                    destination.coordinate.latitude,
                  ).toFixed(4)}
                  °{' '}
                  {destination.coordinate.latitude >=
                  0
                    ? 'N'
                    : 'S'}{' '}
                  ·{' '}
                  {Math.abs(
                    destination.coordinate.longitude,
                  ).toFixed(4)}
                  °{' '}
                  {destination.coordinate.longitude >=
                  0
                    ? 'E'
                    : 'W'}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Currently selected, unassigned location */}

        {showSelectedMarker && (
          <CircleMarker
            center={[
              selectedLocation.coordinate.latitude,
              selectedLocation.coordinate.longitude,
            ]}
            radius={5}
            pane="tidal-location-tooltip"

            bubblingMouseEvents={false}
            pathOptions={{
              color: '#d9a441',
              weight: 1,
              fillColor: '#d9a441',
              fillOpacity: 0.9,
            }}
          >
            <Tooltip
              permanent
              direction="right"
              offset={[10, 0]}
              pane="tidal-location-tooltip"
              className="tidal-location-tooltip"
            >
              <div className="tidal-location-tooltip__content">
                <div className="tidal-location-tooltip__label">
                  SELECTED
                </div>

                {selectedLocation.name && (
                  <div className="tidal-location-tooltip__name">
                    {selectedLocation.name}
                  </div>
                )}

                <div className="tidal-location-tooltip__value">
                  {Math.abs(
                    selectedLocation.coordinate.latitude,
                  ).toFixed(4)}
                  °{' '}
                  {selectedLocation.coordinate.latitude >=
                  0
                    ? 'N'
                    : 'S'}{' '}
                  ·{' '}
                  {Math.abs(
                    selectedLocation.coordinate.longitude,
                  ).toFixed(4)}
                  °{' '}
                  {selectedLocation.coordinate.longitude >=
                  0
                    ? 'E'
                    : 'W'}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}
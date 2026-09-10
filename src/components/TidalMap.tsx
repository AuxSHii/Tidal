import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polyline,
  useMap,
} from 'react-leaflet'
import type {
  GeoJsonObject,
  FeatureCollection,
} from 'geojson'
import type { LeafletMouseEvent } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useState } from 'react'

interface TidalMapProps {
  className?: string
  onCoordinateChange?: (
    coordinate: {
      latitude: number
      longitude: number
    } | null,
  ) => void
}

function MapView() {
  const map = useMap()

  useEffect(() => {
    map.setView(
      [7.6979, 124.0],
      5,
    )
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

  for (let latitude = -80; latitude <= 80; latitude += 10) {
    latitudeLines.push([
      [latitude, -180],
      [latitude, 180],
    ])
  }

  const longitudeLines: [number, number][][] = []

  for (let longitude = -180; longitude <= 180; longitude += 10) {
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
            color: 'rgba(0, 0, 0, 0.12)',
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
            color: 'rgba(0, 0, 0, 0.12)',
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
 * Selects a geographic location when the map is clicked.
 *
 * The selected coordinate is kept locally for now.
 * Later this will become the basis for Origin and Destination.
 */
function MapClickTracker({
  onCoordinateSelect,
}: {
  onCoordinateSelect: (
    coordinate: {
      latitude: number
      longitude: number
    },
  ) => void
}) {
  const map = useMap()

  useEffect(() => {
    function handleClick(
      event: LeafletMouseEvent,
    ) {
      onCoordinateSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
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
    onCoordinateSelect,
  ])

  return null
}

export function TidalMap({
  className,
  onCoordinateChange,
}: TidalMapProps) {
  const [
    land,
    setLand,
  ] = useState<FeatureCollection | null>(null)

  const [
    selectedCoordinate,
    setSelectedCoordinate,
  ] = useState<{
    latitude: number
    longitude: number
  } | null>(null)

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
        <MapView />

        <Graticule />

        <MapCoordinateTracker
          onCoordinateChange={
            onCoordinateChange
          }
        />

        <MapClickTracker
          onCoordinateSelect={
            setSelectedCoordinate
          }
        />

        {selectedCoordinate && (
          <CircleMarker
            center={[
              selectedCoordinate.latitude,
              selectedCoordinate.longitude,
            ]}
            radius={5}
            pathOptions={{
              color: '#d9a441',
              weight: 1,
              fillColor: '#d9a441',
              fillOpacity: 0.9,
            }}
          />
        )}

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
      </MapContainer>
    </div>
  )
}
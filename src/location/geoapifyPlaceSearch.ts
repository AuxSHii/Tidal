import type {
  PlaceSearchResult,
  PlaceSearchService,
} from './placeSearch'

const GEOAPIFY_GEOCODING_URL =
  'https://api.geoapify.com/v1/geocode/search'

const GEOAPIFY_AUTOCOMPLETE_URL =
  'https://api.geoapify.com/v1/geocode/autocomplete'

interface GeoapifyFeature {
  properties?: {
    name?: string
    country?: string
    formatted?: string
    lat?: number
    lon?: number
  }
}

interface GeoapifyResponse {
  features?: GeoapifyFeature[]
}

export class GeoapifyPlaceSearch
  implements PlaceSearchService
{
  private readonly apiKey: string

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        'Geoapify API key is missing.',
      )
    }

    this.apiKey = apiKey
  }

  async autocomplete(
    query: string,
  ): Promise<PlaceSearchResult[]> {
    return this.request(
      GEOAPIFY_AUTOCOMPLETE_URL,
      query,
    )
  }

  async search(
    query: string,
  ): Promise<PlaceSearchResult[]> {
    return this.request(
      GEOAPIFY_GEOCODING_URL,
      query,
    )
  }

  private async request(
    endpoint: string,
    query: string,
  ): Promise<PlaceSearchResult[]> {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      return []
    }

    const url = new URL(endpoint)

    url.searchParams.set(
      'text',
      trimmedQuery,
    )

    url.searchParams.set(
      'apiKey',
      this.apiKey,
    )

    const response = await fetch(
      url.toString(),
    )

    if (!response.ok) {
      throw new Error(
        `Geoapify request failed: ${response.status}`,
      )
    }

    const data =
      (await response.json()) as GeoapifyResponse

    return (data.features ?? [])
      .map(
        (
          feature,
        ): PlaceSearchResult | null => {
          const properties =
            feature.properties

          if (
            !properties?.name ||
            !Number.isFinite(
              properties.lat,
            ) ||
            !Number.isFinite(
              properties.lon,
            )
          ) {
            return null
          }

          return {
            name: properties.name,
            country: properties.country,
            coordinate: {
              latitude: properties.lat!,
              longitude: properties.lon!,
            },

            description:
              properties.formatted,
          }
        },
      )
      .filter(
        (
          result,
        ): result is PlaceSearchResult =>
          result !== null,
      )
  }
}

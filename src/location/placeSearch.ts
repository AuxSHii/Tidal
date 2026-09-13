import type { Coordinate } from '../domain/coordinate'

/*
  normalized location candidate returned by a place-search provider.
 */
export interface PlaceSearchResult {
  name: string
  country?: string
  coordinate: Coordinate
  description?: string
}

/*
 * Provider-independent contract for location search.
 *
 * autocomplete while the user is typing.
 * search - when the user explctly submit a query.
 * reverseGeocode - resolve a coordinate into a named location.
 */
export interface PlaceSearchService {
  autocomplete(
    query: string,
  ): Promise<PlaceSearchResult[]>

  search(
    query: string,
  ): Promise<PlaceSearchResult[]>

  reverseGeocode(
    coordinate: Coordinate,
  ): Promise<PlaceSearchResult | null>
}

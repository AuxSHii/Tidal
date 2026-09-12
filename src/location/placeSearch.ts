import type { Coordinate } from '../domain/coordinate'

/*
   result returned by a place-search provider.
 
  intent smaller than the provider's raw response.
  
 */
export interface PlaceSearchResult {
  name: string
  coordinate: Coordinate
  description?: string
}

/*
 * Provider-independent contract for place searching.
 
 ui dep on this interface rather then geoloc provider's
 */
export interface PlaceSearchService {
  search(
    query: string,
  ): Promise<PlaceSearchResult[]>
}

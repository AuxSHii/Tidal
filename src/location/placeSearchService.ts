import { GeoapifyPlaceSearch } from './geoapifyPlaceSearch'

const apiKey =
  import.meta.env.VITE_GEOAPIFY_API_KEY

if (!apiKey) {
  throw new Error(
    'VITE_GEOAPIFY_API_KEY is not configured.',
  )
}

export const placeSearchService =
  new GeoapifyPlaceSearch(apiKey)

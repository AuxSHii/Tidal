import { createServer } from 'vite'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)

if (args.length !== 4) {
  console.error(
    'Usage: npm run voyage -- <originLongitude> <originLatitude> <destinationLongitude> <destinationLatitude>',
  )
  process.exit(1)
}

const [
  originLongitude,
  originLatitude,
  destinationLongitude,
  destinationLatitude,
] = args.map(Number)

if (
  !Number.isFinite(originLongitude) ||
  !Number.isFinite(originLatitude) ||
  !Number.isFinite(destinationLongitude) ||
  !Number.isFinite(destinationLatitude)
) {
  console.error('All coordinates must be valid numbers.')
  process.exit(1)
}

if (
  Math.abs(originLatitude) > 90 ||
  Math.abs(destinationLatitude) > 90
) {
  console.error('Latitude must be between -90 and 90.')
  process.exit(1)
}



const projectRoot = fileURLToPath(new URL('..', import.meta.url),)




const dataRoot = resolve(
  projectRoot,
  'public',
)

const originalFetch = globalThis.fetch

globalThis.fetch = async (input, init) => {
  const url =
    typeof input === 'string'
      ? input
      : input.url

  if (!url.startsWith('/data/')) {
    return originalFetch(input, init)
  }

  const filePath = resolve(
    dataRoot,
    `.${url}`,
  )

  const data = await readFile(filePath)

  return new Response(data)
}


const vite = await createServer({
  root: projectRoot,
  server: {
    middlewareMode: true,
  },
  appType: 'custom',
  resolve: {
    alias: {
      'geographiclib-geodesic': resolve(
        projectRoot,
        'scripts/geographiclib-geodesic-ssr.mjs',
      ),
    },
  },
})


try {
  const {
    calculateVoyage,
  } = await vite.ssrLoadModule(
    '/src/features/navigation/calculateVoyage.ts',
  )

  console.log('')
  console.log('TIDAL voyage calculation')
  console.log('------------------------')
  console.log(
    'Origin:',
    originLatitude,
    originLongitude,
  )
  console.log(
    'Destination:',
    destinationLatitude,
    destinationLongitude,
  )
  console.log('')

  const startedAt = performance.now()

  const result = await calculateVoyage(
    {
      latitude: originLatitude,
      longitude: originLongitude,
    },
    {
      latitude: destinationLatitude,
      longitude: destinationLongitude,
    },
  )

  const elapsed =
    performance.now() - startedAt

  console.log('')
  console.log('------------------------')

  if (result === null) {
    console.log('Route: NOT FOUND')
  } else {
    console.log('Route: FOUND')
    console.log(
      'Route points:',
      result.route.points.length,
    )
  }

  console.log(
    'Total CLI time:',
    elapsed.toFixed(1),
    'ms',
  )
  console.log('')
} finally {
  await vite.close()
}

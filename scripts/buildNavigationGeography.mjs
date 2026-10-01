import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const VERSION = 5

const CELL_SIZE = 0.1
const WIDTH = 3600
const HEIGHT = 1800

const STATE_OCEAN = 0
const STATE_LAND = 1
const STATE_COAST = 2

const SOURCE_PATH =
  'public/data/geography/natural-earth/land.geojson'

const OUTPUT_PATH =
  'public/data/geography/natural-earth/navigation-geography.bin'

const CHECKPOINT_PATH =
  'public/data/geography/natural-earth/navigation-geography.checkpoint.bin'

const SOURCE_ABSOLUTE_PATH =
  path.resolve(SOURCE_PATH)

const OUTPUT_ABSOLUTE_PATH =
  path.resolve(OUTPUT_PATH)

const CHECKPOINT_ABSOLUTE_PATH =
  path.resolve(CHECKPOINT_PATH)

const TOTAL_CELLS =
  WIDTH * HEIGHT

const EPSILON = 1e-10

/*
 * ------------------------------------------------------------
 * Basic coordinate helpers
 * ------------------------------------------------------------
 */

function normalizeLongitude(longitude) {
  return (
    ((longitude + 180) % 360 + 360) %
      360 -
    180
  )
}

function wrapColumn(column) {
  return (
    ((column % WIDTH) + WIDTH) %
    WIDTH
  )
}

function rowIndex(latitude) {
  const clamped =
    Math.max(
      -90,
      Math.min(90, latitude),
    )

  return Math.max(
    0,
    Math.min(
      HEIGHT - 1,
      Math.floor(
        (clamped + 90) /
          CELL_SIZE,
      ),
    ),
  )
}

function cellIndex(
  column,
  row,
) {
  return (
    row * WIDTH +
    wrapColumn(column)
  )
}

/*
 * Grid coordinates are intentionally allowed
 * to be unwrapped in longitude.
 *
 * Example:
 *
 *   180° -> grid x = 3600
 *   190° -> grid x = 3700
 *
 * Column wrapping happens only when accessing
 * the actual periodic world grid.
 */
function longitudeGridX(longitude) {
  return (
    (longitude + 180) /
    CELL_SIZE
  )
}

function latitudeGridY(latitude) {
  return (
    (latitude + 90) /
    CELL_SIZE
  )
}

/*
 * GeoJSON lines use the shortest Cartesian
 * longitude difference unless explicitly
 * represented as antimeridian-cut geometry.
 *
 * Exact ±360° jumps represent the same seam
 * location and therefore have zero longitude
 * displacement.
 */
function shortestLongitudeDelta(
  from,
  to,
) {
  let delta =
    to - from

  if (
    Math.abs(
      Math.abs(delta) - 360,
    ) < EPSILON
  ) {
    return 0
  }

  while (delta > 180) {
    delta -= 360
  }

  while (delta < -180) {
    delta += 360
  }

  return delta
}

/*
 * Unwrap a ring continuously in longitude.
 */
function unwrapRing(ring) {
  if (
    ring.length === 0
  ) {
    return []
  }

  const result = [
    [
      ring[0][0],
      ring[0][1],
    ],
  ]

  let previousLongitude =
    ring[0][0]

  for (
    let i = 1;
    i < ring.length;
    i++
  ) {
    const longitude =
      previousLongitude +
      shortestLongitudeDelta(
        previousLongitude,
        ring[i][0],
      )

    result.push([
      longitude,
      ring[i][1],
    ])

    previousLongitude =
      longitude
  }

  return result
}

/*
 * ------------------------------------------------------------
 * Binary format
 * ------------------------------------------------------------
 */

function sha256File(
  filePath,
) {
  return crypto
    .createHash('sha256')
    .update(
      fs.readFileSync(
        filePath,
      ),
    )
    .digest('hex')
}

function configurationHash(
  sourceHash,
) {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        version: VERSION,
        cellSize: CELL_SIZE,
        width: WIDTH,
        height: HEIGHT,
        sourceHash,
      }),
    )
    .digest('hex')
}

function createHeader(
  sourceHash,
  configHash,
  nextRow,
) {
  return JSON.stringify({
    version: VERSION,
    cellSize: CELL_SIZE,
    width: WIDTH,
    height: HEIGHT,
    sourceHash,
    configHash,
    nextRow,
  })
}

function writeBinary(
  filePath,
  header,
  states,
) {
  const headerBytes =
    Buffer.from(
      header,
      'utf8',
    )

  const prefix =
    Buffer.alloc(4)

  prefix.writeUInt32LE(
    headerBytes.length,
    0,
  )

  fs.writeFileSync(
    filePath,
    Buffer.concat([
      prefix,
      headerBytes,
      Buffer.from(states),
    ]),
  )
}

function readBinary(
  filePath,
) {
  const buffer =
    fs.readFileSync(
      filePath,
    )

  const headerLength =
    buffer.readUInt32LE(0)

  const header =
    JSON.parse(
      buffer
        .subarray(
          4,
          4 + headerLength,
        )
        .toString('utf8'),
    )

  const stateStart =
    4 + headerLength

  const stateEnd =
    stateStart +
    TOTAL_CELLS

  if (
    buffer.length <
    stateEnd
  ) {
    throw new Error(
      'Checkpoint is truncated.',
    )
  }

  return {
    header,
    states:
      new Uint8Array(
        buffer.subarray(
          stateStart,
          stateEnd,
        ),
      ),
  }
}

function checkpointMatches(
  header,
  sourceHash,
  configHash,
) {
  return (
    header.version ===
      VERSION &&
    header.cellSize ===
      CELL_SIZE &&
    header.width ===
      WIDTH &&
    header.height ===
      HEIGHT &&
    header.sourceHash ===
      sourceHash &&
    header.configHash ===
      configHash
  )
}

/*
 * ------------------------------------------------------------
 * Coastline rasterization
 * ------------------------------------------------------------
 *
 * We deliberately use a conservative
 * "supercover" style grid traversal.
 *
 * Every grid cell touched by a boundary
 * becomes COAST.
 *
 * This is intentionally conservative:
 * missing a touched cell would be worse
 * for navigation than marking an additional
 * ambiguous cell.
 */

function markCoastCell(
  states,
  column,
  row,
) {
  if (
    row < 0 ||
    row >= HEIGHT
  ) {
    return
  }

  const wrapped =
    wrapColumn(column)

  states[
    cellIndex(
      wrapped,
      row,
    )
  ] =
    STATE_COAST

  /*
   * The ±180° meridian is shared by
   * the first and last longitude cells.
   */
  if (
    wrapped === 0 &&
    column % WIDTH === 0
  ) {
    states[
      cellIndex(
        WIDTH - 1,
        row,
      )
    ] =
      STATE_COAST
  }
}

function rasterizeSegment(
  states,
  x1,
  y1,
  x2,
  y2,
) {
  const longitudeDelta =
    shortestLongitudeDelta(
      x1,
      x2,
    )

  const unwrappedX2 =
    x1 + longitudeDelta

  const gx1 =
    longitudeGridX(x1)

  const gy1 =
    latitudeGridY(y1)

  const gx2 =
    longitudeGridX(
      unwrappedX2,
    )

  const gy2 =
    latitudeGridY(y2)

  let column =
    Math.floor(gx1)

  let row =
    Math.floor(gy1)

  const targetColumn =
    Math.floor(gx2)

  const targetRow =
    Math.floor(gy2)

  markCoastCell(
    states,
    column,
    row,
  )

  const dx =
    gx2 - gx1

  const dy =
    gy2 - gy1

  if (
    Math.abs(dx) <
      EPSILON &&
    Math.abs(dy) <
      EPSILON
  ) {
    return
  }

  const stepColumn =
    dx > 0
      ? 1
      : dx < 0
        ? -1
        : 0

  const stepRow =
    dy > 0
      ? 1
      : dy < 0
        ? -1
        : 0

  let tMaxX =
    Infinity

  let tMaxY =
    Infinity

  const tDeltaX =
    stepColumn === 0
      ? Infinity
      : 1 /
        Math.abs(dx)

  const tDeltaY =
    stepRow === 0
      ? Infinity
      : 1 /
        Math.abs(dy)

  if (
    stepColumn !== 0
  ) {
    const boundary =
      stepColumn > 0
        ? Math.floor(gx1) +
          1
        : Math.floor(gx1)

    tMaxX =
      (boundary - gx1) /
      dx
  }

  if (
    stepRow !== 0
  ) {
    const boundary =
      stepRow > 0
        ? Math.floor(gy1) +
          1
        : Math.floor(gy1)

    tMaxY =
      (boundary - gy1) /
      dy
  }

  const maxSteps =
    Math.abs(
      targetColumn -
        column,
    ) +
    Math.abs(
      targetRow -
        row,
    ) +
    8

  for (
    let step = 0;
    step < maxSteps;
    step++
  ) {
    if (
      column ===
        targetColumn &&
      row ===
        targetRow
    ) {
      break
    }

    if (
      tMaxX < tMaxY
    ) {
      column +=
        stepColumn

      tMaxX +=
        tDeltaX

      markCoastCell(
        states,
        column,
        row,
      )
    } else if (
      tMaxY < tMaxX
    ) {
      row +=
        stepRow

      tMaxY +=
        tDeltaY

      markCoastCell(
        states,
        column,
        row,
      )
    } else {
      /*
       * Exact grid-corner crossing:
       *
       * The segment touches both side cells
       * and then enters the diagonal cell.
       */
      const nextColumn =
        column +
        stepColumn

      const nextRow =
        row +
        stepRow

      markCoastCell(
        states,
        nextColumn,
        row,
      )

      markCoastCell(
        states,
        column,
        nextRow,
      )

      column =
        nextColumn

      row =
        nextRow

      tMaxX +=
        tDeltaX

      tMaxY +=
        tDeltaY

      markCoastCell(
        states,
        column,
        row,
      )
    }
  }
}

function rasterizeRingBoundary(
  states,
  ring,
) {
  const unwrapped =
    unwrapRing(ring)

  for (
    let i = 0;
    i < unwrapped.length - 1;
    i++
  ) {
    const a =
      unwrapped[i]

    const b =
      unwrapped[i + 1]

    rasterizeSegment(
      states,
      a[0],
      a[1],
      b[0],
      b[1],
    )
  }
}

function rasterizeGeometryBoundary(
  states,
  geometry,
) {
  if (
    geometry.type ===
    'Polygon'
  ) {
    for (
      const ring of
        geometry.coordinates
    ) {
      rasterizeRingBoundary(
        states,
        ring,
      )
    }

    return
  }

  if (
    geometry.type ===
    'MultiPolygon'
  ) {
    for (
      const polygon of
        geometry.coordinates
    ) {
      for (
        const ring of
          polygon
      ) {
        rasterizeRingBoundary(
          states,
          ring,
        )
      }
    }
  }
}

/*
 * ------------------------------------------------------------
 * Scanline edge table
 * ------------------------------------------------------------
 *
 * One edge object is shared by all row buckets
 * it belongs to.
 *
 * No RBush.
 * No Turf.
 * No point-in-polygon calls.
 */

function rowForCenterAtOrAbove(
  latitude,
) {
  return Math.ceil(
    (
      (latitude + 90) /
        CELL_SIZE
    ) -
      0.5,
  )
}

function addEdgeToBuckets(
  buckets,
  ring,
  featureId,
) {
  const unwrapped =
    unwrapRing(ring)

  for (
    let i = 0;
    i < unwrapped.length - 1;
    i++
  ) {
    const a =
      unwrapped[i]

    const b =
      unwrapped[i + 1]

    const x1 =
      a[0]

    const y1 =
      a[1]

    const x2 =
      b[0]

    const y2 =
      b[1]

    /*
     * Horizontal edges never cross the
     * interior of a scanline and are skipped.
     */
    if (
      Math.abs(
        y2 - y1,
      ) < EPSILON
    ) {
      continue
    }

    const lowerY =
      Math.min(
        y1,
        y2,
      )

    const upperY =
      Math.max(
        y1,
        y2,
      )

    const lowerX =
      y1 < y2
        ? x1
        : x2

    const upperX =
      y1 < y2
        ? x2
        : x1

    const startRow =
      Math.max(
        0,
        rowForCenterAtOrAbove(
          lowerY,
        ),
      )

    const endRow =
      Math.min(
        HEIGHT,
        rowForCenterAtOrAbove(
          upperY,
        ),
      )

    if (
      startRow >=
      endRow
    ) {
      continue
    }

    const inverseSlope =
      (
        upperX -
        lowerX
      ) /
      (
        upperY -
        lowerY
      )

    const startLatitude =
      -90 +
      (
        startRow +
        0.5
      ) *
        CELL_SIZE

    const startX =
      lowerX +
      (
        startLatitude -
        lowerY
      ) *
        inverseSlope

    const edge = {
      featureId,
      startRow,
      endRow,
      startX,
      inverseSlope,
    }

    for (
      let row =
        startRow;
      row < endRow;
      row++
    ) {
      buckets[row].push(
        edge,
      )
    }
  }
}

function buildEdgeBuckets(
  features,
) {
  const bucketsByFeature =
    features.map(
      () =>
        Array.from(
          {
            length:
              HEIGHT,
          },
          () => [],
        ),
    )

  for (
    let featureId = 0;
    featureId <
    features.length;
    featureId++
  ) {
    const geometry =
      features[
        featureId
      ].geometry

    if (!geometry) {
      continue
    }

    const buckets =
      bucketsByFeature[
        featureId
      ]

    if (
      geometry.type ===
      'Polygon'
    ) {
      for (
        const ring of
          geometry.coordinates
      ) {
        addEdgeToBuckets(
          buckets,
          ring,
          featureId,
        )
      }
    } else if (
      geometry.type ===
      'MultiPolygon'
    ) {
      for (
        const polygon of
          geometry.coordinates
      ) {
        for (
          const ring of
            polygon
        ) {
          addEdgeToBuckets(
            buckets,
            ring,
            featureId,
          )
        }
      }
    }
  }

  return bucketsByFeature
}

/*
 * ------------------------------------------------------------
 * Scanline filling
 * ------------------------------------------------------------
 */

function fillLongitudeSpan(
  states,
  row,
  start,
  end,
) {
  if (
    end <= start
  ) {
    return
  }

  /*
   * A polygon crossing ±180 may have an
   * unwrapped interval such as:
   *
   *   179 → 181
   *
   * Split it against world copies.
   */
  const firstWorld =
    Math.floor(
      (start + 180) /
        360,
    )

  const lastWorld =
    Math.floor(
      (end + 180) /
        360,
    )

  for (
    let world =
      firstWorld;
    world <= lastWorld;
    world++
  ) {
    const worldMin =
      -180 +
      world * 360

    const worldMax =
      180 +
      world * 360

    const clippedStart =
      Math.max(
        start,
        worldMin,
      )

    const clippedEnd =
      Math.min(
        end,
        worldMax,
      )

    if (
      clippedEnd <=
      clippedStart
    ) {
      continue
    }

    const localStart =
      clippedStart -
      world * 360

    const localEnd =
      clippedEnd -
      world * 360

    /*
     * Fill cells whose centers lie inside
     * the scanline span.
     *
     * Boundary cells remain COAST.
     */
    const firstColumn =
      Math.max(
        0,
        Math.ceil(
          (
            localStart +
            180
          ) /
            CELL_SIZE -
            0.5,
        ),
      )

    const lastColumn =
      Math.min(
        WIDTH - 1,
        Math.floor(
          (
            localEnd +
            180
          ) /
            CELL_SIZE -
            0.5,
        ),
      )

    if (
      firstColumn >
      lastColumn
    ) {
      continue
    }

    for (
      let column =
        firstColumn;
      column <= lastColumn;
      column++
    ) {
      const index =
        cellIndex(
          column,
          row,
        )

      if (
        states[index] !==
        STATE_COAST
      ) {
        states[index] =
          STATE_LAND
      }
    }
  }
}

function classifyRow(
  states,
  row,
  bucketsByFeature,
) {
  for (
    let featureId = 0;
    featureId <
    bucketsByFeature.length;
    featureId++
  ) {
    const bucket =
      bucketsByFeature[
        featureId
      ][row]

    if (
      bucket.length === 0
    ) {
      continue
    }

    const intersections =
      new Array(
        bucket.length,
      )

    const latitude =
      -90 +
      (
        row + 0.5
      ) *
        CELL_SIZE

    for (
      let i = 0;
      i < bucket.length;
      i++
    ) {
      const edge =
        bucket[i]

      /*
       * Because the edge was bucketed using
       * the half-open [ymin, ymax) rule,
       * this intersection is valid exactly
       * once at shared vertices.
       */
      intersections[i] =
        edge.startX +
        (
          latitude -
          (
            -90 +
            (
              edge.startRow +
              0.5
            ) *
              CELL_SIZE
          )
        ) *
          edge.inverseSlope
    }

    intersections.sort(
      (a, b) =>
        a - b,
    )

    /*
     * Even-odd fill.
     *
     * This naturally handles:
     * - concave land
     * - holes
     * - multiple disconnected polygons
     *
     * and does not depend on ring winding.
     */
    for (
      let i = 0;
      i + 1 <
      intersections.length;
      i += 2
    ) {
      const start =
        intersections[i]

      const end =
        intersections[i + 1]

      if (
        end >
        start
      ) {
        fillLongitudeSpan(
          states,
          row,
          start,
          end,
        )
      }
    }
  }
}

/*
 * ------------------------------------------------------------
 * Diagnostics
 * ------------------------------------------------------------
 */

function countStates(
  states,
) {
  let ocean = 0
  let land = 0
  let coast = 0

  for (
    const state of states
  ) {
    if (
      state ===
      STATE_OCEAN
    ) {
      ocean++
    } else if (
      state ===
      STATE_LAND
    ) {
      land++
    } else if (
      state ===
      STATE_COAST
    ) {
      coast++
    }
  }

  return {
    ocean,
    land,
    coast,
  }
}

/*
 * ------------------------------------------------------------
 * Main build
 * ------------------------------------------------------------
 */

console.log(
  'Loading Natural Earth...',
)

const sourceHash =
  sha256File(
    SOURCE_ABSOLUTE_PATH,
  )

const configHash =
  configurationHash(
    sourceHash,
  )

console.log(
  'Source SHA-256:',
  sourceHash,
)

console.log(
  'Configuration SHA-256:',
  configHash,
)

const source =
  JSON.parse(
    fs.readFileSync(
      SOURCE_ABSOLUTE_PATH,
      'utf8',
    ),
  )

if (
  source.type !==
  'FeatureCollection'
) {
  throw new Error(
    'Expected a GeoJSON FeatureCollection.',
  )
}

const features =
  source.features.filter(
    (feature) =>
      feature.geometry &&
      (
        feature.geometry.type ===
          'Polygon' ||
        feature.geometry.type ===
          'MultiPolygon'
      ),
  )

console.log(
  'Loaded',
  features.length,
  'land features.',
)

const states =
  new Uint8Array(
    TOTAL_CELLS,
  )

let startRow = 0

/*
 * ------------------------------------------------------------
 * Resume
 * ------------------------------------------------------------
 */

if (
  fs.existsSync(
    CHECKPOINT_ABSOLUTE_PATH,
  )
) {
  console.log(
    'Checkpoint found.',
  )

  const checkpoint =
    readBinary(
      CHECKPOINT_ABSOLUTE_PATH,
    )

  if (
    checkpointMatches(
      checkpoint.header,
      sourceHash,
      configHash,
    )
  ) {
    states.set(
      checkpoint.states,
    )

    startRow =
      checkpoint.header.nextRow

    console.log(
      'Checkpoint accepted.',
      `Resuming at row ${startRow}.`,
    )
  } else {
    console.log(
      'Checkpoint rejected:',
      'source/configuration mismatch.',
    )

    fs.unlinkSync(
      CHECKPOINT_ABSOLUTE_PATH,
    )
  }
}

/*
 * ------------------------------------------------------------
 * Static coastline layer
 * ------------------------------------------------------------
 */

if (
  startRow === 0
) {
  console.log(
    'Rasterizing coastline...',
  )

  for (
    const feature of
      features
  ) {
    rasterizeGeometryBoundary(
      states,
      feature.geometry,
    )
  }

  console.log(
    'Coastline rasterization complete.',
  )
}

/*
 * ------------------------------------------------------------
 * Build scanline edge table
 * ------------------------------------------------------------
 */

console.log(
  'Building scanline edge tables...',
)

const bucketsByFeature =
  buildEdgeBuckets(
    features,
  )

console.log(
  'Scanline edge tables ready.',
)

/*
 * ------------------------------------------------------------
 * Fill land
 * ------------------------------------------------------------
 */

console.log(
  'Rasterizing land interiors...',
)

const startTime =
  performance.now()

for (
  let row =
    startRow;
  row < HEIGHT;
  row++
) {
  classifyRow(
    states,
    row,
    bucketsByFeature,
  )

  if (
    row % 100 === 0 ||
    row ===
      HEIGHT - 1
  ) {
    const elapsed =
      (
        performance.now() -
        startTime
      ) / 1000

    console.log(
      `Processed row ${row + 1}/${HEIGHT}`,
      `(${elapsed.toFixed(1)}s)`,
    )

    writeBinary(
      CHECKPOINT_ABSOLUTE_PATH,
      createHeader(
        sourceHash,
        configHash,
        row + 1,
      ),
      states,
    )
  }
}

/*
 * ------------------------------------------------------------
 * Final output
 * ------------------------------------------------------------
 */

const counts =
  countStates(states)

console.log(
  'Navigation geography complete.',
)

console.log(
  counts,
)

const finalHeader =
  createHeader(
    sourceHash,
    configHash,
    HEIGHT,
  )

writeBinary(
  OUTPUT_ABSOLUTE_PATH,
  finalHeader,
  states,
)

if (
  fs.existsSync(
    CHECKPOINT_ABSOLUTE_PATH,
  )
) {
  fs.unlinkSync(
    CHECKPOINT_ABSOLUTE_PATH,
  )
}

console.log(
  'Written:',
  OUTPUT_PATH,
)
import { baqend, model } from 'baqend'
import { BulkComparisonTestParams } from './_BulkComparisonFactory'
import { bootstrap } from './_compositionRoot'
import { generateHash, getDateString } from './_helpers'
import { Puppeteer } from './_Puppeteer'
import { TestParams } from './_TestParams'

/**
 * The params which are allowed per test.
 */
export interface BulkTestParams extends TestParams {
  url: string
  runs?: number
}

type StartBulkComparisonParams = BulkTestParams[] | {
  tests: BulkTestParams[]
  createdBy?: string
}

async function buildTest(db: baqend, puppeteer: Puppeteer, testParams: BulkTestParams): Promise<BulkComparisonTestParams | null> {
  const { url } = testParams
  try {
    const puppeteerInfo = await puppeteer.analyze(url)

    return Object.assign({}, testParams, { puppeteer: puppeteerInfo })
  } catch ({ message, stack }) {
    db.log.error(`Puppeteer failed for ${url}: ${message}`, { stack })
    return null
  }
}

async function buildTests(db: baqend, puppeteer: Puppeteer, params: BulkTestParams[]): Promise<BulkComparisonTestParams[]> {
  const promises = params.map(param => buildTest(db, puppeteer, param))

  return (await Promise.all(promises)).filter(param => param !== null) as BulkComparisonTestParams[]
}

export async function startBulkComparison(db: baqend, id: string, createdBy: string | null, data: BulkTestParams[]): Promise<model.BulkComparison> {
  const { bulkComparisonWorker, bulkComparisonFactory, puppeteer } = bootstrap(db)

  const tests = await buildTests(db, puppeteer, data)
  const bulkComparison = await bulkComparisonFactory.create(id, createdBy, tests)
  await bulkComparisonWorker.next(bulkComparison)

  return bulkComparison
}

/**
 * Baqend code API call.
 */
export function call(db: baqend, data: StartBulkComparisonParams): any {
  const id = `${getDateString()}-${generateHash()}`
  if (data instanceof Array) {
    startBulkComparison(db, id, null, data)
      .catch((error) => console.error(`Error while starting bulk comparison: ${error.message}`, { stack: error.stack, tests, createdBy }))

    return { id, tests: data, createdBy: null }
  }

  const { tests, createdBy = null } = data
  startBulkComparison(db, id, createdBy, tests)
    .catch((error) => console.error(`Error while starting bulk comparison: ${error.message}`, { stack: error.stack, tests, createdBy }))

  return { id, tests, createdBy }
}

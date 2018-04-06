import {
  ADD_ERROR,
  INIT_TEST,
  START_TEST,
  NORMALIZE_URL_POST,
  MONITOR_TEST,
  TESTOVERVIEW_LOAD,
  TESTOVERVIEW_NEXT,
  TEST_STATUS_GET,
  RESET_TEST_RESULT,
} from './types'

import { isURL } from '../helper/utils'
import stringifyObject from 'lib/stringify-object'

/**
 * Prepares the test before its execution (check rate limiting and normalize url).
 */
export const prepareTest = (url = null) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({
      type: INIT_TEST,
    })
    try {
      if (!isURL(url)) {
        throw new Error("Input is not a valid url")
      }
      // const rateLimitResult = await db.modules.get('rateLimiter')
      // dispatch({
      //   type: RATE_LIMITER_GET,
      //   payload: rateLimitResult.isRateLimited,
      // })
      const { mobile } = getState().config
      const urlInfo = await db.modules.post('normalizeUrl', { urls: url, mobile: mobile })
      if (!urlInfo[0]) {
        throw new Error("Input is not a valid url")
      }
      if (urlInfo[0].isBaqendApp) {
        throw new Error("Url is already a Baqend app")
      }
      dispatch({
        type: NORMALIZE_URL_POST,
        payload: urlInfo[0]
      })
      return urlInfo[0]
    } catch(e) {
      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e.message,
      })
      throw e
    }
  }
})

/**
 * Triggers the start of a new test.
 */
export const startTest = (urlInfo = {}) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    dispatch({
      type: RESET_TEST_RESULT
    })
    try {
      dispatch({
        type: START_TEST,
      })
      let { url, location, caching, mobile, speedKitConfig, activityTimeout } = getState().config
      let { speedkit, speedkitVersion, type } = urlInfo

      if (mobile && speedKitConfig) {
        // eslint-disable-next-line no-eval
        const speedKitConfigObj = eval(`(${speedKitConfig})`)
        speedKitConfigObj.userAgentDetection = true
        speedKitConfig = stringifyObject(speedKitConfigObj, { indent: '  ' })
      }

      const testOverview = await db.modules.post('runComparison', {
        url,
        location,
        caching,
        mobile,
        speedKitConfig,
        activityTimeout,
        type,
        isSpeedKitComparison: speedkit,
        speedKitVersion: speedkitVersion,
      })
      return testOverview
    } catch(e) {
      dispatch({
        type: RESET_TEST_RESULT,
      })
      dispatch({
        type: ADD_ERROR,
        payload: e.message,
      })
      throw e
    }
  }
})

/**
 * Checks the status of a given test and subscribes to the result.
 * @param testId The id of the test to be monitored.
 */
export const monitorTest = (testId, onAfterFinish) => ({
  'BAQEND': async ({ dispatch }) => {
    dispatch({ type: MONITOR_TEST })
    const testOverview = await dispatch(subscribeToTestOverview({ testId, onAfterFinish }))
    // dispatch(updateConfigByTestOverview(testOverview))
    if (!testOverview.hasFinished) {
      dispatch(checkTestStatus(testOverview.competitorTestResult))
    }
  }
})

const subscribeToTestOverview = ({ testId, onAfterFinish }) => ({
  'BAQEND': async ({ dispatch, getState, db }) => {
    let isResolved = false
    const testOverviewStream = db.TestOverview.find().equal('id', `/db/TestOverview/${testId}`).resultStream()
    const testOverviewPromise = new Promise((resolve, reject) => {
      const testOverviewSubscription = testOverviewStream.subscribe((res) => {
        const testOverview = res[0] ? res[0].toJSON() : null
        if (testOverview) {
          if (testOverview.hasFinished) {
            testOverviewSubscription && testOverviewSubscription.unsubscribe()
            onAfterFinish && onAfterFinish({ testId })
          }
          if (isResolved) {
            dispatch({
              type: TESTOVERVIEW_NEXT,
              payload: testOverview
            })
          } else {
            dispatch({
              type: TESTOVERVIEW_LOAD,
              payload: testOverview
            })
          }
          testOverviewPromise.then((testOverview) => {
            isResolved = true
          })
          resolve(testOverview)
        }
      })
    })
    return testOverviewPromise
  }
})

const checkTestStatus = (testId) => ({
  'BAQEND': ({ dispatch, getState, db }) => {
    const pullTestStatus = (id) => ({
      'BAQEND': async ({ dispatch, db }) => {
        const res = await db.modules.get('getTestStatus', { baqendId: id })
        const status = {
          statusCode: res.status.statusCode,
          statusText: res.status.statusText
        }
        dispatch({
          type: TEST_STATUS_GET,
          payload: status
        })
        return status
      }
    })
    const interval = setInterval(async () => {
      try {
        const { statusCode } = await dispatch(pullTestStatus(testId))
        if (statusCode === 100 || statusCode === 200) {
          clearInterval(interval)
        }
      } catch (e) {
        clearInterval(interval)
      }
    }, 2000)
    return interval
  }
})

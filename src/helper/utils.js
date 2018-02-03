/* global window */

/**
 * @param {number} bytes The file size in bytes to format.
 * @param {number} [decimals] The number of decimals.
 * @return {string}
 */
export function formatFileSize(bytes, decimals) {
  if (bytes === 0) return '0 Bytes'
  const k = 1000
  const dm = decimals || 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / (k ** i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Lets the VM sleep for a given time.
 *
 * @param {number} millis The time to sleep in milliseconds.
 * @return {Promise<void>} A promise which resolves when we wake up.
 */
export function sleep(millis) {
  return new Promise((resolve) => {
    setTimeout(resolve, millis)
  })
}

/**
 * Verify whether the device is IOS or not.
 */
export function isDeviceIOS() {
  return window.navigator.userAgent.match(/iPhone|iPod/i)
}

/**
 * Sort an Array of Objects by a given sort criterion
 *
 * @param {Array} dataArray An Array of Objects.
 * @param {string} sortCriterion Criterion for sort mechanism.
 * @return {Array} The sorted Array of objects.
 */
export function sortArray(dataArray, sortCriterion) {
  return dataArray[sortCriterion].sort((a, b) => parseFloat(b.requests) - parseFloat(a.requests))
}

/**
 * @param {string} name
 * @return {null|string}
 */
export function getParameterByName(name) {
  const url = window.location.href
  const newName = name.replace(/[[\]]/g, '\\$&')
  const regex = new RegExp(`[?&]${newName}(=([^&#]*)|&|#|$)`)
  const results = regex.exec(url)
  if (!results) return null
  if (!results[2]) return ''
  return decodeURIComponent(results[2].replace(/\+/g, ' '))
}

/**
 * @param {object} objectId The id of the corresponding object
 * @return {string}
 */
export function getObjectKey(objectId) {
  const objectSplit = objectId.split('/')
  return objectSplit[objectSplit.length - 1]
}

/**
 * Check if a given string is a valid url.
 * @param str The string to be checked.
 * @returns {boolean}
 */
export function isURL(str) {
  const pattern =
    new RegExp('((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name and extension
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?' + // port
      '(\\/[-a-z\\d%@_.~+&:]*)*' + // path
      '(\\?[;&a-z\\d%@_.,~+&:=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', 'i') // fragment locator
  return pattern.test(str)
}

/**
 * Check whether an object is empty or not
 * @param obj The object to be checked
 * @returns {boolean}
 */
export function isEmpty(obj) {
  for(const prop in obj) {
    if(obj.hasOwnProperty(prop))
      return false
  }

  return true
}

/**
 * Extracts the top level domain of a URL.
 *
 * @param {string} url The URL to extract the hostname of.
 * @return {string} The extracted hostname.
 */
export const getTLD = (url) => {
  const dummyElement = document.createElement('a')
  dummyElement.href = url
  let { hostname } = dummyElement
  // Remove "www" in the beginning
  if (hostname.includes('www.')) {
    hostname = hostname.substr(hostname.indexOf('www.') + 4)
  }
  const domainFilter = /^(?:[\w-]*\.){0,3}([\w-]*\.)[\w]*$/
  const [, domain] = domainFilter.exec(hostname)
  // remove the dot at the end of the string
  return domain
}

/**
 * Escapes a regular expression.
 *
 * @param {string} str
 * @return {string}
 */
export const escapeRegExp = (str) => str.replace(/[[\]/{}()*+?.\\^$|-]/g, '\\$&')

/**
 * Generates a reg exp representing the whitelist.
 *
 * @param {string} originalUrl The original URL to the site.
 * @param {string[]} whitelist An array of whitelist domains.
 * @return {string} A regexp string representing the white listed domains
 */
export const generateRules = (originalUrl, whitelist) => {
  const domain = getTLD(originalUrl)
  // Create parts for the regexp
  return `/^(?:[\\w-]*\\.){0,3}(?:${[domain, ...whitelist]
    .filter(item => item !== null)
    .map(item => escapeRegExp(item)).join('|')})/`
}

export const shuffle = (a) => {
  let counter = a.length
  while (counter > 0) {
    let index = Math.floor(Math.random() * counter)
    counter--
    let temp = a[counter]
    a[counter] = a[index]
    a[index] = temp
  }
  return a
}

import fetch from 'node-fetch'
import { Request, Response } from 'express'
import { baqend } from 'baqend'
import credentials from './credentials'

const API_KEY = credentials.google_api_key;
const API_URL = 'https://www.googleapis.com/pagespeedonline/v1/runPagespeed?';

export interface PageSpeedScreenshot {
  data: string
  height: number
  mime_type: string
  width: number
}

export interface PageSpeedResult {
  url: string
  mobile: boolean
  domains: number
  requests: number
  bytes: number
  screenshot: PageSpeedScreenshot
}

/**
 * @param url The URL to run the Page Speed tests on.
 * @param mobile Run the test as a mobile client.
 * @return
 */
export async function callPageSpeed(url: string, mobile: boolean): Promise<PageSpeedResult> {
  const query = [
    `url=${encodeURIComponent(url)}`,
    'screenshot=true',
    `strategy=${mobile ? 'mobile' : 'desktop'}`,
    `key=${API_KEY}`,
  ].join('&')

  const response = await fetch(API_URL + query, { method: 'get' })
  const [ok, data] = await Promise.all([response.ok, response.json()])
  if (!ok) {
    throw new Error(data.error.errors[0].message)
  }

  const { pageStats, screenshot } = data
  const domains = pageStats.numberHosts || 0
  const requests = pageStats.numberResources || 0

  let bytes = parseInt(pageStats.htmlResponseBytes, 10) || 0
  bytes += parseInt(pageStats.cssResponseBytes, 10) || 0
  bytes += parseInt(pageStats.imageResponseBytes, 10) || 0
  bytes += parseInt(pageStats.javascriptResponseBytes, 10) || 0
  bytes += parseInt(pageStats.otherResponseBytes, 10) || 0

  return { url, mobile, domains, requests, bytes, screenshot }
}
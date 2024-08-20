// @ts-ignore
import icon from '../assets/icon.png';
import config_json from '../config.json';
import { redirect, notarize, outputJSON, getCookiesByHost, getHeadersByHost } from './utils/hf.js';

/**
 * Plugin configuration
 * This configurations defines the plugin, most importantly:
 *  * the different steps
 *  * the user data (headers, cookies) it will access
 *  * the web requests it will query (or notarize)
 */
export function config() {
  // TODO: if we need to prove the pb param, can we get it for a given day? any args for config?
  outputJSON({
    ...config_json,
    icon: icon
  });
}

function isValidHost(urlString: string) {
  const url = new URL(urlString);
  return url.hostname === 'timeline.google.com';
}

/**
 * Implementation of the first (start) plugin step
  */
export function start() {
  if (!isValidHost(Config.get('tabUrl'))) {
    redirect('https://timeline.google.com');
    outputJSON(false);
    return;
  }
  outputJSON(true);
}


function gmapsMaPb(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const inputStr = '!1m9!2m8!1m3!1i2021!2i5!3i11!2m3!1i2021!2i5!3i11!2m3!6b1!7b1!8b1!3m11!1m10!1e0!2m8!1m3!1i2021!2i5!3i11!2m3!1i2021!2i5!3i11!5m0!6b1!7m3!1szILEZu3wG5fkxc8PkbD-0Ak!7e94!15i12604'
  // @ts-ignore
  return inputStr.replaceAll('!1i2021!2i5!3i11', `!1i${year}!2i${month}!3i${day}`)
}

type GmapsHeaders = {
  "Accept": string
  "Accept-Encoding": string
  "Accept-Language": string
  "DNT": string
  "Referer": string
  "Sec-Fetch-Dest": string
  "Sec-Fetch-Mode": string
  "Sec-Fetch-Site": string
  "Sec-Fetch-User": string
  "Upgrade-Insecure-Requests": string
  "User-Agent": string
  "X-Client-Data": string
  "sec-ch-ua": string
  "sec-ch-ua-arch": string
  "sec-ch-ua-bitness": string
  "sec-ch-ua-form-factors": string
  "sec-ch-ua-full-version": string
  "sec-ch-ua-full-version-list": string
  "sec-ch-ua-mobile": string
  "sec-ch-ua-model": string
  "sec-ch-ua-platform": string
  "sec-ch-ua-platform-version": string
  "sec-ch-ua-wow64": string
}

type GmapsCookies = {
  "AEC": string
  "APISID": string
  "HSID": string
  "NID": string
  "OSID": string
  "SAPISID": string
  "SEARCH_SAMESITE": string
  "SID": string
  "SIDCC": string
  "SSID": string
  "__Secure-1PAPISID": string
  "__Secure-1PSID": string
  "__Secure-1PSIDCC": string
  "__Secure-1PSIDTS": string
  "__Secure-3PAPISID": string
  "__Secure-3PSID": string
  "__Secure-3PSIDCC": string
  "__Secure-3PSIDTS": string
  "__Secure-ENID": string
  "__Secure-OSID": string
}

const hasHeaders = (headers: Partial<GmapsHeaders>): boolean => [
"Accept",
"Accept-Encoding",
"Accept-Language",
"DNT",
"Referer",
"Sec-Fetch-Dest",
"Sec-Fetch-Mode",
"Sec-Fetch-Site",
"Sec-Fetch-User",
"Upgrade-Insecure-Requests",
"User-Agent",
"X-Client-Data",
// "sec-ch-ua",
// "sec-ch-ua-arch",
// "sec-ch-ua-bitness",
// "sec-ch-ua-form-factors",
// "sec-ch-ua-full-version",
// "sec-ch-ua-full-version-list",
// "sec-ch-ua-mobile",
// "sec-ch-ua-model",
// "sec-ch-ua-platform",
// "sec-ch-ua-platform-version",
// "sec-ch-ua-wow64",
].every(key => headers[key])


const hasCookies = (cookies: Partial<GmapsCookies>): boolean => [
"AEC",
"APISID",
"HSID",
"NID",
"OSID",
"SAPISID",
"SEARCH_SAMESITE",
"SID",
"SIDCC",
"SSID",
"__Secure-1PAPISID",
"__Secure-1PSID",
"__Secure-1PSIDCC",
"__Secure-1PSIDTS",
"__Secure-3PAPISID",
"__Secure-3PSID",
"__Secure-3PSIDCC",
"__Secure-3PSIDTS",
"__Secure-ENID",
"__Secure-OSID",
].every(key => cookies[key])

/**
 * Implementation of step "two".
 * This step collects and validates authentication cookies and headers for 'timeline.google.com'.
 * If all required information, it creates the request object.
 * Note that the url needs to be specified in the `config` too, otherwise the request will be refused.
 */
export function two() {
  const cookies = JSON.parse(Config.get('cookies'))['timeline.google.com']  as GmapsCookies;
  const headers = JSON.parse(Config.get('headers'))['timeline.google.com']  as GmapsHeaders;
  // const cookies = getCookiesByHost('timeline.google.com') as GmapsCookies;
  // const headers = getHeadersByHost('timeline.google.com') as GmapsHeaders;

  const urlObj = new URL(headers['Referer']);

  const searchParams = urlObj.searchParams;
  const pb = searchParams.get('pb');
  const rapt = searchParams.get('rapt');

  // get date string from header and convert to google protobuf
  const dateStr = pb.slice(-10)
  // todo confirm dateStr is valid, e.g. 2024-07-03

  const pbWithDate = gmapsMaPb(dateStr)

  // TODO: if this endpoint is too big, use `pl` - list of top visited places
  // https://timeline.google.com/maps/timeline/_rpc/pl?rapt=AEjHL4M9YsgzU49GchWYYrqqFxmm_CcBsie0E6dDxDyUP5Wc4KNMD1J2V-KFojN-iVaEzfVQtyMH6oFZfvVcBcCbi5yEWCgAOwzUCL05oBic1BbJl1_WsHQ&authuser=0&pb=!1m1!2s0x47a851e1ca221bb5%3A0x9cf0cb1ba6660eb3!1m1!2s0x47a851e3e51437d9%3A0xa7d1df1ad7eb443!1m1!2s0x47a851e21a266539%3A0xef7ab01fd3be2ab9!2b1!3m0&hl=en&gl=DE
  const url = `https://timeline.google.com/maps/timeline/_rpc/ma?rapt=${rapt}&pb=${pbWithDate}`
  // const url = `https://timeline.google.com/maps/timeline/_rpc/ma?pb=${pbWithDate}`
  // console.log(url)

  if (
    !hasCookies(cookies) || !hasHeaders(headers)
  ) {
    outputJSON(false);
    return;
  }

  outputJSON({
    url,
    method: 'GET',
    headers: {
      ...headers,
      "Accept-Encoding": 'identity',
      Cookie: Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; '),
    },
    secretHeaders: [],
  });
}

const getLocations = (json: any): {lat: number; lon: number; time1: number; time2: number}[] => json[11][2][2].map(item => ({
  lat: item[0][2],
  lon: item[0][3],
  time1: item[1][4],
  time2: item[1][5]
})).filter((item: any) =>
    item.lat != null &&
    item.lon != null &&
    item.time1 != null &&
    item.time2 != null
)

/**
 * This method is used to parse the Twitter response and specify what information is revealed (i.e. **not** redacted)
 * This method is optional in the notarization request. When it is not specified nothing is redacted.
 *
 * In this example it locates the `screen_name` and excludes that range from the revealed response.
 */
export function parseResp() {
  const bodyString = Host.inputString();
  // console.log(bodyString.slice(4))

  // TODO simple redaction: remove precision on latlons and/or time

  // const params = JSON.parse(bodyString.slice(4));
  // console.log(JSON.stringify(params))
  // console.log(JSON.stringify(params[11][2]))
  // const locations = getLocations(params)

  outputJSON([bodyString])
  // outputJSON([JSON.stringify(locations)])
}

/**
 * Step 3: calls the `notarize` host function
 */
export function three() {
  const str = Host.inputString()
  // console.log(str)
  // const params = false
  const params = JSON.parse(str);
  console.log('params')
  console.log(JSON.stringify(params))

  if (!params) {
    outputJSON(false);
  } else {
    const id = notarize({
      ...params,
      getSecretResponse: 'parseResp',
    });
    outputJSON(id);
  }
}

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

/**
 * Implementation of step "two".
 * This step collects and validates authentication cookies and headers for 'timeline.google.com'.
 * If all required information, it creates the request object.
 * Note that the url needs to be specified in the `config` too, otherwise the request will be refused.
 */
export function two() {
  const cookies = getCookiesByHost('timeline.google.com');
  const headers = getHeadersByHost('timeline.google.com');

  // fuck knows if this works
  console.log(JSON.stringify(headers))

  // maybe this??
  // debugger;

  // TODO maybe get the date from the url here if poss
  // request header path (note: date at the end) &pb=!1m2!1m1!1s2021-07-03
  // /maps/timeline?pli=1&rapt=AEjHL4PSyX0XW3FGCnZaYAVzNoV-EosLZgGaSDkU8Za8lLxS08xJszDmI-nqndr1uqoqz40XP45DAsutgSe7jwKBmJPdCBCjm7zdXE_dt4gpQ6EglsnalbQ&pb=!1m2!1m1!1s2021-07-03

  if (
    !cookies.auth_token ||
    !cookies.ct0 ||
    !headers['x-csrf-token'] ||
    !headers['authorization']
  ) {
    outputJSON(false);
    return;
  }

  outputJSON({
    // TODO we need the pb param for the date
    url: 'https://timeline.google.com/ma',
    method: 'GET',
    headers: {
      // TODO: add headers as needed
      'x-csrf-token': headers['x-csrf-token'],
      Host: 'timeline.google.com',
      authorization: headers.authorization,
      Cookie: `lang=en; auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
      'Accept-Encoding': 'identity',
      Connection: 'close',
    },
    secretHeaders: [
      `x-csrf-token: ${headers['x-csrf-token']}`,
      `cookie: lang=en; auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
      `authorization: ${headers.authorization}`,
    ],
  });
}

/**
 * This method is used to parse the Twitter response and specify what information is revealed (i.e. **not** redacted)
 * This method is optional in the notarization request. When it is not specified nothing is redacted.
 *
 * In this example it locates the `screen_name` and excludes that range from the revealed response.
 */
export function parseResp() {
  const bodyString = Host.inputString();

  // TODO everything

  const params = JSON.parse(bodyString);

  if (params.screen_name) {
    const revealed = `"screen_name":"${params.screen_name}"`;
    const selectionStart = bodyString.indexOf(revealed);
    const selectionEnd =
      selectionStart + revealed.length;
    const secretResps = [
      bodyString.substring(0, selectionStart),
      bodyString.substring(selectionEnd, bodyString.length),
    ];
    outputJSON(secretResps);
  } else {
    outputJSON(false);
  }
}

/**
 * Step 3: calls the `notarize` host function
 */
export function three() {
  const params = JSON.parse(Host.inputString());

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

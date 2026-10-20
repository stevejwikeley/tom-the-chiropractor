/*
 * Cookie banner and Google tag loading.
 *
 * This uses Google's "advanced" consent mode. The Google tags load on every
 * visit, but until someone accepts the banner they run in a denied state:
 * they set no cookies, store nothing on the device, and send no information
 * that identifies the visitor. Accepting switches them to granted. Declining
 * leaves them denied permanently.
 *
 * The alternative ("basic" consent mode, which this file used to do) simply
 * never loaded the tags for anyone who didn't accept. That is also compliant,
 * but it means bookings from those visitors are completely invisible in Google
 * Ads even when an advert paid for them. Advanced mode lets Google estimate
 * that gap without storing anything on the visitor's device.
 *
 * The consent defaults below MUST run before any Google tag loads, which is
 * why this file is a plain synchronous <script> in the <head> of every page.
 * Don't make it async or defer it, and don't let anything else on the page
 * load Google Tag Manager first. In particular, never set gtmContainerId in
 * the PracticeHub widget's window.BookingTrackerConfig: its embed script
 * would then load GTM itself.
 */
(function () {
  var CONSENT_KEY = 'cookieConsent';
  var GTM_ID = 'GTM-KQFB5WPB';
  var GA_ID = 'G-DLL6GMS3S4';
  var AW_ID = 'AW-18395409899';
  var OAIQ_PIXEL_ID = 'QeTofy82ewKqgbGSfjGbwz'; // ChatGPT/OpenAI Ads conversion pixel

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  });

  // While consent is denied, strip Google's ad click identifiers out of
  // anything sent to Google, so a visitor who hasn't agreed is never
  // identifiable to them.
  gtag('set', 'ads_data_redaction', true);

  // Instead, keep the ad click identifier in the page URL as someone moves
  // around the site. If they accept later in the visit, the booking can still
  // be attributed to the advert that brought them. This stays in the browser
  // and is not sent anywhere.
  gtag('set', 'url_passthrough', true);

  var stored = null;
  try { stored = localStorage.getItem(CONSENT_KEY); } catch (e) {}

  // Returning visitors who already accepted get consent restored before the
  // tags load, so there's no brief denied state on every subsequent page.
  if (stored === 'accepted') grantConsent();
  if (stored === 'ads_only') grantAdsMeasurement();

  loadTags();

  function grantConsent() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
    });
    if (typeof oaiq === 'function') oaiq('consent', true);
  }

  // The banner's middle option: Google Ads conversion measurement only (did
  // an ad click lead to a booking). Analytics, ad personalisation and
  // remarketing, and the OpenAI pixel all stay denied. The cookie policy
  // describes this option, so keep the two in step.
  function grantAdsMeasurement() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted'
    });
  }

  function loadTags() {
    if (window.__trackingLoaded) return;
    window.__trackingLoaded = true;

    var gtm = document.createElement('script');
    gtm.async = true;
    gtm.src = 'https://www.googletagmanager.com/gtm.js?id=' + GTM_ID;
    document.head.appendChild(gtm);

    gtag('js', new Date());
    gtag('config', GA_ID);
    // Google Ads must be configured as its own destination on every page.
    // Without this, js/tracking.js's send_to conversions (WhatsApp, phone,
    // contact) are silently dropped: gtag only routes to destinations it has
    // loaded, and GTM only loads the Ads destination on /thank-you.html. It
    // also gives the Ads conversion linker url_passthrough on every page.
    gtag('config', AW_ID);

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);

    // ChatGPT/OpenAI Ads conversion pixel. Same advanced-consent approach as
    // the Google tags above: loads on every visit but starts denied, so it
    // sets no cookies and sends no identifying data until the visitor accepts.
    !function (w, d, s, u) {
      if (w.oaiq) return;
      var q = function () { q.q.push(arguments); };
      q.q = [];
      w.oaiq = q;
      var j = d.createElement(s);
      j.async = 1;
      j.src = u;
      var f = d.getElementsByTagName(s)[0];
      f.parentNode.insertBefore(j, f);
    }(window, document, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
    oaiq('init', { pixelId: OAIQ_PIXEL_ID });
    oaiq('consent', stored === 'accepted');
  }

  function hideBanner() {
    var el = document.getElementById('cookieBanner');
    if (el) el.hidden = true;
    document.documentElement.style.overflow = '';
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    hideBanner();
    if (value === 'accepted') grantConsent();
    if (value === 'ads_only') grantAdsMeasurement();
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Already chosen, either way: no banner.
    if (stored === 'accepted' || stored === 'ads_only' || stored === 'declined') return;

    var banner = document.getElementById('cookieBanner');
    if (!banner) return;
    // Shown as a modal over the page (see .cookie-banner in styles.css), so
    // announce it as a dialog and stop the page scrolling behind it.
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-modal', 'true');
    banner.setAttribute('aria-label', 'Cookie preferences');
    banner.hidden = false;
    document.documentElement.style.overflow = 'hidden';

    var acceptBtn = document.getElementById('cookieAccept');
    var adsOnlyBtn = document.getElementById('cookieAdsOnly');
    var declineBtn = document.getElementById('cookieDecline');
    if (acceptBtn) acceptBtn.focus({ preventScroll: true });
    if (acceptBtn) acceptBtn.addEventListener('click', function () { setConsent('accepted'); });
    if (adsOnlyBtn) adsOnlyBtn.addEventListener('click', function () { setConsent('ads_only'); });
    if (declineBtn) declineBtn.addEventListener('click', function () { setConsent('declined'); });
  });
})();

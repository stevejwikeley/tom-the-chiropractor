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
 * load Google Tag Manager first -- see the note about the PracticeHub booking
 * widget's gtmContainerId option in index.html.
 */
(function () {
  var CONSENT_KEY = 'cookieConsent';
  var GTM_ID = 'GTM-KQFB5WPB';
  var GA_ID = 'G-DLL6GMS3S4';

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

  loadTags();

  function grantConsent() {
    gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted'
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

    var ga = document.createElement('script');
    ga.async = true;
    ga.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(ga);
  }

  function hideBanner() {
    var el = document.getElementById('cookieBanner');
    if (el) el.hidden = true;
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) {}
    hideBanner();
    if (value === 'accepted') grantConsent();
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Already chosen, either way: no banner.
    if (stored === 'accepted' || stored === 'declined') return;

    var banner = document.getElementById('cookieBanner');
    if (!banner) return;
    banner.hidden = false;

    var acceptBtn = document.getElementById('cookieAccept');
    var declineBtn = document.getElementById('cookieDecline');
    if (acceptBtn) acceptBtn.addEventListener('click', function () { setConsent('accepted'); });
    if (declineBtn) declineBtn.addEventListener('click', function () { setConsent('declined'); });
  });
})();

(function () {
  var CONSENT_KEY = 'cookieConsent';
  var GTM_ID = 'GTM-KQFB5WPB';
  var GA_ID = 'G-DLL6GMS3S4';

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied'
  });

  function loadTracking() {
    if (window.__trackingLoaded) return;
    window.__trackingLoaded = true;

    gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted'
    });

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
    if (value === 'accepted') loadTracking();
  }

  document.addEventListener('DOMContentLoaded', function () {
    var stored;
    try { stored = localStorage.getItem(CONSENT_KEY); } catch (e) { stored = null; }

    if (stored === 'accepted') {
      loadTracking();
      return;
    }
    if (stored === 'declined') return;

    var banner = document.getElementById('cookieBanner');
    if (!banner) return;
    banner.hidden = false;

    var acceptBtn = document.getElementById('cookieAccept');
    var declineBtn = document.getElementById('cookieDecline');
    if (acceptBtn) acceptBtn.addEventListener('click', function () { setConsent('accepted'); });
    if (declineBtn) declineBtn.addEventListener('click', function () { setConsent('declined'); });
  });
})();

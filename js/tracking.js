/**
 * Site-wide interaction tracking for tomthechiropractor.co.uk
 *
 * Covers three Google Ads conversion actions that currently show "Inactive"
 * in account 642-795-0400 because nothing on the site ever fires them.
 *
 * TO COMPLETE: the send_to labels below are placeholders. Get each one from
 * Google Ads → Goals → Conversions → click the action → Manage →
 * "See event snippet", then replace the REPLACE_ME_* values.
 *
 * These should be added as SECONDARY conversions in Google Ads. A WhatsApp
 * click or phone click is an enquiry, not a booking — letting one into
 * Primary would corrupt bidding once the campaign moves to Maximise
 * conversions.
 *
 * Loaded sitewide, after cookie-consent.js. Idempotent; safe to include twice.
 */
(function () {
  'use strict';

  var AW = 'AW-18395409899';

  var EVENTS = {
    whatsapp_click: {
      label: 'REPLACE_ME_WHATSAPP',       // Ads action: "WhatsApp click"
      match: function (a) {
        return /(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)/i.test(a.href);
      }
    },
    phone_click: {
      label: 'REPLACE_ME_PHONE',          // Ads action: "Phone Click (1)"
      match: function (a) { return /^tel:/i.test(a.getAttribute('href') || ''); }
    },
    email_click: {
      label: 'REPLACE_ME_CONTACT',        // Ads action: "Contact"
      match: function (a) { return /^mailto:/i.test(a.getAttribute('href') || ''); }
    }
  };

  if (window.__ttcTrackingInit) return;
  window.__ttcTrackingInit = true;

  function send(name, cfg, detail) {
    if (typeof gtag !== 'function') return;

    // Skip unconfigured labels rather than sending a broken ping.
    if (!cfg.label || cfg.label.indexOf('REPLACE_ME') === 0) {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.warn('[tracking] no label configured for ' + name + ' — not sent');
      }
      return;
    }

    gtag('event', 'conversion', { send_to: AW + '/' + cfg.label });
    gtag('event', name, detail || {});   // GA4 mirror
  }

  // Delegated so it survives DOM changes from the PracticeHub widget.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;

    for (var name in EVENTS) {
      if (!Object.prototype.hasOwnProperty.call(EVENTS, name)) continue;
      var cfg = EVENTS[name];
      try {
        if (cfg.match(a)) {
          send(name, cfg, { link_url: a.href, link_text: (a.innerText || '').trim().slice(0, 100) });
          return;
        }
      } catch (err) { /* never let tracking break a click */ }
    }
  }, true);
})();

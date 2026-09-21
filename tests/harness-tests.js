// Assertions for the guide data and the endpoint's pure functions.
// Runs inside the page built by tests/build-harness.sh. Results land in
// the #out element and in window.__results so they can be read back.

(function () {
  var pass = 0;
  var lines = [];

  function check(label, condition) {
    if (condition) {
      pass = pass + 1;
      lines.push("pass  " + label);
    } else {
      lines.push("FAIL  " + label);
    }
  }

  function runsWithoutThrowing(label, fn) {
    var threw = false;
    try { fn(); } catch (e) { threw = true; }
    check(label, threw === false);
  }

  // The data module
  check("21 guides defined", Object.keys(GUIDES.guides).length === 21);
  check("6 groups", GUIDES.groups.length === 6);
  check("27 slug references", GUIDES.groups.reduce(function (n, g) {
    return n + g.slugs.length;
  }, 0) === 27);
  check("first group is Low back and leg", GUIDES.groups[0].heading === "Low back and leg");
  check("hip guide is in two groups", GUIDES.groups.filter(function (g) {
    return g.slugs.indexOf("hip-arthritis-and-low-back-pain") !== -1;
  }).length === 2);

  // escapeHtml
  check("escapeHtml handles ampersand", escapeHtml("Bob & Sue") === "Bob &amp; Sue");
  check("escapeHtml handles angle brackets", escapeHtml("<b>") === "&lt;b&gt;");
  check("escapeHtml handles quotes", escapeHtml('a"b') === "a&quot;b");
  check("escapeHtml handles apostrophe", escapeHtml("O'Neill") === "O&#39;Neill");
  check("escapeHtml handles null", escapeHtml(null) === "");

  // guideUrl
  check("guideUrl builds an absolute url",
    guideUrl("low-back-pain") === "https://tomthechiropractor.co.uk/guides/low-back-pain.html");

  // validate
  var good = validate(GUIDES, { name: "Sarah", email: "sarah@example.com", slug: "low-back-pain" });
  check("valid submission passes", good.ok === true);
  check("valid submission returns the title", good.ok && good.safe.title === "Low Back Pain in Your 30s, 40s and 50s");
  check("valid submission trims the name",
    validate(GUIDES, { name: "  Sarah  ", email: "s@e.com", slug: "neck-pain" }).safe.name === "Sarah");

  check("missing name rejected", validate(GUIDES, { name: "", email: "s@e.com", slug: "neck-pain" }).ok === false);
  check("whitespace name rejected", validate(GUIDES, { name: "   ", email: "s@e.com", slug: "neck-pain" }).ok === false);
  check("overlong name rejected", validate(GUIDES, {
    name: new Array(100).join("a"), email: "s@e.com", slug: "neck-pain"
  }).ok === false);
  check("bad email rejected", validate(GUIDES, { name: "Sarah", email: "not-an-email", slug: "neck-pain" }).ok === false);
  check("empty email rejected", validate(GUIDES, { name: "Sarah", email: "", slug: "neck-pain" }).ok === false);
  check("unknown slug rejected", validate(GUIDES, { name: "Sarah", email: "s@e.com", slug: "made-up" }).ok === false);
  check("missing slug rejected", validate(GUIDES, { name: "Sarah", email: "s@e.com" }).ok === false);
  check("non string fields rejected", validate(GUIDES, { name: 42, email: {}, slug: [] }).ok === false);
  runsWithoutThrowing("validate survives an empty body", function () { validate(GUIDES, {}); });
  runsWithoutThrowing("validate survives no body at all", function () { validate(GUIDES, undefined); });

  // buildSubject
  check("subject names the guide", buildSubject("Neck Pain Over 60") === "Your guide: Neck Pain Over 60");

  // buildText
  var text = buildText({
    name: "Sarah",
    title: "Neck Pain Over 60",
    url: "https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html"
  });
  check("plain text greets by name", text.indexOf("Hi Sarah,") === 0);
  check("plain text carries the url", text.indexOf("https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html") !== -1);
  check("plain text carries the urgent help line", text.indexOf("When to get urgent help") !== -1);
  check("plain text says no mailing list", text.indexOf("mailing list") !== -1);
  check("plain text has no dashes", text.indexOf("\u2014") === -1 && text.indexOf("\u2013") === -1);

  // buildHtml
  var html = buildHtml({
    name: "Sarah",
    title: "Neck Pain Over 60",
    url: "https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html"
  });
  check("html greets by name", html.indexOf("Hi Sarah,") !== -1);
  check("html has a button to the guide",
    html.indexOf('href="https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html"') !== -1);
  check("html shows the bare url too", html.indexOf(">https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html<") !== -1);
  check("html uses the teal button colour", html.indexOf("#007a7a") !== -1);
  check("html uses the cream ground", html.indexOf("#EFEADF") !== -1);
  check("html carries the urgent help line", html.indexOf("When to get urgent help") !== -1);
  check("html has no dashes", html.indexOf("\u2014") === -1 && html.indexOf("\u2013") === -1);

  var escaped = buildHtml({ name: "<script>x</script>", title: "T & U", url: "https://x/y.html" });
  check("name is escaped into the html", escaped.indexOf("<script>x</script>") === -1);
  check("title is escaped into the html", escaped.indexOf("T &amp; U") !== -1);

  // The handler is not inlined into this harness, so what is checked here
  // is the error mapping it depends on, as a pure function.
  check("401 maps to a key problem", resendErrorMessage(401) === "The Resend API key is missing or has been revoked.");
  check("403 maps to a key problem", resendErrorMessage(403) === "The Resend API key is missing or has been revoked.");
  check("422 maps to a bad address", resendErrorMessage(422) === "Resend would not accept that email address.");
  check("400 maps to a bad address", resendErrorMessage(400) === "Resend would not accept that email address.");
  check("500 maps to a Resend outage", resendErrorMessage(500) === "Resend could not be reached. Try again in a minute.");
  check("0 maps to a Resend outage", resendErrorMessage(0) === "Resend could not be reached. Try again in a minute.");

  var total = lines.length;
  var summary = (pass === total ? "PASS" : "FAIL") + "  " + pass + "/" + total;
  window.__results = summary + "\n" + lines.join("\n");
  document.getElementById("out").textContent = window.__results;
  document.title = summary;
})();

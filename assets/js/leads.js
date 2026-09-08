/* ==========================================================================
   AIC lead capture  ->  Supabase  (table: public.leads)
   Shared by every page that has a #contactForm.

   SETUP (one time, ~5 min) — see docs/leads-supabase.md:
     1. Create a free project at supabase.com
     2. SQL Editor -> run the SQL in docs/leads-supabase.md (table + insert policy)
     3. Project Settings -> API -> copy "Project URL" and the "anon public" key
     4. Paste them into the two constants below
     5. View leads anytime in Supabase -> Table Editor -> leads

   Until the keys are filled in, the form still works: it falls back to
   emailing each submission to hello@alexic.ca via formsubmit.
   ========================================================================== */
(function () {
  "use strict";

  var SUPABASE_URL      = "https://pfvipaltqmpurfxpojgs.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmdmlwYWx0cW1wdXJmeHBvamdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MDIwOTgsImV4cCI6MjA5NzQ3ODA5OH0.rtrIvM3CQG4TFT6inPtJBNyQd9oDOjHQzMoZ9IIAqO8";
  var EMAIL_NOTIFY      = "https://formsubmit.co/ajax/hello@alexic.ca"; // also email each lead ("" to disable)

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var form = document.getElementById("contactForm");
    if (!form) return;

    /* pre-select the inquiry type from a ?type= link (e.g. contact.html?type=ai-readiness) */
    (function () {
      var t = new URLSearchParams(location.search).get("type");
      if (!t) return;
      var map = { "ai-readiness": "readiness", "training": "training", "workflow": "readiness",
        "governance": "readiness", "alebex-demo": "Alebex", "research": "research",
        "venture-studio": "Incubation", "innovation-night": "Innovation", "infrastructure": "infrastructure",
        "founders-lab": "Founders Lab", "accelerator": "Accelerator", "investor": "Investor",
        "mentor": "Mentor" };
      var kw = (map[t] || t).toLowerCase();
      var sel = form.querySelector("select[name=inquiry]");
      if (!sel) return;
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.toLowerCase().indexOf(kw) > -1) { sel.selectedIndex = i; break; }
      }
    })();

    if (!window.fetch) return; // very old browsers: native POST handles it

    var ok  = form.querySelector(".pform__ok");
    var err = form.querySelector(".pform__err");
    var btn = form.querySelector("button[type=submit]");
    function show(el) { if (el) el.hidden = false; }
    function hide(el) { if (el) el.hidden = true; }
    function done() { if (btn) btn.disabled = false; }
    function emailNotify(fd) {
      if (!EMAIL_NOTIFY) return Promise.resolve(null);
      return fetch(EMAIL_NOTIFY, { method: "POST", headers: { "Accept": "application/json" }, body: fd });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hide(ok); hide(err);
      if (btn) btn.disabled = true;

      var fd = new FormData(form);
      var lead = {
        name:         fd.get("name") || "",
        organization: fd.get("org") || "",
        job_title:    fd.get("jobtitle") || "",
        email:        fd.get("email") || "",
        phone:        fd.get("phone") || "",
        inquiry_type: fd.get("inquiry") || "",
        company_size: fd.get("size") || "",
        message:      fd.get("message") || "",
        source_page:  (location.pathname.replace(/^.*\//, "") || "index.html")
      };

      var configured = SUPABASE_URL.indexOf("YOUR-PROJECT") === -1 && SUPABASE_ANON_KEY.indexOf("YOUR-ANON") === -1;

      if (configured) {
        fetch(SUPABASE_URL + "/rest/v1/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": "Bearer " + SUPABASE_ANON_KEY,
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(lead)
        }).then(function (r) {
          if (!r.ok) throw new Error("supabase " + r.status);
          emailNotify(fd);                 // fire-and-forget email alert
          show(ok); form.reset(); done();
        }).catch(function () {
          emailNotify(fd).then(function (r) {        // Supabase failed -> don't lose the lead
            if (r && !r.ok) throw 0;
            show(ok); form.reset();
          }).catch(function () { show(err); }).then(done);
        });
      } else {
        emailNotify(fd).then(function (r) {          // not configured yet -> email only
          if (r && !r.ok) throw 0;
          show(ok); form.reset();
        }).catch(function () { show(err); }).then(done);
      }
    });
  });
})();

(function () {
  const measurementId = "G-8K1PDWVWJL";
  const storageKey = "media-analytics-consent-v1";
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  const allowedHost = location.hostname === "aitoolnavigator.github.io";
  let consented = false;
  let started = false;
  let choice = null;
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (stored && ["accepted", "rejected"].includes(stored.value) &&
        Number.isFinite(stored.time) && Date.now() - stored.time >= 0 && Date.now() - stored.time < maxAge) {
      choice = stored.value;
    }
  } catch (_) {}

  const panel = document.querySelector(".analytics-consent");
  if (!panel) return;
  if (choice === null) document.documentElement.classList.add("analytics-prompt");
  panel.hidden = choice !== null;

  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "analytics-settings";
  settings.textContent = "アクセス解析の設定";
  (document.querySelector("footer") || document.body).appendChild(settings);
  settings.addEventListener("click", () => {
    document.documentElement.classList.add("analytics-prompt");
    panel.hidden = false;
    panel.scrollIntoView({ block: "center" });
    panel.querySelector("button").focus({ preventScroll: true });
  });

  function start() {
    if (!allowedHost || started || !consented) return;
    started = true;
    window.dataLayer = window.dataLayer || [];
    function queue() { window.dataLayer.push(arguments); }
    // Basic consent mode: no Google Analytics tag request until opt-in.
    queue("consent", "default", {
      analytics_storage: "denied", ad_storage: "denied",
      ad_user_data: "denied", ad_personalization: "denied"
    });
    queue("consent", "update", { analytics_storage: "granted" });
    queue("js", new Date());
    queue("set", { allow_google_signals: false, allow_ad_personalization_signals: false });
    const campaign = {};
    const query = new URLSearchParams(location.search);
    const sources = { social: "organic", github: "referral" };
    const source = query.get("utm_source");
    if (Object.hasOwn(sources, source) && query.get("utm_medium") === sources[source] &&
        query.get("utm_campaign") === "first_decision") {
      campaign.campaign_source = source;
      campaign.campaign_medium = sources[source];
      campaign.campaign_name = "first_decision";
      const content = query.get("utm_content");
      if (["dating_trial", "aga_questions", "beard_area", "profile_builder"].includes(content)) campaign.campaign_content = content;
    }
    queue("config", measurementId, {
      send_page_view: true,
      page_location: location.origin + location.pathname,
      page_referrer: "",
      page_title: location.pathname,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: "none",
      cookie_expires: 15552000,
      cookie_update: false,
      ...campaign
    });
    window.gtag = function (command, name, params) {
      if (!consented || command !== "event" || !["affiliate_click", "official_link_click"].includes(name)) return;
      const safe = {};
      ["slot_id", "program_id"].forEach((key) => {
        const value = params && params[key];
        if (typeof value === "string" && /^[a-z0-9-]{1,80}$/.test(value)) safe[key] = value;
      });
      safe.page_path = location.pathname;
      safe.page_location = location.origin + location.pathname;
      safe.page_referrer = "";
      queue("event", name, safe);
    };
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    tag.referrerPolicy = "origin";
    document.head.appendChild(tag);
  }

  function apply(value) {
    consented = value === "accepted";
    window["ga-disable-" + measurementId] = !consented;
    if (consented) start();
    else {
      // Reload after revocation to unload Google's timers as well as click tracking.
      ["_ga", "_ga_8K1PDWVWJL"].forEach((name) => {
        document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax; Secure";
      });
    }
  }
  panel.querySelectorAll("button[data-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.getAttribute("data-choice");
      const wasStarted = started;
      let saved = false;
      try {
        localStorage.setItem(storageKey, JSON.stringify({ value, time: Date.now() }));
        saved = true;
      } catch (_) {
        if (value === "rejected") {
          try { localStorage.removeItem(storageKey); saved = true; } catch (_) {}
        }
      }
      apply(value);
      panel.hidden = true;
      settings.focus({ preventScroll: true });
      if (wasStarted && value === "rejected" && saved) location.reload();
    });
  });
  window.addEventListener("storage", (event) => {
    if (event.key === storageKey) location.reload();
  });
  apply(choice);
})();

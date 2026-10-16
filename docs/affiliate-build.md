# Approved Affiliate Links

`affiliate-slots.json` is the source of truth. Use only a creative retrieved from
the approved program for the registered site. Pending programs stay as ordinary
official links. Do not use affiliate links for test purchases or self-referrals.

After changing approvals, creative URLs, CTA text, or placement HTML, run:

```powershell
python scripts/build-affiliates.py
python scripts/check-affiliates.py
node scripts/check-affiliate-events.cjs
python scripts/check-sites.py
node scripts/check-consent.cjs
```

Commit and deploy both the configuration and generated HTML together. The builder
preserves the original official URL and label, restores them if approval is
removed, and emits the supplied impression pixel next to the link. It is
idempotent. Cached HTML still needs its normal cache lifetime to expire.

Static approved URLs work without JavaScript or before configuration fetch
completion. The runtime still refreshes the configuration and registers the
appropriate consent-gated click event. Loader version 2 recognizes static
approved links even if the JSON fetch fails; no extra pixel is inserted when the
HTML already contains the matching slot pixel. Verify links by inspecting their
destinations, never by clicking your own ads.

The Japanese web font uses `font-display: optional`: slow first visits retain
the device font instead of shifting paragraphs when the web font arrives late.
This is a readability/stability tradeoff, not a guarantee of a speed score.

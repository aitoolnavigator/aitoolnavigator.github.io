# Acquisition Experiment: Useful Profile Tool

## Diagnosis

On October 16 the URL Inspection tool reported the Bridalnet trial article was
unknown to Google, with no previous crawl or referring sitemap/page. A live
test said it could be indexed. An indexing request then succeeded and entered
the priority crawl queue. This is not proof of indexing or ranking.

GA4 home showed zero in both the last-seven-days and today views. The property
was set up recently, reports can lag, and collection is opt-in. Do not equate
this with a measured zero across all visits. Search Console is the source for
search impressions/clicks; GA4 only describes the consented subset. Referrer
URLs are suppressed by design, so untagged referrals/organic traffic may appear
as direct in GA4. Do not infer organic performance from that channel alone.

## Narrow Focus

The currently approved new-theme offer is Bridalnet. Prioritize one useful
dating acquisition asset rather than publishing many near-duplicate pages.
The new profile-builder page is a working, no-registration Japanese draft
tool, with editable results, a privacy-safe copy/share flow, real examples,
public-use checks and internal links to the existing service decision guides.

Intended queries are hypotheses, not verified search volumes:

- 婚活 プロフィール 作成 無料
- 婚活 自己紹介文 メーカー
- 婚活 プロフィール 趣味 例文

The builder and the existing profile guide serve different needs: create a
draft versus understand the writing/research. Do not clone them into dozens of
age/region/gender keyword pages.

## Distribution

- Homepage: prominent free-tool entry and main editorial feature.
- Existing profile article: contextual link before the comic.
- Sitemap/RSS: tool URL included; modification dates reflect real edits.
- Public GitHub README: useful project introduction and tracked tool link.
- Share button: copies a fixed social campaign URL, never profile content.
- External SNS posting awaits the user's designated account. No unrelated
  account, unsolicited bulk message, purchased backlink, traffic bot or
  fabricated testimonial should be used.

Fixed approved campaign values are `social / organic / first_decision` and
`github / referral / first_decision`; content includes `profile_builder`.
Arbitrary query values and visitor input are not sent. Analytics still needs
opt-in, and consent withdrawal behavior is unchanged.

## Review

1. Confirm indexing requests succeed, then wait for actual crawl/index status.
   Repeated requests do not accelerate crawling.
2. After data becomes available, compare indexed URLs, impressions, query
   relevance and genuine search clicks before changing headlines again.
3. Record actual external posts and links, then inspect their fixed campaigns.
   Agent testing is not acquired traffic.
4. Review tool completion qualitatively without collecting typed profiles.
   No registration/affiliate click may be fabricated for measurement.
5. Improve the page serving observed queries before expanding to more pages.

No ranking, traffic or revenue outcome is guaranteed. No paid acquisition or
new subscription is part of this experiment.

Sources:
- https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl
- https://developers.google.com/search/docs/essentials/spam-policies
- https://support.google.com/analytics/answer/11198161

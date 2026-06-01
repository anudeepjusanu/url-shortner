// Conversion tracking — fires GTM dataLayer + TikTok + Twitter/X on key user actions.
// Twitter event IDs below use the format tw-rc1pg-<name>; replace the suffix with
// the actual event IDs from your Twitter Ads dashboard if you create dedicated events.

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
    twq: (...args: unknown[]) => void;
    ttq: { track: (event: string, params?: Record<string, unknown>) => void };
  }
}

export type ConversionEvent =
  | 'landing_shorten'
  | 'dashboard_shorten'
  | 'mylinks_shorten'
  | 'bulk_shorten'
  | 'qr_created'
  | 'bio_published';

const TWITTER_IDS: Record<ConversionEvent, string> = {
  landing_shorten:   'tw-rc1pg-landing_shorten',
  dashboard_shorten: 'tw-rc1pg-dashboard_shorten',
  mylinks_shorten:   'tw-rc1pg-mylinks_shorten',
  bulk_shorten:      'tw-rc1pg-bulk_shorten',
  qr_created:        'tw-rc1pg-qr_created',
  bio_published:     'tw-rc1pg-bio_published',
};

export function fireConversion(
  event: ConversionEvent,
  params?: Record<string, unknown>
): void {
  const eventName = `conversion_${event}`;

  // Google Tag Manager
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: eventName, ...params });
  } catch (_) { /* noop */ }

  // Twitter / X
  try {
    if (typeof window.twq === 'function') {
      window.twq('event', TWITTER_IDS[event], params ?? {});
    }
  } catch (_) { /* noop */ }

  // TikTok
  try {
    if (typeof window.ttq?.track === 'function') {
      window.ttq.track('SubmitForm', { event_id: eventName, ...params });
    }
  } catch (_) { /* noop */ }
}

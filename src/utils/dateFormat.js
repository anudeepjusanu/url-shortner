// Formats dates in Saudi Arabia Standard Time (UTC+3) regardless of the
// server's OS timezone. Plain Date-to-string coercion (template literals,
// String(date), date.toString()) uses the server's local timezone, which on
// this project's production host resolves to China Standard Time — hence the
// need to always format explicitly with a fixed IANA zone here.
const SAUDI_TIMEZONE = 'Asia/Riyadh';

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: SAUDI_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: SAUDI_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const formatSaudiDateTime = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const parts = dateTimeFormatter.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} SAST`;
};

const formatSaudiDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const parts = dateFormatter.formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
};

module.exports = { SAUDI_TIMEZONE, formatSaudiDateTime, formatSaudiDate };

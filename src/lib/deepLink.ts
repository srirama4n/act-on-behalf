/** Map wf:// deep links to in-app routes. */
export function routeFromDeepLink(deepLink: string): string | null {
  try {
    const url = new URL(deepLink);
    if (url.protocol !== 'wf:') return null;
    const parts = url.pathname.replace(/^\/+/, '').split('/');
    // wf://fargo/approvals/apr_311 → host fargo, path approvals/apr_311
    const segs =
      url.hostname === 'fargo'
        ? parts
        : [url.hostname, ...parts].filter(Boolean);
    if (segs[0] === 'approvals' && segs[1]) return `/approvals/${segs[1]}`;
    if (segs[0] === 'agents' && segs[1]) return `/agents/${segs[1]}`;
    if (segs[0] === 'activity') return '/activity';
    return null;
  } catch {
    return null;
  }
}

export function modeLabel(mode: 'ask' | 'act_then_tell' | 'read'): string {
  if (mode === 'ask') return 'Asks before acting';
  if (mode === 'act_then_tell') return 'Acts, then tells you';
  return 'Read only';
}

export function formatExpiresIn(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 1) return `Expires in ${h} h`;
  return `Expires in ${m} min`;
}

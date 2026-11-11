export const FRAME_MESSAGES = {
  theme: 'ops-dashboard-theme', filter: 'ops-dashboard-filter', resize: 'ops-dashboard-resize',
};
/** The only inbound message listener for a static dashboard. */
export function attachHostBridge(handlers, lifecycle, parentOnly = false) {
  return lifecycle.listen(window, 'message', event => {
    if (event.origin !== window.location.origin || (parentOnly && event.source !== window.parent)) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;
    if (data.type === FRAME_MESSAGES.theme && data.theme) handlers.onTheme?.(data.theme);
    if (data.type === FRAME_MESSAGES.filter) handlers.onFilter?.(data);
    if ([FRAME_MESSAGES.theme, FRAME_MESSAGES.filter, FRAME_MESSAGES.resize].includes(data.type)) handlers.onResize?.();
  });
}

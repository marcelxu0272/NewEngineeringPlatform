/** Per-page ownership for persistent listeners, observers, requests and chart cleanup. */
export function createLifecycle() {
  const cleanups = [], timers = new Set(), frames = new Set(), requests = new Set();
  let disposed = false;
  const api = {
    get disposed() { return disposed; },
    listen(target, type, listener, options) {
      if (disposed) return () => {};
      target.addEventListener(type, listener, options);
      const off = () => target.removeEventListener(type, listener, options);
      cleanups.push(off); return off;
    },
    property(target, name, value) {
      const old = target[name]; target[name] = value;
      cleanups.push(() => { if (target[name] === value) target[name] = old; });
      return value;
    },
    observe(callback) {
      const observer = new ResizeObserver((...args) => { if (!disposed) callback(...args); });
      cleanups.push(() => observer.disconnect()); return observer;
    },
    timeout(callback, delay) {
      if (disposed) return 0;
      const id = setTimeout(() => { timers.delete(id); if (!disposed) callback(); }, delay);
      timers.add(id); return id;
    },
    clearTimeout(id) { clearTimeout(id); timers.delete(id); },
    frame(callback) {
      if (disposed) return 0;
      const id = requestAnimationFrame(time => { frames.delete(id); if (!disposed) callback(time); });
      frames.add(id); return id;
    },
    cancelFrame(id) { cancelAnimationFrame(id); frames.delete(id); },
    async fetch(url, options = {}) {
      if (disposed) throw new DOMException('Page disposed', 'AbortError');
      const controller = new AbortController(); requests.add(controller);
      try { return await fetch(url, { ...options, signal: controller.signal }); }
      catch (error) { requests.delete(controller); throw error; }
    },
    onDispose(cleanup) { cleanups.push(cleanup); },
    dispose() {
      if (disposed) return;
      disposed = true;
      timers.forEach(clearTimeout); frames.forEach(cancelAnimationFrame); requests.forEach(controller => controller.abort());
      for (const cleanup of cleanups.splice(0).reverse()) cleanup();
      timers.clear(); frames.clear(); requests.clear();
    },
  };
  api.listen(window, 'pagehide', event => { if (!event.persisted) api.dispose(); });
  return api;
}

/** Remove only RescueSync's offline worker and asset caches from a development origin. */
export async function retireDevelopmentWorker(): Promise<boolean> {
  const scriptUrl = new URL("/sw.js", window.location.origin).href;
  const wasControlled = navigator.serviceWorker.controller?.scriptURL === scriptUrl;
  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) =>
        [registration.active, registration.waiting, registration.installing].some(
          (worker) => worker?.scriptURL === scriptUrl,
        ),
      )
      .map((registration) => registration.unregister()),
  );
  if ("caches" in window) {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((key) => key.startsWith("rescuesync-shell-")).map((key) => caches.delete(key)),
    );
  }
  return wasControlled;
}

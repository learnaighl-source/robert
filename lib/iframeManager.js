// Iframe-specific utilities to prevent hydration issues
export class IframeManager {
  static disableCache() {
    // Prevent Next.js from caching in iframe
    if (typeof window !== 'undefined') {
      // Disable service worker caching
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }

      // Add cache-busting meta tags
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Cache-Control';
      meta.content = 'no-cache, no-store, must-revalidate';
      document.head.appendChild(meta);

      const pragma = document.createElement('meta');
      pragma.httpEquiv = 'Pragma';
      pragma.content = 'no-cache';
      document.head.appendChild(pragma);

      const expires = document.createElement('meta');
      expires.httpEquiv = 'Expires';
      expires.content = '0';
      document.head.appendChild(expires);
    }
  }

  static preventHydrationMismatch() {
    if (typeof window !== 'undefined') {
      // Clear any existing React state
      window.__NEXT_DATA__ = undefined;
      
      // Force DOM cleanup
      const scripts = document.querySelectorAll('script[data-next-page]');
      scripts.forEach(script => script.remove());
      
      // Remove stale React roots
      const reactRoots = document.querySelectorAll('[data-reactroot]');
      reactRoots.forEach(root => root.removeAttribute('data-reactroot'));
    }
  }

  static forceReload() {
    if (typeof window !== 'undefined') {
      // Clear all caches
      this.disableCache();
      this.preventHydrationMismatch();
      
      // Force page reload with cache bypass
      window.location.reload(true);
    }
  }

  static isInIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }
}

export default IframeManager;
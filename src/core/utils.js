/**
 * Load script dynamically
 * @param {string} src - Script URL
 * @param {Object} options - Options
 * @returns {Promise} Promise
 */
export function loadScript(src, options = {}) {
    return new Promise((resolve, reject) => {
        // Check if script already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.setAttribute("data-ad-client", options.pubId);
        script.setAttribute("data-ad-frequency-hint", options.hint);

        if (options.crossOrigin) {
            script.setAttribute("crossorigin", options.crossOrigin);
        }

        script.onload = () => {
            resolve();
        };

        script.onerror = () => {
            reject(new Error(`Script load failed: ${src}`));
        };

        document.head.appendChild(script);
    });
}

/**
 * Load stylesheet dynamically
 * @param {string} href - Stylesheet URL
 * @returns {Promise} Promise
 */
export function loadStylesheet(href) {
    return new Promise((resolve, reject) => {
        const existingLink = document.querySelector(`link[href="${href}"]`);
        if (existingLink) {
            resolve();
            return;
        }

        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;

        link.onload = () => {
            resolve();
        };

        link.onerror = () => {
            reject(new Error(`Stylesheet load failed: ${href}`));
        };

        document.head.appendChild(link);
    });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time (ms)
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit (ms)
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Lazy load ad (using Intersection Observer)
 * @param {HTMLElement} element - Ad element
 * @param {Function} loadCallback - Load callback
 * @param {Object} options - Options
 * @param {number} options.rootMargin - Root margin (default: '50px')
 * @returns {IntersectionObserver} Observer instance
 */
export function lazyLoadAd(element, loadCallback, options = {}) {
    const { rootMargin = "50px" } = options;

    // Check if Intersection Observer supported
    if (!window.IntersectionObserver) {
        // Load immediately if not supported
        loadCallback();
        return null;
    }

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    loadCallback();
                    observer.unobserve(element);
                }
            });
        },
        {
            rootMargin,
            threshold: 0.01,
        }
    );

    observer.observe(element);
    return observer;
}

/**
 * Setup ad auto refresh
 * @param {Function} refreshCallback - Refresh callback
 * @param {number} intervalSeconds - Refresh interval (seconds)
 * @returns {number} Timer ID
 */
export function setAutoRefresh(refreshCallback, intervalSeconds) {
    if (intervalSeconds <= 0) {
        return null;
    }

    const intervalMs = intervalSeconds * 1000;
    return setInterval(() => {
        try {
            refreshCallback();
        } catch (error) {
            console.error("Ad auto refresh failed:", error);
        }
    }, intervalMs);
}

/**
 * Clear auto refresh timer
 * @param {number} timerId - Timer ID
 */
export function clearAutoRefresh(timerId) {
    if (timerId) {
        clearInterval(timerId);
    }
}

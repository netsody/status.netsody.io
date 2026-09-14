/**
 * Custom JS for status.netsody.io
 *
 * Mobile navigation for the Upptime status page. Upptime renders the nav
 * itself (logo + inline link list), so the burger menu is added from here:
 * at 960px and below the link list is styled as a panel under the bar and
 * this script injects the button that reveals it, mirroring the netsody.io
 * header. There is intentionally no markup in the SSR HTML; without JS the
 * bar shows the logo only, like netsody.io's no-JS state.
 *
 * Upptime's Nav component re-renders on client-side route changes (it
 * updates the current-page marker), and Sapper's initial hydration may
 * re-claim or replace nodes. Everything here is therefore set up
 * idempotently and re-applied by a MutationObserver whenever the nav
 * changes underneath us.
 */
(function () {
    "use strict";

    var LIST_ID = "netsody-nav-menu";
    // Kept in sync with the `@media (max-width: 960px)` block in custom.css.
    var MEDIA_QUERY = "(max-width: 960px)";

    function findNavParts() {
        var nav = document.querySelector("nav");
        if (!nav) {
            return null;
        }

        var container = nav.querySelector(":scope > .container");
        if (!container) {
            return null;
        }

        var list = container.querySelector(":scope > ul");
        if (!list) {
            return null;
        }

        return { nav: nav, container: container, list: list };
    }

    function findToggle(container) {
        return container.querySelector(":scope > .nav-menu-toggle");
    }

    function isOpen(toggle) {
        return toggle && toggle.getAttribute("aria-expanded") === "true";
    }

    function ifMenuOpen(fn) {
        var parts = findNavParts();
        var toggle = parts && findToggle(parts.container);

        if (isOpen(toggle)) {
            fn(parts, toggle);
        }
    }

    function setOpen(open) {
        var parts = findNavParts();
        if (!parts) {
            return;
        }

        var toggle = findToggle(parts.container);
        if (!toggle) {
            return;
        }

        toggle.setAttribute("aria-expanded", open ? "true" : "false");

        if (open) {
            parts.list.setAttribute("data-open", "");
        } else {
            parts.list.removeAttribute("data-open");
        }
    }

    function createToggle(container) {
        var toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "nav-menu-toggle";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-controls", LIST_ID);
        toggle.setAttribute("aria-label", "Toggle navigation");

        for (var i = 0; i < 3; i++) {
            var line = document.createElement("span");
            line.className = "nav-menu-toggle-line";
            line.setAttribute("aria-hidden", "true");
            toggle.appendChild(line);
        }

        toggle.addEventListener("click", function () {
            setOpen(!isOpen(toggle));
        });

        container.appendChild(toggle);
        return toggle;
    }

    /**
     * Make sure the nav carries everything the menu needs: the list's stable
     * id (referenced by the button's aria-controls) and the toggle button
     * itself. Recreates whatever a re-render dropped; a nav that was replaced
     * wholesale comes back in the closed state.
     */
    function setupNav() {
        var parts = findNavParts();
        if (!parts) {
            return;
        }

        if (parts.list.id !== LIST_ID) {
            parts.list.id = LIST_ID;
        }

        var toggle = findToggle(parts.container) || createToggle(parts.container);

        if (toggle.getAttribute("aria-controls") !== LIST_ID) {
            toggle.setAttribute("aria-controls", LIST_ID);
        }
    }

    function start() {
        setupNav();

        document.addEventListener("keydown", function (event) {
            if (event.key !== "Escape") {
                return;
            }

            ifMenuOpen(function (parts, toggle) {
                setOpen(false);

                if (parts.list.contains(document.activeElement)) {
                    toggle.focus();
                }
            });
        });

        document.addEventListener("click", function (event) {
            // The [data-open] selector only matches while the panel is open.
            var link = event.target.closest
                ? event.target.closest("nav ul[data-open] a")
                : null;

            if (link) {
                setOpen(false);
            }
        });

        var mediaQueryList = window.matchMedia(MEDIA_QUERY);
        var onBreakpointChange = function (event) {
            if (!event.matches) {
                setOpen(false);
            }
        };

        if (typeof mediaQueryList.addEventListener === "function") {
            mediaQueryList.addEventListener("change", onBreakpointChange);
        } else if (typeof mediaQueryList.addListener === "function") {
            mediaQueryList.addListener(onBreakpointChange);
        }

        var setupScheduled = false;
        var observer = new MutationObserver(function () {
            if (setupScheduled) {
                return;
            }
            setupScheduled = true;
            Promise.resolve().then(function () {
                setupScheduled = false;
                setupNav();
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
        start();
    }
})();

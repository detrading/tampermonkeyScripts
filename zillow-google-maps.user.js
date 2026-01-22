// ==UserScript==
// @name         Zillow Addresses → Google Maps Links (Search + Details)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Adds Google Maps link on/after addresses in Zillow search/map cards and makes detail page address clickable
// @author       You
// @match        https://www.zillow.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const observer = new MutationObserver(() => {
        addLinks();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    addLinks(); // Initial run

    function addLinks() {
        // --- For SEARCH/MAP Results (property cards) ---
        const cardAddressSelectors = [
            'address[data-test="property-card-addr"]',           // Common in cards
            '[data-test="property-card-addr"]',
            'article[data-testid="property-card"] address',
            '.StyledPropertyCardDataArea-address',               // Class variant
            'a.property-card-link address'                       // From your screenshot
        ];

        document.querySelectorAll(cardAddressSelectors.join(', ')).forEach(addrEl => {
            if (addrEl.dataset.gmapsAdded) return; // Skip if already processed
            addrEl.dataset.gmapsAdded = 'true';

            const addressText = addrEl.textContent.trim();
            if (!addressText || addressText.length < 8) return;

            const encoded = encodeURIComponent(addressText);
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

            const mapsLink = document.createElement('a');
            mapsLink.href = mapsUrl;
            mapsLink.textContent = ' [Google Maps]';
            mapsLink.target = '_blank';
            mapsLink.rel = 'noopener noreferrer';
            //mapsLink.style.cssText = 'font-size: 2em; color: #1a73e8; background-color: hotpink; margin-left: 6px; text-decoration: underline; vertical-align: baseline;';

            // Insert right after the address text
            addrEl.parentNode.insertBefore(mapsLink, addrEl.nextSibling);
        });

        // --- For DETAILS Page (main address heading) ---
        const detailSelectors = [
            'h1[data-testid="ds-address"]',
            'h1[itemprop="name"]',
            '.ds-address-container h1',
            'h1:not([class*="price"]):not([class*="beds"])'
        ];

        const detailAddr = document.querySelector(detailSelectors.join(', '));
        if (detailAddr && !detailAddr.dataset.gmapsAdded) {
            detailAddr.dataset.gmapsAdded = 'true';

            const fullText = detailAddr.textContent.trim();
            const encodedDetail = encodeURIComponent(fullText);
            const detailMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDetail}`;

            // Make entire address clickable
            if (!detailAddr.querySelector('a')) {
                const wrapper = document.createElement('a');
                wrapper.href = detailMapsUrl;
                wrapper.target = '_blank';
                wrapper.rel = 'noopener noreferrer';
                wrapper.style.cssText = 'color: purple; text-decoration: none; background-color: yellow; font-size: 1.5em; margin-top:20px; ';
                wrapper.title = 'Open in Google Maps';

                while (detailAddr.firstChild) {
                    wrapper.appendChild(detailAddr.firstChild);
                }
                detailAddr.appendChild(wrapper);

                detailAddr.style.cursor = 'pointer';
                detailAddr.addEventListener('mouseover', () => { detailAddr.style.textDecoration = 'underline'; });
                detailAddr.addEventListener('mouseout', () => { detailAddr.style.textDecoration = 'none'; });
            }
        }
    }
})();

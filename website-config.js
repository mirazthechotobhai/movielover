/*
 * GoToCinema website name and logo settings.
 *
 * Edit only the values below, then upload this file with index.html.
 * No index.html edit is needed.
 */
(function (window, document) {
  'use strict';

  window.GTC_WEBSITE_CONFIG = {
    siteName: 'GoToCinema',
    pageTitle: 'Go To Cinema - Watch Movies, TV Shows & Anime',
    logoText: 'GOTO CINEMA',
    logoImageUrl: 'logo-icon.png',
    logoImageAlt: 'GoToCinema logo'
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderBrand(element) {
    var config = window.GTC_WEBSITE_CONFIG;
    var imageUrl = String(config.logoImageUrl || '').trim();
    var logoImage = imageUrl
      ? '<img class="gtc-config-logo-img" src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(config.logoImageAlt || config.siteName) + '">'
      : '';
    element.innerHTML = logoImage + '<span class="gtc-config-logo-text">' + escapeHtml(config.logoText || config.siteName) + '</span>';
  }

  function applyWebsiteConfig() {
    var config = window.GTC_WEBSITE_CONFIG;
    if (config.pageTitle) document.title = config.pageTitle;
    document.querySelectorAll('[data-gtc-brand]').forEach(renderBrand);
    document.querySelectorAll('[data-gtc-brand-name]').forEach(function (element) {
      element.textContent = config.siteName || config.logoText || '';
    });
  }

  window.GTC_WEBSITE_CONFIG.apply = applyWebsiteConfig;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyWebsiteConfig, { once: true });
  } else {
    applyWebsiteConfig();
  }
})(window, document);
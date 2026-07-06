import { readBlockConfig, decorateIcons } from '../../scripts/lib-franklin.js';

/**
 * Normalizes malformed anchor hrefs to origin-relative paths.
 * Authoring tools can emit host-less absolute URLs like "http:///us/en/x",
 * which browsers resolve to "http://us/en/x" (treating "us" as a host).
 * Rewrites those, and any same-origin absolute URLs, to a clean path.
 * @param {Element} container element containing the anchors
 */
function normalizeLinks(container) {
  container.querySelectorAll('a[href]').forEach((a) => {
    const raw = a.getAttribute('href');
    let path = null;
    const malformed = raw.match(/^https?:\/\/\/(.*)$/); // empty-host absolute
    if (malformed) {
      path = `/${malformed[1]}`;
    } else if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        if (u.hostname === window.location.hostname || u.hostname.endsWith('.aem.live') || u.hostname.endsWith('.aem.page')) {
          path = u.pathname + u.search + u.hash;
        }
      } catch (e) { /* leave as-is */ }
    }
    if (path) a.setAttribute('href', path);
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The header block element
 */

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  const footerPath = cfg.footer || '/footer';
  const resp = await fetch(`${footerPath}.plain.html`);
  const html = await resp.text();
  const footer = document.createElement('div');
  footer.innerHTML = html;
  normalizeLinks(footer);
  await decorateIcons(footer);
  block.append(footer);
}

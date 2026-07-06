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
 * collapses all open nav sections
 * @param {Element} sections The container element
 */

function collapseAllNavSections(sections) {
  sections.querySelectorAll('.nav-sections > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', 'false');
  });
}

/**
 * decorates the header, mainly the nav
 * @param {Element} block The header block element
 */

export default async function decorate(block) {
  const cfg = readBlockConfig(block);
  block.textContent = '';

  // fetch nav content
  const navPath = cfg.nav || '/nav';
  const resp = await fetch(`${navPath}.plain.html`);
  if (resp.ok) {
    const html = await resp.text();

    // decorate nav DOM
    const nav = document.createElement('nav');
    nav.innerHTML = html;
    normalizeLinks(nav);
    decorateIcons(nav);

    const classes = ['brand', 'sections', 'tools'];
    classes.forEach((e, j) => {
      const section = nav.children[j];
      if (section) section.classList.add(`nav-${e}`);
    });

    const navSections = [...nav.children][1];
    if (navSections) {
      navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
        if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
        navSection.addEventListener('click', () => {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          collapseAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        });
      });
    }

    // hamburger for mobile
    const hamburger = document.createElement('div');
    hamburger.classList.add('nav-hamburger');
    hamburger.innerHTML = '<div class="nav-hamburger-icon"></div>';
    hamburger.addEventListener('click', () => {
      const expanded = nav.getAttribute('aria-expanded') === 'true';
      document.body.style.overflowY = expanded ? '' : 'hidden';
      nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    });
    nav.prepend(hamburger);
    nav.setAttribute('aria-expanded', 'false');
    decorateIcons(nav);
    block.append(nav);
  }
}

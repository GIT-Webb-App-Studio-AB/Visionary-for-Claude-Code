/**
 * annotate-runtime.js — injected via Playwright's browser_evaluate to enter
 * annotation mode on a live dev-server page. Used by /annotate command.
 *
 * Sets up window.__visionaryAnnotations__ as the collection.
 * Exits when the user clicks "Done" or clicks "Cancel".
 *
 * Security: no innerHTML — every node is built with createElement +
 * textContent. The toolbar cannot render any user-supplied HTML. User
 * input (the annotation description) is read via window.prompt which
 * returns a plain string and is stored as data, never rendered as HTML.
 */

(() => {
  if (window.__visionaryAnnotationsInstalled__) return;
  window.__visionaryAnnotationsInstalled__ = true;
  window.__visionaryAnnotations__ = [];

  // ── Styles (static CSS, no user input) ────────────────────────────────
  const style = document.createElement('style');
  style.appendChild(document.createTextNode(`
    .__vz-hover__ { outline: 2px dashed #EF4444 !important; outline-offset: 2px !important; cursor: crosshair !important; }
    .__vz-pinned__ { outline: 2px solid #EF4444 !important; outline-offset: 2px !important; }
    #__vz-toolbar__ {
      position: fixed; inset-block-end: 24px; inset-inline-end: 24px;
      z-index: 2147483647; padding: 12px 16px;
      background: #0A0A0A; color: #F5F5F5;
      font: 500 13px ui-sans-serif, system-ui;
      border-radius: 12px; box-shadow: 0 10px 24px rgba(0,0,0,.4);
      display: flex; gap: 8px; align-items: center;
    }
    #__vz-toolbar__ button {
      background: #EF4444; color: white; border: 0;
      padding: 6px 12px; border-radius: 6px; cursor: pointer;
      font: inherit;
    }
    #__vz-toolbar__ .__vz-count { background: #F5F5F5; color: #0A0A0A; padding: 4px 10px; border-radius: 999px; font-weight: 700; }
    .__vz-pin__ {
      position: absolute; pointer-events: none;
      inline-size: 24px; block-size: 24px;
      background: #EF4444; color: white; font-weight: 700;
      border-radius: 50%;
      display: grid; place-items: center; font-size: 12px;
      z-index: 2147483646;
    }
  `));
  document.head.appendChild(style);

  // ── Toolbar (DOM construction, no innerHTML) ──────────────────────────
  const mkEl = (tag, attrs = {}, text = '') => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (text) el.textContent = text;
    return el;
  };

  const toolbar = mkEl('div', { id: '__vz-toolbar__' });
  toolbar.appendChild(mkEl('span', {}, 'Annotate mode'));
  const countSpan = mkEl('span', { id: '__vz-count', class: '__vz-count' }, '0');
  toolbar.appendChild(countSpan);
  const doneBtn = mkEl('button', { id: '__vz-done' }, 'Done');
  const cancelBtn = mkEl('button', { id: '__vz-cancel' }, 'Cancel');
  toolbar.appendChild(doneBtn);
  toolbar.appendChild(cancelBtn);
  document.body.appendChild(toolbar);

  const overlay = mkEl('div');
  overlay.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483645';
  document.body.appendChild(overlay);

  let hovered = null;

  function cssPath(el) {
    if (!(el instanceof Element)) return '';
    const path = [];
    while (el && el.nodeType === 1 && el.tagName !== 'BODY' && path.length < 6) {
      let sel = el.tagName.toLowerCase();
      if (el.id) { sel += '#' + el.id; path.unshift(sel); break; }
      const cls = [...el.classList].filter((c) => !c.startsWith('__vz')).slice(0, 2);
      if (cls.length) sel += '.' + cls.join('.');
      const parent = el.parentElement;
      if (parent) {
        const same = [...parent.children].filter((c) => c.tagName === el.tagName);
        if (same.length > 1) sel += `:nth-of-type(${same.indexOf(el) + 1})`;
      }
      path.unshift(sel);
      el = el.parentElement;
    }
    return path.join(' > ');
  }

  function placePin(el, idx) {
    const rect = el.getBoundingClientRect();
    const pin = mkEl('div', { class: '__vz-pin__' }, String(idx));
    pin.style.inset = `${rect.top + window.scrollY - 12}px auto auto ${rect.left + window.scrollX - 12}px`;
    pin.style.position = 'absolute';
    overlay.appendChild(pin);
  }

  function onMove(e) {
    if (hovered) hovered.classList.remove('__vz-hover__');
    hovered = document.elementFromPoint(e.clientX, e.clientY);
    if (hovered && hovered.id !== '__vz-toolbar__' && !hovered.closest('#__vz-toolbar__')) {
      hovered.classList.add('__vz-hover__');
    } else {
      hovered = null;
    }
  }

  function onClick(e) {
    if (!hovered || hovered.closest('#__vz-toolbar__')) return;
    e.preventDefault();
    e.stopPropagation();
    const target = hovered;
    hovered.classList.remove('__vz-hover__');
    hovered = null;

    // outerHTML is READ, never written. Safe.
    const snippet = (target.outerHTML || '').slice(0, 100);
    const desc = window.prompt(`Describe the change you want:\n\n${snippet}…`, '');
    if (!desc) return;

    const rect = target.getBoundingClientRect();
    const entry = {
      selector: cssPath(target),
      element_html: (target.outerHTML || '').slice(0, 400),
      description: desc.trim(),
      bbox: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        w: Math.round(rect.width),
        h: Math.round(rect.height),
      },
    };
    window.__visionaryAnnotations__.push(entry);
    target.classList.add('__vz-pinned__');
    placePin(target, window.__visionaryAnnotations__.length);
    countSpan.textContent = String(window.__visionaryAnnotations__.length);
  }

  function tearDown(canceled) {
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    toolbar.remove();
    overlay.remove();
    style.remove();
    document.querySelectorAll('.__vz-hover__, .__vz-pinned__').forEach((el) => {
      el.classList.remove('__vz-hover__', '__vz-pinned__');
    });
    if (canceled) window.__visionaryAnnotations__ = [];
    window.__visionaryAnnotationsInstalled__ = false;
  }

  document.addEventListener('mousemove', onMove, true);
  document.addEventListener('click', onClick, true);

  return new Promise((resolve) => {
    doneBtn.addEventListener('click', () => { tearDown(false); resolve(window.__visionaryAnnotations__); });
    cancelBtn.addEventListener('click', () => { tearDown(true); resolve([]); });
  });
})();

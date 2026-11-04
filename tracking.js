/* Skenderovski Marine — cookie consent, GA4 + Meta Pixel, conversion events.
   Loaded in <head> on every page. Nothing is sent to Google or Meta until the visitor accepts.
   Debug: add ?sm_debug=1 to any URL to log events to the console and to GA4 DebugView. */
(function () {
  'use strict';

  var GA_ID = 'G-PS0SDX3FHJ';
  var PIXEL_ID = '584480777834021';
  var CONSENT_KEY = 'sm-consent';
  var CONSENT_VERSION = 1;
  var ATTR_KEY = 'sm-attr';
  var DEBUG = /[?&]sm_debug=1/.test(location.search);

  var BRANDS = { sr: 'Sea Ray', jn: 'Jeanneau' };
  var LISTS = {
    'camci': 'Boats',
    'nasa-ponuda': 'Brand picker',
    'brendovi': 'Brands',
    'sea-ray-lager': 'Sea Ray stock',
    'jeanneau-lager': 'Jeanneau stock',
    'marine-lager': 'Marine Aluminium boats',
    'mercury-lager': 'Mercury engines',
    'vesta-lager': 'Vesta trailers',
    'oprema': 'Engines & equipment',
    'jobe': 'Jobe Watersports'
  };
  var CONTACT_EVENTS = { phone: 'click_to_call', whatsapp: 'click_whatsapp', email: 'click_email' };

  var TEXT = {
    mk: {
      title: 'Колачиња',
      body: 'Користиме колачиња за аналитика (Google Analytics) и маркетинг (Meta) за да ја подобриме страницата и да ви прикажеме релевантни понуди. Ги поставуваме само ако се согласите.',
      accept: 'Прифати', decline: 'Одбиј', settings: 'Поставки за колачиња',
      error: 'Пораката не е испратена. Обидете се повторно или јавете се на +389 2 2780 090.'
    },
    en: {
      title: 'Cookies',
      body: 'We use cookies for analytics (Google Analytics) and marketing (Meta) to improve this website and show you relevant offers. We only set them if you agree.',
      accept: 'Accept', decline: 'Decline', settings: 'Cookie settings',
      error: 'Your message could not be sent. Please try again or call +389 2 2780 090.'
    },
    sq: {
      title: 'Cookies',
      body: 'Përdorim cookies për analitikë (Google Analytics) dhe marketing (Meta) për të përmirësuar faqen dhe për t’ju shfaqur oferta të përshtatshme. I vendosim vetëm nëse pajtoheni.',
      accept: 'Prano', decline: 'Refuzo', settings: 'Cilësimet e cookies',
      error: 'Mesazhi nuk u dërgua. Provoni përsëri ose telefononi +389 2 2780 090.'
    }
  };

  /* ── Storage (can throw in private mode / blocked storage) ── */
  function getItem(kind, key) { try { return window[kind].getItem(key); } catch (e) { return null; } }
  function setItem(kind, key, val) { try { window[kind].setItem(key, val); } catch (e) {} }
  function lang() { var l = getItem('localStorage', 'sm-lang') || document.documentElement.lang || 'mk'; return TEXT[l] ? l : 'mk'; }

  function readConsent() {
    try {
      var c = JSON.parse(getItem('localStorage', CONSENT_KEY));
      return c && c.v === CONSENT_VERSION ? c.state : null;
    } catch (e) { return null; }
  }
  var consent = readConsent();

  /* ── Page context ── */
  var slug = (location.pathname.split('/').pop() || '').replace(/\.html?$/, '') || 'index';
  var pageItem = null;
  if (/^boat-/.test(slug)) {
    var parts = document.title.split(' — ');
    pageItem = {
      item_id: slug,
      item_name: parts[0],
      item_brand: BRANDS[slug.split('-')[1]] || '',
      item_category: 'Boats',
      item_variant: parts.length > 2 ? parts[1] : ''
    };
  }
  var modalItem = null;

  function pageType() {
    if (pageItem) return 'product';
    if (LISTS[slug]) return 'listing';
    return slug === 'index' ? 'home' : 'other';
  }

  /* ── Attribution: kept for the session so it can be attached to enquiries ── */
  var urlAttr = (function () {
    var a = {}, p;
    try { p = new URLSearchParams(location.search); } catch (e) { return a; }
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'].forEach(function (k) {
      var v = p.get(k);
      if (v) a[k] = v.slice(0, 100);
    });
    var ref = '';
    try { ref = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) {}
    if (ref && ref !== location.hostname) a.referrer = ref;
    if (Object.keys(a).length) a.landing_page = slug;
    return a;
  })();

  function attribution() {
    if (urlAttr.landing_page) return urlAttr;
    try { return JSON.parse(getItem('sessionStorage', ATTR_KEY)) || {}; } catch (e) { return {}; }
  }
  function persistAttribution() {
    if (consent === 'granted' && urlAttr.landing_page) setItem('sessionStorage', ATTR_KEY, JSON.stringify(urlAttr));
  }
  function describeAttribution(a) {
    if (a.utm_source) return [a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(' / ');
    if (a.gclid) return 'google / cpc';
    if (a.fbclid) return 'facebook / referral';
    if (a.referrer) return a.referrer + ' / referral';
    return '';
  }

  /* ── GA4 + Meta Pixel, loaded only after consent ── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });

  var started = false, pending = [];

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    document.head.appendChild(s);
  }

  function start() {
    if (started) return;
    started = true;
    gtag('consent', 'update', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', GA_ID, DEBUG ? { debug_mode: true } : {});
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);

    var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    flush();
  }

  function flush() {
    while (pending.length) {
      var e = pending.shift();
      if (e[0]) gtag('event', e[0], e[1]);
      if (e[2]) window.fbq('track', e[2], e[3] || {});
    }
  }

  // One call per user action: GA4 event and its Meta equivalent are sent together, never twice.
  function track(gaName, gaParams, fbName, fbParams) {
    gaParams = gaParams || {};
    gaParams.page_type = pageType();
    if (DEBUG) console.log('[sm-track]', gaName, gaParams, fbName || '', fbParams || '');
    pending.push([gaName, gaParams, fbName, fbParams]);
    if (started) flush();
  }

  function fbContent(it) {
    return { content_ids: [it.item_id], content_name: it.item_name, content_category: it.item_category, content_type: 'product' };
  }

  /* ── Page-level events ── */
  if (pageItem) track('view_item', { items: [pageItem] }, 'ViewContent', fbContent(pageItem));
  if (LISTS[slug]) track('view_item_list', { item_list_id: slug, item_list_name: LISTS[slug] });

  // Called by pages that show products in a modal (jobe, mercury, vesta, marine).
  function viewItem(p) {
    modalItem = {
      item_id: String(p.id || p.name),
      item_name: p.name,
      item_brand: p.brand || '',
      item_category: p.category || ''
    };
    if (LISTS[slug]) track('select_item', { item_list_id: slug, item_list_name: LISTS[slug], items: [modalItem] });
    track('view_item', { items: [modalItem] }, 'ViewContent', fbContent(modalItem));
  }

  /* ── Contact clicks ── */
  function productFromLink(href) {
    try {
      var p = new URLSearchParams(href.split('?')[1] || '');
      var text = p.get('text'), subject = p.get('subject');
      if (text) {
        var m = text.match(/(?:\sза|интересира:)\s(.+?)(?:\s*\(|\.(?:\s|$)|$)/);
        if (m) return m[1].trim();
      }
      if (subject) return subject.replace(/^[^:]*:\s*/, '').trim();
    } catch (e) {}
    return '';
  }

  function contactClick(method, href, link) {
    var it = pageItem || (link.closest('[role="dialog"]') ? modalItem : null);
    var name = it ? it.item_name : productFromLink(href);
    var params = { contact_method: method, link_url: href.split('?')[0] };
    if (it) { params.product_id = it.item_id; params.product_brand = it.item_brand; }
    if (name) params.product_name = name;
    track(CONTACT_EVENTS[method], params, 'Contact', { content_name: name, contact_method: method });
  }

  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t.closest && t.closest('[data-consent-open]')) { showBanner(); return; }
    var a = t.closest && t.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    var method = /^tel:/i.test(href) ? 'phone' : /wa\.me\/|whatsapp\.com/i.test(href) ? 'whatsapp' : /^mailto:/i.test(href) ? 'email' : null;
    if (method) { contactClick(method, href, a); return; }
    var m = href.match(/(?:^|\/)(boat-[a-z0-9-]+?)(?:\.html)?(?:[?#]|$)/i);
    if (m && m[1] !== slug) {
      track('select_item', {
        item_list_id: slug,
        item_list_name: LISTS[slug] || slug,
        items: [{ item_id: m[1], item_brand: BRANDS[m[1].split('-')[1]] || '', item_category: 'Boats' }]
      });
    }
  }, true);

  /* ── Scroll depth ── */
  var marks = [25, 50, 75, 100], ticking = false;
  function checkScroll() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (max <= 0) return;
    var pct = (window.scrollY / max) * 100;
    while (marks.length && pct >= marks[0] - 1) track('scroll_depth', { percent_scrolled: marks.shift() });
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(checkScroll); }
  }, { passive: true });

  /* ── Enquiry forms ──
     <form data-sm-form="contact" action="https://formsubmit.co/ADDRESS" method="POST">
     Sent with FormSubmit's AJAX endpoint; the plain POST still works if this script fails to load.
     generate_lead / Lead fire only after FormSubmit confirms delivery. */
  document.addEventListener('submit', function (ev) {
    var form = ev.target;
    if (!form.hasAttribute || !form.hasAttribute('data-sm-form') || !window.fetch) return;
    ev.preventDefault();
    sendForm(form);
  });

  function sendForm(form) {
    var btn = form.querySelector('[type="submit"]');
    var err = form.querySelector('[data-error]');
    if (err) err.style.display = 'none';
    if (btn) btn.disabled = true;

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    var product = data['Производ'] || data['Вид на услуга'] || '';
    var source = describeAttribution(attribution());
    data['Страница'] = location.origin + location.pathname;
    if (source) data['Извор на посета'] = source;

    fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (String(res.success) !== 'true') throw new Error(res.message || 'not sent');
        var formName = form.getAttribute('data-sm-form');
        track('generate_lead', { form_name: formName, product_name: product, traffic_source: source },
              'Lead', { content_name: product, content_category: formName });
        formSucceeded(form);
      })
      .catch(function () {
        if (!err) {
          err = document.createElement('p');
          err.setAttribute('data-error', '');
          err.setAttribute('role', 'alert');
          err.style.cssText = 'margin-top:1rem;font-size:.875rem;font-weight:500;color:#B42318;';
          form.appendChild(err);
        }
        err.textContent = TEXT[lang()].error;
        err.style.display = 'block';
      })
      .then(function () { if (btn) btn.disabled = false; });
  }

  function formSucceeded(form) {
    var target = form.getAttribute('data-sm-success');
    if (target) {
      var box = document.querySelector(target);
      if (box) { box.style.display = 'block'; box.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
      form.style.display = 'none';
      return;
    }
    var ok = form.querySelector('[data-success]'), body = form.querySelector('[data-form]');
    form.reset();
    if (ok) ok.classList.remove('hidden');
    if (body) body.classList.add('hidden');
  }

  /* ── Consent banner ── */
  var banner = null;

  function setConsent(state) {
    var previous = consent;
    consent = state;
    setItem('localStorage', CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, state: state, at: new Date().toISOString() }));
    hideBanner();
    if (state === 'granted') { persistAttribution(); start(); return; }
    if (previous === 'granted') { clearTrackingCookies(); location.reload(); }
  }

  function clearTrackingCookies() {
    var root = location.hostname.replace(/^www\./, '');
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (!/^(_ga|_gid|_gat|_fbp|_fbc)/.test(name)) return;
      ['', '; domain=' + location.hostname, '; domain=.' + root].forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; path=/' + d;
      });
    });
  }

  function injectStyles() {
    var css =
      '.sm-cc{position:fixed;z-index:9999;left:16px;right:16px;bottom:16px;max-width:520px;padding:20px 22px;border-radius:12px;' +
      'background:#0A1622;color:#fff;font-family:Inter,system-ui,sans-serif;font-size:14px;line-height:1.6;' +
      'box-shadow:0 1px 2px rgba(10,22,34,.25),0 12px 24px -8px rgba(10,60,90,.35),0 32px 64px -24px rgba(19,164,216,.28);' +
      'border:1px solid rgba(124,219,245,.14);opacity:0;transform:translateY(16px);' +
      'transition:opacity .45s cubic-bezier(.16,1,.3,1),transform .45s cubic-bezier(.16,1,.3,1);}' +
      '.sm-cc.sm-cc-in{opacity:1;transform:none;}' +
      '@media(min-width:640px){.sm-cc{left:24px;right:auto;bottom:24px;}}' +
      '.sm-cc h2{margin:0 0 6px;font-family:Oswald,Inter,sans-serif;font-weight:600;font-size:17px;letter-spacing:.01em;}' +
      '.sm-cc p{margin:0;color:rgba(255,255,255,.72);}' +
      '.sm-cc-row{display:flex;gap:10px;margin-top:16px;}' +
      '.sm-cc button{flex:1;cursor:pointer;font:600 14px/1 Inter,system-ui,sans-serif;padding:12px 16px;border-radius:8px;' +
      'transition:transform .25s cubic-bezier(.34,1.56,.64,1),opacity .2s ease;}' +
      '.sm-cc button:hover{transform:translateY(-1px);opacity:.92;}' +
      '.sm-cc button:active{transform:scale(.97);}' +
      '.sm-cc button:focus-visible,.sm-cc-link:focus-visible{outline:2px solid #7CDBF5;outline-offset:2px;}' +
      '.sm-cc-accept{background:#13A4D8;color:#fff;border:1px solid #13A4D8;}' +
      '.sm-cc-decline{background:transparent;color:#fff;border:1px solid rgba(255,255,255,.35);}' +
      '.sm-cc-foot{text-align:center;padding:0 16px 20px;}' +
      '.sm-cc-link{background:none;border:0;cursor:pointer;color:inherit;opacity:.55;font:12px Inter,system-ui,sans-serif;' +
      'text-decoration:underline;text-underline-offset:3px;padding:4px;transition:opacity .2s ease;}' +
      '.sm-cc-link:hover{opacity:.85;}.sm-cc-link:active{opacity:1;}' +
      '@media(prefers-reduced-motion:reduce){.sm-cc,.sm-cc button{transition:none;}}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function showBanner() {
    if (banner) return;
    var t = TEXT[lang()];
    banner = document.createElement('div');
    banner.className = 'sm-cc';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', t.title);
    banner.innerHTML = '<h2></h2><p></p><div class="sm-cc-row">' +
      '<button type="button" class="sm-cc-decline"></button><button type="button" class="sm-cc-accept"></button></div>';
    banner.querySelector('h2').textContent = t.title;
    banner.querySelector('p').textContent = t.body;
    banner.querySelector('.sm-cc-decline').textContent = t.decline;
    banner.querySelector('.sm-cc-accept').textContent = t.accept;
    banner.querySelector('.sm-cc-decline').addEventListener('click', function () { setConsent('denied'); });
    banner.querySelector('.sm-cc-accept').addEventListener('click', function () { setConsent('granted'); });
    document.body.appendChild(banner);
    requestAnimationFrame(function () { requestAnimationFrame(function () { banner.classList.add('sm-cc-in'); }); });
  }

  function hideBanner() {
    if (!banner) return;
    var b = banner;
    banner = null;
    b.classList.remove('sm-cc-in');
    setTimeout(function () { b.remove(); }, 450);
  }

  function addSettingsLink() {
    var host = document.querySelector('footer') || document.body;
    var wrap = document.createElement('div');
    wrap.className = 'sm-cc-foot';
    wrap.innerHTML = '<button type="button" class="sm-cc-link" data-consent-open></button>';
    wrap.firstChild.textContent = TEXT[lang()].settings;
    host.appendChild(wrap);
  }

  if (consent === 'granted') { persistAttribution(); start(); }

  function onReady() {
    injectStyles();
    addSettingsLink();
    if (!consent) showBanner();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady);
  else onReady();

  window.smTrack = { viewItem: viewItem, openConsent: showBanner };
})();

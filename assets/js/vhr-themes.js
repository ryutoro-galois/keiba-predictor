/* Visual Horse Racing — design switcher for archive pages.
   Load in <head> (not deferred) so the saved design applies before first paint.
   Shares the "vhr-theme" choice with the top page. */
(function () {
  var NAMES = ['modern', 'warm', 'ocean'];
  var LABELS = { modern: 'モダン', warm: 'ぬくもり', ocean: '南の海' };
  var KEY = 'vhr-theme';
  var root = document.documentElement;

  var t = 'warm';
  try { t = localStorage.getItem(KEY) || t; } catch (e) {}
  if (NAMES.indexOf(t) < 0) t = 'warm';
  root.setAttribute('data-design', t);

  function setDesign(n, save) {
    root.setAttribute('data-design', n);
    var btns = document.querySelectorAll('[data-theme-btn]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-checked', btns[i].getAttribute('data-theme-btn') === n ? 'true' : 'false');
    }
    if (save) { try { localStorage.setItem(KEY, n); } catch (e) {} }
  }
  window.setDesign = setDesign;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function buildBar() {
    var bar = el('div', 'vhr-bar');
    var inner = el('div', 'in');
    var back = el('a', 'back', '← Visual Horse Racing');
    back.href = '../';
    inner.appendChild(back);

    // month quick links
    var months = document.querySelectorAll('h2#content, h2[id="content"]');
    if (months.length) {
      var nav = el('nav', 'vhr-months');
      nav.setAttribute('aria-label', '月');
      for (var i = 0; i < months.length; i++) {
        var h = months[i];
        var id = 'm' + i;
        h.id = id; // ids were duplicated ("content"); make each unique
        h.setAttribute('data-month', '');
        var m = (h.textContent.match(/(\d+)月/) || [])[1];
        var a = el('a', null, m ? m + '月' : h.textContent.trim());
        a.href = '#' + id;
        nav.appendChild(a);
      }
      inner.appendChild(nav);
    }

    var sw = el('div', 'theme-switch');
    sw.setAttribute('role', 'radiogroup');
    sw.setAttribute('aria-label', 'デザイン切替');
    sw.appendChild(el('span', 'ts-label', '🎨 デザイン'));
    NAMES.forEach(function (n) {
      var b = el('button', null, LABELS[n]);
      b.type = 'button';
      b.setAttribute('role', 'radio');
      b.setAttribute('data-theme-btn', n);
      b.addEventListener('click', function () { setDesign(n, true); });
      sw.appendChild(b);
    });
    inner.appendChild(sw);
    bar.appendChild(inner);
    document.body.insertBefore(bar, document.body.firstChild);
  }

  function buildYears(p, links) {
    var cards = [];
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var m = a.textContent.trim().match(/^【\s*(\d{4})年\s*(.*?)\s*】/);
      var card = el('a', 'year-card' + (i === 0 ? ' latest' : ''));
      card.href = a.getAttribute('href');
      if (a.getAttribute('target')) { card.target = a.getAttribute('target'); card.rel = 'noopener noreferrer'; }
      if (i === 0) card.appendChild(el('span', 'badge', '最新'));
      var y = el('span', 'y', m ? m[1] : a.textContent.trim());
      y.appendChild(el('span', 'nen', '年'));
      card.appendChild(y);
      card.appendChild(el('span', 'sub', m && m[2] ? m[2].replace(/[()（）]/g, '').replace(/[~〜]$/, '〜12月') : (i === 0 ? '1月〜 更新中' : '1月〜12月')));
      card.appendChild(el('span', 'go', 'レース結果を見る →'));
      cards.push(card);
    }
    while (p.firstChild) p.removeChild(p.firstChild);
    p.classList.add('vhr-years');
    cards.forEach(function (c) { p.appendChild(c); });
  }

  // Turn "☑️ 【第4週(12/26~27)】(有観客) { A(GⅠ), B(GⅡ) }" into a tidy row
  function enhanceWeeks() {
    var ps = document.querySelectorAll('#main section > p');
    for (var i = 0; i < ps.length; i++) {
      var p = ps[i];
      var links = p.querySelectorAll('a');
      if (!links.length) continue;

      // Year index list ("【2026年】", "【2025年】", …) → year cards
      var isYears = links.length > 1;
      for (var k = 0; k < links.length && isYears; k++) {
        if (!/^【\s*\d{4}年/.test(links[k].textContent.trim())) isYears = false;
      }
      if (isYears) { buildYears(p, links); continue; }

      var first = links[0];
      var raw = first.textContent.replace(/\s+/g, ' ').trim();
      var mm = raw.match(/【([^】]*)】\s*(.*)$/);

      var wk = el('a', 'wk');
      wk.href = first.getAttribute('href');
      var label = el('span', null, mm ? mm[1] : raw);
      wk.appendChild(label);
      if (mm && mm[2]) label.appendChild(el('span', 'note', mm[2]));

      var races = el('span', 'races');
      for (var j = 1; j < links.length; j++) {
        var txt = links[j].textContent.replace(/\s+/g, ' ').trim();
        var g = txt.match(/\(\s*(J\.?\s*G\s*[ⅠⅡⅢI]+|G\s*[ⅠⅡⅢI]+)\s*\)\s*$/);
        var name = g ? txt.slice(0, g.index).trim() : txt;
        var grade = g ? g[1].replace(/\s+/g, '') : '';
        var cls = /^J/.test(grade) ? 'jg' : /Ⅲ|III/.test(grade) ? 'g3' : /Ⅱ|II/.test(grade) ? 'g2' : grade ? 'g1' : '';
        var href = links[j].getAttribute('href');
        var chip = el(href && href !== '#' ? 'a' : 'span', 'race' + (cls ? ' ' + cls : ''));
        if (chip.tagName === 'A') { chip.href = href; chip.target = '_blank'; chip.rel = 'noopener noreferrer'; }
        if (grade) chip.appendChild(el('span', 'g', grade.replace('.', '')));
        chip.appendChild(document.createTextNode(name));
        races.appendChild(chip);
      }

      while (p.firstChild) p.removeChild(p.firstChild);
      p.classList.add('vhr-week');
      p.appendChild(wk);
      p.appendChild(races);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    try { enhanceWeeks(); } catch (e) {}
    buildBar();
    setDesign(root.getAttribute('data-design'), false);
  });
})();

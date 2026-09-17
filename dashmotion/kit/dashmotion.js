/* Dashmotion kit v2
 *
 * A diagram page only holds a JSON spec in <script type="application/json" id="dm-spec">.
 * This file measures the text, lays the nodes out on a grid, routes labeled edges,
 * switches to a vertical layout on narrow screens, follows the blog theme, and plays
 * the step sequence. See .agents/skills/write-tuan-truong-blog/references/dashmotion-guide.md.
 */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var params = new URLSearchParams(location.search);
  var specEl = document.getElementById('dm-spec');
  if (!specEl) return;
  var spec = JSON.parse(specEl.textContent);

  var EXPORT = params.has('export');
  var STATIC = params.has('static');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var embedded = window.self !== window.top || params.has('embed');

  // Geometry constants (CSS px at 1:1 scale).
  var G = {
    pad: 12,
    minScale: 0.84,
    nodePadX: 12, nodePadY: 10,
    icon: 16, iconGap: 8,
    titleLH: 17, detailLH: 15, detailTop: 3,
    detailMaxH: 168,
    gapMainH: 34, gapCrossH: 34,
    gapMainV: 34, gapCrossV: 16,
    pillPadX: 8, pillH: 20,
    radius: 10, corner: 8,
    head: 6
  };

  var T = { step: 1000, travel: 620, hold: 1800 };
  var padX = G.nodePadX;

  var ICONS = {
    client: 'M2 3h12v8H2z M6 14h4 M8 11v3',
    mobile: 'M4.5 1.5h7v13h-7z M7 12.5h2',
    service: 'M2 2.5h12v4.5H2z M2 9h12v4.5H2z M4.5 4.75h.01 M4.5 11.25h.01',
    store: 'M2 4c0-1.4 2.7-2.5 6-2.5s6 1.1 6 2.5-2.7 2.5-6 2.5S2 5.4 2 4z M2 4v8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V4 M2 8c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5',
    cache: 'M8 1.5 14.5 5 8 8.5 1.5 5z M1.5 8 8 11.5 14.5 8 M1.5 11 8 14.5 14.5 11',
    queue: 'M2 3.5h12 M2 8h12 M2 12.5h12',
    worker: 'M4 4h8v8H4z M6.5 1.5V4 M9.5 1.5V4 M6.5 12v2.5 M9.5 12v2.5 M1.5 6.5H4 M1.5 9.5H4 M12 6.5h2.5 M12 9.5h2.5',
    shield: 'M8 1.5 13.5 3.5v4c0 3.5-2.4 6-5.5 7-3.1-1-5.5-3.5-5.5-7v-4z',
    filter: 'M2 3h12l-4.5 5.5v5l-3-1.5V8.5z',
    link: 'M6.5 9.5l3-3 M7 4.5l1-1a2.8 2.8 0 0 1 4 4l-1 1 M9 11.5l-1 1a2.8 2.8 0 0 1-4-4l1-1',
    share: 'M8 10V2 M5 5l3-3 3 3 M3 8v5.5h10V8',
    search: 'M7 12.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z M11 11l3.5 3.5',
    chart: 'M2 14h12 M4 11V7 M8 11V3 M12 11V8',
    code: 'M5.5 4.5 2 8l3.5 3.5 M10.5 4.5 14 8l-3.5 3.5',
    bolt: 'M9 1.5 3.5 9H8l-1 5.5L12.5 7H8z',
    key: 'M5.5 13a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M8 7l6-5.5 M11.5 4l2 2',
    globe: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z M1.5 8h13 M8 1.5c2 2 2.8 4.2 2.8 6.5S10 12.5 8 14.5C6 12.5 5.2 10.3 5.2 8S6 3.5 8 1.5z',
    user: 'M8 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M2.5 14.5c.6-3 2.7-4.5 5.5-4.5s4.9 1.5 5.5 4.5',
    stop: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z M5.5 5.5l5 5 M10.5 5.5l-5 5',
    check: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z M5 8.2l2 2 4-4.2'
  };

  var UI = {
    play: 'M5 3.5v9l7.5-4.5z',
    pause: 'M5.5 3.5v9 M10.5 3.5v9',
    replay: 'M2.5 8a5.5 5.5 0 1 0 1.6-3.9 M2.5 2.5v3h3',
    more: 'M3.5 8h.01 M8 8h.01 M12.5 8h.01',
    copy: 'M5.5 5.5h8v8h-8z M10.5 5.5v-3h-8v8h3',
    share: ICONS.share,
    x: 'M3 3l10 10 M13 3 3 13',
    linkedin: 'M2.5 2.5h11v11h-11z M5.5 7v4 M5.5 5h.01 M8 11V7 M8 8.8c0-1 .8-1.8 1.8-1.8s1.7.8 1.7 1.8V11',
    send: 'M14.5 1.5 7 9 M14.5 1.5 10 14.5 7 9 1.5 6z',
    image: 'M2 2.5h12v11H2z M2 11l3.5-3.5 3 3 2-2L14 12 M10.5 6h.01',
    film: 'M2 2.5h12v11H2z M5 2.5v11 M11 2.5v11 M2 6h3 M2 10h3 M11 6h3 M11 10h3',
    vector: 'M3 13 13 3 M3 13h.01 M13 3h.01 M3 3c6 0 10 4 10 10'
  };

  // ---------- helpers ----------

  function el(name, attrs, parent) {
    var node = document.createElementNS(NS, name);
    if (attrs) for (var k in attrs) if (attrs[k] != null) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function html(tag, cls, parent) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (parent) parent.appendChild(node);
    return node;
  }

  function icon(path) {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' + path + '"/></svg>';
  }

  function r1(v) { return Math.round(v * 10) / 10; }

  function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

  // ---------- theme ----------

  function detectTheme() {
    var forced = params.get('theme');
    if (forced === 'light' || forced === 'dark') return forced;
    try {
      if (embedded && parent.document && parent.document.body) {
        var cl = parent.document.body.classList;
        if (cl.contains('theme--dark')) return 'dark';
        if (cl.contains('theme--light')) return 'light';
      }
    } catch (e) { /* cross-origin parent */ }
    try {
      var stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch (e) { /* storage blocked */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme() { document.documentElement.setAttribute('data-theme', detectTheme()); }

  function watchTheme() {
    if (params.get('theme')) return;
    try {
      if (embedded && parent.document && parent.document.body) {
        new MutationObserver(applyTheme).observe(parent.document.body, { attributes: true, attributeFilter: ['class'] });
      }
    } catch (e) { /* cross-origin parent */ }
    window.addEventListener('storage', function (e) { if (e.key === 'theme') applyTheme(); });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
  }

  // ---------- spec ----------

  var nodes = spec.nodes.map(function (n) {
    return {
      id: n.id, label: n.label, detail: n.detail || '',
      icon: ICONS[n.icon] ? n.icon : null,
      col: n.col || 0, row: n.row || 0,
      step: n.step || null,
      tone: n.tone || 'default',
      external: !!n.external
    };
  });
  var byId = {};
  nodes.forEach(function (n) { byId[n.id] = n; });

  var edges = (spec.edges || []).map(function (e) {
    return {
      id: e.id || (e.from + '-' + e.to),
      from: e.from, to: e.to, label: e.label || '',
      code: !!e.code, dashed: !!e.dashed, tone: e.tone || 'default'
    };
  });
  var edgeById = {};
  edges.forEach(function (e) { edgeById[e.id] = e; });

  function buildSequence() {
    if (spec.sequence) {
      return spec.sequence.map(function (s) {
        return { nodes: s.nodes || [], edges: s.edges || [] };
      });
    }
    var steps = nodes.filter(function (n) { return n.step; })
      .sort(function (a, b) { return a.step - b.step; });
    var seq = [];
    steps.forEach(function (n, i) {
      var prev = i > 0 ? steps[i - 1].id : null;
      var incoming = edges.filter(function (e) { return e.to === n.id && e.from === prev; })
        .map(function (e) { return e.id; });
      seq.push({ nodes: [n.id], edges: incoming });
    });
    return seq;
  }
  var sequence = buildSequence();
  var starts = sequence.map(function (s, i) { return i * T.step; });
  var DURATION = sequence.length ? starts[starts.length - 1] + T.travel + T.hold : 1;

  // ---------- DOM ----------

  document.title = spec.title + ' — Dashmotion';
  if (!embedded && !EXPORT) document.body.classList.add('is-standalone');
  if (EXPORT) document.body.classList.add('is-export');
  if (EXPORT || STATIC) document.body.classList.add('is-frozen');

  var root = html('div', 'dm', document.body);
  var head = html('header', 'dm-head', root);
  var titles = html('div', 'dm-titles', head);
  var h1 = html('h1', 'dm-title', titles); h1.textContent = spec.title;
  if (spec.subtitle) { var sub = html('p', 'dm-sub', titles); sub.textContent = spec.subtitle; }

  var actions = html('div', 'dm-actions', head);
  var playBtn = html('button', 'dm-btn', actions);
  playBtn.type = 'button';
  var replayBtn = html('button', 'dm-btn', actions);
  replayBtn.type = 'button';
  replayBtn.className = 'dm-btn is-optional';
  replayBtn.setAttribute('aria-label', 'Replay animation');
  replayBtn.title = 'Replay';
  replayBtn.innerHTML = icon(UI.replay);
  var moreBtn = html('button', 'dm-btn', actions);
  moreBtn.type = 'button';
  moreBtn.setAttribute('aria-label', 'Share and download');
  moreBtn.setAttribute('aria-haspopup', 'true');
  moreBtn.setAttribute('aria-expanded', 'false');
  moreBtn.title = 'Share and download';
  moreBtn.innerHTML = icon(UI.more);

  var menu = html('div', 'dm-menu', actions);
  menu.hidden = true;
  menu.setAttribute('role', 'menu');

  var stage = html('div', 'dm-stage', root);
  function updateScrollEdges() {
    stage.classList.toggle('is-at-start', stage.scrollLeft <= 2);
    stage.classList.toggle('is-at-end', stage.scrollLeft + stage.clientWidth >= stage.scrollWidth - 2);
  }
  stage.addEventListener('scroll', updateScrollEdges, { passive: true });
  var svg = el('svg', { class: 'dm-svg', role: 'img', xmlns: NS }, stage);
  var svgTitle = el('title', { id: 'dm-svg-title' }, svg);
  svgTitle.textContent = spec.title;
  var svgDesc = el('desc', { id: 'dm-svg-desc' }, svg);
  svgDesc.textContent = spec.description || spec.subtitle || '';
  svg.setAttribute('aria-labelledby', 'dm-svg-title dm-svg-desc');

  var foot = html('footer', 'dm-foot', root);
  var footLeft = html('span', '', foot); footLeft.textContent = spec.credit || 'Tuan Truong';
  var footRight = html('span', '', foot); footRight.textContent = spec.site || 'tqtuan1201.github.io';

  var toast = html('div', 'dm-toast', document.body);
  toast.setAttribute('role', 'status');

  // ---------- measuring ----------

  var measureSvg = el('svg', { width: 0, height: 0, style: 'position:absolute;visibility:hidden' }, document.body);
  var cache = {};
  function textWidth(text, cls) {
    var key = cls + '|' + text;
    if (cache[key] != null) return cache[key];
    var t = el('text', { class: cls }, measureSvg);
    t.textContent = text;
    var w = t.getComputedTextLength();
    measureSvg.removeChild(t);
    cache[key] = w;
    return w;
  }

  function wrap(text, cls, maxW) {
    if (!text) return [];
    var words = text.split(/\s+/), lines = [], line = '';
    words.forEach(function (word) {
      var next = line ? line + ' ' + word : word;
      if (line && textWidth(next, cls) > maxW) { lines.push(line); line = word; }
      else line = next;
    });
    if (line) lines.push(line);
    return lines;
  }

  // ---------- layout ----------

  function sizeNodes(maxInner) {
    nodes.forEach(function (n) {
      var titleRow = textWidth(n.label, 'dm-node-title') + (n.icon ? G.icon + G.iconGap : 0);
      var detailCap = Math.max(titleRow, Math.min(maxInner, G.detailMaxH));
      var lines = wrap(n.detail, 'dm-node-detail', detailCap);
      var inner = titleRow;
      lines.forEach(function (l) { inner = Math.max(inner, textWidth(l, 'dm-node-detail')); });
      n.lines = lines;
      n.w = Math.ceil(inner + padX * 2);
      n.h = Math.ceil(G.nodePadY * 2 + G.titleLH + (lines.length ? G.detailTop + lines.length * G.detailLH : 0));
    });
  }

  function tracks(axisKey, sizeKey, count) {
    var sizes = [];
    for (var i = 0; i < count; i++) sizes.push(0);
    nodes.forEach(function (n) { sizes[n[axisKey]] = Math.max(sizes[n[axisKey]], n[sizeKey]); });
    return sizes;
  }

  function place(orient, gapsX, gapsY) {
    var mainKey = 'col', crossKey = 'row';
    var xKey = orient === 'h' ? mainKey : crossKey;
    var yKey = orient === 'h' ? crossKey : mainKey;
    var nx = 1 + Math.max.apply(null, nodes.map(function (n) { return n[xKey]; }));
    var ny = 1 + Math.max.apply(null, nodes.map(function (n) { return n[yKey]; }));
    var colW = tracks(xKey, 'w', nx);
    var rowH = tracks(yKey, 'h', ny);
    var xs = [], x = G.pad;
    for (var i = 0; i < nx; i++) { xs.push(x); x += colW[i] + (i < nx - 1 && colW[i] ? gapsX[i] : 0); }
    var ys = [], y = G.pad;
    for (var j = 0; j < ny; j++) { ys.push(y); y += rowH[j] + (j < ny - 1 && rowH[j] ? gapsY[j] : 0); }
    nodes.forEach(function (n) {
      var cx = n[xKey], cy = n[yKey];
      n.w = colW[cx];
      n.x = xs[cx];
      n.y = ys[cy] + (rowH[cy] - n.h) / 2;
      n.cx = n.x + n.w / 2;
      n.cy = n.y + n.h / 2;
    });
    return {
      width: x + G.pad, height: y + G.pad,
      xTracks: xs.map(function (s, k) { return [s, s + colW[k]]; }),
      yTracks: ys.map(function (s, k) { return [s, s + rowH[k]]; })
    };
  }

  function route(e, orient) {
    var S = byId[e.from], D = byId[e.to];
    var overlapY = S.y < D.y + D.h && D.y < S.y + S.h;
    var overlapX = S.x < D.x + D.w && D.x < S.x + S.w;
    var pts;
    if (overlapY && !overlapX) {
      var y = r1((Math.max(S.y, D.y) + Math.min(S.y + S.h, D.y + D.h)) / 2);
      pts = D.cx > S.cx ? [[S.x + S.w, y], [D.x, y]] : [[S.x, y], [D.x + D.w, y]];
    } else if (overlapX && !overlapY) {
      var x = r1((Math.max(S.x, D.x) + Math.min(S.x + S.w, D.x + D.w)) / 2);
      pts = D.cy > S.cy ? [[x, S.y + S.h], [x, D.y]] : [[x, S.y], [x, D.y + D.h]];
    } else {
      var forward = orient === 'h' ? D.cx > S.cx : D.cy > S.cy;
      if (orient === 'h') {
        if (forward) {
          var xm = e._gapMid != null ? e._gapMid : r1((S.x + S.w + D.x) / 2);
          pts = [[S.x + S.w, S.cy], [xm, S.cy], [xm, D.cy], [D.x, D.cy]];
        } else {
          pts = [[S.cx, D.cy > S.cy ? S.y + S.h : S.y], [S.cx, D.cy], [D.cx < S.cx ? D.x + D.w : D.x, D.cy]];
        }
      } else {
        if (forward) {
          var ym = e._gapMid != null ? e._gapMid : r1((S.y + S.h + D.y) / 2);
          pts = [[S.cx, S.y + S.h], [S.cx, ym], [D.cx, ym], [D.cx, D.y]];
        } else {
          pts = [[D.cx > S.cx ? S.x + S.w : S.x, S.cy], [D.cx, S.cy], [D.cx, D.cy < S.cy ? D.y + D.h : D.y]];
        }
      }
    }
    e.pts = pts.map(function (p) { return [r1(p[0]), r1(p[1])]; });
    // Label sits on the longest segment.
    var best = 0, bestLen = -1;
    for (var i = 0; i < e.pts.length - 1; i++) {
      var len = Math.abs(e.pts[i + 1][0] - e.pts[i][0]) + Math.abs(e.pts[i + 1][1] - e.pts[i][1]);
      if (len > bestLen) { bestLen = len; best = i; }
    }
    var a = e.pts[best], b = e.pts[best + 1];
    e.labelAt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    e.labelAxis = a[1] === b[1] ? 'x' : 'y';
  }

  function forwardGapMid(e, orient, frame) {
    // Forward elbows turn in the middle of the gap right after the source track.
    var S = byId[e.from];
    var tracksList = orient === 'h' ? frame.xTracks : frame.yTracks;
    var edgePos = orient === 'h' ? S.x + S.w : S.y + S.h;
    for (var i = 0; i < tracksList.length - 1; i++) {
      if (Math.abs(tracksList[i][1] - edgePos) < 1 || (tracksList[i][0] <= edgePos && edgePos <= tracksList[i][1] + 0.5)) {
        return r1((tracksList[i][1] + tracksList[i + 1][0]) / 2);
      }
    }
    return null;
  }

  function pillSize(e) {
    if (!e.label) return null;
    var cls = e.code ? 'dm-pill-text is-code' : 'dm-pill-text';
    return { w: Math.ceil(textWidth(e.label, cls) + G.pillPadX * 2), h: G.pillH, cls: cls };
  }

  function computeLayout(orient, availW) {
    padX = orient === 'v' ? 10 : G.nodePadX;
    // Narrow screens: wrap details close to the title width so side-by-side nodes stay slim.
    sizeNodes(orient === 'v' ? Math.min(G.detailMaxH, Math.max(110, (availW - G.pad * 2) / crossCount() - padX * 2 - G.gapCrossV)) : G.detailMaxH);
    var nx = 1 + Math.max.apply(null, nodes.map(function (n) { return orient === 'h' ? n.col : n.row; }));
    var ny = 1 + Math.max.apply(null, nodes.map(function (n) { return orient === 'h' ? n.row : n.col; }));
    var gx = [], gy = [], i;
    for (i = 0; i < nx; i++) gx.push(orient === 'h' ? G.gapMainH : G.gapCrossV);
    for (i = 0; i < ny; i++) gy.push(orient === 'h' ? G.gapCrossH : G.gapMainV);

    var frame;
    for (var pass = 0; pass < 3; pass++) {
      frame = place(orient, gx, gy);
      var grew = false;
      edges.forEach(function (e) {
        e._gapMid = null;
        route(e, orient);
        e._gapMid = forwardGapMid(e, orient, frame);
        route(e, orient);
        var p = pillSize(e);
        e.pill = p;
        if (!p) return;
        [['x', frame.xTracks, gx, p.w], ['y', frame.yTracks, gy, p.h]].forEach(function (a) {
          var axis = a[0], list = a[1], gaps = a[2], extent = a[3];
          var c = axis === 'x' ? e.labelAt[0] : e.labelAt[1];
          for (var k = 0; k < list.length - 1; k++) {
            if (c > list[k][1] && c < list[k + 1][0]) {
              var need = extent + (e.labelAxis === axis ? 24 : 16);
              if (need > gaps[k] + 0.5) { gaps[k] = Math.ceil(need); grew = true; }
            }
          }
        });
      });
      if (!grew) break;
    }
    return frame;
  }

  // Last-resort phone layout: one column in reading order. Edges between neighbours
  // go straight down; any other edge runs along its own lane on the left side,
  // with its label just before the node it enters.
  function computeListLayout(availW) {
    padX = 10;
    var order = nodes.slice().sort(function (a, b) { return a.col - b.col || a.row - b.row; });
    var index = {};
    order.forEach(function (n, i) { index[n.id] = i; });

    var railEdges = edges.filter(function (e) { return Math.abs(index[e.from] - index[e.to]) !== 1; });
    var lanes = [];
    var span = function (e) { return Math.abs(index[e.from] - index[e.to]); };
    // Shorter spans take the inner lanes, so lanes nest instead of crossing.
    railEdges.slice().sort(function (a, b) {
      return span(a) - span(b) || Math.min(index[a.from], index[a.to]) - Math.min(index[b.from], index[b.to]);
    }).forEach(function (e) {
      var lo = Math.min(index[e.from], index[e.to]), hi = Math.max(index[e.from], index[e.to]);
      var lane = 0;
      // Rails that meet at the same node must not share a lane, or they read as one line.
      while (lanes[lane] && lanes[lane].some(function (r) { return lo <= r[1] && r[0] <= hi; })) lane++;
      (lanes[lane] = lanes[lane] || []).push([lo, hi]);
      e._lane = lane;
    });

    var railPill = 0;
    edges.forEach(function (e) {
      e.pill = pillSize(e);
      if (e.pill && e._lane != null && railEdges.indexOf(e) >= 0) railPill = Math.max(railPill, e.pill.w);
    });
    var laneGap = 10;
    var indent = G.pad + (railEdges.length ? lanes.length * laneGap + (railPill ? railPill + 20 : 16) : 0);
    sizeNodes(Math.max(120, Math.min(220, availW / G.minScale - indent - G.pad - padX * 2)));
    var width = Math.max.apply(null, order.map(function (n) { return n.w; }));

    var y = G.pad;
    order.forEach(function (n, i) {
      n.w = width;
      n.x = indent;
      n.y = y;
      n.cx = n.x + n.w / 2;
      n.cy = n.y + n.h / 2;
      var gap = G.gapMainV;
      edges.forEach(function (e) {
        var pair = [index[e.from], index[e.to]].sort(function (a, b) { return a - b; });
        if (e.pill && pair[0] === i && pair[1] === i + 1) gap = Math.max(gap, e.pill.h + 20);
      });
      y += n.h + gap;
    });

    // Several rails leaving one node: the outermost lane exits highest.
    var exitRank = {};
    nodes.forEach(function (n) {
      railEdges.filter(function (e) { return e.from === n.id; })
        .sort(function (a, b) { return b._lane - a._lane; })
        .forEach(function (e, i, list) { exitRank[e.id] = i - (list.length - 1) / 2; });
    });
    edges.forEach(function (e) {
      var S = byId[e.from], D = byId[e.to];
      if (railEdges.indexOf(e) < 0) {
        e.pts = D.cy > S.cy ? [[S.cx, S.y + S.h], [D.cx, D.y]] : [[S.cx, S.y], [D.cx, D.y + D.h]];
        e.labelAt = [S.cx, (e.pts[0][1] + e.pts[1][1]) / 2];
        e.labelAxis = 'y';
        return;
      }
      var laneX = G.pad + (lanes.length - 1 - e._lane) * laneGap + 2;
      var exitY = S.cy + exitRank[e.id] * 8;
      e.pts = [[S.x, exitY], [laneX, exitY], [laneX, D.cy], [D.x, D.cy]].map(function (p) { return [r1(p[0]), r1(p[1])]; });
      e.labelAt = e.pill ? [D.x - 10 - e.pill.w / 2, D.cy] : [(laneX + D.x) / 2, D.cy];
      e.labelAxis = 'x';
    });

    return { width: indent + width + G.pad, height: y - G.gapMainV + G.pad, xTracks: [], yTracks: [] };
  }

  function crossCount() {
    return 1 + Math.max.apply(null, nodes.map(function (n) { return n.row; }));
  }

  // ---------- render ----------

  var nodeEls = {}, edgeEls = {}, packets = {};

  function pathD(pts) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var p = pts[i], prev = pts[i - 1], next = pts[i + 1];
      if (!next) { d += ' L' + p[0] + ' ' + p[1]; break; }
      var r = Math.min(G.corner,
        (Math.abs(p[0] - prev[0]) + Math.abs(p[1] - prev[1])) / 2,
        (Math.abs(next[0] - p[0]) + Math.abs(next[1] - p[1])) / 2);
      var inX = Math.sign(p[0] - prev[0]), inY = Math.sign(p[1] - prev[1]);
      var outX = Math.sign(next[0] - p[0]), outY = Math.sign(next[1] - p[1]);
      d += ' L' + r1(p[0] - inX * r) + ' ' + r1(p[1] - inY * r);
      d += ' Q' + p[0] + ' ' + p[1] + ' ' + r1(p[0] + outX * r) + ' ' + r1(p[1] + outY * r);
    }
    return d;
  }

  function render() {
    var availW = Math.max(240, stage.clientWidth || root.clientWidth);
    var fits = function (f) { return f.width * G.minScale <= availW; };
    var orient = 'h', frame = computeLayout('h', availW);
    if (!fits(frame)) {
      var h = frame.width;
      frame = computeLayout('v', availW); orient = 'v';
      if (!fits(frame)) {
        var v = frame.width;
        frame = computeListLayout(availW); orient = 'list';
        if (!fits(frame) && Math.min(h, v) < frame.width) {
          orient = h <= v ? 'h' : 'v';
          frame = computeLayout(orient, availW);
        }
      }
    }
    // Never shrink text below minScale; let the stage scroll sideways instead.
    var shown = Math.max(Math.min(frame.width, availW), frame.width * G.minScale);
    var scrolls = shown > availW + 0.5;
    stage.classList.toggle('is-scroll', scrolls);

    while (svg.lastChild && svg.lastChild !== svgDesc) svg.removeChild(svg.lastChild);
    svg.setAttribute('viewBox', '0 0 ' + Math.ceil(frame.width) + ' ' + Math.ceil(frame.height));
    svg.setAttribute('width', Math.ceil(frame.width));
    svg.setAttribute('height', Math.ceil(frame.height));
    svg.style.width = shown + 'px';
    svg.style.maxWidth = scrolls ? 'none' : '';
    svg.dataset.orient = orient;

    var gEdges = el('g', { class: 'dm-edges' }, svg);
    var gNodes = el('g', { class: 'dm-nodes' }, svg);
    var gPackets = el('g', { class: 'dm-packets' }, svg);
    var gPills = el('g', { class: 'dm-pills' }, svg);

    edges.forEach(function (e) {
      var g = el('g', { class: 'dm-edge tone-' + e.tone + (e.dashed ? ' is-dashed' : ''), 'data-id': e.id }, gEdges);
      var line = el('path', { class: 'dm-edge-line', d: pathD(e.pts) }, g);
      var n = e.pts.length, end = e.pts[n - 1], before = e.pts[n - 2];
      var ang = Math.atan2(end[1] - before[1], end[0] - before[0]);
      var s = G.head;
      var tip = [end[0], end[1]];
      var l = [tip[0] - s * Math.cos(ang) + s * 0.6 * Math.sin(ang), tip[1] - s * Math.sin(ang) - s * 0.6 * Math.cos(ang)];
      var rr = [tip[0] - s * Math.cos(ang) - s * 0.6 * Math.sin(ang), tip[1] - s * Math.sin(ang) + s * 0.6 * Math.cos(ang)];
      el('path', { class: 'dm-edge-head', d: 'M' + r1(tip[0]) + ' ' + r1(tip[1]) + ' L' + r1(l[0]) + ' ' + r1(l[1]) + ' L' + r1(rr[0]) + ' ' + r1(rr[1]) + 'Z' }, g);
      edgeEls[e.id] = { g: g, line: line };

      if (e.pill) {
        var pg = el('g', { class: 'dm-pill tone-' + e.tone, 'data-edge': e.id }, gPills);
        var px = r1(e.labelAt[0] - e.pill.w / 2), py = r1(e.labelAt[1] - e.pill.h / 2);
        el('rect', { class: 'dm-pill-base', x: px, y: py, width: e.pill.w, height: e.pill.h, rx: e.pill.h / 2 }, pg);
        el('rect', { class: 'dm-pill-box', x: px, y: py, width: e.pill.w, height: e.pill.h, rx: e.pill.h / 2 }, pg);
        var t = el('text', { class: e.pill.cls, x: r1(e.labelAt[0]), y: r1(e.labelAt[1] + 3.8), 'text-anchor': 'middle' }, pg);
        t.textContent = e.label;
        e.pillRect = { x: px, y: py, w: e.pill.w, h: e.pill.h };
      }

      var halo = el('circle', { class: 'dm-packet-halo', r: 8, cx: -99, cy: -99 }, gPackets);
      var dot = el('circle', { class: 'dm-packet', r: 3.6, cx: -99, cy: -99 }, gPackets);
      packets[e.id] = { halo: halo, dot: dot, line: line, len: 0 };
    });

    nodes.forEach(function (n) {
      var cls = 'dm-node tone-' + n.tone + (n.external ? ' is-external' : '');
      var g = el('g', { class: cls, 'data-id': n.id }, gNodes);
      el('rect', { class: 'dm-node-halo', x: n.x - 3, y: n.y - 3, width: n.w + 6, height: n.h + 6, rx: G.radius + 3 }, g);
      el('rect', { class: 'dm-node-box', x: n.x, y: n.y, width: n.w, height: n.h, rx: G.radius }, g);
      var tx = n.x + padX;
      var ty = n.y + G.nodePadY;
      if (n.icon) {
        el('path', { class: 'dm-icon', d: ICONS[n.icon], transform: 'translate(' + r1(tx) + ' ' + r1(ty + 0.5) + ')' }, g);
        tx += G.icon + G.iconGap;
      }
      var title = el('text', { class: 'dm-node-title', x: r1(tx), y: r1(ty + 13) }, g);
      title.textContent = n.label;
      n.lines.forEach(function (line, i) {
        var d = el('text', { class: 'dm-node-detail', x: r1(n.x + padX), y: r1(ty + G.titleLH + G.detailTop + 11.5 + i * G.detailLH) }, g);
        d.textContent = line;
      });
      if (n.step) {
        el('circle', { class: 'dm-badge-dot', cx: n.x + n.w - 2, cy: n.y + 2, r: 8.5 }, g);
        var num = el('text', { class: 'dm-badge-num', x: n.x + n.w - 2, y: n.y + 5.6, 'text-anchor': 'middle' }, g);
        num.textContent = String(n.step);
      }
      nodeEls[n.id] = g;
    });

    Object.keys(packets).forEach(function (id) { packets[id].len = packets[id].line.getTotalLength(); });

    if (!scrolls) stage.scrollLeft = 0;
    updateScrollEdges();

    state.orient = orient;
    state.frame = frame;
    paint(state.t);
    reportHeight();
  }

  // ---------- animation ----------

  var state = { t: DURATION - 1, playing: false, userPaused: false, visible: true, last: 0, orient: 'h', frame: null };

  function paint(t) {
    state.t = t;
    var activeStep = -1;
    sequence.forEach(function (s, i) {
      var arrive = starts[i] + (s.edges.length ? T.travel - 80 : 0);
      if (t >= arrive) activeStep = i;
    });
    nodes.forEach(function (n) {
      var g = nodeEls[n.id];
      if (!g) return;
      g.classList.remove('is-active', 'is-done');
    });
    edges.forEach(function (e) {
      var p = packets[e.id];
      if (edgeEls[e.id]) edgeEls[e.id].g.classList.remove('is-done');
      if (p) { p.dot.setAttribute('cx', -99); p.halo.setAttribute('cx', -99); }
    });
    sequence.forEach(function (s, i) {
      s.edges.forEach(function (id) {
        var p = packets[id];
        if (!p || !edgeEls[id]) return;
        var local = t - starts[i];
        if (local >= T.travel) edgeEls[id].g.classList.add('is-done');
        else if (local >= 0) {
          var pt = p.line.getPointAtLength(ease(local / T.travel) * p.len);
          p.dot.setAttribute('cx', r1(pt.x)); p.dot.setAttribute('cy', r1(pt.y));
          p.halo.setAttribute('cx', r1(pt.x)); p.halo.setAttribute('cy', r1(pt.y));
        }
      });
      if (i <= activeStep) {
        s.nodes.forEach(function (id) {
          if (nodeEls[id]) nodeEls[id].classList.add(i === activeStep ? 'is-active' : 'is-done');
        });
      }
    });
  }

  function tick(now) {
    if (!state.playing) return;
    var dt = state.last ? now - state.last : 0;
    state.last = now;
    paint((state.t + dt) % DURATION);
    requestAnimationFrame(tick);
  }

  function setPlayButton() {
    var on = state.playing || (!state.userPaused && !reduceMotion && !STATIC);
    playBtn.innerHTML = icon(on ? UI.pause : UI.play);
    playBtn.setAttribute('aria-label', on ? 'Pause animation' : 'Play animation');
    playBtn.title = on ? 'Pause' : 'Play';
  }

  function play() {
    if (state.playing || !sequence.length) return;
    state.playing = true;
    state.last = 0;
    setPlayButton();
    requestAnimationFrame(tick);
  }

  function pause() {
    state.playing = false;
    setPlayButton();
  }

  function shouldRun() { return !state.userPaused && state.visible && !STATIC && !EXPORT; }

  playBtn.addEventListener('click', function () {
    if (state.playing) { state.userPaused = true; pause(); }
    else { state.userPaused = false; if (state.t >= DURATION - 1) state.t = 0; play(); }
  });
  replayBtn.addEventListener('click', function () {
    state.userPaused = false;
    paint(0);
    play();
  });

  // ---------- share & download ----------

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-shown');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () { toast.classList.remove('is-shown'); }, 2200);
  }

  function pageUrl() {
    try { if (embedded) return parent.location.href; } catch (e) { /* cross-origin */ }
    return embedded && document.referrer ? document.referrer : location.href;
  }

  function slug() { return (location.pathname.split('/').pop() || 'diagram').replace(/\.html?$/, ''); }

  function exportSvgString() {
    var clone = svg.cloneNode(true);
    var liveAll = svg.querySelectorAll('*');
    var cloneAll = clone.querySelectorAll('*');
    var props = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'opacity', 'font-family', 'font-size', 'font-weight'];
    for (var i = 0; i < liveAll.length; i++) {
      var cs = getComputedStyle(liveAll[i]);
      props.forEach(function (p) { cloneAll[i].setAttribute(p, cs.getPropertyValue(p)); });
      cloneAll[i].removeAttribute('class');
    }
    var bg = getComputedStyle(document.body).getPropertyValue('--dm-card').trim();
    var vb = svg.viewBox.baseVal;
    var rect = el('rect', { x: 0, y: 0, width: vb.width, height: vb.height, fill: bg });
    clone.insertBefore(rect, clone.firstChild);
    clone.removeAttribute('style');
    return new XMLSerializer().serializeToString(clone);
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  var menuItems = [];
  function addLabel(text) { var d = html('div', 'dm-menu-label', menu); d.textContent = text; }
  function addItem(label, path, fn) {
    var b = html('button', '', menu);
    b.type = 'button';
    b.setAttribute('role', 'menuitem');
    b.innerHTML = icon(path) + '<span></span>';
    b.lastChild.textContent = label;
    b.addEventListener('click', function () { closeMenu(); fn(); });
    menuItems.push(b);
  }

  addLabel('Share');
  if (navigator.share) {
    addItem('Share…', UI.share, function () {
      navigator.share({ title: spec.title, url: pageUrl() }).catch(function () {});
    });
  }
  addItem('Copy link', UI.copy, function () {
    var url = pageUrl();
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
      .then(function () { showToast('Link copied'); })
      .catch(function () { showToast('Copy failed'); });
  });
  addItem('Share on X', UI.x, function () {
    window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(spec.title) + '&url=' + encodeURIComponent(pageUrl()), '_blank', 'noopener');
  });
  addItem('LinkedIn', UI.linkedin, function () {
    window.open('https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(pageUrl()), '_blank', 'noopener');
  });
  addItem('Telegram', UI.send, function () {
    window.open('https://t.me/share/url?url=' + encodeURIComponent(pageUrl()) + '&text=' + encodeURIComponent(spec.title), '_blank', 'noopener');
  });
  html('hr', '', menu);
  addLabel('Download');
  addItem('SVG', UI.vector, function () {
    download(new Blob([exportSvgString()], { type: 'image/svg+xml' }), slug() + '.svg');
  });
  addItem('PNG', UI.image, function () {
    var vb = svg.viewBox.baseVal, scale = 2;
    var img = new Image();
    var url = URL.createObjectURL(new Blob([exportSvgString()], { type: 'image/svg+xml' }));
    img.onload = function () {
      var c = document.createElement('canvas');
      c.width = vb.width * scale; c.height = vb.height * scale;
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob(function (b) { download(b, slug() + '.png'); }, 'image/png');
    };
    img.src = url;
  });
  if (spec.gif) {
    addItem('Animated GIF', UI.film, function () {
      fetch(spec.gif).then(function (r) { if (!r.ok) throw new Error(); return r.blob(); })
        .then(function (b) { download(b, slug() + '.gif'); })
        .catch(function () { showToast('GIF not available'); });
    });
  }

  function openMenu() {
    menu.hidden = false;
    moreBtn.setAttribute('aria-expanded', 'true');
    reportHeight();
    if (menuItems[0]) menuItems[0].focus();
  }
  function closeMenu() {
    menu.hidden = true;
    moreBtn.setAttribute('aria-expanded', 'false');
    reportHeight();
  }
  moreBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (menu.hidden) openMenu(); else closeMenu();
  });
  document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target)) closeMenu(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { closeMenu(); moreBtn.focus(); }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && !menu.hidden) {
      e.preventDefault();
      var i = menuItems.indexOf(document.activeElement);
      var next = e.key === 'ArrowDown' ? (i + 1) % menuItems.length : (i - 1 + menuItems.length) % menuItems.length;
      menuItems[next].focus();
    }
  });

  // ---------- embedding ----------

  function reportHeight() {
    if (!embedded) return;
    var h = Math.ceil(root.getBoundingClientRect().height);
    if (!menu.hidden) h = Math.max(h, Math.ceil(menu.getBoundingClientRect().bottom) + 8);
    try { parent.postMessage({ type: 'dashmotion:height', height: h }, '*'); } catch (e) { /* ignore */ }
  }

  // ---------- boot ----------

  applyTheme();
  watchTheme();
  setPlayButton();

  var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
  ready.then(function () {
    render();
    var lastW = stage.clientWidth;
    new ResizeObserver(function () {
      if (Math.abs(stage.clientWidth - lastW) < 1) return;
      lastW = stage.clientWidth;
      render();
    }).observe(stage);

    if (!reduceMotion && !STATIC && !EXPORT) {
      state.t = 0;
      paint(0);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          state.visible = entries[0].isIntersecting;
          if (shouldRun()) play(); else if (state.playing) pause();
          setPlayButton();
        }, { threshold: 0.25 }).observe(root);
      } else {
        play();
      }
    }

    window.dashmotion = {
      ready: true,
      duration: DURATION,
      seek: function (ms) {
        state.userPaused = true;
        pause();
        document.body.classList.add('is-frozen');
        paint(Math.max(0, Math.min(ms, DURATION - 1)));
      },
      play: function () { state.userPaused = false; play(); },
      inspect: function () {
        return {
          orient: state.orient,
          viewBox: [svg.viewBox.baseVal.width, svg.viewBox.baseVal.height],
          scale: svg.getBoundingClientRect().width / svg.viewBox.baseVal.width,
          scrolls: stage.classList.contains('is-scroll'),
          nodes: nodes.map(function (n) {
            var g = nodeEls[n.id];
            var texts = Array.prototype.map.call(g.querySelectorAll('text'), function (t) {
              var b = t.getBBox();
              var cs = getComputedStyle(t);
              return { cls: t.getAttribute('class'), text: t.textContent, x: b.x, y: b.y, w: b.width, h: b.height, fontSize: parseFloat(cs.fontSize), color: cs.fill };
            });
            var box = g.querySelector('.dm-node-box');
            return { id: n.id, x: n.x, y: n.y, w: n.w, h: n.h, texts: texts, fill: getComputedStyle(box).fill };
          }),
          edges: edges.map(function (e) {
            var line = edgeEls[e.id].line, len = line.getTotalLength(), samples = [];
            for (var d = 0; d <= len; d += 3) { var p = line.getPointAtLength(d); samples.push([p.x, p.y]); }
            return { id: e.id, from: e.from, to: e.to, pill: e.pillRect || null, samples: samples };
          }),
          card: getComputedStyle(document.body).getPropertyValue('--dm-card').trim(),
          docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
        };
      }
    };
    document.documentElement.setAttribute('data-dm-ready', 'true');
  });
})();

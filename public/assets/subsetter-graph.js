// Tessera Subsetter Graph Engine (Pure DOM & SVG Traversal Simulation)
(function() {
  'use strict';

  var W = 180, H = 68;

  var NODES = [
    // Wave 0: Anchor Seed
    { id: 'customers', name: 'customers', cols: 'id · cpf · email', x: 60, y: 220, depth: 0, kind: 'seed' },
    
    // Lookup Tables (Full Copies)
    { id: 'regions', name: 'regions', cols: 'id · state_code', x: 60, y: 70, depth: 1, kind: 'lookup' },
    { id: 'currency_rates', name: 'currency_rates', cols: 'id · rate_brl', x: 820, y: 410, depth: 3, kind: 'lookup' },

    // Wave 1: Direct FK dependencies
    { id: 'accounts', name: 'accounts', cols: 'id · customer_id', x: 310, y: 130, depth: 1 },
    { id: 'addresses', name: 'addresses', cols: 'id · customer_id', x: 310, y: 310, depth: 1 },

    // Wave 2: Cascading dependencies
    { id: 'orders', name: 'orders', cols: 'id · account_id', x: 560, y: 70, depth: 2 },
    { id: 'payment_methods', name: 'payment_methods', cols: 'id · account_id', x: 560, y: 220, depth: 2 },
    { id: 'invoices', name: 'invoices', cols: 'id · address_id', x: 560, y: 370, depth: 2 },

    // Wave 3: Leaf nodes & Tarjan cycles
    { id: 'order_items', name: 'order_items', cols: 'id · order_id', x: 820, y: 70, depth: 3 },
    { id: 'transactions', name: 'transactions', cols: 'id · order_id · fk_cycle', x: 820, y: 220, depth: 3, isCycle: true },

    // Dead nodes (Not included in subset)
    { id: 'audit_events', name: 'audit_events', cols: 'id · actor_id', x: 60, y: 460, depth: null },
    { id: 'employee_shifts', name: 'employee_shifts', cols: 'id · manager_id', x: 310, y: 470, depth: null },
    { id: 'internal_tickets', name: 'internal_tickets', cols: 'id · team_id', x: 560, y: 490, depth: null },
    { id: 'archived_logs', name: 'archived_logs', cols: 'id · raw_payload', x: 820, y: 510, depth: null }
  ];

  var EDGES = [
    // Live Foreign Keys
    { from: 'customers', to: 'accounts', label: 'customer_id', wave: 1 },
    { from: 'customers', to: 'addresses', label: 'customer_id', wave: 1 },
    { from: 'customers', to: 'regions', label: 'region_id', wave: 1, lookup: true },
    { from: 'accounts', to: 'orders', label: 'account_id', wave: 2 },
    { from: 'accounts', to: 'payment_methods', label: 'account_id', wave: 2 },
    { from: 'addresses', to: 'invoices', label: 'address_id', wave: 2 },
    { from: 'orders', to: 'order_items', label: 'order_id', wave: 3 },
    { from: 'orders', to: 'transactions', label: 'order_id', wave: 3 },
    { from: 'payment_methods', to: 'transactions', label: 'method_id', wave: 3 },
    { from: 'invoices', to: 'currency_rates', label: 'currency_id', wave: 3, lookup: true },

    // Circular FK resolved by Tarjan SCC
    { from: 'transactions', to: 'orders', label: 'Tarjan SCC Wave 2', wave: 3, isCycle: true },

    // Dead edges (not part of the seed slice)
    { from: 'audit_events', to: 'customers', label: '', dead: true },
    { from: 'employee_shifts', to: 'accounts', label: '', dead: true },
    { from: 'internal_tickets', to: 'orders', label: '', dead: true },
    { from: 'archived_logs', to: 'transactions', label: '', dead: true }
  ];

  var nodeMap = {};
  NODES.forEach(function(n) { nodeMap[n.id] = n; });

  // Calculate smooth Bezier Curve between two boxes
  function calcBezier(a, b) {
    var ac = { x: a.x + W / 2, y: a.y + H / 2 };
    var bc = { x: b.x + W / 2, y: b.y + H / 2 };
    var dx = bc.x - ac.x;
    var dy = bc.y - ac.y;

    var p0, p3, c1, c2;
    if (Math.abs(dx) > Math.abs(dy) * 0.85) {
      var s = dx > 0 ? 1 : -1;
      var off = Math.max(45, Math.abs(dx) * 0.45);
      p0 = { x: a.x + (s > 0 ? W : 0), y: ac.y };
      p3 = { x: b.x + (s > 0 ? 0 : W), y: bc.y };
      c1 = { x: p0.x + s * off, y: p0.y };
      c2 = { x: p3.x - s * off, y: p3.y };
    } else {
      var s2 = dy > 0 ? 1 : -1;
      var off2 = Math.max(35, Math.abs(dy) * 0.45);
      p0 = { x: ac.x, y: a.y + (s2 > 0 ? H : 0) };
      p3 = { x: bc.x, y: b.y + (s2 > 0 ? 0 : H) };
      c1 = { x: p0.x, y: p0.y + s2 * off2 };
      c2 = { x: p3.x - s2 * off2, y: p3.y };
    }

    var d = 'M ' + p0.x + ' ' + p0.y + ' C ' + c1.x + ' ' + c1.y + ', ' + c2.x + ' ' + c2.y + ', ' + p3.x + ' ' + p3.y;
    var mx = (p0.x + 3 * c1.x + 3 * c2.x + p3.x) / 8;
    var my = (p0.y + 3 * c1.y + 3 * c2.y + p3.y) / 8;

    return { d: d, mx: mx, my: my };
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  document.addEventListener('DOMContentLoaded', function() {
    var nodesLayer = document.getElementById('nodes-layer');
    var liveEdgesGroup = document.getElementById('live-edges');
    var deadEdgesGroup = document.getElementById('dead-edges');
    if (!nodesLayer || !liveEdgesGroup || !deadEdgesGroup) return;

    // 1. Build Dead Edges
    EDGES.filter(function(e) { return e.dead; }).forEach(function(e) {
      var a = nodeMap[e.from], b = nodeMap[e.to];
      var geom = calcBezier(a, b);
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', geom.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#28243D');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-dasharray', '3 5');
      path.setAttribute('marker-end', 'url(#arrow-dead)');
      deadEdgesGroup.appendChild(path);
    });

    // 2. Build Live Edges
    var liveEdgeElements = [];
    EDGES.filter(function(e) { return !e.dead; }).forEach(function(e) {
      var a = nodeMap[e.from], b = nodeMap[e.to];
      var geom = calcBezier(a, b);
      var g = document.createElementNS(SVG_NS, 'g');
      g.style.transition = 'opacity 0.4s ease';
      g.style.opacity = '0';

      var strokeColor = e.isCycle ? '#FF7B72' : (e.lookup ? '#D29922' : '#7EE787');
      var marker = e.isCycle ? 'url(#arrow-cycle)' : 'url(#arrow-active)';

      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', geom.d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', e.isCycle ? '2.5' : '2');
      path.setAttribute('marker-end', marker);
      path.classList.add('edge-flow');
      g.appendChild(path);

      // Edge label (FK column)
      if (e.label) {
        var text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', geom.mx);
        text.setAttribute('y', geom.my - 4);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-family', "'JetBrains Mono', monospace");
        text.setAttribute('font-size', '10');
        text.setAttribute('font-weight', '600');
        text.setAttribute('fill', strokeColor);
        text.setAttribute('stroke', '#0B0A16');
        text.setAttribute('stroke-width', '3');
        text.setAttribute('paint-order', 'stroke');
        text.textContent = e.label;
        g.appendChild(text);
      }

      liveEdgesGroup.appendChild(g);
      liveEdgeElements.push({ edge: e, el: g, wave: e.wave });
    });

    // 3. Build Nodes
    var nodeElements = [];
    NODES.forEach(function(n) {
      var wrap = document.createElement('div');
      wrap.className = 'node-wrap';
      wrap.style.left = n.x + 'px';
      wrap.style.top = n.y + 'px';

      var pulseRing = document.createElement('div');
      pulseRing.className = 'seed-pulse-ring';

      var card = document.createElement('div');
      card.className = 'node-card';

      var header = document.createElement('div');
      header.className = 'node-header';

      var title = document.createElement('span');
      title.className = 'node-title';
      title.innerHTML = (n.kind === 'seed' ? '&#9679; ' : '') + n.name;

      var badge = document.createElement('span');
      badge.className = 'node-badge';
      badge.textContent = n.depth === null ? 'PRUNED' : (n.kind === 'seed' ? 'SEED' : (n.kind === 'lookup' ? 'FULL' : 'W' + n.depth));

      header.appendChild(title);
      header.appendChild(badge);

      var sub = document.createElement('div');
      sub.className = 'node-sub';
      sub.textContent = n.cols;

      card.appendChild(header);
      card.appendChild(sub);
      wrap.appendChild(pulseRing);
      wrap.appendChild(card);
      nodesLayer.appendChild(wrap);

      nodeElements.push({ node: n, wrap: wrap, pulse: pulseRing });
    });

    // Simulation State
    var currentHop = 0;
    var isPlaying = false;
    var playTimer = null;

    function updateStage() {
      var reachedCount = 0;

      nodeElements.forEach(function(item) {
        var n = item.node;
        var inHop = n.depth !== null && n.depth <= currentHop;

        item.wrap.className = 'node-wrap';
        item.pulse.style.display = 'none';

        if (inHop) {
          reachedCount++;
          if (n.kind === 'seed') {
            item.wrap.classList.add('state-anchor');
            item.pulse.style.display = 'block';
          } else if (n.kind === 'lookup') {
            item.wrap.classList.add('state-lookup');
          } else if (n.depth === 1) {
            item.wrap.classList.add('state-wave1');
          } else if (n.depth === 2) {
            item.wrap.classList.add('state-wave2');
          } else if (n.depth === 3) {
            item.wrap.classList.add('state-wave3');
          }
        }
      });

      // Toggle Live Edges
      liveEdgeElements.forEach(function(item) {
        var on = item.wave <= currentHop;
        item.el.style.opacity = on ? '1' : '0';
      });

      // Tarjan alert visibility
      var tarjanAlert = document.getElementById('tarjan-alert');
      if (tarjanAlert) {
        tarjanAlert.style.display = currentHop >= 3 ? 'flex' : 'none';
      }

      // Update stats
      var statReached = document.getElementById('stat-reached');
      if (statReached) statReached.textContent = reachedCount + ' / ' + NODES.length;

      var statusText = document.getElementById('status-text');
      if (statusText) {
        if (currentHop === 0) {
          statusText.textContent = "Semente customers ativada. Traversal inicializado.";
          statusText.style.color = "#8A6BFF";
        } else if (currentHop === 1) {
          statusText.textContent = "Onda 1: Resolvidas FKs diretas (accounts, addresses, regions).";
          statusText.style.color = "#7EE787";
        } else if (currentHop === 2) {
          statusText.textContent = "Onda 2: Cascata de tabelas filhas (orders, payments, invoices).";
          statusText.style.color = "#58A6FF";
        } else if (currentHop >= 3) {
          statusText.textContent = "Onda 3 Completa: Tarjan SCC quebrou ciclo orders <-> transactions. Fatiamento íntegro!";
          statusText.style.color = "#7EE787";
        }
      }

      // Update active state on hop buttons
      document.querySelectorAll('[data-hop]').forEach(function(btn) {
        var hopVal = parseInt(btn.getAttribute('data-hop'), 10);
        btn.classList.toggle('active', hopVal === currentHop);
      });
    }

    function setHop(hop) {
      currentHop = hop;
      updateStage();
    }

    function resetSim() {
      stopPlay();
      setHop(0);
    }

    function startPlay() {
      isPlaying = true;
      var btn = document.getElementById('btn-play');
      var icon = document.getElementById('play-icon');
      var text = document.getElementById('play-text');
      if (btn) btn.classList.add('active');
      if (icon) icon.innerHTML = '&#10074;&#10074;';
      if (text) text.textContent = 'Pausar';

      function step() {
        currentHop = (currentHop + 1) % 4;
        updateStage();
        playTimer = setTimeout(step, 2400);
      }

      playTimer = setTimeout(step, 1800);
    }

    function stopPlay() {
      isPlaying = false;
      if (playTimer) clearTimeout(playTimer);
      var btn = document.getElementById('btn-play');
      var icon = document.getElementById('play-icon');
      var text = document.getElementById('play-text');
      if (btn) btn.classList.remove('active');
      if (icon) icon.innerHTML = '&#9654;';
      if (text) text.textContent = 'Auto Play';
    }

    function togglePlay() {
      if (isPlaying) {
        stopPlay();
      } else {
        startPlay();
      }
    }

    // Bind event listeners to UI controls (no inline onclicks)
    var btnPlay = document.getElementById('btn-play');
    if (btnPlay) {
      btnPlay.addEventListener('click', togglePlay);
    }

    var btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', resetSim);
    }

    document.querySelectorAll('[data-hop]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var h = parseInt(this.getAttribute('data-hop'), 10);
        setHop(h);
      });
    });

    // Initial render
    updateStage();
  });
})();

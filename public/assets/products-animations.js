// ==========================================================================
// Tessera Product Interactive Animations Engine
// Strict CSP Compliant (Pure JS & DOM, zero inline scripts or styles)
// ==========================================================================
(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', function() {
    initDiscoverySim();
    initMaskingSim();
    initCdcSim();
  });

  // ========================================================================
  // 1. DISCOVERY SIMULATOR
  // ========================================================================
  function initDiscoverySim() {
    var feed = document.getElementById('disc-feed');
    var laser = document.getElementById('disc-laser');
    var targetLabel = document.getElementById('disc-target-label');
    var targetVal = document.getElementById('disc-target-val');
    var pass1 = document.getElementById('disc-pass1');
    var pass2 = document.getElementById('disc-pass2');
    var pass3 = document.getElementById('disc-pass3');
    var resDomain = document.getElementById('disc-res-domain');
    var resAction = document.getElementById('disc-res-action');
    var resScore = document.getElementById('disc-res-score');
    var resScoreFill = document.getElementById('disc-res-score-fill');
    var btnPlay = document.getElementById('disc-btn-play');
    var btnNext = document.getElementById('disc-btn-next');

    if (!feed || !targetVal) return;

    var COLUMNS = [
      {
        id: 'cpf',
        col: 'customers.cpf',
        sample: '341.890.122-10',
        tag: 'CONFIRMED',
        tagClass: 'tag-confirmed',
        pathTest: 'Regex: /(cpf|doc_fed)/i ✓ Match',
        valTest: 'Validador Luhn/Mod11 ✓ 11 dígitos válidos',
        valClass: 'pass-ok',
        entropy: '3.1 bits/byte (Padrão Formatado)',
        domain: 'BR_CPF // DADO PESSOAL SENSÍVEL',
        action: 'Algoritmo: CPF Format-Preserving Masker (NIST FF1)',
        score: '100%',
        scoreWidth: '100%'
      },
      {
        id: 'card',
        col: 'billing.num_cc',
        sample: '4532 8901 2234 8819',
        tag: 'CONFIRMED',
        tagClass: 'tag-confirmed',
        pathTest: 'Regex: /(cc|card|pan)/i ✓ Match',
        valTest: 'Algoritmo de Luhn ✓ Visa Card Verificado',
        valClass: 'pass-ok',
        entropy: '3.4 bits/byte (Alta Variância)',
        domain: 'CREDIT_CARD_PAN // DADO FINANCEIRO SENSÍVEL',
        action: 'Algoritmo: Luhn FPE Masker (Preserva 6 primeiros + 4 finais)',
        score: '98.4%',
        scoreWidth: '98.4%'
      },
      {
        id: 'email',
        col: 'users.email',
        sample: 'mariana.silva@empresa.com.br',
        tag: 'CONFIRMED',
        tagClass: 'tag-confirmed',
        pathTest: 'Regex: /email/i ✓ Match',
        valTest: 'RFC 5322 Syntax ✓ Domínio Corporativo',
        valClass: 'pass-ok',
        entropy: '3.8 bits/byte (Normal)',
        domain: 'EMAIL_ADDRESS // IDENTIFICADOR PESSOAL',
        action: 'Algoritmo: Deterministic Email Masker (Preserva MX)',
        score: '99.2%',
        scoreWidth: '99.2%'
      },
      {
        id: 'sap',
        col: 'sap_legacy.FLD_019',
        sample: 'fe89a02bc41d904e',
        tag: 'NEEDS_REVIEW',
        tagClass: 'tag-review',
        pathTest: 'Path Opaco: FLD_019 ⚠ Sem Regex',
        valTest: 'Hexadecimal 16 bytes ⚠ Padrão Token',
        valClass: 'pass-warn',
        entropy: '4.2 bits/byte (Alta Aleatoriedade)',
        domain: 'SUSPECTED_TOKEN // RECALL-FIRST FLAG',
        action: 'Ação: Classificado para Revisão Humana (Recall-First)',
        score: '75.0%',
        scoreWidth: '75%'
      },
      {
        id: 'balance',
        col: 'accounts.balance',
        sample: 'R$ 14.850,20',
        tag: 'FINANCEIRO',
        tagClass: 'tag-safe',
        pathTest: 'Regex: /(bal|saldo)/i ✓ Match',
        valTest: 'Monetário BRL ✓ Float positivo',
        valClass: 'pass-ok',
        entropy: '1.9 bits/byte (Numérico)',
        domain: 'FINANCIAL_VALUE // SIGILO BANCÁRIO',
        action: 'Algoritmo: Numeric Variance (±12% aleatório)',
        score: '96.0%',
        scoreWidth: '96%'
      }
    ];

    var currentIndex = 0;
    var isPlaying = false;
    var playTimer = null;

    // Render feed
    feed.innerHTML = '';
    var feedElements = [];
    COLUMNS.forEach(function(item, idx) {
      var div = document.createElement('div');
      div.className = 'feed-item' + (idx === 0 ? ' active' : '');
      div.setAttribute('data-index', idx);

      var topRow = document.createElement('div');
      topRow.className = 'feed-col-name';

      var nameSpan = document.createElement('span');
      nameSpan.textContent = item.col;

      var tagSpan = document.createElement('span');
      tagSpan.className = 'feed-tag ' + item.tagClass;
      tagSpan.textContent = item.tag;

      topRow.appendChild(nameSpan);
      topRow.appendChild(tagSpan);

      var sampleDiv = document.createElement('div');
      sampleDiv.className = 'feed-sample-val';
      sampleDiv.textContent = item.sample;

      div.appendChild(topRow);
      div.appendChild(sampleDiv);
      feed.appendChild(div);

      div.addEventListener('click', function() {
        stopPlay();
        inspect(idx);
      });

      feedElements.push(div);
    });

    function inspect(idx) {
      currentIndex = idx;
      var item = COLUMNS[idx];

      // Update feed active state
      feedElements.forEach(function(el, i) {
        el.classList.toggle('active', i === idx);
      });

      // Start laser pulse
      if (laser) {
        laser.classList.remove('scanning');
        void laser.offsetWidth; // trigger reflow
        laser.classList.add('scanning');
      }

      // Update Target Box
      if (targetLabel) targetLabel.textContent = 'Amostra sob inspeção: ' + item.col;
      if (targetVal) targetVal.textContent = item.sample;

      // Update Passes
      if (pass1) pass1.textContent = item.pathTest;
      if (pass2) {
        pass2.textContent = item.valTest;
        pass2.className = 'pass-val ' + (item.valClass || 'pass-ok');
      }
      if (pass3) pass3.textContent = item.entropy;

      // Update Final Result
      if (resDomain) resDomain.textContent = item.domain;
      if (resAction) resAction.textContent = item.action;
      if (resScore) resScore.textContent = item.score;
      if (resScoreFill) resScoreFill.style.width = item.scoreWidth;
    }

    function step() {
      currentIndex = (currentIndex + 1) % COLUMNS.length;
      inspect(currentIndex);
      playTimer = setTimeout(step, 3000);
    }

    function startPlay() {
      isPlaying = true;
      if (btnPlay) {
        btnPlay.classList.add('active');
        btnPlay.textContent = '❚❚ Pausar';
      }
      playTimer = setTimeout(step, 2400);
    }

    function stopPlay() {
      isPlaying = false;
      if (playTimer) clearTimeout(playTimer);
      if (btnPlay) {
        btnPlay.classList.remove('active');
        btnPlay.textContent = '▶ Auto Scan';
      }
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', function() {
        if (isPlaying) stopPlay();
        else startPlay();
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', function() {
        stopPlay();
        inspect((currentIndex + 1) % COLUMNS.length);
      });
    }

    // Initial render
    inspect(0);
  }

  // ========================================================================
  // 2. MASKING SIMULATOR (DETERMINISTIC FPE & CROSS-SERVICE JOINS)
  // ========================================================================
  function initMaskingSim() {
    var btnToggle = document.getElementById('mask-btn-toggle');
    var btnKey = document.getElementById('mask-btn-key');
    var statusText = document.getElementById('mask-status-text');
    var joinBanner = document.getElementById('mask-join-banner');
    var kmsLabel = document.getElementById('mask-kms-key-label');

    if (!btnToggle) return;

    var isMasked = false;
    var keyIndex = 0;
    var KEYS = [
      { name: 'aws-kms://tessera-prod-key', tag1: 'US-981-D', tag2: 'US-204-K', name1: 'Fernanda Castro', cpf1: '582.109.844-32' },
      { name: 'gcp-kms://tessera-vault-key', tag1: 'EU-412-Z', tag2: 'EU-773-M', name1: 'Beatriz Monteiro', cpf1: '812.441.902-18' }
    ];

    var rawData = {
      pId1: '1042', pName1: 'Mariana Silva', pCpf1: '341.890.122-10',
      pId2: '1043', pName2: 'Carlos Eduardo', pCpf2: '512.390.871-00',
      oFk1: '1042', oFk2: '1043'
    };

    function updateView() {
      var k = KEYS[keyIndex];
      var elPId1 = document.getElementById('cell-p-id1');
      var elPName1 = document.getElementById('cell-p-name1');
      var elPCpf1 = document.getElementById('cell-p-cpf1');
      var elOFk1 = document.getElementById('cell-o-fk1');

      var elPId2 = document.getElementById('cell-p-id2');
      var elOFk2 = document.getElementById('cell-o-fk2');

      if (isMasked) {
        if (elPId1) { elPId1.textContent = k.tag1; elPId1.classList.add('val-masked'); }
        if (elPName1) { elPName1.textContent = k.name1; elPName1.classList.add('val-masked'); }
        if (elPCpf1) { elPCpf1.textContent = k.cpf1; elPCpf1.classList.add('val-masked'); }
        if (elOFk1) { elOFk1.textContent = k.tag1; elOFk1.classList.add('val-masked'); }

        if (elPId2) { elPId2.textContent = k.tag2; elPId2.classList.add('val-masked'); }
        if (elOFk2) { elOFk2.textContent = k.tag2; elOFk2.classList.add('val-masked'); }

        if (btnToggle) {
          btnToggle.textContent = '↺ Restaurar Original';
          btnToggle.classList.add('active');
        }
        if (statusText) {
          statusText.textContent = 'Mascaramento Determinístico Ativo: FPE FF1 NIST SP 800-38G.';
          statusText.style.color = '#7EE787';
        }
        if (joinBanner) {
          joinBanner.innerHTML = '<span><strong style="color:#7EE787;">✓ JOIN PRESERVADO:</strong> <code>customers.id ("' + k.tag1 + '") == invoices.customer_id ("' + k.tag1 + '")</code></span><span style="color:#7EE787; font-weight:700;">100% Íntegro em Testes</span>';
        }
      } else {
        if (elPId1) { elPId1.textContent = rawData.pId1; elPId1.classList.remove('val-masked'); }
        if (elPName1) { elPName1.textContent = rawData.pName1; elPName1.classList.remove('val-masked'); }
        if (elPCpf1) { elPCpf1.textContent = rawData.pCpf1; elPCpf1.classList.remove('val-masked'); }
        if (elOFk1) { elOFk1.textContent = rawData.oFk1; elOFk1.classList.remove('val-masked'); }

        if (elPId2) { elPId2.textContent = rawData.pId2; elPId2.classList.remove('val-masked'); }
        if (elOFk2) { elOFk2.textContent = rawData.oFk2; elOFk2.classList.remove('val-masked'); }

        if (btnToggle) {
          btnToggle.textContent = '▶ Anonimizar com FPE';
          btnToggle.classList.remove('active');
        }
        if (statusText) {
          statusText.textContent = 'Dados em Claro (Produção). PII real exposta.';
          statusText.style.color = '#FFB74D';
        }
        if (joinBanner) {
          joinBanner.innerHTML = '<span><strong>Atenção:</strong> Dados em claro com PII real (CPF e Nome). Clique em <strong>Anonimizar</strong> para proteger.</span><span style="color:#FFB74D; font-weight:700;">Risco em Não-Produção</span>';
        }
      }

      if (kmsLabel) kmsLabel.textContent = k.name;
    }

    btnToggle.addEventListener('click', function() {
      isMasked = !isMasked;
      updateView();
    });

    if (btnKey) {
      btnKey.addEventListener('click', function() {
        keyIndex = (keyIndex + 1) % KEYS.length;
        if (!isMasked) isMasked = true;
        updateView();
      });
    }

    // Start masked by default for impressive showcase
    isMasked = true;
    updateView();
  }

  // ========================================================================
  // 4. CDC & SNAPSHOT SIMULATOR (LSN0 BOUNDARY & CONTINUOUS STREAM TO S3)
  // ========================================================================
  function initCdcSim() {
    var streamZone = document.getElementById('cdc-stream-zone');
    var btnPlay = document.getElementById('cdc-btn-play');
    var btnMut = document.getElementById('cdc-btn-mut');
    var btnDdl = document.getElementById('cdc-btn-ddl');
    var fileCountSpan = document.getElementById('cdc-file-count');
    var opsSecSpan = document.getElementById('cdc-ops-sec');

    if (!streamZone) return;

    var isStreaming = true;
    var streamTimer = null;
    var fileCounter = 42;
    var opsCounter = 4200;

    var MUTATION_TEMPLATES = [
      { type: 'INSERT', table: 'customers', detail: 'id: 1045, reg: "BR-SP"', lsn: '0/16B3FA0' },
      { type: 'UPDATE', table: 'accounts', detail: 'balance: +R$ 450.00', lsn: '0/16B3FB8' },
      { type: 'INSERT', table: 'orders', detail: 'id: 9912, total: R$ 890', lsn: '0/16B3FD0' },
      { type: 'UPDATE', table: 'invoices', detail: 'status: "CONFIRMED"', lsn: '0/16B3FE8' },
      { type: 'DELETE', table: 'session_tokens', detail: 'token_hash: 0x9f..', lsn: '0/16B4000' }
    ];

    function pushMutation(m, isDdl) {
      if (!streamZone) return;

      var div = document.createElement('div');
      div.className = 'mutation-item' + (isDdl ? ' ddl-alert' : '');

      var left = document.createElement('div');
      left.style.display = 'flex';
      left.style.alignItems = 'center';
      left.style.gap = '6px';

      var badge = document.createElement('strong');
      badge.textContent = '[' + m.type + ']';
      left.appendChild(badge);

      var text = document.createElement('span');
      text.textContent = m.table + ' (' + m.detail + ')';
      left.appendChild(text);

      var lsnSpan = document.createElement('span');
      lsnSpan.style.color = isDdl ? '#FFD54F' : '#BC8CFF';
      lsnSpan.style.fontSize = '0.5625rem';
      lsnSpan.textContent = 'LSN ' + m.lsn;

      div.appendChild(left);
      div.appendChild(lsnSpan);

      streamZone.appendChild(div);

      // Keep only last 4 items
      while (streamZone.children.length > 4) {
        streamZone.removeChild(streamZone.firstChild);
      }

      // Increment file counter occasionally
      if (Math.random() > 0.65) {
        fileCounter++;
        if (fileCountSpan) fileCountSpan.textContent = 'part-00' + fileCounter + '.jsonl.zst';
      }
    }

    function step() {
      var rand = MUTATION_TEMPLATES[Math.floor(Math.random() * MUTATION_TEMPLATES.length)];
      // calculate slight random lsn
      var hex = (Math.floor(Math.random() * 8000) + 1000).toString(16).toUpperCase();
      rand.lsn = '0/16B' + hex;
      pushMutation(rand, false);

      if (opsSecSpan) {
        opsCounter = 4000 + Math.floor(Math.random() * 600);
        opsSecSpan.textContent = (opsCounter / 1000).toFixed(1) + 'k ops/s';
      }

      streamTimer = setTimeout(step, 1600);
    }

    function startStream() {
      isStreaming = true;
      if (btnPlay) {
        btnPlay.classList.add('active');
        btnPlay.textContent = '❚❚ Pausar Stream';
      }
      step();
    }

    function stopStream() {
      isStreaming = false;
      if (streamTimer) clearTimeout(streamTimer);
      if (btnPlay) {
        btnPlay.classList.remove('active');
        btnPlay.textContent = '▶ Iniciar Stream';
      }
    }

    if (btnPlay) {
      btnPlay.addEventListener('click', function() {
        if (isStreaming) stopStream();
        else startStream();
      });
    }

    if (btnMut) {
      btnMut.addEventListener('click', function() {
        var rand = MUTATION_TEMPLATES[Math.floor(Math.random() * MUTATION_TEMPLATES.length)];
        pushMutation(rand, false);
      });
    }

    if (btnDdl) {
      btnDdl.addEventListener('click', function() {
        var ddlEvent = {
          type: 'DDL SCHEMA',
          table: 'customers',
          detail: 'ALTER TABLE ADD COLUMN loyalty_points INT',
          lsn: '0/16B' + (Math.floor(Math.random() * 8000) + 1000).toString(16).toUpperCase()
        };
        pushMutation(ddlEvent, true);
      });
    }

    // Start streaming automatically
    startStream();
  }
})();

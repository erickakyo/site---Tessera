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
    var btnTessera = document.getElementById('mask-btn-tessera');
    var btnNaive = document.getElementById('mask-btn-naive');
    var btnReal = document.getElementById('mask-btn-real');
    var btnKey = document.getElementById('mask-btn-key');
    var statusText = document.getElementById('mask-status-text');
    var joinBanner = document.getElementById('mask-join-banner');
    var kmsLabel = document.getElementById('mask-kms-key-label');

    if (!btnTessera && !btnNaive) return;

    var mode = 'tessera'; // 'tessera' | 'naive' | 'real'
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

      // Update button active states
      if (btnTessera) btnTessera.classList.toggle('active', mode === 'tessera');
      if (btnNaive) btnNaive.classList.toggle('active', mode === 'naive');
      if (btnReal) btnReal.classList.toggle('active', mode === 'real');

      function clearClasses(el) {
        if (!el) return;
        el.classList.remove('val-masked', 'val-broken');
      }
      [elPId1, elPName1, elPCpf1, elOFk1, elPId2, elOFk2].forEach(clearClasses);

      if (mode === 'tessera') {
        // TESSERA FPE DETERMINISTIC
        if (elPId1) { elPId1.textContent = k.tag1; elPId1.classList.add('val-masked'); }
        if (elPName1) { elPName1.textContent = k.name1; elPName1.classList.add('val-masked'); }
        if (elPCpf1) { elPCpf1.textContent = k.cpf1; elPCpf1.classList.add('val-masked'); }
        if (elOFk1) { elOFk1.textContent = k.tag1; elOFk1.classList.add('val-masked'); }

        if (elPId2) { elPId2.textContent = k.tag2; elPId2.classList.add('val-masked'); }
        if (elOFk2) { elOFk2.textContent = k.tag2; elOFk2.classList.add('val-masked'); }

        if (joinBanner) {
          joinBanner.className = 'join-bridge-banner';
          joinBanner.innerHTML = '<span><strong style="color:#7EE787;">✓ SUCESSO NO JOIN:</strong> <code style="color:#FFFFFF; background:rgba(0,0,0,0.65); border:1px solid rgba(126,231,135,0.4); padding:3px 8px; border-radius:4px;">customers.id ("' + k.tag1 + '") == invoices.customer_id ("' + k.tag1 + '")</code></span><span style="color:#7EE787; font-weight:700;">100% Íntegro em Testes</span>';
        }
        if (statusText) {
          statusText.innerHTML = '<span style="color: #7EE787;"><strong style="color: #7EE787;">A Solução Tessera:</strong> Criptografia determinística (FF1). O mesmo ID de entrada <code style="color:#FFFFFF; background:rgba(0,0,0,0.65); padding:2px 6px; border-radius:3px;">1042</code> gera exatamente a mesma saída <code style="color:#FFFFFF; background:rgba(0,0,0,0.65); padding:2px 6px; border-radius:3px;">"' + k.tag1 + '"</code> no Postgres e no Oracle. Os testes de integração funcionam 100% sem expor PII real!</span>';
        }
      } else if (mode === 'naive') {
        // NAIVE / RANDOM MASKING (BREAKS JOINS)
        if (elPId1) { elPId1.textContent = 'FAKE-119'; elPId1.classList.add('val-broken'); }
        if (elPName1) { elPName1.textContent = 'User Random'; elPName1.classList.add('val-broken'); }
        if (elPCpf1) { elPCpf1.textContent = '000.000.000-00'; elPName1.classList.add('val-broken'); }
        if (elOFk1) { elOFk1.textContent = 'RANDOM-842'; elOFk1.classList.add('val-broken'); }

        if (elPId2) { elPId2.textContent = 'FAKE-332'; elPId2.classList.add('val-broken'); }
        if (elOFk2) { elOFk2.textContent = 'RANDOM-991'; elOFk2.classList.add('val-broken'); }

        if (joinBanner) {
          joinBanner.className = 'join-bridge-banner join-error';
          joinBanner.innerHTML = '<span><strong style="color:#FF7B72;">❌ ERRO DE JOIN:</strong> <code style="color:#FFFFFF; background:rgba(0,0,0,0.65); border:1px solid rgba(255,123,114,0.5); padding:3px 8px; border-radius:4px;">customers.id ("FAKE-119") ≠ invoices.customer_id ("RANDOM-842")</code> &rarr; <strong style="color:#FF7B72;">0 registros retornados!</strong></span><span style="color:#FF7B72; font-weight:700;">Ambiente Quebrado</span>';
        }
        if (statusText) {
          statusText.innerHTML = '<span style="color: #FF7B72;"><strong style="color: #FF7B72;">O Desastre do Mascaramento Comum:</strong> Os valores foram gerados aleatoriamente sem determinismo. As tabelas se desconectaram e qualquer teste que dependa de JOIN falha imediatamente.</span>';
        }
      } else if (mode === 'real') {
        // REAL DATA / PRODUCTION
        if (elPId1) elPId1.textContent = rawData.pId1;
        if (elPName1) elPName1.textContent = rawData.pName1;
        if (elPCpf1) elPCpf1.textContent = rawData.pCpf1;
        if (elOFk1) elOFk1.textContent = rawData.oFk1;

        if (elPId2) elPId2.textContent = rawData.pId2;
        if (elOFk2) elOFk2.textContent = rawData.oFk2;

        if (joinBanner) {
          joinBanner.className = 'join-bridge-banner join-warning';
          joinBanner.innerHTML = '<span><strong style="color:#FFB74D;">⚠ DADOS DE PRODUÇÃO EM CLARO:</strong> <code style="color:#FFFFFF; background:rgba(0,0,0,0.65); border:1px solid rgba(255,183,77,0.5); padding:3px 8px; border-radius:4px;">customers.id (1042) == invoices.customer_id (1042)</code></span><span style="color:#FFB74D; font-weight:700;">Risco Grave de Multa LGPD</span>';
        }
        if (statusText) {
          statusText.innerHTML = '<span style="color: #FFB74D;"><strong style="color: #FFB74D;">Atenção:</strong> Dados reais de produção contendo CPF e Nome de clientes expostos em testes. Sujeito a sanções regulatórias e vazamento.</span>';
        }
      }

      if (kmsLabel) kmsLabel.textContent = k.name;
    }

    if (btnTessera) {
      btnTessera.addEventListener('click', function() {
        mode = 'tessera';
        updateView();
      });
    }

    if (btnNaive) {
      btnNaive.addEventListener('click', function() {
        mode = 'naive';
        updateView();
      });
    }

    if (btnReal) {
      btnReal.addEventListener('click', function() {
        mode = 'real';
        updateView();
      });
    }

    if (btnKey) {
      btnKey.addEventListener('click', function() {
        keyIndex = (keyIndex + 1) % KEYS.length;
        mode = 'tessera';
        updateView();
      });
    }

    // Default to Tessera
    mode = 'tessera';
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

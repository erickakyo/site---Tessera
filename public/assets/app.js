// TESSERA — Interactive Scripts & Bilingual I18n Engine
(function() {
  'use strict';

  // Translations Dictionary
  const translations = {
    pt: {
      nav_products: "Produtos",
      nav_about: "Quem Somos",
      nav_blog: "Blog & Insights",
      nav_contact: "Contato",
      nav_demo: "Agendar Demo",
      eyebrow_hero: "DATA ENVIRONMENT AUTOMATION",
      hero_title: "Dados com fidelidade de produção. Sem o risco de produção.",
      hero_desc: "A Tessera automatiza como dados protegidos e realistas são descobertos, mascarados, reduzidos e entregues para engenharia, testes e IA agêntica.",
      btn_explore: "Explorar Arquitetura",
      problem_eyebrow: "O GARGALO DA ENGENHARIA",
      problem_title: "Seu código e sua infra aceleraram. Seus dados continuam lentos.",
      problem_desc: "Enquanto CI/CD, nuvem e agentes de IA automatizaram o software, ambientes de dados não-produtivos ainda dependem de scripts manuais, tickets para DBAs e réplicas brutas de produção com dados sensíveis expostos.",
      demo_title: "Simulação Interativa de Ambientes de Dados",
      demo_desc: "Alterne os módulos para ver como a Tessera isola fatias íntegras, neutraliza PII e preserva as relações relacionais.",
      ready_badge: "PRONTO",
      core_badge: "CORE PRONTO",
      hardening_badge: "EM HARDENING",
      roadmap_badge: "ROADMAP",
      cookie_text: "Utilizamos cookies técnicos mínimos e anonimizados para aprimorar sua experiência e avaliar o desempenho do site, em conformidade com a LGPD e GDPR.",
      cookie_accept: "Aceitar",
      cookie_decline: "Recusar"
    },
    en: {
      nav_products: "Products",
      nav_about: "About Us",
      nav_blog: "Blog & Insights",
      nav_contact: "Contact",
      nav_demo: "Request Demo",
      eyebrow_hero: "DATA ENVIRONMENT AUTOMATION",
      hero_title: "Production-like data. Without production risk.",
      hero_desc: "Tessera automates how realistic, protected data is discovered, masked, subsetted, and delivered for modern engineering, QA, and AI agents.",
      btn_explore: "Explore Architecture",
      problem_eyebrow: "THE ENGINEERING BOTTLENECK",
      problem_title: "Your code and infra moved fast. Your data environments didn't.",
      problem_desc: "While CI/CD, cloud, and AI agents automated software, non-production data environments still rely on manual scripts, DBA tickets, and full production copies with exposed PII.",
      demo_title: "Interactive Data Environment Simulator",
      demo_desc: "Toggle modules to witness how Tessera isolates referential slices, neutralizes PII, and guarantees relational integrity.",
      ready_badge: "READY",
      core_badge: "CORE COMPLETE",
      hardening_badge: "HARDENING",
      roadmap_badge: "ROADMAP",
      cookie_text: "We use minimal and anonymized technical cookies to enhance navigation and performance, adhering to LGPD and GDPR standards.",
      cookie_accept: "Accept",
      cookie_decline: "Decline"
    }
  };

  let currentLang = 'pt';
  try {
    currentLang = localStorage.getItem('tessera_lang') || 'pt';
  } catch (e) {
    currentLang = 'pt';
  }

  window.setLanguage = function(lang) {
    currentLang = lang;
    try {
      localStorage.setItem('tessera_lang', lang);
    } catch (e) {}

    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';

    // Update active button classes
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // Update translatable elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[lang] && translations[lang][key]) {
        el.textContent = translations[lang][key];
      }
    });
  };

  // Interactive Demo Simulation
  window.demoState = {
    subset: true,
    mask: true,
    cdc: false
  };

  window.setDemoTab = function(module) {
    document.querySelectorAll('.demo-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.module === module);
    });

    const targetOutput = document.getElementById('demo-target-output');
    const logOutput = document.getElementById('demo-log');
    const targetDbView = document.getElementById('target-db-view');
    const flowLabelText = document.getElementById('flow-label-text');
    const targetStatText = document.getElementById('target-stat-text');
    const targetBadge = document.getElementById('target-badge');
    const outputTitle = document.getElementById('output-panel-title');

    if (!targetOutput || !logOutput || !targetDbView) return;

    if (module === 'subset') {
      if (flowLabelText) flowLabelText.textContent = "Tarjan SCC Waves Extraindo Seed";
      if (targetBadge) {
        targetBadge.textContent = "SUBSET REFERENCIAL";
        targetBadge.style.background = "rgba(126,231,135,0.2)";
        targetBadge.style.color = "#7EE787";
      }
      if (targetStatText) targetStatText.textContent = "Volume reduzido em 96.4% · FKs íntegras (Tarjan Waves)";

      targetDbView.innerHTML = `
        <div class="row-item row-target-ready">
          <span class="col-id">#1002</span>
          <span class="col-pii" style="color: #FF7B72;">carlos.eduardo@corp.com</span>
          <span class="col-cpf" style="color: #FF7B72;">890.124.908-55</span>
          <span class="col-amt">$1,250.00</span>
        </div>
        <div class="row-item row-target-ready" style="animation-delay: 0.15s;">
          <span class="col-id">#FK-29</span>
          <span style="color: #A6A3B8;">accounts.id: 1002</span>
          <span style="color: #A6A3B8;">orders.ref: #9042</span>
          <span class="col-amt">Status: ACTIVE</span>
        </div>
      `;

      logOutput.textContent = "> Iniciando resolvedor de grafo Tarjan SCC...\n> Semente relacional: customer_id = 1002\n> Mapeando Foreign Keys: 'accounts', 'orders', 'transactions'\n> Ciclos de dependência quebrados em ondas (Wave 1 & Wave 2)\n> 96.4% de redução de volume preservando integridade referencial.";
      
      if (outputTitle) outputTitle.textContent = "Schema de Destino (DEV / QA)";
      targetOutput.innerHTML = `
        <table>
          <thead>
            <tr><th>tabela</th><th>registros</th><th>status fk</th><th>redução</th></tr>
          </thead>
          <tbody>
            <tr><td>customers</td><td>1</td><td><span class="val-masked">Consistente</span></td><td>99.9%</td></tr>
            <tr><td>accounts</td><td>2</td><td><span class="val-masked">Consistente</span></td><td>99.8%</td></tr>
            <tr><td>orders</td><td>5</td><td><span class="val-masked">Consistente</span></td><td>98.5%</td></tr>
          </tbody>
        </table>
      `;
    } else if (module === 'mask') {
      if (flowLabelText) flowLabelText.textContent = "FF1 NIST Criptografia Preservando Formato";
      if (targetBadge) {
        targetBadge.textContent = "PII NEUTRALIZADA";
        targetBadge.style.background = "rgba(107,75,240,0.25)";
        targetBadge.style.color = "#8A6BFF";
      }
      if (targetStatText) targetStatText.textContent = "Chave AWS KMS · Saídas determinísticas byte-idênticas";

      targetDbView.innerHTML = `
        <div class="row-item row-target-ready">
          <span class="col-id">#1002</span>
          <span class="val-masked" style="font-size: 0.75rem;">k.morris_49@anondata.io</span>
          <span class="val-masked" style="font-size: 0.75rem;">392.481.029-44</span>
          <span class="col-amt">$1,250.00</span>
        </div>
        <div class="row-item row-target-ready" style="animation-delay: 0.15s;">
          <span class="col-id">#FK-29</span>
          <span style="color: #A6A3B8;">accounts.id: 1002</span>
          <span style="color: #7EE787;">CC: 4532-****-****-8819</span>
          <span class="col-amt">Status: ACTIVE</span>
        </div>
      `;

      logOutput.textContent = "> Motor de Mascaramento Determinístico Key-Driven Ativo\n> Algoritmo: FF1 (NIST SP 800-38G) + SHA-256 Format Salt\n> Provedor de Chave: AWS KMS (ARN: .../tessera-prod-key)\n> Validação: CPF com dígito verificador íntegro, Luhn verificado em cartões\n> Saídas byte-idênticas entre todas as réplicas e microsserviços.";

      if (outputTitle) outputTitle.textContent = "Auditoria Criptográfica de Campos";
      targetOutput.innerHTML = `
        <table>
          <thead>
            <tr><th>campo</th><th>tipo</th><th>saída transformada</th><th>algoritmo</th></tr>
          </thead>
          <tbody>
            <tr><td>email</td><td>VARCHAR</td><td><span class="val-masked">k.morris_49@anondata.io</span></td><td>Email Mapping</td></tr>
            <tr><td>cpf</td><td>VARCHAR</td><td><span class="val-masked">392.481.029-44</span></td><td>Mod Checksum</td></tr>
            <tr><td>cartao</td><td>CHAR(16)</td><td><span class="val-masked">4532-****-****-8819</span></td><td>FF1 Luhn Valid</td></tr>
          </tbody>
        </table>
      `;
    } else if (module === 'cdc') {
      if (flowLabelText) flowLabelText.textContent = "pgoutput LSN0 Stream & Snapshot";
      if (targetBadge) {
        targetBadge.textContent = "CANONICAL JSONL";
        targetBadge.style.background = "rgba(14,134,173,0.25)";
        targetBadge.style.color = "#0E86AD";
      }
      if (targetStatText) targetStatText.textContent = "Destino: s3://tessera-lake/incremental/ (Sem Kafka/Debezium)";

      targetDbView.innerHTML = `
        <div class="row-item row-target-ready" style="grid-template-columns: 1fr;">
          <span style="color: #7EE787; font-size: 0.7rem; font-family: var(--font-mono);">
            {"lsn": "0/16B3AA0", "op": "u", "table": "orders", "ts": "2026-09-09T21:10:04Z", "data": {"id": 102, "status": "COMPLETED"}}
          </span>
        </div>
        <div class="row-item row-target-ready" style="grid-template-columns: 1fr; animation-delay: 0.15s;">
          <span style="color: #8A6BFF; font-size: 0.7rem; font-family: var(--font-mono);">
            {"lsn": "0/16B3AA8", "op": "i", "table": "audit_log", "ts": "2026-09-09T21:10:04Z", "data": {"event": "PAYMENT_SETTLED"}}
          </span>
        </div>
      `;

      logOutput.textContent = "> ChangeSource PostgreSQL 16+ conectado via pgoutput (replicação lógica)\n> Coordinator fixou ponto LSN0: 0/16B3A98\n> Snapshot MVCC-consistente finalizado para arquivos canônicos\n> Stream incremental com commit ordering gravando em S3\n> Zero gap, zero overlap, efetivamente once com marcadores no storage.";

      if (outputTitle) outputTitle.textContent = "Verificação de Eventos Stream";
      targetOutput.innerHTML = `
        <div style="font-size: 0.75rem; line-height: 1.6; color: #7EE787;">
          <span style="color: #848096;">[LSN0: 0/16B3A98]</span> Coordenador inicializado com sucesso.<br>
          <span style="color: #848096;">[Storage Marker]</span> s3://tessera-lake/incremental/2026-09-09/chunk_042.jsonl<br>
          <span style="color: #8A6BFF;">[DDL Event]</span> ALTER TABLE orders ADD COLUMN idempotency_key VARCHAR(64);<br>
          <span style="color: #7EE787;">Status: Stream contínuo ativo (latência &lt; 200ms)</span>
        </div>
      `;
    }
  };

  // Cookie Notice Management
  function initCookieNotice() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    try {
      if (!localStorage.getItem('tessera_cookie_consent')) {
        banner.style.display = 'block';
      }
    } catch (e) {
      banner.style.display = 'block';
    }
  }

  window.acceptCookies = function() {
    try {
      localStorage.setItem('tessera_cookie_consent', 'accepted');
    } catch (e) {}
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.style.display = 'none';
      banner.remove();
    }
  };

  window.declineCookies = function() {
    try {
      localStorage.setItem('tessera_cookie_consent', 'declined');
    } catch (e) {}
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.style.display = 'none';
      banner.remove();
    }
  };

  // On DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    window.setLanguage(currentLang);
    initCookieNotice();
    if (document.getElementById('demo-target-output')) {
      window.setDemoTab('subset');
    }
  });
})();

  // Mobile Hamburger Menu Toggle with Backdrop
  window.toggleMobileMenu = function() {
    const nav = document.querySelector('nav.main-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    const backdrop = document.querySelector('.mobile-menu-backdrop');
    if (nav) {
      nav.classList.toggle('open');
      const isOpen = nav.classList.contains('open');
      if (btn) {
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
      if (backdrop) {
        backdrop.classList.toggle('open', isOpen);
      }
      document.body.style.overflow = isOpen ? 'hidden' : '';
    }
  };

  // Close mobile menu when clicking a link or backdrop & handle event delegation for controls
  document.addEventListener('click', (e) => {
    // 0. Cookie banner actions delegation
    if (e.target.closest('button[onclick*="acceptCookies"]') || e.target.getAttribute('data-i18n') === 'cookie_accept') {
      window.acceptCookies();
      return;
    }
    if (e.target.closest('button[onclick*="declineCookies"]') || e.target.getAttribute('data-i18n') === 'cookie_decline') {
      window.declineCookies();
      return;
    }

    // 1. Mobile menu closing
    const nav = document.querySelector('nav.main-nav');
    const btn = document.querySelector('.mobile-menu-btn');
    const backdrop = document.querySelector('.mobile-menu-backdrop');
    if (nav && nav.classList.contains('open')) {
      if (e.target.closest('nav.main-nav a') || e.target.classList.contains('mobile-menu-backdrop') || (!e.target.closest('nav.main-nav') && !e.target.closest('.mobile-menu-btn') && !e.target.closest('#cookie-banner'))) {
        nav.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    }

    // 2. Demo simulator tabs delegation
    const demoBtn = e.target.closest('.demo-tab-btn');
    if (demoBtn && demoBtn.dataset.module) {
      if (typeof window.setDemoTab === 'function') {
        window.setDemoTab(demoBtn.dataset.module);
      }
    }

    // 3. Train toggle buttons delegation
    const trainBtn = e.target.closest('.train-toggle-btn');
    if (trainBtn) {
      if (trainBtn.id === 'btn-train-bottleneck' || trainBtn.getAttribute('onclick')?.includes('bottleneck')) {
        if (typeof window.setTrainState === 'function') {
          window.setTrainState('bottleneck');
        }
      } else if (trainBtn.id === 'btn-train-tessera' || trainBtn.getAttribute('onclick')?.includes('tessera')) {
        if (typeof window.setTrainState === 'function') {
          window.setTrainState('tessera');
        }
      }
    }
  });

  // Train Analogy Interactive Switcher (Flicker-Free Layer Toggle & Mobile Scroll Alignment)
  function alignTrainRightOnMobile() {
    const scrollWrapper = document.getElementById('train-scroll-wrapper');
    if (scrollWrapper && window.innerWidth <= 960) {
      setTimeout(() => {
        scrollWrapper.scrollLeft = scrollWrapper.scrollWidth - scrollWrapper.clientWidth;
      }, 100);
    }
  }

  window.setTrainState = function(state) {
    const btnBottleneck = document.getElementById('btn-train-bottleneck');
    const btnTessera = document.getElementById('btn-train-tessera');
    const carriageBottleneck = document.getElementById('train-state-bottleneck');
    const carriageTessera = document.getElementById('train-state-tessera');
    const railPrimary = document.getElementById('train-rail-primary');
    const railSecondary = document.getElementById('train-rail-secondary');
    const feedbackText = document.getElementById('train-feedback-text');

    if (state === 'bottleneck') {
      if (btnBottleneck) btnBottleneck.classList.add('active');
      if (btnTessera) btnTessera.classList.remove('active');
      if (carriageBottleneck) {
        carriageBottleneck.style.display = 'block';
        carriageBottleneck.style.opacity = '1';
      }
      if (carriageTessera) {
        carriageTessera.style.display = 'none';
        carriageTessera.style.opacity = '0';
      }
      if (railPrimary) railPrimary.setAttribute('stroke', '#3A3654');
      if (railSecondary) railSecondary.setAttribute('stroke', '#221F38');

      if (feedbackText) {
        feedbackText.textContent = "Sem automação de dados, tudo que depende deles desacelera.";
        feedbackText.style.color = "#FF7B72";
      }
    } else {
      if (btnTessera) btnTessera.classList.add('active');
      if (btnBottleneck) btnBottleneck.classList.remove('active');
      if (carriageTessera) {
        carriageTessera.style.display = 'block';
        carriageTessera.style.opacity = '1';
      }
      if (carriageBottleneck) {
        carriageBottleneck.style.display = 'none';
        carriageBottleneck.style.opacity = '0';
      }
      if (railPrimary) railPrimary.setAttribute('stroke', '#0E86AD');
      if (railSecondary) railSecondary.setAttribute('stroke', '#6B4BF0');

      if (feedbackText) {
        feedbackText.textContent = "Com a Tessera: a automação de dados acompanha a velocidade da IA e do código.";
        feedbackText.style.color = "#7EE787";
      }
    }
  };

  // Align train on initial page load if mobile
  window.addEventListener('load', alignTrainRightOnMobile);
  window.addEventListener('resize', alignTrainRightOnMobile);

/* Kit Contrato Fácil — aplicação: roteamento e telas */
(function () {
  'use strict';
  const K = window.KCF;
  const { $, $$, esc } = K;
  const view = $('#view');

  const STATUS = {
    rascunho: { label: 'Rascunho', cls: 'st-draft' },
    revisao: { label: 'Em revisão', cls: 'st-review' },
    conferido: { label: 'Conferido', cls: 'st-ok' },
  };
  const CHIP = {
    ok: ['ok', '✓', 'Encontrado'],
    warn: ['warn', '!', 'Atenção'],
    fail: ['fail', '✕', 'Problema'],
    manual: ['manual', '👁', 'Conferência manual'],
  };
  const badge = (st) => `<span class="badge ${STATUS[st].cls}">${STATUS[st].label}</span>`;
  const chip = (st) => `<span class="chip ${CHIP[st][0]}"><span aria-hidden="true">${CHIP[st][1]}</span> ${CHIP[st][2]}</span>`;
  const typeOf = (tipo) => K.TYPES[tipo] || K.TYPES.servicos;
  const typeChip = (tipo) => `<span class="type-chip">${typeOf(tipo).icon} ${esc(typeOf(tipo).label)}</span>`;
  const parties = (d) => `${esc((d.fields && d.fields.p1 && d.fields.p1.nome) || '—')} <span class="x">×</span> ${esc((d.fields && d.fields.p2 && d.fields.p2.nome) || '—')}`;
  const pageHead = (eyebrow, title, text, right = '') =>
    `<section class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${text}</p></div>${right}</section>`;
  const notFound = (title, msg) =>
    `<section class="section"><div class="empty"><div class="ico">🔎</div><h3>${esc(title)}</h3><p>${esc(msg)}</p><a class="btn primary" href="#/documentos">Ir para Meus documentos</a></div></section>`;
  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setPath = (o, p, v) => {
    const ks = p.split('.');
    let a = o;
    ks.slice(0, -1).forEach((k) => { a[k] = a[k] || {}; a = a[k]; });
    a[ks[ks.length - 1]] = v;
  };

  /* =====================================================================
   * Roteador (hash): #/inicio, #/novo[/tipo], #/documentos[/situacao],
   *                  #/editor/:id[/:clausula], #/glossario
   * O checklist fica dentro do editor (painel lateral).
   * ===================================================================== */
  let cleanup = null;
  const routes = { entrar: viewEntrar, inicio: viewHome, novo: viewNovo, documentos: viewDocs, editor: viewEditor, glossario: viewGlossario, planos: viewPlanos, kit: viewKit };
  function router(e) {
    // Âncoras internas (ex.: link "Pular para o conteúdo") não trocam de tela.
    if (e && location.hash && !location.hash.startsWith('#/')) return;
    if (cleanup) { try { cleanup(); } catch (e) { /* ignora */ } cleanup = null; }
    K.closeModal(null);
    const parts = location.hash.replace(/^#\/?/, '').split('/').map((s) => decodeURIComponent(s));
    // Links antigos da tela de checklist levam ao editor do documento.
    if (parts[0] === 'checklist') { location.replace(parts[1] ? '#/editor/' + parts[1] : '#/documentos'); return; }
    let r = parts[0] || 'inicio';
    if (!routes[r]) r = 'inicio';
    // Antes do site, a tela de entrada (login ou "Continuar sem login").
    if (r !== 'entrar' && K.gate.needed()) {
      K.gate.target = location.hash && location.hash.startsWith('#/') ? location.hash : '#/inicio';
      location.replace('#/entrar');
      return;
    }
    if (r === 'entrar' && K.auth.current()) { location.replace('#/inicio'); return; }
    document.body.dataset.route = r;
    $$('#mainNav a').forEach((a) => a.classList.toggle('active', a.dataset.route === (r === 'editor' ? 'documentos' : r)));
    $('#mainNav').classList.remove('open');
    $('#menuToggle').setAttribute('aria-expanded', 'false');
    window.scrollTo(0, 0);
    routes[r](...parts.slice(1));
    const h1 = view.querySelector('h1');
    const name = r === 'entrar' ? 'Entrar' : r === 'planos' ? 'Planos' : h1 && r !== 'inicio' ? h1.textContent.trim() : '';
    document.title = (name ? name + ' · ' : '') + 'Kit Contrato Fácil';
  }

  /* =====================================================================
   * Componentes compartilhados
   * ===================================================================== */
  function docCard(d) {
    const s = K.summary(d);
    const pct = Math.round((s.done / s.total) * 100);
    return `<article class="doc-card" data-id="${d.id}">
      <div class="doc-card-top">${typeChip(d.tipo)}${badge(s.status)}</div>
      <h3><a href="#/editor/${d.id}">${esc(d.title)}</a></h3>
      <p class="parties">${parties(d)}</p>
      <div class="mini-progress" aria-label="Checklist ${s.done} de ${s.total}"><div style="width:${pct}%"></div></div>
      <div class="doc-meta"><span>Checklist ${s.done}/${s.total}${s.fails ? ` · <b class="txt-fail">${s.fails} problema(s)</b>` : ''}${s.warns ? ` · <b class="txt-warn">${s.warns} atenção</b>` : ''}</span><span title="${new Date(d.updatedAt).toLocaleString('pt-BR')}">${K.relTime(d.updatedAt)}</span></div>
      ${d.mock ? `<span class="mock-tag" title="${esc(d.note || 'Documento de exemplo')}">Exemplo</span>` : ''}
      <div class="doc-actions">
        <a class="btn sm primary" href="#/editor/${d.id}">Abrir e editar</a>
        <button class="btn sm ghost" data-act="dup" title="Duplicar">Duplicar</button>
        <button class="btn sm ghost" data-act="export" title="Exportar">Exportar</button>
        <button class="btn sm ghost danger-txt" data-act="del" title="Excluir">Excluir</button>
      </div>
    </article>`;
  }

  function bindDocActions(root, refresh) {
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const card = b.closest('[data-id]');
      const doc = card && K.store.get(card.dataset.id);
      if (!doc) return;
      const act = b.dataset.act;
      if (act === 'dup') {
        const c = K.duplicateDoc(doc);
        K.store.upsert(c);
        K.toast('Cópia criada: ' + c.title);
        refresh();
      } else if (act === 'export') {
        exportDialog(doc);
      } else if (act === 'del') {
        const ok = await K.confirm('Excluir documento', `“${doc.title}” será excluído deste navegador. Essa ação não pode ser desfeita.`, 'Excluir', true);
        if (ok) { K.store.remove(doc.id); K.toast('Documento excluído.'); refresh(); }
      }
    });
  }

  const WM = 'Documento gerado no plano Grátis do Kit Contrato Fácil. Material educativo — não substitui a análise de um profissional.';
  function exportDialog(doc) {
    const marca = K.plan.info().marca;
    K.modal({
      title: 'Exportar documento',
      html: `<p class="muted">Escolha o formato de “${esc(doc.title)}”.</p>
      <div class="export-grid">
        <button class="export-opt" data-x="pdf"><b>📄 PDF / Imprimir</b><span>Abre a impressão. Escolha “Salvar como PDF”.</span></button>
        <button class="export-opt" data-x="doc"><b>📝 Word (.doc)</b><span>Abre no Word ou Google Docs para ajustes finais.</span></button>
        <button class="export-opt" data-x="txt"><b>🗒️ Texto (.txt)</b><span>Texto simples, sem formatação.</span></button>
        <button class="export-opt" data-x="copy"><b>📋 Copiar texto</b><span>Copia o contrato para colar em outro lugar.</span></button>
      </div>
      ${K.summary(doc).status !== 'conferido' ? '<p class="notice warn sm">Este documento ainda não foi totalmente conferido no checklist.</p>' : ''}
      ${marca ? `<p class="notice sm">Plano Grátis: os arquivos saem com uma marca d’água no rodapé. <button type="button" class="link" data-upsell>Exportar sem marca d’água</button></p>` : ''}`,
    });
    $$('#modalRoot [data-x]').forEach((b) =>
      b.addEventListener('click', async () => {
        const x = b.dataset.x;
        K.closeModal(null);
        const wmHTML = marca ? `<p class="watermark">${esc(WM)}</p>` : '';
        const wmTXT = marca ? '\n\n— ' + WM + '\n' : '';
        if (x === 'pdf') K.printHTML(`<div class="paper">${K.renderPaper(doc)}${wmHTML}</div>`);
        if (x === 'doc') { K.download(K.slug(doc.title) + '.doc', K.docWord(doc).replace('</body>', wmHTML + '</body>'), 'application/msword'); K.toast('Arquivo .doc baixado.'); }
        if (x === 'txt') { K.download(K.slug(doc.title) + '.txt', K.docText(doc) + wmTXT, 'text/plain;charset=utf-8'); K.toast('Arquivo .txt baixado.'); }
        if (x === 'copy') { await K.copy(K.docText(doc) + wmTXT); K.toast('Texto copiado para a área de transferência.'); }
      })
    );
    const up = $('#modalRoot [data-upsell]');
    if (up) up.addEventListener('click', () => K.upsell('marca'));
  }

  /* =====================================================================
   * Tela: Início
   * ===================================================================== */
  function viewHome() {
    const docs = K.store.load();
    const sts = docs.map((d) => K.summary(d).status);
    const count = (st) => sts.filter((s) => s === st).length;
    const recent = [...docs].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
    const step = (n, t, p) => `<article class="step-card"><div class="num">${n}</div><h3>${t}</h3><p>${p}</p></article>`;
    view.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <div class="eyebrow light">Organização · Clareza · Praticidade</div>
        <h1>Contratos mais simples. Decisões mais claras.</h1>
        <p>Gere uma minuta a partir de um formulário guiado, edite cada cláusula livremente e confira tudo com um checklist que lê o próprio texto do contrato.</p>
        <div class="actions">
          <a class="btn white" href="#/novo">Criar novo contrato →</a>
          <a class="btn outline-light" href="#/documentos">Meus documentos (${docs.length})</a>
        </div>
      </div>
      <div class="hero-card" aria-hidden="true">
        <div class="hc-label">Prévia · Prestação de serviços</div>
        <div class="hc-title">CONTRATO DE PRESTAÇÃO DE SERVIÇOS</div>
        <div class="line"></div><div class="line w80"></div><div class="line w60"></div>
        <ul class="hc-checks">
          <li class="ok"><span>✓</span> CNPJs válidos das duas partes</li>
          <li class="ok"><span>✓</span> Valor confere com o extenso</li>
          <li class="warn"><span>!</span> 1 campo a preencher</li>
        </ul>
      </div>
    </section>
    <div class="stats">
      <a href="#/documentos"><b>${docs.length}</b><small>Documentos salvos</small></a>
      <a href="#/documentos/rascunho"><b>${count('rascunho')}</b><small>Rascunhos</small></a>
      <a href="#/documentos/revisao"><b>${count('revisao')}</b><small>Em revisão</small></a>
      <a href="#/documentos/conferido"><b>${count('conferido')}</b><small>Conferidos</small></a>
    </div>
    <section class="section">
      <div class="head"><div class="eyebrow">Comece por aqui</div><h2>Qual contrato você precisa?</h2><p>Escolha uma categoria para abrir o formulário já configurado para ela.</p></div>
      <div class="type-grid">${Object.entries(K.TYPES).map(([k, t]) => `<a class="type-tile ${t.pro ? 'is-pro' : ''}" href="#/novo/${k}">${t.pro ? '<span class="pro-tag">PRO</span>' : ''}<span class="ico">${t.icon}</span><b>${esc(t.label)}</b><small>${esc(t.desc)}</small></a>`).join('')}</div>
    </section>
    ${recent.length ? `<section class="section alt">
      <div class="head row"><div><div class="eyebrow">Seus documentos</div><h2>Continue de onde parou</h2></div><a class="btn ghost" href="#/documentos">Ver todos →</a></div>
      <div class="doc-grid" id="recent">${recent.map(docCard).join('')}</div>
    </section>` : ''}
    <section class="section">
      <div class="head"><div class="eyebrow">Como utilizar</div><h2>Do formulário à conferência</h2></div>
      <div class="steps">
        ${step('01', 'Escolha', 'Selecione a categoria que corresponde à finalidade do acordo.')}
        ${step('02', 'Preencha', 'Informe partes, objeto, valores e prazos. A prévia do contrato é montada ao vivo.')}
        ${step('03', 'Edite', 'Abra o documento e ajuste livremente qualquer cláusula, título ou trecho.')}
        ${step('04', 'Confira', 'Marque o checklist item a item. No Pro, ele lê o texto e aponta sozinho pendências, CPF/CNPJ inválidos e valores divergentes.')}
      </div>
      <div class="assist-banner">
        <div class="ab-ico" aria-hidden="true">💬</div>
        <div><b>Ficou com dúvida? Pergunte ao assistente jurídico.</b><p>Ele explica termos, encontra pendências no contrato aberto e sugere cláusulas prontas.</p></div>
        <button class="btn primary" data-open-assistant>Abrir assistente</button>
      </div>
    </section>
    <section class="section plans-teaser">
      <div class="pt-text">
        <div class="eyebrow light">Planos</div>
        <h2>Comece grátis. Evolua quando precisar.</h2>
        <p>No Grátis você cria ${K.PLANS.gratis.docs} contratos por mês com editor e checklist. O Pro libera os 10 tipos de contrato, a análise automática e o revisor por ${K.price(K.PLANS.pro.mensal)}/mês.</p>
      </div>
      <div class="actions"><a class="btn white" href="#/planos">Ver planos e preços →</a></div>
    </section>
    <section class="section alt">
      <div class="head"><div class="eyebrow">Conheça a proposta</div><h2>Um kit. Três formas de ajudar.</h2><p>O conceito acadêmico reúne modelos de documentos, conferência de informações e explicações acessíveis em uma única solução.</p></div>
      <div class="cards">
        <a class="card" href="#/novo"><div class="ico">▤</div><h3>Modelos de contratos</h3><p>Cinco categorias com cláusulas prontas, preenchidas a partir das suas respostas.</p></a>
        <a class="card" href="#/documentos"><div class="ico">☑</div><h3>Checklist de conferência</h3><p>Dentro do editor: verificação automática de dados, valores, prazos e obrigações, com confirmação manual.</p></a>
        <a class="card" href="#/glossario"><div class="ico">Aa</div><h3>Explicações simplificadas</h3><p>Glossário com termos destacados direto no texto do contrato.</p></a>
      </div>
      <div class="metrics">
        <div><b>5 categorias</b><small>Tipos de contrato previstos</small></div>
        <div><b>Até 50</b><small>Modelos na proposta física</small></div>
        <div><b>3 recursos</b><small>Modelo, checklist e explicação</small></div>
      </div>
      <div class="team">
        <div><div class="eyebrow">Equipe do projeto</div><p class="muted sm">Projeto acadêmico — Desenvolvimento de Produto</p></div>
        <ul>${['Amanda Lima da Mata', 'Beatriz Aparecida Moreira', 'Isadora Nagahara Kumagai', 'Natalie Camargo Alberto'].map((n) => `<li><span class="avatar" aria-hidden="true">${n.split(' ').filter((w, i, a) => i === 0 || i === a.length - 1).map((w) => w[0]).join('')}</span>${esc(n)}</li>`).join('')}</ul>
      </div>
      <div class="notice"><b>Sobre o projeto:</b> a proposta original prevê uma pasta física de aproximadamente 32 × 24 × 6 cm, feita principalmente de papelão rígido e papel reciclado. Este site é uma demonstração digital complementar. <a href="#/kit"><b>Ver o que vem no kit físico →</b></a></div>
    </section>`;
    const rc = $('#recent');
    if (rc) bindDocActions(rc, viewHome);
  }

  /* =====================================================================
   * Tela de entrada: aparece antes do site (login simulado ou "Continuar sem login") e mostra os planos
   * ===================================================================== */
  function viewEntrar() {
    const render = () => {
      view.innerHTML = `
      <div class="gate">
        <section class="gate-hero">
          <div class="gate-intro">
            <div class="gate-brand"><img src="assets/img/logo.svg" alt="" width="64" height="64"><span class="wordmark"><small>Kit</small><span>Contrato <em>Fácil</em></span></span></div>
            <h1>Contratos mais simples. Decisões mais claras.</h1>
            <p>Gere minutas com um formulário guiado, edite cada cláusula e confira tudo com o checklist. Entre na sua conta ou continue sem login para conhecer o site.</p>
            <a class="gate-down" href="#planos-gate" data-scroll-plans>Ver os planos ↓</a>
          </div>
          <div class="auth-card" id="authCard">${authCardHTML(null)}</div>
        </section>
        <section class="section gate-plans" id="planos-gate">
          <div class="head center"><div class="eyebrow">Planos</div><h2>Comece grátis. Evolua quando precisar.</h2><p>O Grátis já cria contratos com editor e checklist. O Pro libera os 10 tipos de contrato, a análise automática e o revisor.</p></div>
          ${plansCardsHTML()}
        </section>
        <p class="gate-foot">Projeto acadêmico — Desenvolvimento de Produto · Amanda Lima da Mata, Beatriz Aparecida Moreira, Isadora Nagahara Kumagai e Natalie Camargo Alberto</p>
      </div>`;
      bindAuthCard($('#authCard'));
      $('#planos-gate').addEventListener('click', (e) => {
        const b = e.target.closest('[data-plan]');
        if (b) planAction(b.dataset.plan, b.dataset.ciclo, render);
      });
      $('[data-scroll-plans]').addEventListener('click', (e) => { e.preventDefault(); $('#planos-gate').scrollIntoView({ behavior: 'smooth' }); });
    };
    render();
    document.title = 'Entrar · Kit Contrato Fácil';
  }

  /* ---------- Cartão de login (simulado e opcional) ---------- */
  function authCardHTML(sess) {
    if (sess) {
      return `<div class="auth-hello"><span class="avatar lg" aria-hidden="true">${esc((sess.nome.trim()[0] || '?').toUpperCase())}</span>
          <div><small>Que bom ter você aqui</small><b>Olá, ${esc(K.auth.firstName())}!</b><span class="muted sm">Plano ${esc(K.plan.label())}</span></div></div>
        <div class="auth-links"><a class="btn primary full" href="#/novo">Criar novo contrato</a><a class="btn ghost full" href="#/documentos">Meus documentos</a></div>
        <button type="button" class="link center-link" data-logout>Sair da conta</button>`;
    }
    return `<div class="auth-tabs" role="tablist" aria-label="Acesso">
        <button type="button" role="tab" data-auth-tab="entrar" class="on" aria-selected="true">Entrar</button>
        <button type="button" role="tab" data-auth-tab="criar" aria-selected="false">Criar conta</button>
      </div>
      <form class="auth-form" id="loginForm" novalidate>
        <div class="field"><label for="loginUser">Usuário ou e-mail</label><input id="loginUser" autocomplete="username"></div>
        <div class="field"><label for="loginPass">Senha</label><input id="loginPass" type="password" autocomplete="current-password"></div>
        <small class="err" id="loginErr" role="alert"></small>
        <button class="btn primary full" type="submit">Entrar</button>
        <p class="auth-demo">Para testar: usuário <b>${K.auth.DEMO_USER}</b> e senha <b>${K.auth.DEMO_PASS}</b>. <button type="button" class="link" data-fill-demo>Preencher</button></p>
      </form>
      <form class="auth-form" id="signupForm" novalidate hidden>
        <div class="field"><label for="suNome">Nome</label><input id="suNome" autocomplete="name"></div>
        <div class="field"><label for="suUser">Usuário ou e-mail</label><input id="suUser" autocomplete="username"></div>
        <div class="field"><label for="suPass">Senha (mínimo 6 caracteres)</label><input id="suPass" type="password" autocomplete="new-password"></div>
        <small class="err" id="signupErr" role="alert"></small>
        <button class="btn primary full" type="submit">Criar conta</button>
      </form>
      <div class="auth-or"><span>ou</span></div>
      <button type="button" class="btn ghost full" data-continue>Continuar sem login →</button>
      <p class="auth-note">Login simulado para a demonstração: os dados ficam só neste navegador. Não use uma senha real.</p>`;
  }

  function bindAuthCard(card) {
    card.addEventListener('click', (e) => {
      const tab = e.target.closest('[data-auth-tab]');
      if (tab) {
        const criar = tab.dataset.authTab === 'criar';
        card.querySelectorAll('[data-auth-tab]').forEach((b) => { const on = b === tab; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
        $('#loginForm', card).hidden = criar;
        $('#signupForm', card).hidden = !criar;
        $(criar ? '#suNome' : '#loginUser', card).focus();
      }
      if (e.target.closest('[data-fill-demo]')) { $('#loginUser', card).value = K.auth.DEMO_USER; $('#loginPass', card).value = K.auth.DEMO_PASS; $('#loginPass', card).focus(); }
      if (e.target.closest('[data-continue]')) K.gate.enter();
    });
    card.addEventListener('submit', (e) => {
      e.preventDefault();
      if (e.target.id === 'loginForm') {
        const u = $('#loginUser', card).value, pw = $('#loginPass', card).value;
        if (!u.trim() || !pw) { $('#loginErr', card).textContent = 'Informe o usuário e a senha.'; return; }
        if (!K.auth.login(u, pw)) { $('#loginErr', card).textContent = 'Usuário ou senha incorretos.'; $('#loginPass', card).select(); return; }
        K.toast(`Bem-vindo(a), ${K.auth.firstName()}!`);
        K.gate.enter();
      } else {
        const n = $('#suNome', card).value.trim(), u = $('#suUser', card).value.trim(), pw = $('#suPass', card).value;
        const err = $('#signupErr', card);
        if (!n || !u) { err.textContent = 'Preencha nome e usuário.'; return; }
        if (pw.length < 6) { err.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; $('#suPass', card).focus(); return; }
        if (K.auth.register(n, u, pw) === 'existe') { err.textContent = 'Esse usuário já existe. Escolha outro ou entre.'; return; }
        K.toast(`Conta criada! Bem-vindo(a), ${K.auth.firstName()}.`);
        K.gate.enter();
      }
    });
    return () => {};
  }

  /* =====================================================================
   * Tela: Meus documentos
   * ===================================================================== */
  const docFilter = { q: '', tipo: '', status: '', sort: 'recent' };
  function viewDocs(st) {
    if (st !== undefined) docFilter.status = STATUS[st] ? st : '';
    view.innerHTML = `
    ${pageHead('Biblioteca', 'Meus documentos', 'Contratos gerados e salvos neste navegador. Abra para editar e conferir com o checklist, ou exporte.', '<a class="btn primary" href="#/novo">+ Novo contrato</a>')}
    <section class="section tight">
      <div class="toolbar">
        <input type="search" id="fq" placeholder="Buscar por título, parte ou tipo…" value="${esc(docFilter.q)}" aria-label="Buscar documentos">
        <select id="ft" aria-label="Filtrar por tipo"><option value="">Todos os tipos</option>${Object.entries(K.TYPES).map(([k, t]) => `<option value="${k}" ${docFilter.tipo === k ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select>
        <select id="fs" aria-label="Filtrar por situação"><option value="">Todas as situações</option>${Object.entries(STATUS).map(([k, s]) => `<option value="${k}" ${docFilter.status === k ? 'selected' : ''}>${s.label}</option>`).join('')}</select>
        <select id="fo" aria-label="Ordenar"><option value="recent">Editados recentemente</option><option value="old">Mais antigos</option><option value="az">Título (A–Z)</option></select>
      </div>
      <p class="result-count" id="fcount"></p>
      <div class="doc-grid" id="grid"></div>
    </section>
    <section class="section tight">
      <div class="panel backup">
        <div><h3>Backup e exemplos</h3><p class="muted">Os documentos ficam salvos apenas neste navegador. Exporte um backup para levar a outro computador — útil no dia da apresentação.</p></div>
        <div class="actions">
          <button class="btn ghost" id="bExport">Exportar backup (.json)</button>
          <label class="btn ghost" for="bImport">Importar backup</label><input type="file" id="bImport" accept="application/json,.json" hidden>
          <button class="btn ghost" id="bMocks">Restaurar exemplos</button>
        </div>
      </div>
    </section>`;
    $('#fo').value = docFilter.sort;
    const grid = $('#grid');
    const render = () => {
      const q = K.norm(docFilter.q.trim());
      const list = K.store.load()
        .map((d) => ({ d, s: K.summary(d).status }))
        .filter(({ d, s }) =>
          (!docFilter.tipo || d.tipo === docFilter.tipo) &&
          (!docFilter.status || s === docFilter.status) &&
          (!q || K.norm([d.title, d.fields && d.fields.p1 && d.fields.p1.nome, d.fields && d.fields.p2 && d.fields.p2.nome, typeOf(d.tipo).label].join(' ')).includes(q)))
        .sort((a, b) => docFilter.sort === 'az' ? a.d.title.localeCompare(b.d.title, 'pt-BR') : docFilter.sort === 'old' ? a.d.updatedAt - b.d.updatedAt : b.d.updatedAt - a.d.updatedAt);
      $('#fcount').textContent = `${list.length} documento(s)${docFilter.q || docFilter.tipo || docFilter.status ? ' encontrados com os filtros atuais' : ''}`;
      grid.innerHTML = list.length
        ? list.map((x) => docCard(x.d)).join('')
        : `<div class="empty span-all"><div class="ico">📄</div><h3>Nenhum documento encontrado</h3><p>Ajuste os filtros ou crie um novo contrato.</p><a class="btn primary" href="#/novo">Criar contrato</a></div>`;
    };
    render();
    bindDocActions(grid, render);
    $('#fq').addEventListener('input', (e) => { docFilter.q = e.target.value; render(); });
    $('#ft').addEventListener('change', (e) => { docFilter.tipo = e.target.value; render(); });
    $('#fs').addEventListener('change', (e) => { docFilter.status = e.target.value; history.replaceState(null, '', '#/documentos' + (e.target.value ? '/' + e.target.value : '')); render(); });
    $('#fo').addEventListener('change', (e) => { docFilter.sort = e.target.value; render(); });

    $('#bExport').addEventListener('click', () => {
      const data = { app: 'kit-contrato-facil', versao: 1, exportadoEm: new Date().toISOString(), documentos: K.store.load() };
      K.download(`kit-contrato-facil-backup-${K.today()}.json`, JSON.stringify(data, null, 2), 'application/json');
      K.toast('Backup exportado.');
    });
    $('#bImport').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      e.target.value = '';
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        const arr = Array.isArray(data) ? data : data.documentos;
        if (!Array.isArray(arr)) throw new Error('formato');
        const valid = arr.filter((d) => d && typeof d.id === 'string' && Array.isArray(d.clauses) && typeof d.heading === 'string');
        if (!valid.length) throw new Error('vazio');
        const list = K.store.load();
        valid.forEach((d) => {
          d.checks = d.checks || {}; d.versions = d.versions || []; d.updatedAt = d.updatedAt || Date.now();
          const i = list.findIndex((x) => x.id === d.id);
          if (i >= 0) list[i] = d; else list.push(d);
        });
        K.store.persist();
        K.toast(`${valid.length} documento(s) importado(s).`);
        render();
      } catch (err) {
        K.toast('Arquivo inválido. Use um backup exportado por este site.', 'error');
      }
    });
    $('#bMocks').addEventListener('click', async () => {
      const ok = await K.confirm('Restaurar exemplos', 'Os 6 documentos de exemplo voltarão ao estado original (alterações feitas neles serão perdidas). Seus próprios documentos não serão afetados.', 'Restaurar');
      if (!ok) return;
      K.store.mem = K.store.load().filter((d) => !d.mock).concat(K.buildMocks());
      K.store.persist();
      K.toast('Exemplos restaurados.');
      render();
    });
  }

  /* =====================================================================
   * Tela: Novo contrato (formulário + prévia ao vivo)
   * ===================================================================== */
  function ensureDefaults(d) {
    const t = typeOf(d.tipo);
    d.p1 = d.p1 || {}; d.p2 = d.p2 || {}; d.extras = d.extras || {};
    t.extras.forEach((x) => { if (x.options && !x.options.includes(d.extras[x.k])) d.extras[x.k] = x.options[0]; });
    if (t.vigencia && !d.prazoMeses) d.prazoMeses = '12';
    if (t.pagamentoPadrao && (!d.pagamento || d.pagamento === 'avista')) d.pagamento = t.pagamentoPadrao;
    if ((t.vencimento || d.pagamento === 'mensal') && !d.vencimento) d.vencimento = '10';
    return d;
  }
  const emptyDraft = (tipo = 'servicos') =>
    ensureDefaults({ tipo, p1: {}, p2: {}, extras: {}, pagamento: 'avista', meio: 'PIX', parcelas: '2', inicio: K.today(), multa: '10' });

  function usageChip() {
    const lim = K.plan.info().docs;
    if (lim === Infinity) return `<a class="usage" href="#/planos">Plano ${esc(K.plan.label())} · contratos ilimitados</a>`;
    const n = K.plan.docsThisMonth();
    return `<a class="usage ${n >= lim ? 'full' : ''}" href="#/planos">Plano Grátis · <b>${Math.min(n, lim)} de ${lim}</b> contratos este mês</a>`;
  }

  function viewNovo(tipo) {
    let draft = K.prefs.get('draft', null) || emptyDraft();
    if (!K.TYPES[draft.tipo]) draft = emptyDraft();
    if (tipo && K.TYPES[tipo] && draft.tipo !== tipo) draft.tipo = tipo;
    ensureDefaults(draft);
    K.prefs.set('draft', draft);

    view.innerHTML = `
    ${pageHead('Gerador de contratos', 'Novo contrato', 'Preencha o formulário e acompanhe a prévia ao vivo. Campos deixados em branco aparecem como <mark class="ph">[PREENCHER]</mark> e podem ser completados depois no editor.', usageChip())}
    <div class="builder">
      <form class="panel form" id="form" novalidate></form>
      <aside class="preview-col">
        <div class="preview-box">
          <div class="preview-head"><span>Prévia ao vivo</span><span id="pvInfo"></span></div>
          <div class="paper paper-sm" id="pv"></div>
        </div>
      </aside>
    </div>`;
    const form = $('#form');
    const pv = $('#pv');

    const field = (p, label, o = {}) => {
      const id = 'f_' + p.replace(/\./g, '_');
      const v = getPath(draft, p) ?? '';
      let ctl;
      if (o.options) {
        ctl = `<select id="${id}" data-f="${p}">${o.options.map((op) => { const [val, lab] = Array.isArray(op) ? op : [op, op[0].toUpperCase() + op.slice(1)]; return `<option value="${esc(val)}" ${String(v) === String(val) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
      } else if (o.textarea) {
        ctl = `<textarea id="${id}" data-f="${p}" placeholder="${esc(o.ph || '')}" rows="3">${esc(v)}</textarea>`;
      } else {
        ctl = `<input id="${id}" type="${o.type || 'text'}" data-f="${p}" value="${esc(v)}" placeholder="${esc(o.ph || '')}" ${o.attrs || ''}>`;
      }
      return `<div class="field ${o.cls || ''}"><label for="${id}">${esc(label)}${o.req ? ' <span class="req" aria-label="obrigatório">*</span>' : ''}</label>${ctl}${o.hint ? `<small class="hint">${o.hint}</small>` : ''}<small class="err" id="${id}_err" aria-live="polite"></small></div>`;
    };

    function renderForm() {
      const t = typeOf(draft.tipo);
      const showVenc = t.vencimento || (t.pagamento && draft.pagamento === 'mensal');
      const showMeio = t.pagamento || t.vencimento;
      form.innerHTML = `
      <div class="step"><span>1</span><h3>Tipo de contrato</h3></div>
      <div class="type-pick" role="radiogroup" aria-label="Tipo de contrato">
        ${Object.entries(K.TYPES).map(([k, x]) => `<label class="tp ${draft.tipo === k ? 'on' : ''} ${x.pro ? 'is-pro' : ''}"><input type="radio" name="tipo" value="${k}" ${draft.tipo === k ? 'checked' : ''}>${x.pro ? '<span class="pro-tag">PRO</span>' : ''}<span class="ico">${x.icon}</span><b>${esc(x.label)}</b></label>`).join('')}
      </div>
      <p class="hint type-desc">${esc(t.desc)}</p>
      ${t.pro && !K.plan.info().proTypes ? `<div class="pro-note">💼 <span><b>Modelo exclusivo do Pro.</b> Você pode preencher e ver a prévia à vontade; para gerar o contrato, é preciso assinar o Pro.</span></div>` : ''}

      <div class="step"><span>2</span><h3>Partes</h3></div>
      ${['p1', 'p2'].map((p, i) => `<fieldset class="party"><legend>${esc(t[p + 'Label'])}</legend>
        ${field(p + '.nome', 'Nome completo ou razão social', { req: true, ph: i ? 'Ex.: Maria da Silva' : 'Ex.: Padaria Grão Dourado Ltda' })}
        <div class="two">
          ${field(p + '.doc', 'CPF ou CNPJ', { ph: '000.000.000-00', attrs: 'inputmode="numeric" autocomplete="off"', hint: 'Os dígitos são validados automaticamente.' })}
          ${field(p + '.end', 'Endereço', { ph: 'Rua, nº, bairro, cidade/UF' })}
        </div></fieldset>`).join('')}

      <div class="step"><span>3</span><h3>Objeto e valores</h3></div>
      ${field('objeto', t.objetoLabel, { req: true, textarea: true, ph: t.objetoPh, hint: 'Quanto mais detalhes (quantidades, características, entregas), melhor.' })}
      <div class="two">
        ${field('valor', t.valorLabel, { ph: 'Ex.: 1.500,00', attrs: 'inputmode="decimal"', hint: '<span id="extenso"></span>' })}
        ${t.pagamento ? field('pagamento', 'Forma de pagamento', { options: [['avista', 'À vista, na assinatura'], ['sinal', '50% na assinatura + 50% na entrega'], ['parcelado', 'Em parcelas mensais'], ['mensal', 'Mensalidade (valor por mês)'], ['entrega', 'Integral na entrega/conclusão']] }) : ''}
        ${draft.pagamento === 'parcelado' && t.pagamento ? field('parcelas', 'Número de parcelas', { type: 'number', attrs: 'min="2" max="48"' }) : ''}
        ${showVenc ? field('vencimento', 'Dia do vencimento', { type: 'number', attrs: 'min="1" max="31"' }) : ''}
        ${showMeio ? field('meio', 'Meio de pagamento', { options: [['PIX', 'PIX'], ['transferência bancária', 'Transferência bancária'], ['boleto bancário', 'Boleto bancário'], ['dinheiro', 'Dinheiro'], ['cartão de crédito', 'Cartão de crédito']] }) : ''}
      </div>

      <div class="step"><span>4</span><h3>Detalhes de ${esc(t.label.toLowerCase())}</h3></div>
      <div class="two">${t.extras.map((x) => field('extras.' + x.k, x.label, { ph: x.ph, options: x.options, textarea: x.textarea, type: x.type, attrs: x.type === 'number' ? 'min="0" step="0.1" inputmode="decimal"' : '', cls: x.textarea ? 'span2' : '' })).join('')}</div>

      <div class="step"><span>5</span><h3>Prazos, foro e multa</h3></div>
      <div class="two">
        ${field('inicio', 'Data de início / assinatura', { type: 'date' })}
        ${t.vigencia ? field('prazoMeses', 'Vigência (meses)', { type: 'number', attrs: 'min="1" max="120"' }) : ''}
        ${field('cidade', 'Cidade do foro', { ph: 'Ex.: Campinas' })}
        ${field('uf', 'UF', { ph: 'SP', attrs: 'maxlength="2" autocomplete="off"' })}
        ${t.semMulta ? '' : field('multa', 'Multa por descumprimento (%)', { type: 'number', attrs: 'min="0" max="100"' })}
      </div>

      <div class="step"><span>6</span><h3>Observações</h3></div>
      ${field('obs', 'Condições adicionais (opcional)', { textarea: true, ph: 'Ex.: o material de divulgação será aprovado pelas duas partes antes da publicação.', hint: 'Vira uma cláusula própria no contrato.' })}

      <div class="form-actions">
        <button type="button" class="btn ghost" id="fExample">✨ Preencher com exemplo</button>
        <button type="button" class="btn ghost" id="fClear">Limpar</button>
        <button type="submit" class="btn primary" id="fGen">Gerar contrato e abrir no editor →</button>
      </div>
      <p class="hint center">O rascunho do formulário é salvo automaticamente neste navegador.</p>`;
      updateExtenso();
    }

    const updateExtenso = () => {
      const el = $('#extenso');
      const n = K.parseMoney(draft.valor);
      if (el) el.textContent = n > 0 ? `Por extenso: ${K.valorExtenso(n)}` : 'O valor por extenso é gerado automaticamente.';
    };
    const updatePreview = () => {
      const b = K.buildContract(draft);
      pv.innerHTML = K.renderPaper(b);
      const n = K.countPH(K.docText(b));
      $('#pvInfo').innerHTML = n ? `<span class="chip warn">${n} campo(s) a preencher</span>` : '<span class="chip ok">✓ Sem pendências</span>';
    };
    const schedulePreview = K.debounce(updatePreview, 150);
    const saveDraft = () => K.prefs.set('draft', draft);
    const showErr = (el, msg) => {
      el.classList.add('invalid');
      el.setAttribute('aria-invalid', 'true');
      const er = $('#' + el.id + '_err');
      if (er) er.textContent = msg;
    };
    const clearErr = (el) => {
      el.classList.remove('invalid');
      el.removeAttribute('aria-invalid');
      const er = $('#' + el.id + '_err');
      if (er) er.textContent = '';
    };

    form.addEventListener('input', (e) => {
      const el = e.target;
      const p = el.dataset.f;
      if (!p) return;
      if (p.endsWith('.doc')) { const m = K.maskDoc(el.value); if (m !== el.value) el.value = m; }
      if (p === 'uf') el.value = el.value.toUpperCase().replace(/[^A-Z]/g, '');
      setPath(draft, p, el.value);
      clearErr(el);
      if (p === 'valor') updateExtenso();
      saveDraft();
      schedulePreview();
    });
    form.addEventListener('change', (e) => {
      const el = e.target;
      if (el.name === 'tipo') {
        draft.tipo = el.value;
        ensureDefaults(draft);
        saveDraft();
        renderForm();
        updatePreview();
        history.replaceState(null, '', '#/novo/' + el.value);
        const first = $('.tp.on', form);
        if (first) first.querySelector('input').focus();
      } else if (el.dataset.f === 'pagamento') {
        ensureDefaults(draft);
        renderForm();
        updatePreview();
        const s = $('#f_pagamento');
        if (s) s.focus();
      }
    });
    form.addEventListener('focusout', (e) => {
      const el = e.target;
      const p = el.dataset && el.dataset.f;
      if (!p) return;
      if (p.endsWith('.doc') && el.value && !K.validDoc(el.value)) {
        const n = K.digits(el.value).length;
        showErr(el, n !== 11 && n !== 14 ? 'Informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).' : `${n === 11 ? 'CPF' : 'CNPJ'} inválido: os dígitos verificadores não conferem.`);
      }
      if (p === 'valor' && el.value) {
        const n = K.parseMoney(el.value);
        el.value = n ? K.money(n) : '';
        setPath(draft, p, el.value);
        saveDraft();
        updateExtenso();
      }
    });
    form.addEventListener('click', async (e) => {
      if (e.target.closest('#fExample')) {
        const ex = K.clone(K.EXAMPLES[draft.tipo]);
        ex.valor = K.money(ex.valor);
        ex.inicio = K.today();
        draft = ensureDefaults(ex);
        saveDraft();
        renderForm();
        updatePreview();
        K.toast('Formulário preenchido com dados fictícios de exemplo.');
      } else if (e.target.closest('#fClear')) {
        if (await K.confirm('Limpar formulário', 'Todos os campos preenchidos serão apagados.', 'Limpar', true)) {
          draft = emptyDraft(draft.tipo);
          saveDraft();
          renderForm();
          updatePreview();
        }
      }
    });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      $$('.invalid', form).forEach(clearErr);
      let first = null;
      const need = (p, msg) => {
        const el = $('#f_' + p.replace(/\./g, '_'));
        if (el) { showErr(el, msg); first = first || el; }
      };
      if (!(draft.p1.nome || '').trim()) need('p1.nome', 'Informe o nome ou a razão social.');
      if (!(draft.p2.nome || '').trim()) need('p2.nome', 'Informe o nome ou a razão social.');
      if (!(draft.objeto || '').trim()) need('objeto', 'Descreva o objeto do contrato.');
      ['p1', 'p2'].forEach((p) => { if (draft[p].doc && !K.validDoc(draft[p].doc)) need(p + '.doc', 'CPF/CNPJ inválido. Corrija ou deixe em branco para preencher depois.'); });
      if (first) {
        first.focus();
        first.scrollIntoView({ block: 'center', behavior: 'smooth' });
        K.toast('Revise os campos destacados em vermelho.', 'error');
        return;
      }
      if (typeOf(draft.tipo).pro && !K.plan.info().proTypes && (await K.upsell('tipos')) !== 'pro') return;
      if (!K.plan.canCreate() && (await K.upsell('docs')) !== 'pro') return;
      const doc = K.newDoc(K.clone(draft));
      doc.origin = 'form';
      K.store.upsert(doc);
      K.prefs.del('draft');
      K.toast('Contrato gerado! Edite qualquer trecho e acompanhe o checklist ao lado.');
      location.hash = '#/editor/' + doc.id;
    });

    renderForm();
    updatePreview();
    cleanup = () => schedulePreview.cancel();
  }

  /* =====================================================================
   * Tela: Editor de documento
   * ===================================================================== */
  function viewEditor(id, focusId) {
    const doc = K.store.get(id);
    if (!doc) {
      view.innerHTML = notFound('Documento não encontrado', 'Ele pode ter sido excluído ou estar salvo em outro navegador.');
      return;
    }
    doc.checks = doc.checks || {};
    let mode = 'edit';
    let lastTA = null;
    let dirty = false;

    view.innerHTML = `
    <div class="editor">
      <div class="editor-bar">
        <a class="btn ghost sm" href="#/documentos" title="Voltar para Meus documentos">←<span class="hide-sm"> Documentos</span></a>
        <div class="title-wrap"><input class="title-input" id="docTitle" value="${esc(doc.title)}" aria-label="Nome do documento"><span class="save-state" id="saveState">Salvo</span></div>
        <div class="bar-actions">
          <div class="seg" role="group" aria-label="Modo"><button type="button" data-mode="edit" class="on" aria-pressed="true">✏️ Editar</button><button type="button" data-mode="view" aria-pressed="false">👁 Visualizar</button></div>
          <button class="btn ghost sm" id="btnFind" title="Localizar e substituir (Ctrl+F)">🔍<span class="hide-sm"> Substituir</span></button>
          <button class="btn ghost sm" id="btnHistory" title="Versões salvas">🕘<span class="hide-sm"> Versões</span></button>
          <button class="btn ghost sm show-sm" id="btnCk">☑ Checklist</button>
          <button class="btn primary sm" id="btnExport">Exportar</button>
        </div>
      </div>
      <div class="editor-grid">
        <aside class="outline panel" aria-label="Estrutura do documento">
          <h4>Estrutura</h4>
          <ol id="outline"></ol>
          <button class="btn ghost sm full" id="btnAdd">+ Adicionar cláusula</button>
        </aside>
        <div class="paper-wrap">
          <p class="paper-tip" id="paperTip"></p>
          <div class="paper" id="paper"></div>
        </div>
        <aside class="side panel" id="sideCheck" aria-label="Checklist do documento"></aside>
      </div>
    </div>`;
    const paper = $('#paper');
    const outline = $('#outline');
    const side = $('#sideCheck');
    const saveState = $('#saveState');

    const persist = () => {
      K.store.upsert(doc);
      dirty = false;
      saveState.textContent = 'Salvo às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      saveState.classList.remove('saving');
    };
    const saveSoon = K.debounce(persist, 600);
    const refreshSoon = K.debounce(() => { renderOutline(); renderSide(); }, 300);
    const changed = () => {
      dirty = true;
      saveState.textContent = 'Salvando…';
      saveState.classList.add('saving');
      saveSoon();
      refreshSoon();
    };
    const autosize = (ta) => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };

    /* ----- Papel em modo edição ----- */
    function hintHTML(c) {
      const n = K.countPH(c.body) + K.countPH(c.title);
      return n ? `<button type="button" class="ph-hint" data-ph>⚠ ${n} campo(s) a preencher — clique para selecionar o próximo</button>` : '';
    }
    function renderEdit() {
      let n = 0;
      const last = doc.clauses.length - 1;
      paper.innerHTML =
        `<textarea class="heading-input" id="heading" rows="1" aria-label="Título do contrato">${esc(doc.heading)}</textarea>` +
        doc.clauses.map((c, i) => {
          const num = c.numbered !== false ? `Cláusula ${++n}ª` : 'Sem número';
          return `<div class="clause" data-id="${c.id}" id="cl-${c.id}">
            <div class="clause-head">
              <span class="clause-num">${num}</span>
              <input class="clause-title" value="${esc(c.title)}" data-field="title" aria-label="Título da ${esc(num)}" placeholder="Título da cláusula">
              <div class="clause-tools">
                <button type="button" data-ct="up" title="Mover para cima" aria-label="Mover para cima" ${i === 0 ? 'disabled' : ''}>↑</button>
                <button type="button" data-ct="down" title="Mover para baixo" aria-label="Mover para baixo" ${i === last ? 'disabled' : ''}>↓</button>
                <button type="button" data-ct="add" title="Inserir cláusula abaixo" aria-label="Inserir cláusula abaixo">＋</button>
                <button type="button" data-ct="num" title="${c.numbered !== false ? 'Remover numeração' : 'Numerar cláusula'}" aria-label="Alternar numeração">#</button>
                <button type="button" data-ct="dup" title="Duplicar" aria-label="Duplicar cláusula">⧉</button>
                <button type="button" data-ct="del" class="danger-txt" title="Excluir" aria-label="Excluir cláusula">✕</button>
              </div>
            </div>
            <textarea class="clause-body" data-field="body" rows="1" aria-label="Texto da ${esc(num)}" placeholder="Escreva o texto da cláusula…">${esc(c.body)}</textarea>
            <div class="hint-slot">${hintHTML(c)}</div>
          </div>`;
        }).join('') +
        `<button type="button" class="add-inline" id="addEnd">+ Adicionar cláusula</button>`;
      $$('.clause-body, .heading-input', paper).forEach(autosize);
      $('#paperTip').innerHTML = 'Clique em qualquer trecho para editar. Use as setas para reordenar e <b>＋</b> para inserir cláusulas.';
    }
    function renderView() {
      paper.innerHTML = K.renderPaper(doc, { glossary: true });
      $('#paperTip').innerHTML = 'Modo leitura: os <span class="gl-sample">termos sublinhados</span> mostram uma explicação do glossário ao passar o mouse (ou tocar).';
    }
    function renderPaperMode() { mode === 'edit' ? renderEdit() : renderView(); }

    function renderOutline() {
      let n = 0;
      const res = K.autoCheck() ? K.evaluate(doc) : [];
      const flagged = new Set(res.filter((r) => r.status === 'fail' || r.status === 'warn').map((r) => r.clause).filter(Boolean));
      outline.innerHTML = doc.clauses.map((c) => {
        const flag = flagged.has(c.id) || K.hasPH(c.body);
        return `<li><button type="button" data-go="${c.id}" class="${flag ? 'flag' : ''}" title="${flag ? 'Há pontos a revisar nesta cláusula' : ''}"><span class="n">${c.numbered !== false ? ++n + '.' : '•'}</span><span class="t">${esc(c.title || '(sem título)')}</span>${flag ? '<span class="dot" aria-label="revisar"></span>' : ''}</button></li>`;
      }).join('');
    }
    function renderSide() {
      const s = K.summary(doc);
      const pct = Math.round((s.done / s.total) * 100);
      const nAuto = s.auto ? K.countAutoFixes(doc) : 0;
      side.innerHTML = `
        <div class="side-head"><h4>Checklist</h4>${badge(s.status)}</div>
        <div class="progress"><div style="width:${pct}%"></div></div>
        <p class="muted sm">${s.done} de ${s.total} itens confirmados${s.fails ? ` · <b class="txt-fail">${s.fails} problema(s)</b>` : ''}${s.warns ? ` · <b class="txt-warn">${s.warns} atenção</b>` : ''}</p>
        ${s.auto ? '' : `<div class="auto-lock"><b>🔒 Análise automática · Pro</b><p>No plano Grátis você confere marcando cada item à mão. No Pro, o checklist lê o contrato e aponta sozinho CPF/CNPJ inválidos, valores que não batem com o extenso e campos em branco.</p><button type="button" class="btn primary sm" data-upsell-auto>Assinar o Pro</button></div>`}
        ${s.auto && nAuto ? `<button type="button" class="btn primary sm full fix-all" data-fix-all>🔧 Arrumar tudo automaticamente (${nAuto})</button>` : ''}
        <ul class="side-list">${s.res.map((r) => { const fx = s.auto ? K.fixFor(doc, r) : null; return s.auto ? `
          <li class="si ${r.status} ${doc.checks[r.id] ? 'done' : ''}">
            <label><input type="checkbox" data-ck="${r.id}" ${doc.checks[r.id] ? 'checked' : ''}>
              <span><b>${esc(r.title)}</b><small><span class="ic" aria-hidden="true">${CHIP[r.status][1]}</span> ${esc(r.msg)}</small></span></label>
            <div class="si-actions">${fx ? `<button type="button" class="fix-btn ${fx.auto ? 'auto' : ''}" data-fix="${r.id}" title="${fx.auto ? 'Corrige o texto automaticamente' : 'Leva até o trecho para você corrigir'}">${fx.auto ? '🔧' : '✏️'} ${esc(fx.label)}</button>` : ''}${r.clause ? `<button type="button" class="link" data-go="${r.clause}">Ir para a cláusula →</button>` : ''}</div>
          </li>` : `
          <li class="si manual-only ${doc.checks[r.id] ? 'done' : ''}">
            <label><input type="checkbox" data-ck="${r.id}" ${doc.checks[r.id] ? 'checked' : ''}>
              <span><b>${esc(r.title)}</b><small>${esc(r.desc)}</small></span></label>
          </li>`; }).join('')}</ul>
        <div class="side-actions">
          <button type="button" class="btn ghost sm" id="ckPrint">🖨 Imprimir relatório</button>
          <button type="button" class="btn ghost sm" id="ckNone" ${s.done ? '' : 'disabled'}>Desmarcar todos</button>
        </div>`;
    }

    function go(cid, selectTitle = false) {
      const el = $(mode === 'edit' ? '#cl-' + cid : '#pc-' + cid);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      if (mode === 'edit') {
        const t = el.querySelector(selectTitle ? '.clause-title' : '.clause-body');
        if (t) { t.focus({ preventScroll: true }); if (selectTitle) t.select(); }
      }
    }
    /** Leva até a cláusula e seleciona o trecho indicado (usado pelo revisor). */
    function selectText(cid, text) {
      if (mode !== 'edit') setMode('edit');
      const el = $('#cl-' + cid);
      if (!el) return;
      const ta = el.querySelector('.clause-body');
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      const i = text ? ta.value.indexOf(text) : -1;
      ta.focus({ preventScroll: true });
      if (i >= 0) ta.setSelectionRange(i, i + text.length);
    }
    function runFix(id) {
      const r = K.evaluate(doc).find((x) => x.id === id);
      const fx = K.fixFor(doc, r);
      if (!fx) { renderSide(); return; }
      if (fx.guided) {
        if (fx.clause) selectText(fx.clause, fx.text);
        K.toast(fx.hint || 'Corrija o trecho selecionado.', 'warn');
        return;
      }
      K.snapshot(doc, `Antes do revisor: ${fx.label}`);
      const msg = fx.apply(doc);
      structural();
      K.toast('🔧 ' + msg + ' (dá para desfazer em Versões)');
    }

    function structural(focus) {
      renderPaperMode();
      renderOutline();
      renderSide();
      changed();
      if (focus) go(focus);
    }
    function selectNextPlaceholder(box) {
      const ta = box.querySelector('.clause-body');
      const re = /\[[^\]\n]{1,80}\]/g;
      re.lastIndex = ta.selectionEnd || 0;
      const m = re.exec(ta.value) || /\[[^\]\n]{1,80}\]/.exec(ta.value);
      if (m) { ta.focus(); ta.setSelectionRange(m.index, m.index + m[0].length); }
      else { const t = box.querySelector('.clause-title'); t.focus(); }
    }
    // Novas cláusulas entram antes das disposições finais (gerais, foro, assinaturas).
    const endIndex = () => {
      for (const key of ['gerais', 'foro', 'assinaturas']) {
        const a = doc.clauses.findIndex((c) => c.key === key);
        if (a > 0) return a - 1;
      }
      return doc.clauses.length - 1;
    };
    function addClause(after) {
      const lib = [{ key: '', title: 'Cláusula em branco', body: '' }].concat(K.CLAUSE_LIB);
      K.modal({
        title: 'Adicionar cláusula',
        wide: true,
        html: `<p class="muted">Escolha um modelo pronto ou comece em branco. Você pode editar o texto depois.</p>
          <div class="lib">${lib.map((l, i) => `<button type="button" class="lib-item" data-lib="${i}"><b>${esc(l.title)}</b><span>${esc(l.body ? l.body.slice(0, 120) + (l.body.length > 120 ? '…' : '') : 'Título e texto livres.')}</span></button>`).join('')}</div>`,
      });
      $$('#modalRoot [data-lib]').forEach((b) =>
        b.addEventListener('click', () => {
          const l = lib[b.dataset.lib];
          const c = { id: K.uid(), key: l.key, title: l.key ? l.title : 'Nova cláusula', body: l.body, numbered: true };
          doc.clauses.splice(after + 1, 0, c);
          K.closeModal(null);
          if (mode !== 'edit') setMode('edit');
          structural();
          go(c.id, !l.key);
          K.toast('Cláusula adicionada.');
        })
      );
    }
    function setMode(m) {
      mode = m;
      $$('.seg button').forEach((b) => { const on = b.dataset.mode === m; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
      document.body.classList.toggle('reading', m === 'view');
      renderPaperMode();
    }

    /* ----- Eventos do papel ----- */
    paper.addEventListener('input', (e) => {
      const el = e.target;
      if (el.id === 'heading') { doc.heading = el.value.replace(/\n/g, ' '); autosize(el); return changed(); }
      const box = el.closest('.clause');
      if (!box) return;
      const c = doc.clauses.find((x) => x.id === box.dataset.id);
      if (!c) return;
      if (el.dataset.field === 'title') c.title = el.value;
      else if (el.dataset.field === 'body') { c.body = el.value; autosize(el); }
      box.querySelector('.hint-slot').innerHTML = hintHTML(c);
      changed();
    });
    paper.addEventListener('focusin', (e) => { if (e.target.classList.contains('clause-body')) lastTA = e.target; });
    paper.addEventListener('click', async (e) => {
      if (e.target.closest('[data-ph]')) return selectNextPlaceholder(e.target.closest('.clause'));
      if (e.target.closest('#addEnd')) return addClause(endIndex());
      const b = e.target.closest('[data-ct]');
      if (!b) return;
      const box = b.closest('.clause');
      const i = doc.clauses.findIndex((x) => x.id === box.dataset.id);
      const c = doc.clauses[i];
      switch (b.dataset.ct) {
        case 'up':
          if (i > 0) { [doc.clauses[i - 1], doc.clauses[i]] = [doc.clauses[i], doc.clauses[i - 1]]; structural(c.id); }
          break;
        case 'down':
          if (i < doc.clauses.length - 1) { [doc.clauses[i + 1], doc.clauses[i]] = [doc.clauses[i], doc.clauses[i + 1]]; structural(c.id); }
          break;
        case 'num':
          c.numbered = c.numbered === false;
          structural(c.id);
          break;
        case 'dup': {
          const copy = Object.assign(K.clone(c), { id: K.uid(), title: c.title + ' (cópia)' });
          doc.clauses.splice(i + 1, 0, copy);
          structural(copy.id);
          break;
        }
        case 'add':
          addClause(i);
          break;
        case 'del':
          if (await K.confirm('Excluir cláusula', `Remover “${c.title || 'cláusula sem título'}” do documento? Uma versão de segurança será salva antes.`, 'Excluir', true)) {
            K.snapshot(doc, `Antes de excluir “${c.title || 'cláusula'}”`);
            doc.clauses.splice(i, 1);
            structural();
            K.toast('Cláusula removida. Você pode recuperá-la em “Versões”.');
          }
          break;
      }
    });
    outline.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
    side.addEventListener('click', (e) => {
      if (e.target.closest('[data-upsell-auto]')) { K.upsell('auto'); return; }
      const fb = e.target.closest('[data-fix]');
      if (fb) { runFix(fb.dataset.fix); return; }
      if (e.target.closest('[data-fix-all]')) {
        K.snapshot(doc, 'Antes do revisor: arrumar tudo');
        const msgs = K.fixAll(doc);
        structural();
        const guiadas = K.evaluate(doc).map((r) => K.fixFor(doc, r)).filter((f) => f && f.guided).length;
        K.toast(`🔧 ${msgs.length} correção(ões) aplicada(s).${guiadas ? ` Ainda ${guiadas > 1 ? 'há ' + guiadas + ' pontos' : 'há 1 ponto'} para você completar.` : ''} (dá para desfazer em Versões)`);
        return;
      }
      const b = e.target.closest('[data-go]');
      if (b) go(b.dataset.go);
      if (e.target.closest('#ckPrint')) { if (dirty) persist(); printReport(doc); }
      if (e.target.closest('#ckNone')) { doc.checks = {}; persist(); renderSide(); K.toast('Marcações do checklist removidas.'); }
    });
    side.addEventListener('change', (e) => {
      const id2 = e.target.dataset.ck;
      if (!id2) return;
      doc.checks[id2] = e.target.checked;
      const r = K.autoCheck() && K.evaluate(doc).find((x) => x.id === id2);
      if (e.target.checked && r && r.status === 'fail') K.toast('Atenção: o sistema ainda aponta um problema neste item.', 'warn');
      persist();
      renderSide();
      const again = side.querySelector(`[data-ck="${id2}"]`);
      if (again) again.focus();
    });
    $('#btnAdd').addEventListener('click', () => addClause(endIndex()));
    $('#docTitle').addEventListener('input', (e) => { doc.title = e.target.value; changed(); });
    $('#docTitle').addEventListener('blur', (e) => { if (!e.target.value.trim()) { doc.title = 'Documento sem título'; e.target.value = doc.title; changed(); } });
    $$('.seg button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    $('#btnExport').addEventListener('click', () => { if (dirty) persist(); exportDialog(doc); });
    $('#btnFind').addEventListener('click', findReplace);
    $('#btnCk').addEventListener('click', () => side.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    $('#btnHistory').addEventListener('click', versionsDialog);

    /* ----- Localizar e substituir ----- */
    function findReplace() {
      const sel = lastTA && document.contains(lastTA) && lastTA.selectionEnd > lastTA.selectionStart ? lastTA.value.slice(lastTA.selectionStart, lastTA.selectionEnd) : '';
      K.modal({
        title: 'Localizar e substituir',
        html: `<p class="muted sm">Útil para trocar o nome de uma parte, um valor ou um prazo em todo o documento de uma só vez.</p>
          <div class="field"><label for="frF">Localizar</label><input id="frF" value="${esc(sel)}" placeholder="Ex.: Padaria Grão Dourado Ltda"></div>
          <div class="field"><label for="frR">Substituir por</label><input id="frR" placeholder="Novo texto"></div>
          <label class="check-inline"><input type="checkbox" id="frC"> Diferenciar maiúsculas e minúsculas</label>
          <div id="frN" class="fr-result" aria-live="polite"></div>`,
        actions: [
          { label: 'Fechar' },
          {
            label: 'Substituir tudo', cls: 'primary',
            onClick: () => {
              const f = $('#frF').value;
              if (!f) { $('#frF').focus(); return false; }
              const re = new RegExp(K.escRe(f), $('#frC').checked ? 'g' : 'gi');
              const r = $('#frR').value;
              const total = count(re);
              if (!total) { K.toast('Nenhuma ocorrência encontrada.', 'warn'); return false; }
              K.snapshot(doc, `Antes de substituir “${f}”`);
              doc.heading = doc.heading.replace(re, () => r);
              doc.clauses.forEach((c) => { c.title = c.title.replace(re, () => r); c.body = c.body.replace(re, () => r); });
              structural();
              K.toast(`${total} ocorrência(s) substituída(s).`);
            },
          },
        ],
      });
      const count = (re) => [doc.heading, ...doc.clauses.flatMap((c) => [c.title, c.body])].reduce((a, s) => a + (s.match(re) || []).length, 0);
      const upd = () => {
        const f = $('#frF').value;
        if (!f) { $('#frN').innerHTML = ''; return; }
        const re = new RegExp(K.escRe(f), $('#frC').checked ? 'g' : 'gi');
        let n = 0;
        const where = doc.clauses.map((c) => ({ c, k: (c.title.match(re) || []).length + (c.body.match(re) || []).length, n: c.numbered !== false ? ++n : 0 })).filter((x) => x.k);
        const tot = count(re);
        $('#frN').innerHTML = tot
          ? `<b>${tot} ocorrência(s)</b> em: ${where.map((x) => `<span class="tag">${x.n ? 'Cl. ' + x.n + 'ª' : esc(x.c.title)} (${x.k})</span>`).join(' ')}`
          : '<span class="muted">Nenhuma ocorrência.</span>';
      };
      ['#frF', '#frC'].forEach((s) => $(s).addEventListener('input', upd));
      upd();
    }

    /* ----- Versões ----- */
    function versionsDialog() {
      const list = [...(doc.versions || [])].reverse();
      K.modal({
        title: 'Versões do documento',
        wide: true,
        html: `<p class="muted sm">Salve uma versão antes de mudanças grandes. Versões de segurança também são criadas automaticamente ao excluir cláusulas, substituir textos ou restaurar.</p>
          <div class="ver-new"><input id="verName" placeholder="Nome da versão (ex.: Enviada ao cliente)" aria-label="Nome da versão"><button type="button" class="btn primary sm" id="verSave">Salvar versão atual</button></div>
          ${list.length ? `<ul class="ver-list">${list.map((v) => `<li><div><b>${esc(v.label)}</b><small>${new Date(v.at).toLocaleString('pt-BR')} · ${v.clauses.length} cláusulas</small></div><div class="actions"><button type="button" class="btn ghost sm" data-vprev="${v.id}">Ver</button><button type="button" class="btn ghost sm" data-vres="${v.id}">Restaurar</button></div></li>`).join('')}</ul>` : '<p class="muted">Nenhuma versão salva ainda.</p>'}`,
      });
      const root = $('#modalRoot');
      $('#verSave').addEventListener('click', () => {
        K.snapshot(doc, $('#verName').value.trim() || 'Versão salva manualmente');
        persist();
        K.toast('Versão salva.');
        versionsDialog();
      });
      $('#verName').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#verSave').click(); });
      root.querySelector('.modal').addEventListener('click', async (e) => {
        const pv = e.target.closest('[data-vprev]');
        const rs = e.target.closest('[data-vres]');
        if (pv) {
          const v = doc.versions.find((x) => x.id === pv.dataset.vprev);
          K.modal({ title: v.label, wide: true, html: `<div class="paper paper-sm">${K.renderPaper(v)}</div>`, actions: [{ label: '← Voltar às versões', value: 'back' }] })
            .then((r) => { if (r === 'back') versionsDialog(); });
        }
        if (rs) {
          const v = doc.versions.find((x) => x.id === rs.dataset.vres);
          if (await K.confirm('Restaurar versão', `O documento voltará para “${v.label}”. O estado atual será salvo como uma nova versão antes.`, 'Restaurar')) {
            K.snapshot(doc, 'Antes de restaurar “' + v.label + '”');
            doc.heading = v.heading;
            doc.clauses = K.clone(v.clauses);
            structural();
            K.toast('Versão restaurada.');
          }
        }
      });
    }

    /* ----- Atalhos ----- */
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); saveSoon.cancel(); persist(); K.toast('Documento salvo.'); }
      if (mod && e.key.toLowerCase() === 'f' && !$('#modalRoot').children.length) { e.preventDefault(); findReplace(); }
    };
    document.addEventListener('keydown', onKey);
    const onPlan = () => { renderOutline(); renderSide(); };
    document.addEventListener('kcf:plan', onPlan);
    const onResize = K.debounce(() => $$('.clause-body, .heading-input', paper).forEach(autosize), 150);
    window.addEventListener('resize', onResize);
    cleanup = () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('kcf:plan', onPlan);
      window.removeEventListener('resize', onResize);
      document.body.classList.remove('reading');
      saveSoon.cancel(); refreshSoon.cancel();
      if (dirty) persist();
      K.editorCtx = null;
    };

    /* Interface usada pelo assistente jurídico para agir no documento aberto. */
    K.editorCtx = {
      doc,
      go: (cid) => go(cid),
      /** Insere uma cláusula (antes das disposições finais) e rola até ela. */
      insertClause(l) {
        K.snapshot(doc, `Antes de inserir “${l.title}” pelo assistente`);
        const c = { id: K.uid(), key: l.key, title: l.title, body: l.body, numbered: true };
        doc.clauses.splice(endIndex() + 1, 0, c);
        if (mode !== 'edit') setMode('edit');
        structural(c.id);
        return c;
      },
      /** Substitui um trecho exato em uma cláusula. */
      replaceIn(cid, from, to, label) {
        const c = doc.clauses.find((x) => x.id === cid);
        if (!c || !c.body.includes(from)) return false;
        K.snapshot(doc, label || 'Antes de ajuste do assistente');
        c.body = c.body.replace(from, () => to);
        structural(cid);
        return true;
      },
    };

    renderEdit();
    renderOutline();
    renderSide();
    if (focusId) setTimeout(() => go(focusId), 50);
  }

  function printReport(doc) {
    const s = K.summary(doc);
    K.printHTML(`<div class="print-report">
      <h1>Relatório de conferência</h1>
      <p><b>${esc(doc.title)}</b><br>${esc(typeOf(doc.tipo).label)} · ${parties(doc)}<br>Situação: ${STATUS[s.status].label} · ${s.done} de ${s.total} itens confirmados · Gerado em ${new Date().toLocaleString('pt-BR')}</p>
      <table><thead><tr><th>Conferido</th><th>Item</th>${s.auto ? '<th>Análise automática</th>' : ''}</tr></thead><tbody>
      ${s.res.map((r, i) => `<tr><td class="box">${doc.checks[r.id] ? '☑' : '☐'}</td><td><b>${i + 1}. ${esc(r.title)}</b><br><small>${esc(r.desc)}</small></td>${s.auto ? `<td><b>${CHIP[r.status][2]}</b><br>${esc(r.msg)}</td>` : ''}</tr>`).join('')}
      </tbody></table>
      <p class="foot">Kit Contrato Fácil — material educativo. Não substitui a análise de um profissional habilitado.</p></div>`);
  }

  /* =====================================================================
   * Tela: Glossário
   * ===================================================================== */
  function viewGlossario() {
    view.innerHTML = `
    ${pageHead('Aprenda de forma simples', 'Glossário de termos contratuais', 'Explicações introdutórias em linguagem acessível. No editor, use o modo <b>Visualizar</b> para ver estes termos destacados dentro do seu próprio contrato.')}
    <section class="section tight">
      <input type="search" id="gq" class="search-lg" placeholder="Buscar termo… (ex.: rescisão, foro, caução)" aria-label="Buscar termo">
      <p class="result-count" id="gcount"></p>
      <div class="terms" id="terms"></div>
      <div class="notice"><b>Importante:</b> definições educativas e resumidas. O sentido jurídico depende do contexto, do documento e da legislação aplicável.</div>
    </section>`;
    const render = (q) => {
      const n = K.norm(q.trim());
      const list = K.GLOSSARY.filter((g) => !n || K.norm(g.t + ' ' + g.d).includes(n)).sort((a, b) => a.t.localeCompare(b.t, 'pt-BR'));
      $('#gcount').textContent = `${list.length} termo(s)`;
      $('#terms').innerHTML = list.length
        ? list.map((g) => `<div class="term ${n ? 'open' : ''}"><button type="button" aria-expanded="${!!n}">${esc(g.t)}<span aria-hidden="true">${n ? '−' : '＋'}</span></button><div class="definition"><p>${esc(g.d)}</p>${g.ex ? `<p class="ex"><b>Exemplo:</b> ${esc(g.ex)}</p>` : ''}</div></div>`).join('')
        : '<p class="muted">Nenhum termo encontrado.</p>';
    };
    render('');
    $('#gq').addEventListener('input', (e) => render(e.target.value));
    $('#terms').addEventListener('click', (e) => {
      const b = e.target.closest('.term button');
      if (!b) return;
      const open = b.parentElement.classList.toggle('open');
      b.setAttribute('aria-expanded', open);
      b.querySelector('span').textContent = open ? '−' : '＋';
    });
  }

  /* =====================================================================
   * Tela: Kit físico — a pessoa monta a pasta: de 1 a 10 modelos e as cópias de cada um
   * ===================================================================== */
  function viewKit(abrir) {
    const items = K.KIT_ITEMS;
    const modelos = items.filter((i) => i.kind === 'modelo');
    const apoio = items.filter((i) => i.kind !== 'modelo');
    const basicos = Object.keys(K.TYPES).filter((k) => !K.TYPES[k].pro);
    let sel = K.kitSel.get();

    const folderHTML = () => {
      const ms = K.kitSel.modelos();
      const many = ms.length > 5;
      const step = Math.min(5, 34 / Math.max(ms.length, 1));
      return `<div class="fa-back"></div>
        ${ms.map((m, i) => `<div class="fa-sheet ${many ? 'many' : ''}" style="--c:${m.cor};--i:${i};--step:${step}%"><span title="${esc(m.title)}">${many ? K.TYPES[m.tipo].icon : esc(m.title)}</span></div>`).join('')}
        <div class="fa-front"><img src="assets/img/logo.svg" alt="" width="60" height="60"><b>Kit Contrato Fácil</b><small>${esc(K.kitSel.resumo())}</small></div>`;
    };
    const pickCard = (it) => {
      const n = sel[it.tipo] || 0;
      return `<div class="pick-card ${n ? 'on' : ''}" data-card="${it.tipo}" style="--c:${it.cor}">
        <button type="button" class="pick-thumb" data-sheet="${it.id}" aria-label="Visualizar a folha de ${esc(it.title)}">${K.kitThumb(it)}<span class="pick-view">👁 Visualizar folha</span></button>
        <div class="pick-body">
          <span class="sheet-tag">${esc(it.tag)}</span>
          <b>${esc(it.title)}</b>
          <label class="pick-toggle"><input type="checkbox" data-pick="${it.tipo}" ${n ? 'checked' : ''}> Incluir na pasta</label>
          <div class="copies" ${n ? '' : 'hidden'}>
            <span>Cópias impressas</span>
            <div class="stepper">
              <button type="button" data-step="-1" data-tipo="${it.tipo}" aria-label="Uma cópia a menos">−</button>
              <input type="number" min="1" max="${K.KIT_MAX_COPIAS}" value="${n || 1}" data-copies="${it.tipo}" inputmode="numeric" aria-label="Cópias de ${esc(it.title)}">
              <button type="button" data-step="1" data-tipo="${it.tipo}" aria-label="Uma cópia a mais">+</button>
            </div>
          </div>
        </div>
      </div>`;
    };
    const apoioCard = (it) => `
      <button type="button" class="sheet-card" data-sheet="${it.id}" style="--c:${it.cor}">
        ${K.kitThumb(it)}
        <span class="sheet-info"><span class="sheet-tag">${esc(it.tag)}</span><b>${esc(it.title)}</b><small>${esc(it.desc)}</small><span class="sheet-open">Visualizar folha →</span></span>
      </button>`;

    view.innerHTML = `
    <section class="kit-hero">
      <div class="kh-text">
        <div class="eyebrow light">Produto físico</div>
        <h1>Kit Contrato Fácil — a pasta</h1>
        <p>A versão física do projeto, montada do seu jeito: escolha de 1 a 10 modelos de contrato e quantas cópias impressas quer de cada um. O checklist, o glossário, o guia e o cartão de ativação vêm sempre junto.</p>
        <ul class="kh-specs">
          <li><b>32 × 24 × 6 cm</b><small>pasta com abas</small></li>
          <li><b>Papelão rígido</b><small>e papel reciclado</small></li>
          <li><b data-resumo>${esc(K.kitSel.resumo())}</b><small>escolhidos por você</small></li>
        </ul>
        <div class="kh-buy"><div class="price"><b>${K.price(K.KIT.preco)}</b><span>pagamento único</span></div>
          <button class="btn white" data-kit-buy>Quero o kit</button>
          <a class="btn outline-light" href="#/planos">Comparar com os planos</a></div>
      </div>
      <div class="folder-art" aria-hidden="true" id="folderArt">${folderHTML()}</div>
    </section>

    <section class="section" id="kitBuilder">
      <div class="head"><div class="eyebrow">Monte sua pasta</div><h2>Escolha os modelos e as cópias</h2><p>Marque de 1 a 10 modelos e defina quantas cópias impressas de cada um vêm na pasta (até ${K.KIT_MAX_COPIAS} por modelo). Clique na miniatura para ver a folha inteira.</p></div>
      <div class="pick-tools">
        <button type="button" class="btn ghost sm" data-preset="todos">Escolher os 10 modelos</button>
        <button type="button" class="btn ghost sm" data-preset="basicos">Só os 5 básicos</button>
      </div>
      <div class="pick-grid">${modelos.map(pickCard).join('')}</div>

      <div class="kit-summary">
        <div><b data-resumo>${esc(K.kitSel.resumo())}</b><small>+ checklist, glossário, guia e cartão de ativação</small></div>
        <button class="btn primary" data-kit-buy>Quero o kit · ${K.price(K.KIT.preco)}</button>
      </div>

      <div class="head" style="margin-top:34px"><div class="eyebrow">Sempre incluso</div><h2>Material de apoio</h2><p>Folhas que ajudam a preencher, entender e conferir os contratos, mais o cartão que liga a pasta ao site.</p></div>
      <div class="sheet-grid">${apoio.map(apoioCard).join('')}</div>
    </section>

    <section class="section alt">
      <div class="head"><div class="eyebrow">Do papel para o digital</div><h2>A pasta e o site trabalham juntos</h2></div>
      <div class="steps three">
        <article class="step-card"><div class="num">01</div><h3>Preencha no papel</h3><p>Escolha o modelo pela cor da aba e preencha à mão, com o glossário ao lado.</p></article>
        <article class="step-card"><div class="num">02</div><h3>Confira com o checklist</h3><p>Marque cada item da folha de conferência antes de assinar.</p></article>
        <article class="step-card"><div class="num">03</div><h3>Ative o Pro</h3><p>O cartão traz um código com 3 meses de Pro para gerar, editar e conferir tudo automaticamente no site.</p></article>
      </div>
      <div class="notice"><b>Sobre a demonstração:</b> o pedido e o código de ativação são simulados. O preço do kit é fixo nesta versão, qualquer que seja a quantidade de modelos e cópias.</div>
    </section>`;

    /* ----- Atualiza resumo, pasta ilustrada e cartões sem redesenhar a tela ----- */
    const refresh = () => {
      K.kitSel.set(sel);
      view.querySelectorAll('[data-resumo]').forEach((el) => { el.textContent = K.kitSel.resumo(); });
      $('#folderArt').innerHTML = folderHTML();
      view.querySelectorAll('[data-card]').forEach((card) => {
        const n = sel[card.dataset.card] || 0;
        card.classList.toggle('on', !!n);
        card.querySelector('[data-pick]').checked = !!n;
        card.querySelector('.copies').hidden = !n;
        const inp = card.querySelector('[data-copies]');
        if (n && document.activeElement !== inp) inp.value = n;
      });
    };
    const clamp = (n) => Math.max(1, Math.min(K.KIT_MAX_COPIAS, n || 1));
    const builder = $('#kitBuilder');
    builder.addEventListener('change', (e) => {
      const pk = e.target.closest('[data-pick]');
      if (pk) {
        const t = pk.dataset.pick;
        if (pk.checked) sel[t] = sel[t] || 1;
        else if (Object.keys(sel).length === 1) { pk.checked = true; K.toast('A pasta precisa ter pelo menos 1 modelo.', 'warn'); return; }
        else delete sel[t];
        refresh();
      }
      const cp = e.target.closest('[data-copies]');
      if (cp) { sel[cp.dataset.copies] = clamp(parseInt(cp.value, 10)); cp.value = sel[cp.dataset.copies]; refresh(); }
    });
    builder.addEventListener('input', (e) => {
      const cp = e.target.closest('[data-copies]');
      if (cp && parseInt(cp.value, 10) > 0) { sel[cp.dataset.copies] = clamp(parseInt(cp.value, 10)); refresh(); }
    });
    builder.addEventListener('click', (e) => {
      const st = e.target.closest('[data-step]');
      if (st) {
        const t = st.dataset.tipo;
        const novo = clamp((sel[t] || 1) + Number(st.dataset.step));
        if (novo === K.KIT_MAX_COPIAS && Number(st.dataset.step) > 0 && sel[t] === K.KIT_MAX_COPIAS) K.toast(`Máximo de ${K.KIT_MAX_COPIAS} cópias por modelo.`, 'warn');
        sel[t] = novo;
        refresh();
        return;
      }
      const pr = e.target.closest('[data-preset]');
      if (pr) {
        const lista = pr.dataset.preset === 'todos' ? Object.keys(K.TYPES) : basicos;
        sel = Object.fromEntries(lista.map((k) => [k, sel[k] || 1]));
        refresh();
        K.toast(pr.dataset.preset === 'todos' ? 'Os 10 modelos foram incluídos na pasta.' : 'Pasta com os 5 modelos básicos.');
      }
    });

    /* ----- Visualizador das folhas ----- */
    const open = (idx) => {
      const it = items[idx];
      K.modal({
        title: `${it.tag} — ${it.title}`,
        wide: true,
        html: `<div class="sheet-toolbar">
            <button type="button" class="btn ghost sm" data-nav="-1" ${idx === 0 ? 'disabled' : ''}>← Anterior</button>
            <span class="muted sm">${idx + 1} de ${items.length}</span>
            <button type="button" class="btn ghost sm" data-nav="1" ${idx === items.length - 1 ? 'disabled' : ''}>Próxima →</button>
            <span class="grow"></span>
            ${it.kind === 'cartao' ? '<button type="button" class="btn ghost sm" data-activate>Ativar código (demo)</button>' : ''}
            <button type="button" class="btn primary sm" data-print>🖨 Imprimir esta folha</button>
          </div>
          <div class="sheet-view"><div class="paper sheet ${it.kind === 'cartao' ? 'card-sheet' : ''}">${K.kitSheet(it)}</div></div>`,
      });
      const m = $('#modalRoot .modal');
      m.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-nav]');
        if (nav) open(idx + Number(nav.dataset.nav));
        if (e.target.closest('[data-print]')) { K.closeModal(null); K.printHTML(`<div class="paper sheet ${it.kind === 'cartao' ? 'card-sheet' : ''}">${K.kitSheet(it)}</div>`); }
        if (e.target.closest('[data-activate]')) { K.kitActivate(); K.closeModal(null); }
      });
      history.replaceState(null, '', '#/kit/' + it.id);
    };
    view.querySelectorAll('[data-sheet]').forEach((b) => b.addEventListener('click', () => open(items.findIndex((x) => x.id === b.dataset.sheet))));
    view.querySelectorAll('[data-kit-buy]').forEach((b) => b.addEventListener('click', K.kitCheckout));
    const startAt = items.findIndex((x) => x.id === abrir);
    if (startAt >= 0) setTimeout(() => open(startAt), 50);
  }

  /* =====================================================================
   * Planos: cartões e assinatura (usados na tela de Planos e na página inicial)
   * ===================================================================== */
  function plansCardsHTML() {
    const P = K.PLANS;
    const pro = P.pro;
    const mensalAnual = pro.anual / 12;
    const economia = pro.mensal * 12 - pro.anual;
    const cur = K.plan.get();
    const isPro = cur.id === 'pro';
    const itens = (p) => `<ul class="check-list">${p.itens.map((i) => `<li>${esc(i).replace(/\(em breve\)/, '<span class="soon">em breve</span>')}</li>`).join('')}</ul>`;
    const atual = isPro ? (cur.ciclo === 'anual' ? 'anual' : cur.ciclo === 'kit' ? 'kit' : 'mensal') : '';
    return `
        <div class="plans two-plans">
          <article class="plan ${!isPro ? 'current' : ''}">
            <h3>${esc(P.gratis.nome)}</h3>
            <p class="muted sm">${esc(P.gratis.resumo)}</p>
            <div class="price"><b>R$ 0</b><span>para sempre</span></div>
            ${!isPro ? '<button class="btn ghost full" disabled>✓ Seu plano atual</button>' : '<button class="btn ghost full" data-plan="gratis">Voltar para o Grátis</button>'}
            ${itens(P.gratis)}
          </article>

          <article class="plan featured ${isPro ? 'current' : ''}">
            <span class="ribbon">Recomendado</span>
            <h3>${esc(pro.nome)}</h3>
            <p class="muted sm">${esc(pro.resumo)}</p>
            <div class="price"><b>${K.price(pro.mensal)}</b><span>/mês</span></div>
            <div class="promo">
              <div class="promo-tag">🎉 Promoção do plano anual</div>
              <div class="promo-price"><b>${K.price(pro.anual)}</b><span>/ano</span></div>
              <small>Sai por ${K.price(mensalAnual)}/mês · você economiza ${K.price(economia)} (2 meses grátis)</small>
              ${isPro && cur.ciclo === 'anual' ? '<button class="btn primary full" disabled>✓ Você já tem o plano anual</button>' : '<button class="btn primary full" data-plan="pro" data-ciclo="anual">Aproveitar a promoção anual</button>'}
            </div>
            ${isPro && atual === 'mensal' ? '<button class="btn ghost full" disabled>✓ Seu plano atual (mensal)</button>' : isPro && atual === 'anual' ? '' : `<button class="btn ghost full" data-plan="pro" data-ciclo="mensal">Assinar mensal por ${K.price(pro.mensal)}</button>`}
            ${atual === 'kit' ? '<p class="muted sm center">✓ Pro ativado pelo código do kit físico.</p>' : ''}
            ${itens(pro)}
          </article>
        </div>`;
  }

  async function planAction(plan, cicloEscolhido, done) {
    const pro = K.PLANS.pro;
    const mensalAnual = pro.anual / 12;
    const economia = pro.mensal * 12 - pro.anual;
    if (plan === 'gratis') {
      if (await K.confirm('Voltar para o plano Grátis', 'Os limites do Grátis voltarão a valer: 3 contratos por mês, 3 perguntas ao assistente por dia, checklist só manual e marca d’água na exportação. Seus documentos continuam salvos.', 'Voltar para o Grátis')) {
        K.plan.set('gratis'); K.toast('Plano alterado para Grátis.'); if (done) done();
      }
      return;
    }
    const ciclo = cicloEscolhido === 'anual' ? 'anual' : 'mensal';
    const anual = ciclo === 'anual';
    const pm = K.modal({
      title: anual ? 'Assinar o Pro anual (promoção)' : 'Assinar o Pro mensal',
      html: `<div class="checkout"><div><b>Plano Pro ${anual ? 'anual' : 'mensal'}</b><small>${anual ? `Equivale a ${K.price(mensalAnual)}/mês · economia de ${K.price(economia)}` : 'Cobrança todo mês, cancele quando quiser'}</small></div><b>${anual ? K.price(pro.anual) + '/ano' : K.price(pro.mensal) + '/mês'}</b></div>
        ${anual ? '' : `<p class="promo-hint">💡 No anual você paga ${K.price(pro.anual)} e economiza ${K.price(economia)}. <button type="button" class="link" data-switch-annual>Trocar para o anual</button></p>`}
        <ul class="check-list">${pro.itens.slice(0, 4).map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
        <p class="notice">Demonstração: nenhum dado de pagamento é solicitado nem cobrado. Ao confirmar, o plano é ativado apenas neste navegador.</p>`,
      actions: [{ label: 'Cancelar', value: false }, { label: 'Confirmar assinatura (demo)', cls: 'primary', value: true }],
    });
    $('#modalRoot .modal').addEventListener('click', (e) => {
      if (!e.target.closest('[data-switch-annual]')) return;
      K.closeModal(null);
      setTimeout(() => planAction('pro', 'anual', done), 0);
    });
    if ((await pm) === true) { K.subscribePro(ciclo); if (done) done(); }
  }

  /* =====================================================================
   * Tela: Planos (Grátis e Pro, com promoção no plano anual)
   * ===================================================================== */
  function viewPlanos() {
    const P = K.PLANS;
    const pro = P.pro;
    const mensalAnual = pro.anual / 12;
    const economia = pro.mensal * 12 - pro.anual;
    const render = () => {
      const row = (label, vals) => `<tr><th scope="row">${label}</th>${vals.map((v) => `<td>${v === true ? '<span class="yes">✓</span>' : v === false ? '<span class="no">—</span>' : v}</td>`).join('')}</tr>`;
      view.innerHTML = `
      <section class="page-head center-head"><div>
        <div class="eyebrow">Planos</div>
        <h1>Comece grátis. Evolua quando precisar.</h1>
        <p>Use o essencial sem pagar nada. Quando os contratos virarem rotina, o Pro libera tudo. Você pode cancelar quando quiser.</p>
      </div></section>
      <section class="section tight">
        ${plansCardsHTML()}

        <div class="kit-card panel">
          <div class="kit-img"><img src="assets/img/logo.svg" alt="" width="88" height="88"></div>
          <div class="kit-text">
            <div class="eyebrow">Produto físico</div>
            <h3>Kit Contrato Fácil — a pasta</h3>
            <p class="muted">A versão física do projeto, para quem prefere papel. Acompanha acesso ao site.</p>
            <ul class="check-list cols">${K.KIT.itens.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
          </div>
          <div class="kit-buy"><div class="price"><b>${K.price(K.KIT.preco)}</b></div><small class="muted">pagamento único</small><a class="btn ghost full" href="#/kit">Ver o que vem no kit</a><button class="btn primary full" id="buyKit">Quero o kit</button></div>
        </div>
        <form class="redeem" id="redeem">
          <label for="redeemCode">Já tem o kit? Ative o código do cartão:</label>
          <input id="redeemCode" placeholder="${K.KIT_CODE}" autocomplete="off" aria-describedby="redeemHint">
          <button class="btn ghost" type="submit">Ativar código</button>
          <small id="redeemHint" class="muted">Demonstração: use o código ${K.KIT_CODE}, impresso no cartão do kit.</small>
        </form>

        <h2 class="sub">Compare os planos</h2>
        <div class="table-wrap"><table class="compare">
          <thead><tr><th></th><th>Grátis</th><th>Pro</th></tr></thead>
          <tbody>
            ${row('Preço', ['R$ 0', `${K.price(pro.mensal)}/mês ou ${K.price(pro.anual)}/ano`])}
            ${row('Contratos por mês', ['3', 'Ilimitados'])}
            ${row('Tipos de contrato', ['5', '10 (5 exclusivos)'])}
            ${row('Editor de cláusulas e versões', [true, true])}
            ${row('Checklist manual de conferência', [true, true])}
            ${row('Checklist automático (lê o contrato)', [false, true])}
            ${row('Revisor: arrumar erros com um clique', [false, true])}
            ${row('Glossário no texto', [true, true])}
            ${row('Assistente jurídico', ['3 perguntas/dia', 'Ilimitado'])}
            ${row('Exportar PDF e Word', ['Com marca d’água', 'Sem marca d’água'])}
          </tbody>
        </table></div>

        <h2 class="sub">Perguntas frequentes</h2>
        <div class="terms faq">${[
          ['Qual a diferença entre o mensal e o anual?', `Os recursos são os mesmos. No anual você paga ${K.price(pro.anual)} de uma vez e economiza ${K.price(economia)}, o equivalente a 2 meses grátis.`],
          ['Posso cancelar quando quiser?', 'Sim. O plano continua ativo até o fim do período pago e depois volta para o Grátis. Seus documentos não são apagados.'],
          ['O contrato gerado tem validade jurídica?', 'O Kit organiza e confere as informações, mas não substitui um advogado. Um contrato assinado pelas partes e por duas testemunhas costuma ter validade; para casos complexos ou de valor alto, procure um profissional.'],
          ['O que acontece quando acaba o limite do Grátis?', 'Você continua editando e exportando os contratos que já criou. Para gerar novos no mesmo mês, assine o Pro ou espere o mês seguinte.'],
          ['O assistente jurídico substitui um advogado?', 'Não. Ele explica termos, aponta pendências no texto e sugere cláusulas dos modelos do kit. Para orientação jurídica, consulte um advogado.'],
          ['O kit físico dá acesso ao site?', 'Sim: cada pasta vem com um código que ativa 3 meses do plano Pro.'],
        ].map(([q, a]) => `<div class="term"><button type="button" aria-expanded="false">${esc(q)}<span aria-hidden="true">＋</span></button><div class="definition"><p>${esc(a)}</p></div></div>`).join('')}</div>
        <div class="notice"><b>Página demonstrativa:</b> preços e planos são uma proposta do projeto acadêmico. Nenhum pagamento é processado; a escolha do plano fica salva apenas neste navegador para simular a experiência.</div>
      </section>`;
    };
    render();
    view.addEventListener('click', onClick);
    const onSubmit = (e) => {
      if (e.target.id !== 'redeem') return;
      e.preventDefault();
      const code = $('#redeemCode').value.trim().toUpperCase();
      if (code === K.KIT_CODE) { K.kitActivate(); render(); }
      else K.toast('Código inválido. Confira o código impresso no cartão do kit.', 'error');
    };
    view.addEventListener('submit', onSubmit);
    cleanup = () => { view.removeEventListener('click', onClick); view.removeEventListener('submit', onSubmit); };
    async function onClick(e) {
      const t = e.target.closest('.term button');
      if (t) { const open = t.parentElement.classList.toggle('open'); t.setAttribute('aria-expanded', open); t.querySelector('span').textContent = open ? '−' : '＋'; return; }
      if (e.target.closest('#buyKit')) { K.kitCheckout(); return; }
      const b = e.target.closest('[data-plan]');
      if (b) planAction(b.dataset.plan, b.dataset.ciclo, render);
    }
  }

  /* =====================================================================
   * Modo apresentação: volta o site ao estado de primeira visita
   * ===================================================================== */
  async function presentationMode() {
    const meus = K.store.load().filter((d) => !d.mock).length;
    const escolha = await K.modal({
      title: '🎬 Modo apresentação',
      html: `<p>Deixa o site pronto para apresentar, como numa primeira visita:</p>
        <ul class="check-list">
          <li>Os 6 contratos de exemplo voltam ao original</li>
          <li>Rascunho do formulário e conversa do assistente são limpos</li>
          <li>As perguntas grátis do assistente voltam a ${K.PLANS.gratis.ai} e o limite de contratos do mês é zerado</li>
          <li>A pasta do kit físico volta para os 5 modelos básicos e você sai da conta</li>
        </ul>
        ${meus ? `<p class="notice warn sm"><b>Atenção:</b> ${meus} contrato(s) criado(s) neste navegador serão apagados. Se quiser guardá-los, use antes “Exportar backup” em Meus documentos.</p>` : ''}
        <p><b>Em qual plano a demonstração deve começar?</b><br><span class="muted sm">No Grátis o checklist é manual; no Pro a análise automática já aparece.</span></p>`,
      actions: [
        { label: 'Cancelar', value: null },
        { label: 'Começar no Grátis', value: 'gratis' },
        { label: 'Começar no Pro', cls: 'primary', value: 'pro' },
      ],
    });
    if (!escolha) return;
    K.store.mem = K.buildMocks();
    K.store.persist();
    K.prefs.del('draft');
    K.prefs.del('aiq');
    K.prefs.del('kitSel');
    Object.assign(docFilter, { q: '', tipo: '', status: '', sort: 'recent' });
    if (K.assistant && K.assistant.reset) K.assistant.reset();
    if (K.auth.current()) K.auth.logout();
    K.plan.set(escolha);
    K.gate.reset();
    if (location.hash === '#/entrar') router(); else location.hash = '#/entrar';
    K.toast(`Pronto para apresentar! Começando no plano ${K.PLANS[escolha].nome}.`);
  }

  /* =====================================================================
   * Inicialização
   * ===================================================================== */
  $('#demoMode').addEventListener('click', presentationMode);
  $('#menuToggle').addEventListener('click', () => {
    const open = $('#mainNav').classList.toggle('open');
    $('#menuToggle').setAttribute('aria-expanded', open);
  });
  K.plan.renderChip();
  K.auth.renderHeader();
  window.addEventListener('hashchange', router);
  window.addEventListener('beforeunload', () => { if (cleanup) cleanup(); });
  router();
})();

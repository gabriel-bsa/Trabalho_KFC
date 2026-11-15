/* Kit Contrato Fácil — login SIMULADO (demonstração)
 *
 * Não existe servidor: as contas ficam no navegador (localStorage) e a "senha" é guardada
 * apenas como um resumo simples, sem segurança real. Por isso a tela pede para não usar
 * senhas verdadeiras. O login é opcional: dá para usar o site sem entrar.
 */
(function () {
  'use strict';
  const K = window.KCF;

  const resumo = (s) => { let h = 5381; for (const ch of String(s)) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; return h.toString(36); };
  const chave = (u) => String(u || '').trim().toLowerCase();
  const DEMO = { demo: { nome: 'Visitante (demonstração)', h: resumo('demo123') } };

  K.auth = {
    DEMO_USER: 'demo',
    DEMO_PASS: 'demo123',
    users() { return Object.assign({}, DEMO, K.prefs.get('users', {})); },
    current() { return K.prefs.get('session', null); },
    /** Entra com usuário (ou e-mail) e senha. Retorna true/false. */
    login(user, pass) {
      const u = chave(user);
      const x = this.users()[u];
      if (!x || x.h !== resumo(pass)) return false;
      K.prefs.set('session', { user: u, nome: x.nome, desde: Date.now() });
      this.changed();
      return true;
    },
    /** Cria conta e já entra. Retorna 'ok' | 'existe'. */
    register(nome, user, pass) {
      const u = chave(user);
      if (this.users()[u]) return 'existe';
      const salvos = K.prefs.get('users', {});
      salvos[u] = { nome: String(nome).trim(), h: resumo(pass) };
      K.prefs.set('users', salvos);
      this.login(u, pass);
      return 'ok';
    },
    logout() { K.prefs.del('session'); this.changed(); },
    firstName() { const s = this.current(); return s ? s.nome.split(' ')[0] : ''; },
    changed() { this.renderHeader(); document.dispatchEvent(new CustomEvent('kcf:auth')); },
    renderHeader() {
      const el = K.$('#userArea');
      if (!el) return;
      const s = this.current();
      el.innerHTML = s
        ? `<span class="user-chip" title="${K.esc(s.nome)}"><span class="avatar sm" aria-hidden="true">${K.esc(s.nome.trim()[0] || '?').toUpperCase()}</span><b>${K.esc(this.firstName())}</b></span><button type="button" class="user-out" id="logoutBtn">Sair</button>`
        : '<a class="user-chip login" href="#/inicio/entrar">Entrar</a>';
    },
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#logoutBtn')) return;
    K.auth.logout();
    K.toast('Você saiu da conta.');
  });
})();

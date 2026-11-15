/* Kit Contrato Fácil — utilitários gerais (DOM, formatação, validação, armazenamento) */
(function () {
  'use strict';
  const K = (window.KCF = window.KCF || {});

  /* ---------- DOM ---------- */
  K.$ = (s, el = document) => el.querySelector(s);
  K.$$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  K.esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  K.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  K.digits = (s) => String(s ?? '').replace(/\D/g, '');
  K.clone = (o) => JSON.parse(JSON.stringify(o));
  K.debounce = (fn, ms) => {
    let t;
    const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
    d.cancel = () => clearTimeout(t);
    return d;
  };
  K.norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  K.slug = (s) => K.norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'documento';
  K.escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  K.listJoin = (arr) => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1]);

  /* ---------- Campos pendentes: [PREENCHER: ...] ---------- */
  K.PH_RE = /\[[^\]\n]{1,80}\]/g;
  K.countPH = (s) => (String(s ?? '').match(K.PH_RE) || []).length;
  K.hasPH = (s) => K.countPH(s) > 0;

  /* ---------- CPF / CNPJ ---------- */
  const cpfDV = (d) => {
    for (let t = 9; t < 11; t++) {
      let s = 0;
      for (let i = 0; i < t; i++) s += +d[i] * (t + 1 - i);
      d += ((s * 10) % 11) % 10;
    }
    return d;
  };
  const cnpjDV = (d) => {
    for (const n of [12, 13]) {
      let s = 0, w = n - 7;
      for (let i = 0; i < n; i++) { s += +d[i] * w--; if (w < 2) w = 9; }
      const r = s % 11;
      d += r < 2 ? 0 : 11 - r;
    }
    return d;
  };
  K.fmtCPF = (d) => d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  K.fmtCNPJ = (d) => d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  K.validCPF = (v) => {
    const d = K.digits(v);
    return d.length === 11 && !/^(\d)\1+$/.test(d) && cpfDV(d.slice(0, 9)) === d;
  };
  K.validCNPJ = (v) => {
    const d = K.digits(v);
    return d.length === 14 && !/^(\d)\1+$/.test(d) && cnpjDV(d.slice(0, 12)) === d;
  };
  K.validDoc = (v) => {
    const n = K.digits(v).length;
    return n === 11 ? K.validCPF(v) : n === 14 ? K.validCNPJ(v) : false;
  };
  /** Gera um CPF/CNPJ válido a partir da base (usado nos documentos de exemplo). */
  K.completeCPF = (base9) => K.fmtCPF(cpfDV(K.digits(base9)));
  K.completeCNPJ = (base12) => K.fmtCNPJ(cnpjDV(K.digits(base12)));
  /** Máscara progressiva: até 11 dígitos = CPF, acima = CNPJ. */
  K.maskDoc = (v) => {
    const d = K.digits(v).slice(0, 14);
    if (d.length <= 11)
      return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return d
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  /* ---------- Dinheiro ---------- */
  K.parseMoney = (s) => {
    if (typeof s === 'number') return s;
    let t = String(s ?? '').replace(/[^\d,.]/g, '');
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
    else if (!(/^\d+\.\d{1,2}$/.test(t))) t = t.replace(/\./g, '');
    const n = parseFloat(t);
    return isFinite(n) ? n : 0;
  };
  K.money = (n) => Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  /* ---------- Números por extenso ---------- */
  const UN = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
  const DZ = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
  const CT = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
  const ate999 = (n) => {
    if (n === 100) return 'cem';
    const c = Math.floor(n / 100), r = n % 100, p = [];
    if (c) p.push(CT[c]);
    if (r) p.push(r < 20 ? UN[r] : DZ[Math.floor(r / 10)] + (r % 10 ? ' e ' + UN[r % 10] : ''));
    return p.join(' e ');
  };
  const NOMES = [['', ''], ['mil', 'mil'], ['milhão', 'milhões'], ['bilhão', 'bilhões']];
  K.extenso = (n, fem = false) => {
    n = Math.floor(Math.abs(Number(n) || 0));
    if (n === 0) return 'zero';
    const grupos = [];
    while (n > 0) { grupos.push(n % 1000); n = Math.floor(n / 1000); }
    const partes = [];
    for (let g = grupos.length - 1; g >= 0; g--) {
      const v = grupos[g];
      if (!v) continue;
      let t = g === 1 && v === 1 ? 'mil' : ate999(v);
      if (g > 1) t += ' ' + (v === 1 ? NOMES[g][0] : NOMES[g][1]);
      else if (g === 1 && v !== 1) t += ' mil';
      partes.push({ t, v });
    }
    let out = '';
    partes.forEach((p, i) => {
      if (i === 0) out = p.t;
      else out += (i === partes.length - 1 && (p.v < 100 || p.v % 100 === 0) ? ' e ' : ' ') + p.t;
    });
    if (fem) out = out.replace(/\bum\b/g, 'uma').replace(/\bdois\b/g, 'duas').replace(/entos\b/g, 'entas');
    return out;
  };
  K.valorExtenso = (v) => {
    v = Math.round((Number(v) || 0) * 100) / 100;
    const r = Math.floor(v), c = Math.round((v - r) * 100);
    let s = '';
    if (r > 0) s = K.extenso(r) + (r >= 1e6 && r % 1e6 === 0 ? ' de' : '') + (r === 1 ? ' real' : ' reais');
    if (c > 0) s += (s ? ' e ' : '') + K.extenso(c) + (c === 1 ? ' centavo' : ' centavos');
    return s || 'zero real';
  };

  /* ---------- Datas ---------- */
  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  K.parseISO = (s) => {
    if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  K.toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  K.today = () => K.toISO(new Date());
  K.isoFromNow = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return K.toISO(d); };
  K.fmtDate = (s) => { const d = K.parseISO(s); return d ? d.toLocaleDateString('pt-BR') : ''; };
  K.longDate = (s) => { const d = K.parseISO(s) || new Date(); return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`; };
  K.addMonths = (s, n) => {
    const d = K.parseISO(s);
    d.setMonth(d.getMonth() + Number(n));
    d.setDate(d.getDate() - 1);
    return K.toISO(d);
  };
  /** dd/mm/aaaa existe no calendário? */
  K.validBRDate = (s) => {
    const [d, m, y] = s.split('/').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  };
  K.relTime = (ts) => {
    const diff = (Date.now() - ts) / 1000;
    if (diff < 60) return 'agora mesmo';
    if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} h`;
    if (diff < 172800) return 'ontem';
    if (diff < 604800) return `há ${Math.floor(diff / 86400)} dias`;
    return new Date(ts).toLocaleDateString('pt-BR');
  };

  /* ---------- Armazenamento (localStorage com fallback em memória) ---------- */
  let warnedStorage = false;
  K.store = {
    key: 'kcf_docs_v1',
    mem: null,
    load() {
      if (this.mem) return this.mem;
      let data = null;
      try { data = JSON.parse(localStorage.getItem(this.key)); } catch (e) { data = null; }
      if (Array.isArray(data)) this.mem = data;
      else { this.mem = K.buildMocks(); this.persist(); }
      return this.mem;
    },
    persist() {
      try { localStorage.setItem(this.key, JSON.stringify(this.mem)); return true; }
      catch (e) {
        if (!warnedStorage) { warnedStorage = true; K.toast('O navegador bloqueou o armazenamento local: as alterações valem só até fechar a página.', 'warn'); }
        return false;
      }
    },
    get(id) { return this.load().find((d) => d.id === id); },
    upsert(doc) {
      const list = this.load();
      doc.updatedAt = Date.now();
      const i = list.findIndex((d) => d.id === doc.id);
      if (i < 0) list.unshift(doc); else list[i] = doc;
      this.persist();
    },
    remove(id) { this.mem = this.load().filter((d) => d.id !== id); this.persist(); },
  };
  K.prefs = {
    get(k, def) { try { const v = localStorage.getItem('kcf_' + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem('kcf_' + k, JSON.stringify(v)); } catch (e) { /* ignorado */ } },
    del(k) { try { localStorage.removeItem('kcf_' + k); } catch (e) { /* ignorado */ } },
  };

  /* ---------- Feedback: toast e modal ---------- */
  K.toast = (msg, type = 'ok') => {
    const box = K.$('#toasts');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.textContent = msg;
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3600);
  };

  let closeCurrent = null;
  K.closeModal = (v) => closeCurrent && closeCurrent(v);
  /** Abre um modal. Retorna Promise com o valor da ação escolhida (ou null). */
  K.modal = ({ title, html, actions = [], wide = false }) =>
    new Promise((resolve) => {
      if (closeCurrent) closeCurrent(null);
      const root = K.$('#modalRoot');
      const prevFocus = document.activeElement;
      root.innerHTML = `<div class="modal-backdrop"><div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-labelledby="mTitle">
        <div class="modal-head"><h3 id="mTitle">${K.esc(title)}</h3><button class="icon-btn" data-close aria-label="Fechar">✕</button></div>
        <div class="modal-body">${html}</div>
        ${actions.length ? `<div class="modal-foot">${actions.map((a, i) => `<button class="btn ${a.cls || 'ghost'}" data-act="${i}">${K.esc(a.label)}</button>`).join('')}</div>` : ''}
      </div></div>`;
      const onKey = (e) => { if (e.key === 'Escape') close(null); };
      const close = (v) => {
        root.innerHTML = '';
        document.removeEventListener('keydown', onKey);
        closeCurrent = null;
        if (prevFocus && prevFocus.focus && document.contains(prevFocus)) prevFocus.focus();
        resolve(v);
      };
      closeCurrent = close;
      document.addEventListener('keydown', onKey);
      root.querySelector('.modal-backdrop').addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('modal-backdrop')) close(null);
      });
      root.querySelector('[data-close]').addEventListener('click', () => close(null));
      root.querySelectorAll('[data-act]').forEach((b) =>
        b.addEventListener('click', () => {
          const a = actions[b.dataset.act];
          const r = a.onClick ? a.onClick(root) : a.value;
          if (r !== false) close(r === undefined ? a.value ?? null : r);
        })
      );
      const f = root.querySelector('.modal-body input, .modal-body textarea, .modal-body select') || root.querySelector('.btn.primary, .btn.danger');
      if (f) f.focus();
    });
  K.confirm = (title, msg, okLabel = 'Confirmar', danger = false) =>
    K.modal({
      title,
      html: `<p>${K.esc(msg)}</p>`,
      actions: [{ label: 'Cancelar', value: false }, { label: okLabel, cls: danger ? 'danger' : 'primary', value: true }],
    }).then((v) => v === true);

  /* ---------- Arquivos / área de transferência / impressão ---------- */
  K.download = (name, content, mime) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
  K.copy = async (text) => {
    try { await navigator.clipboard.writeText(text); }
    catch (e) {
      const t = document.createElement('textarea');
      t.value = text; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove();
    }
  };
  K.printHTML = (html) => {
    const r = K.$('#printRoot');
    r.innerHTML = html;
    document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); r.innerHTML = ''; window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => window.print(), 60);
  };
})();

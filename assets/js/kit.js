/* Kit Contrato Fácil — conteúdo do kit físico (a pasta)
 * Monta as folhas como seriam impressas: 5 modelos em branco + materiais de apoio.
 * Tudo é demonstração: o pedido e o código de ativação são simulados.
 */
(function () {
  'use strict';
  const K = window.KCF;
  const { esc } = K;

  const CORES = { servicos: '#2459a5', compra: '#c27c0e', locacao: '#1f8a58', trabalho: '#8a3fb4', parceria: '#c2410c' };
  const CODIGO = 'KCF-7Q4M-2026';

  K.KIT_ITEMS = [
    ...Object.entries(K.TYPES).map(([k, t], i) => ({
      id: 'modelo-' + k, kind: 'modelo', tipo: k, cor: CORES[k],
      tag: `Modelo ${String(i + 1).padStart(2, '0')}`, title: t.label, desc: t.desc,
    })),
    { id: 'checklist', kind: 'checklist', cor: '#10294b', tag: 'Apoio', title: 'Checklist de conferência', desc: 'Folha para marcar item a item antes de assinar.' },
    { id: 'glossario', kind: 'glossario', cor: '#10294b', tag: 'Apoio', title: 'Glossário ilustrado', desc: 'Os termos mais comuns explicados em linguagem simples.' },
    { id: 'guia', kind: 'guia', cor: '#10294b', tag: 'Apoio', title: 'Guia rápido de uso', desc: 'Como usar a pasta e quando recorrer ao site.' },
    { id: 'cartao', kind: 'cartao', cor: '#1f8a58', tag: 'Bônus', title: 'Cartão de ativação', desc: 'QR code e código que liberam 3 meses do plano Pro.' },
  ];

  /** QR code ILUSTRATIVO (padrão visual, não é lido por câmeras). */
  K.fakeQR = (seed = 7, size = 140) => {
    const n = 25;
    let s = seed;
    const rnd = () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
    const finder = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" fill="#10294b"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="#10294b"/>`;
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    let cells = '';
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!inFinder(x, y) && rnd() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" width="${size}" height="${size}" role="img" aria-label="QR code ilustrativo"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><g fill="#10294b">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
  };

  const head = (item) => `<div class="sheet-head" style="--c:${item.cor}"><img src="assets/img/logo.svg" alt="" width="26" height="26"><span>Kit Contrato Fácil</span><b>${esc(item.tag)}${item.kind === 'modelo' ? ' · ' + esc(item.title) : ''}</b></div>`;
  const foot = '<p class="sheet-foot">Material educativo. Não substitui a análise de um profissional habilitado.</p>';

  /** HTML de uma folha do kit, no formato de impressão. */
  K.kitSheet = (item) => {
    switch (item.kind) {
      case 'modelo': {
        const doc = K.blankModel(item.tipo);
        return head(item) +
          `<div class="sheet-howto"><b>Como preencher:</b> escreva com letra de forma nos espaços sublinhados, marque com X as opções <b>(   )</b> e risque o que não se aplica. Depois, confira tudo com o <b>Checklist de conferência</b>.</div>` +
          `<div class="blank">${K.renderPaper(doc, { blank: true })}</div>` + foot;
      }
      case 'checklist':
        return head(item) +
          `<h1 class="paper-title">CHECKLIST DE CONFERÊNCIA</h1>
          <p class="sheet-line">Contrato: <span class="fill" style="min-width:300px"></span> Data: <span class="fill" style="min-width:110px"></span></p>
          <table class="sheet-table"><tbody>${K.CHECKS.map((c, i) => `<tr><td class="box">☐</td><td><b>${i + 1}. ${esc(c.title)}</b><br><small>${esc(c.desc)}</small></td><td class="obs">Obs.:</td></tr>`).join('')}</tbody></table>
          <p class="sheet-tip">💡 Quer conferir automaticamente? No site, com o plano Pro (3 meses grátis no cartão do kit), o checklist digital valida CPF/CNPJ, valores por extenso, datas e campos em branco.</p>` + foot;
      case 'glossario':
        return head(item) +
          `<h1 class="paper-title">GLOSSÁRIO DE TERMOS CONTRATUAIS</h1>
          <dl class="sheet-gloss">${[...K.GLOSSARY].sort((a, b) => a.t.localeCompare(b.t, 'pt-BR')).map((g) => `<div><dt>${esc(g.t)}</dt><dd>${esc(g.d)}</dd></div>`).join('')}</dl>` + foot;
      case 'guia':
        return head(item) +
          `<h1 class="paper-title">GUIA RÁPIDO DO KIT</h1>
          <ol class="sheet-steps">
            <li><b>Escolha o modelo</b> pela cor da aba: serviços (azul), compra e venda (amarelo), locação (verde), trabalho (roxo) e parceria (laranja).</li>
            <li><b>Leia o glossário</b> antes de começar, para entender termos como foro, rescisão e multa.</li>
            <li><b>Preencha com letra de forma</b> os espaços sublinhados. Valores sempre em números e por extenso.</li>
            <li><b>Confira com o checklist</b>, marcando cada item. Se algo ficar em branco, resolva antes de assinar.</li>
            <li><b>Assine em 2 vias</b>, com duas testemunhas. Cada parte fica com uma via.</li>
            <li><b>Prefere o digital?</b> Escaneie o QR code do cartão de ativação: no site você gera o mesmo contrato, edita e confere automaticamente.</li>
          </ol>
          <div class="sheet-tip">⚠️ Para contratos de valor alto, imóveis, sociedades ou situações complexas, procure um advogado.</div>` + foot;
      case 'cartao':
        return `<div class="act-card">
            <div class="act-left">
              <img src="assets/img/logo.svg" alt="" width="54" height="54">
              <div class="act-brand">KIT <b>Contrato Fácil</b></div>
              <h2>3 meses do plano Pro</h2>
              <p>Contratos ilimitados, assistente jurídico e exportação sem marca d’água.</p>
              <div class="act-code"><small>Seu código</small><b>${CODIGO}</b></div>
              <p class="act-how">Escaneie o QR code ou acesse o site do Kit e escolha <b>Planos → Ativar código</b>.</p>
            </div>
            <div class="act-right">${K.fakeQR(2026, 150)}<small>QR ilustrativo</small></div>
          </div>
          <p class="sheet-foot">Cartão impresso em papel reciclado, tamanho 9 × 5 cm. Código fictício para demonstração.</p>`;
      default:
        return '';
    }
  };

  /** Miniatura de uma folha (usada na tela do kit e no pedido). */
  K.kitThumb = (it) =>
    `<span class="sheet-thumb" aria-hidden="true"><span class="paper sheet ${it.kind === 'cartao' ? 'card-sheet' : ''}">${K.kitSheet(it)}</span></span>`;

  /** Pedido simulado do kit: mostra os modelos e materiais que vêm na pasta antes de confirmar. */
  K.kitCheckout = () => {
    const p = K.modal({
      title: 'Quero o Kit Contrato Fácil',
      wide: true,
      html: `<p class="muted">Estes são os materiais que vêm impressos na pasta. Clique em qualquer um para ver a folha inteira.</p>
        <div class="kit-pick">${K.KIT_ITEMS.map((it) => `
          <button type="button" class="kp-item" data-kit-open="${it.id}" style="--c:${it.cor}">
            ${K.kitThumb(it)}
            <span class="kp-tag">${esc(it.tag)}</span><b>${esc(it.title)}</b>
          </button>`).join('')}
        </div>
        <div class="checkout"><div><b>Kit Contrato Fácil — a pasta</b><small>${K.KIT_ITEMS.filter((i) => i.kind === 'modelo').length} modelos + checklist + glossário + guia + cartão com 3 meses de Pro · pasta de 32 × 24 × 6 cm</small></div><b>${K.price(K.KIT.preco)}</b></div>
        <p class="notice sm">Demonstração: a loja ainda não está ativa e nenhum pagamento é processado. Na versão comercial, aqui entrariam endereço de entrega e frete.</p>`,
      actions: [{ label: 'Cancelar', value: false }, { label: `Confirmar pedido · ${K.price(K.KIT.preco)} (demo)`, cls: 'primary', value: true }],
    });
    K.$('#modalRoot .modal').addEventListener('click', (e) => {
      const b = e.target.closest('[data-kit-open]');
      if (!b) return;
      K.closeModal(null);
      const target = '#/kit/' + b.dataset.kitOpen;
      if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
      else location.hash = target;
    });
    return p.then((ok) => { if (ok === true) K.toast('Pedido simulado! Na entrega, use o cartão de ativação para liberar 3 meses de Pro.'); return ok; });
  };

  /** Ativação simulada do código do cartão. */
  K.kitActivate = () => { K.plan.set('pro', { ciclo: 'kit' }); K.toast(`Código ${CODIGO} ativado: 3 meses de Pro liberados (demonstração).`); };
  K.KIT_CODE = CODIGO;
})();

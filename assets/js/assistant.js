/* Kit Contrato Fácil — Assistente jurídico (DEMONSTRAÇÃO)
 *
 * Não usa inteligência artificial nem internet. As respostas são montadas por regras:
 *  - identifica a intenção da pergunta por palavras-chave;
 *  - quando há um contrato aberto no editor, usa a análise real do checklist, o texto das
 *    cláusulas e o glossário para responder sobre AQUELE contrato;
 *  - pode agir no documento (ir até uma cláusula, inserir cláusula, corrigir valor por extenso).
 */
(function () {
  'use strict';
  const K = window.KCF;
  const { $, esc } = K;
  const MONEY_EXT_RE = /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})\s*\(([^)]+)\)/g;
  const state = { open: false, busy: false, msgs: [] };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ctx = () => K.editorCtx;
  const pl = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
  const typeOf = (t) => K.TYPES[t] || K.TYPES.servicos;

  /* ---------- Texto: **negrito**, quebras de linha e citações ("> ") ---------- */
  const md = (s) => {
    const lines = String(s).split('\n');
    let html = '', quote = [];
    const flush = () => { if (quote.length) { html += `<blockquote>${quote.join('<br>')}</blockquote>`; quote = []; } };
    lines.forEach((l, i) => {
      const inl = esc(l.replace(/^> ?/, '')).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
      if (/^> ?/.test(l)) { quote.push(inl); return; }
      flush();
      html += inl + (i < lines.length - 1 ? '<br>' : '');
    });
    flush();
    return html;
  };

  /* ---------- Valor por extenso → número (para corrigir divergências) ---------- */
  const NUM = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, treze: 13, quatorze: 14, catorze: 14, quinze: 15, dezesseis: 16, dezessete: 17, dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70, oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, trezentas: 300, quatrocentos: 400, quatrocentas: 400, quinhentos: 500, quinhentas: 500, seiscentos: 600, seiscentas: 600, setecentos: 700, setecentas: 700, oitocentos: 800, oitocentas: 800, novecentos: 900, novecentas: 900 };
  const parseInt_ = (words) => {
    let total = 0, cur = 0;
    words.forEach((w) => {
      if (NUM[w] != null) cur += NUM[w];
      else if (w === 'mil') { total += (cur || 1) * 1000; cur = 0; }
      else if (w === 'milhao' || w === 'milhoes') { total += (cur || 1) * 1e6; cur = 0; }
    });
    return total + cur;
  };
  const parseExtenso = (s) => {
    const n = K.norm(s).replace(/[^a-z\s]/g, ' ');
    const [reais, cents = ''] = n.split(/\breais?\b/);
    const hasReais = /\breais?\b/.test(n);
    const r = hasReais ? parseInt_(reais.split(/\s+/)) : 0;
    const c = parseInt_((hasReais ? cents : n).replace(/centavos?/, '').split(/\s+/));
    return r + c / 100;
  };
  const mismatches = (doc) => {
    const out = [];
    doc.clauses.forEach((c) => {
      for (const m of c.body.matchAll(MONEY_EXT_RE)) {
        const num = K.parseMoney(m[1]);
        if (K.norm(K.valorExtenso(num)) !== K.norm(m[2].trim())) out.push({ clause: c, full: m[0], num, ext: m[2].trim(), extNum: parseExtenso(m[2]) });
      }
    });
    return out;
  };
  const clauseName = (doc, cid) => {
    let n = 0;
    for (const c of doc.clauses) {
      if (c.numbered !== false) n++;
      if (c.id === cid) return c.numbered !== false ? `Cláusula ${n}ª – ${c.title}` : c.title;
    }
    return '';
  };

  /* =====================================================================
   * Intenções
   * ===================================================================== */
  const TOPICS = [
    ['confidencialidade', /sigil|confidenc|segredo/],
    ['lgpd', /lgpd|dados pessoais|protecao de dados/],
    ['forca', /forca maior|caso fortuito|imprevist|pandemia|enchente|catastrofe/],
    ['atraso', /atraso|juros|mora\b|pagamento atrasado/],
    ['pi', /propriedade intelectual|direitos? autora|autoria|portfolio/],
    ['comunicacao', /comunica|notifica|e-?mail/],
    ['naoexclusividade', /exclusiv/],
  ];
  const TYPE_HINTS = [
    ['nda', /confidencial|sigilo|\bnda\b|segredo/],
    ['distrato', /distrato|encerrar (um |o )?contrato|cancelar (um |o )?contrato|terminar (um |o )?contrato/],
    ['mutuo', /emprest\w* (de )?dinheiro|mutuo|juros|emprestimo (entre|para) empresa/],
    ['comodato', /comodato|emprest\w* (um |uma |o |a |meu |minha )?(equipamento|maquina|carro|veiculo|bem|espaco)/],
    ['representacao', /represent|vendedor externo|comissao/],
    ['locacao', /alug|locar|locacao|imovel|sala comercial|\bloja\b|galpao|inquilino/],
    ['trabalho', /funcionari|empregad|contratar (alguem|uma pessoa|um atendente)|clt|carteira|salario|registrar/],
    ['compra', /vend|compr|equipamento|veiculo|carro|maquina|mercadoria|forno/],
    ['parceria', /parceri|outra empresa|em conjunto|juntos|colabora/],
    ['servicos', /servico|freela|site|consultor|reforma|prestador|designer|contador|manutencao|obra/],
  ];

  function answer(raw) {
    const q = K.norm(raw).replace(/[?!.,]/g, ' ').replace(/\s+/g, ' ').trim();
    const c = ctx();
    const doc = c && c.doc;

    if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa|hello|hey)\b/.test(q)) return intro();
    if (/obrigad|valeu|agradec/.test(q)) return { text: 'Por nada! Se surgir outra dúvida, é só perguntar. 😊' };
    if (/o que (voce|vc) (faz|sabe)|como (voce|vc) (funciona|ajuda)|^ajuda$|me ajuda$/.test(q)) return intro(true);

    if (/(corri[gj]|arrum|consert|ajust).*(extenso|valor)|(extenso|valor).*(corri[gj]|arrum|errad)/.test(q)) return fixExtenso(doc);
    if (/(escrev|redij|redig|cri[ae]|adicion|inclu|insir|insere|sugir|sugest|modelo de).*clausula|clausula (de|sobre|para)/.test(q)) return writeClause(q, doc);
    if (/(falta|pendenc|problema|revis|confer|analis|verific|erro|esta (bom|certo|ok|pronto|completo)|posso assinar|ta bom)/.test(q)) return analyze(doc);
    if (/resum|do que se trata|explica (o|este|esse) contrato|sobre o que/.test(q)) return summarize(doc);
    if (/multa/.test(q) && /(alta|baixa|alto|quanto|percent|normal|razoav|limite|adequad|justa|maxim|pode)/.test(q)) return multa(doc);
    if (/(qual|que) (tipo|contrato|modelo)|preciso (de|fazer) (um )?contrato|vou (alugar|contratar|vender|comprar)|quero (alugar|contratar|vender|comprar)/.test(q)) return recommend(q);
    if (/plano|preco|quanto custa|gratuito|gratis|\bpro\b|assinar o|mensalidade|kit fisico|pasta/.test(q)) return plans();
    if (/advogad|valid|vale (juridicamente|na justica)|cartorio|registr|reconhec|firma|legal(mente)?\b/.test(q)) return validity();
    if (/assin|testemunh/.test(q)) return signatures();

    const g = K.GLOSSARY.find((x) => new RegExp('(^|[^\\p{L}])(' + (x.m || K.escRe(x.t)) + ')($|[^\\p{L}])', 'iu').test(raw));
    if (g) return glossary(g, doc);

    const t = TYPE_HINTS.find(([, re]) => re.test(q));
    if (t && !doc) return recommend(q);

    return {
      text: 'Ainda não sei responder essa pergunta. 🤔\n\nSou um assistente de demonstração: explico termos de contratos, analiso o contrato aberto no editor, sugiro cláusulas e ajudo a escolher o tipo de contrato. Tente uma das sugestões abaixo.',
    };
  }

  function intro(full) {
    const doc = ctx() && ctx().doc;
    return {
      text: (full ? '' : 'Olá! Sou o **assistente jurídico** do Kit Contrato Fácil. 👋\n\n') +
        'Posso ajudar a:\n• explicar termos (ex.: “o que é foro?”)\n• encontrar pendências no contrato aberto\n• resumir o contrato\n• escrever cláusulas prontas\n• indicar qual contrato você precisa\n\n' +
        (doc ? `Estou vendo o contrato **${doc.title}**. Quer que eu confira o que falta nele?` : 'Abra um contrato no editor para que eu possa analisá-lo.'),
      actions: doc ? [{ label: 'O que falta neste contrato?', ask: 'O que falta neste contrato?' }] : [{ label: 'Ver meus documentos', run: () => { location.hash = '#/documentos'; } }],
    };
  }

  const needDoc = (what) => ({
    text: `Para ${what}, abra um contrato no editor. Depois é só me perguntar de novo.`,
    actions: [{ label: 'Abrir Meus documentos', run: () => { location.hash = '#/documentos'; } }],
  });

  /** No Grátis, a análise automática do contrato fica bloqueada (recurso do Pro). */
  const proOnly = () => ({
    text: 'A **análise automática do contrato** é um recurso do plano **Pro**: eu leio o texto e aponto CPF/CNPJ inválidos, valores que não batem com o extenso, datas erradas e campos em branco.\n\nNo Grátis, você confere marcando o checklist ao lado, item por item. Posso continuar explicando termos e sugerindo cláusulas normalmente.',
    actions: [
      { label: 'Assinar o Pro', run: () => { K.subscribePro(); say({ text: 'Pronto! O plano **Pro** está ativo (demonstração). Agora é só perguntar “O que falta neste contrato?”.' }); } },
      { label: 'Ver planos', run: () => { location.hash = '#/planos'; } },
    ],
  });

  function analyze(doc) {
    if (!doc) return needDoc('eu analisar um contrato');
    if (!K.autoCheck()) return proOnly();
    const s = K.summary(doc);
    const bad = s.res.filter((r) => r.status === 'fail' || r.status === 'warn');
    const pend = s.total - s.done;
    if (!bad.length) {
      return {
        text: `Li as ${doc.clauses.length} cláusulas de **${doc.title}** e não encontrei problemas automáticos. ✓\n\n` +
          (pend ? `Ainda ${pend === 1 ? 'falta' : 'faltam'} **${pl(pend, 'item', 'itens')}** para você confirmar manualmente no checklist, incluindo a leitura final.` : 'Todos os itens do checklist já foram confirmados.') +
          '\n\nLembre-se: para contratos de valor alto ou situações complexas, vale consultar um advogado.',
      };
    }
    const actions = [];
    if (mismatches(doc).length) actions.push({ label: '✨ Corrigir valor por extenso', ask: 'Corrija o valor por extenso' });
    bad.filter((r) => r.clause).slice(0, 3).forEach((r) => actions.push({ label: `Ir para: ${r.title}`, run: () => ctx() && ctx().go(r.clause) }));
    return {
      text: `Li as ${doc.clauses.length} cláusulas de **${doc.title}** e encontrei **${pl(bad.length, 'ponto', 'pontos')}** para revisar:\n\n` +
        bad.map((r, i) => `${i + 1}. **${r.title}** ${r.status === 'fail' ? '(problema)' : '(atenção)'} — ${r.msg}`).join('\n') +
        (pend ? `\n\nDepois de resolver, confirme ${pend === 1 ? 'o item restante' : `os ${pend} itens restantes`} no checklist ao lado.` : ''),
      actions,
    };
  }

  function fixExtenso(doc) {
    if (!doc) return needDoc('eu corrigir valores');
    if (!K.autoCheck()) return proOnly();
    const list = mismatches(doc);
    if (!list.length) return { text: 'Conferi todos os valores em R$ do contrato: os números e os valores por extenso estão batendo. ✓' };
    const m = list[0];
    const where = clauseName(doc, m.clause.id);
    const actions = [{
      label: `Manter R$ ${K.money(m.num)}`,
      run: () => {
        const ok = ctx() && ctx().replaceIn(m.clause.id, m.full, `R$ ${K.money(m.num)} (${K.valorExtenso(m.num)})`, 'Antes de corrigir o extenso (assistente)');
        say(ok ? { text: `Pronto! Atualizei o extenso para “${K.valorExtenso(m.num)}” na ${where}. Uma versão de segurança foi salva em “Versões”.` } : { text: 'Não consegui aplicar a correção: o texto mudou. Tente perguntar de novo.' });
      },
    }];
    if (m.extNum > 0 && Math.abs(m.extNum - m.num) > 0.001) {
      actions.push({
        label: `Manter o extenso (R$ ${K.money(m.extNum)})`,
        run: () => {
          const ok = ctx() && ctx().replaceIn(m.clause.id, m.full, `R$ ${K.money(m.extNum)} (${K.valorExtenso(m.extNum)})`, 'Antes de corrigir o valor (assistente)');
          say(ok ? { text: `Pronto! Ajustei o número para R$ ${K.money(m.extNum)} na ${where}. Confira se as parcelas continuam corretas.` } : { text: 'Não consegui aplicar a correção: o texto mudou.' });
        },
      });
    }
    return {
      text: `Na **${where}**, o número e o extenso não batem:\n\n> R$ ${K.money(m.num)} (${m.ext})\n\nO extenso correto de R$ ${K.money(m.num)} seria “${K.valorExtenso(m.num)}”. Qual dos dois está certo?` +
        (list.length > 1 ? `\n\nHá mais ${pl(list.length - 1, 'divergência', 'divergências')}; depois desta, pergunte de novo.` : ''),
      actions,
    };
  }

  function summarize(doc) {
    if (!doc) return needDoc('eu resumir um contrato');
    const s = K.summary(doc);
    const text = K.docText(doc);
    const money = (text.match(/R\$\s?\d{1,3}(?:\.\d{3})*,\d{2}/) || [])[0];
    const prazoC = doc.clauses.find((c) => c.key === 'prazo');
    const prazo = prazoC ? prazoC.body.split(/(?<=\.)\s/)[0] : '';
    const p = doc.fields || {};
    const t = typeOf(doc.tipo);
    return {
      text: `**Resumo de “${doc.title}”**\n\n` +
        `• **Tipo:** ${t.label}\n` +
        (p.p1 && p.p2 ? `• **Partes:** ${p.p1.nome || '—'} (${t.p1.toLowerCase()}) e ${p.p2.nome || '—'} (${t.p2.toLowerCase()})\n` : '') +
        (money ? `• **Valor principal:** ${money}\n` : '') +
        (prazo ? `• **Prazo:** ${prazo}\n` : '') +
        `• **Estrutura:** ${doc.clauses.length} cláusulas\n` +
        `• **Checklist:** ${s.done} de ${s.total} itens confirmados` + (s.fails + s.warns ? `, ${pl(s.fails + s.warns, 'ponto', 'pontos')} para revisar` : ', sem pendências automáticas'),
      actions: s.fails + s.warns ? [{ label: 'Quais pontos revisar?', ask: 'O que falta neste contrato?' }] : [],
    };
  }

  function writeClause(q, doc) {
    const hit = TOPICS.find(([, re]) => re.test(q));
    if (!hit) {
      return {
        text: 'Posso sugerir estas cláusulas prontas. Qual você quer?',
        actions: K.CLAUSE_LIB.slice(0, 6).map((l) => ({ label: l.title.replace(/^D[aeo]s? /, '').replace(/^./, (ch) => ch.toUpperCase()), ask: 'Escreva uma cláusula ' + l.title.toLowerCase() })),
      };
    }
    const l = K.CLAUSE_LIB.find((x) => x.key === hit[0]);
    const already = doc && doc.clauses.find((c) => c.key === l.key);
    const actions = [];
    if (doc && !already) actions.push({ label: '➕ Inserir no contrato', run: () => { const c = ctx() && ctx().insertClause(l); say({ text: c ? `Inseri “${l.title}” antes das disposições finais. Você pode editar o texto à vontade.` : 'Abra o contrato no editor para inserir.' }); } });
    if (already) actions.push({ label: 'Ver a cláusula existente', run: () => ctx() && ctx().go(already.id) });
    actions.push({ label: 'Copiar texto', run: async () => { await K.copy(l.body); K.toast('Texto da cláusula copiado.'); } });
    return {
      text: `Aqui está uma sugestão de cláusula **${l.title}**:\n\n> ${l.body}\n\n` +
        (already ? 'Seu contrato **já tem** uma cláusula com esse tema.' : doc ? 'Quer que eu insira no contrato aberto?' : 'Abra um contrato no editor para inseri-la com um clique.'),
      actions,
    };
  }

  function multa(doc) {
    let ctxTxt = '';
    if (doc) {
      const txt = K.docText(doc);
      const m = txt.match(/multa de (\d+)% \(([^)]+)\)/i);
      if (doc.tipo === 'locacao') ctxTxt = '\n\n**No seu contrato de locação:** a multa por devolução antecipada é de 3 aluguéis, proporcional ao tempo restante, como permite a Lei do Inquilinato.';
      if (m) {
        const v = +m[1];
        ctxTxt += `\n\n**No seu contrato:** a multa por descumprimento é de **${v}%**. ` +
          (v <= 20 ? 'Está dentro da faixa mais usada. ✓' : 'Está **acima** do que costuma ser usado; há risco de ser reduzida se for discutida na Justiça.');
      } else if (doc.tipo === 'trabalho') {
        ctxTxt = '\n\n**No seu contrato de trabalho:** as multas seguem a CLT, então não há percentual livre a definir.';
      }
    }
    return {
      text: 'Em contratos entre empresas, é comum ver multas por descumprimento entre **10% e 20%** do valor do contrato.\n\n' +
        '• A multa não pode ser maior que o valor da obrigação principal (art. 412 do Código Civil).\n' +
        '• Se for exagerada, o juiz pode reduzi-la (art. 413).\n' +
        '• Para atraso de pagamento em relações de consumo, a multa costuma ser limitada a 2%.' + ctxTxt +
        '\n\nEsta é uma orientação geral e educativa.',
    };
  }

  function recommend(q) {
    const t = TYPE_HINTS.find(([, re]) => re.test(q));
    if (!t) {
      return {
        text: 'Me conte o que você quer fazer e eu indico o modelo. Por exemplo:\n• “Vou alugar uma sala”\n• “Quero contratar um designer”\n• “Vou vender um equipamento”',
        actions: Object.entries(K.TYPES).map(([k, x]) => ({ label: `${x.icon} ${x.label}`, run: () => { location.hash = '#/novo/' + k; } })),
      };
    }
    const x = K.TYPES[t[0]];
    return {
      text: `Pelo que você descreveu, o modelo indicado é **${x.label}**. ${x.desc}\n\nO formulário já vem configurado com os campos certos para esse tipo.`,
      actions: [{ label: `Criar contrato de ${x.label.toLowerCase()}`, run: () => { location.hash = '#/novo/' + t[0]; } }],
    };
  }

  function plans() {
    const P = K.PLANS;
    return {
      text: `São dois planos:\n\n• **Grátis:** ${P.gratis.docs} contratos por mês, editor, checklist e ${P.gratis.ai} perguntas por dia aqui no assistente.\n• **Pro:** ${K.price(P.pro.mensal)}/mês, com contratos e assistente ilimitados e exportação sem marca d’água.\n\n🎉 **Promoção do anual:** o Pro sai por ${K.price(P.pro.anual)}/ano, o equivalente a ${K.price(P.pro.anual / 12)}/mês (2 meses grátis).\n\nTambém existe o **kit físico** (a pasta) por ${K.price(K.KIT.preco)}, que inclui 3 meses de Pro.`,
      actions: [{ label: 'Ver planos', run: () => { location.hash = '#/planos'; } }],
    };
  }

  const validity = () => ({
    text: 'Um contrato escrito e assinado pelas partes já costuma valer, mesmo sem cartório. Algumas dicas:\n\n• Com a assinatura de **2 testemunhas**, ele vira um título executivo, o que facilita cobrar na Justiça se houver calote.\n• **Reconhecer firma** em cartório é opcional na maioria dos casos, mas dá mais segurança sobre quem assinou.\n• Assinaturas eletrônicas (como a do gov.br) também são aceitas.\n\nPara contratos de valor alto, imóveis, sociedades ou situações complexas, procure um advogado: este kit é uma ferramenta de apoio e não substitui essa orientação.',
  });
  const signatures = () => ({
    text: 'Para assinar:\n\n• As duas partes assinam no final, nas linhas indicadas.\n• Duas **testemunhas** maiores de idade, sem interesse no negócio, assinam e informam o CPF.\n• Imprima em 2 vias (uma para cada parte) ou use assinatura eletrônica.\n\nOs modelos do kit já trazem esses espaços na seção **Assinaturas**.',
    actions: ctx() && ctx().doc.clauses.find((c) => c.key === 'assinaturas') ? [{ label: 'Ir para as assinaturas', run: () => ctx().go(ctx().doc.clauses.find((c) => c.key === 'assinaturas').id) }] : [],
  });

  function glossary(g, doc) {
    let where = '';
    const actions = [];
    if (doc) {
      const re = new RegExp('(^|[^\\p{L}])(' + (g.m || K.escRe(g.t)) + ')($|[^\\p{L}])', 'iu');
      const c = doc.clauses.find((x) => re.test(x.title + '\n' + x.body));
      if (c) {
        where = `\n\nNo seu contrato, esse termo aparece na **${clauseName(doc, c.id)}**.`;
        actions.push({ label: 'Mostrar no contrato', run: () => ctx() && ctx().go(c.id) });
      }
    }
    actions.push({ label: 'Abrir glossário', run: () => { location.hash = '#/glossario'; } });
    return { text: `**${g.t}:** ${g.d}` + (g.ex ? `\n\n**Exemplo:** ${g.ex}` : '') + where, actions };
  }

  /* =====================================================================
   * Interface
   * ===================================================================== */
  /** Sugestões: [texto curto do botão, pergunta enviada]. */
  function suggestions() {
    if (ctx()) return [
      ['O que falta?', 'O que falta neste contrato?'],
      ['Resumir', 'Resuma este contrato'],
      ['A multa está ok?', 'A multa está adequada?'],
      ['Sugerir cláusula', 'Escreva uma cláusula de confidencialidade'],
      ['O que é foro?', 'O que é foro?'],
    ];
    return [
      ['Qual contrato para alugar?', 'Vou alugar uma sala, qual contrato uso?'],
      ['O que é rescisão?', 'O que é rescisão?'],
      ['Precisa de testemunhas?', 'O contrato precisa de testemunhas?'],
      ['Quanto custa o Pro?', 'Quanto custa o plano Pro?'],
    ];
  }

  function build() {
    const fab = document.createElement('button');
    fab.className = 'ai-fab';
    fab.id = 'aiFab';
    fab.setAttribute('aria-label', 'Abrir assistente jurídico');
    fab.innerHTML = '<span aria-hidden="true">💬</span><span class="lbl">Assistente</span>';
    const panel = document.createElement('section');
    panel.className = 'ai-panel';
    panel.id = 'aiPanel';
    panel.setAttribute('aria-label', 'Assistente jurídico');
    panel.hidden = true;
    panel.innerHTML = `
      <header class="ai-head">
        <img src="assets/img/logo.svg" alt="" width="34" height="34">
        <div><b>Assistente jurídico</b><small>Demonstração · não substitui um advogado</small></div>
        <button class="icon-btn" id="aiClear" title="Limpar conversa" aria-label="Limpar conversa">↺</button>
        <button class="icon-btn" id="aiClose" title="Fechar" aria-label="Fechar assistente">✕</button>
      </header>
      <div class="ai-msgs" id="aiMsgs" aria-live="polite"></div>
      <div class="ai-chips" id="aiChips"></div>
      <form class="ai-input" id="aiForm">
        <input id="aiText" autocomplete="off" placeholder="Pergunte sobre contratos…" aria-label="Sua pergunta" maxlength="300">
        <button class="ai-send" type="submit" aria-label="Enviar pergunta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button>
      </form>
      <div class="ai-foot" id="aiQuota"></div>`;
    document.body.append(fab, panel);

    fab.addEventListener('click', () => toggle(true));
    $('#aiClose').addEventListener('click', () => toggle(false));
    $('#aiClear').addEventListener('click', () => { state.msgs = []; $('#aiMsgs').innerHTML = ''; greet(); });
    $('#aiForm').addEventListener('submit', (e) => { e.preventDefault(); const t = $('#aiText'); const v = t.value; t.value = ''; ask(v); });
    $('#aiChips').addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) ask(b.dataset.q); });
    $('#aiMsgs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = state.actions[b.dataset.a];
      if (!a) return;
      if (a.ask) ask(a.ask);
      else if (a.run) a.run();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.open && !$('#modalRoot').children.length) toggle(false); });
    document.addEventListener('click', (e) => { if (e.target.closest('[data-open-assistant]')) toggle(true); });
    window.addEventListener('hashchange', () => setTimeout(renderChips, 50));
    document.addEventListener('kcf:plan', renderQuota);
  }
  state.actions = [];

  function toggle(open) {
    state.open = open;
    $('#aiPanel').hidden = !open;
    $('#aiFab').classList.toggle('hidden', open);
    document.body.classList.toggle('ai-open', open);
    if (open) {
      if (!state.msgs.length) greet();
      renderChips(); renderQuota();
      setTimeout(() => $('#aiText').focus(), 50);
    } else {
      $('#aiFab').focus();
    }
  }

  function bubble(m) {
    const el = document.createElement('div');
    el.className = 'ai-msg ' + m.from;
    el.innerHTML = `<div class="bubble">${md(m.text)}</div>`;
    $('#aiMsgs').appendChild(el);
    scroll();
    return el;
  }
  const scroll = () => { const box = $('#aiMsgs'); box.scrollTop = box.scrollHeight; };
  function addActions(el, actions) {
    if (!actions || !actions.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'ai-actions';
    wrap.innerHTML = actions.map((a) => { state.actions.push(a); return `<button type="button" data-a="${state.actions.length - 1}">${esc(a.label)}</button>`; }).join('');
    el.appendChild(wrap);
    scroll();
  }

  /** Mostra a resposta do assistente com efeito de digitação. */
  async function say(r) {
    state.busy = true;
    const typing = document.createElement('div');
    typing.className = 'ai-msg bot';
    typing.innerHTML = '<div class="bubble typing"><i></i><i></i><i></i></div>';
    $('#aiMsgs').appendChild(typing);
    scroll();
    await wait(450 + Math.random() * 450);
    typing.remove();
    const m = { from: 'bot', text: '' };
    state.msgs.push(m);
    const el = bubble(m);
    const b = el.querySelector('.bubble');
    const words = r.text.split(/(\s+)/);
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    for (let i = 0; i < words.length; i += reduce ? words.length : 3) {
      m.text = words.slice(0, i + 3).join('');
      b.innerHTML = md(m.text);
      scroll();
      if (!reduce) await wait(16);
    }
    m.text = r.text;
    b.innerHTML = md(m.text);
    addActions(el, r.actions);
    state.busy = false;
    renderChips();
  }

  async function ask(text) {
    text = String(text || '').trim();
    if (!text) return;
    // Se o assistente ainda está "digitando", a pergunta espera a vez em vez de ser descartada.
    while (state.busy) await wait(120);
    const m = { from: 'me', text };
    state.msgs.push(m);
    bubble(m);
    $('#aiChips').innerHTML = '';
    if (K.plan.aiLeft() <= 0) {
      return say({
        text: `Você usou as ${K.PLANS.gratis.ai} perguntas grátis de hoje. 🙂\n\nNo plano **Pro** o assistente é ilimitado, por ${K.price(K.PLANS.pro.mensal)}/mês.`,
        actions: [
          { label: 'Assinar o Pro', run: () => { K.subscribePro(); say({ text: 'Pronto! O plano **Pro** está ativo (demonstração). Pode perguntar à vontade.' }); } },
          { label: 'Ver planos', run: () => { location.hash = '#/planos'; } },
        ],
      });
    }
    if (K.plan.info().ai !== Infinity) K.plan.aiUse();
    renderQuota();
    let r;
    try { r = answer(text); } catch (e) { r = { text: 'Ops, algo deu errado ao analisar. Tente de novo.' }; }
    await say(r);
  }

  function greet() {
    const doc = ctx() && ctx().doc;
    say({
      text: 'Olá! Sou o **assistente jurídico** do Kit. 👋\n\n' +
        (doc ? `Estou com o contrato **${doc.title}** aberto. Posso analisar o que falta, resumir, sugerir cláusulas ou explicar termos.` : 'Posso explicar termos, indicar o contrato certo para você e, com um contrato aberto no editor, analisar o que falta nele.'),
    });
  }

  function renderChips() {
    const box = $('#aiChips');
    if (!box || state.busy) return;
    box.innerHTML = suggestions().map(([label, q]) => `<button type="button" data-q="${esc(q)}" title="${esc(q)}">${esc(label)}</button>`).join('');
  }
  function renderQuota() {
    const el = $('#aiQuota');
    if (!el) return;
    const left = K.plan.aiLeft();
    el.innerHTML = left === Infinity ? `Plano ${esc(K.plan.label())} · perguntas ilimitadas` : `Restam <b>${left} de ${K.PLANS.gratis.ai}</b> perguntas grátis hoje · <a href="#/planos">Conhecer o Pro</a>`;
  }

  /** Limpa a conversa e fecha o painel (usado pelo Modo apresentação). */
  function reset() {
    state.msgs = [];
    state.actions = [];
    state.busy = false;
    $('#aiMsgs').innerHTML = '';
    if (state.open) toggle(false);
    renderQuota();
  }

  K.assistant = { open: () => toggle(true), ask, reset };
  build();
})();

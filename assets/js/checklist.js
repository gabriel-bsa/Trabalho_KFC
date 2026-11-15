/* Kit Contrato Fácil — checklist de conferência com análise automática do texto do contrato
 *
 * Cada item tem:
 *  - uma análise automática (run) que lê o texto e devolve { status, msg, clause }
 *      status: 'ok' (encontrado) | 'warn' (atenção) | 'fail' (problema) | 'manual' (só conferência humana)
 *  - uma confirmação manual (doc.checks[id] = true) feita pela pessoa.
 * O documento só fica "Conferido" quando todos os itens foram confirmados e nenhum aponta problema.
 */
(function () {
  'use strict';
  const K = window.KCF;

  const DOC_RE = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  const DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/g;
  const DUR_RE = /\b\d+\s*(?:\([^)]*\)\s*)?(?:dias?|meses|mês|anos?|horas)\b/gi;
  const MONEY_EXT_RE = /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})\s*\(([^)]+)\)/g;

  const ctxOf = (doc) => {
    const text = [doc.heading, ...doc.clauses.map((c) => c.title + '\n' + c.body)].join('\n\n');
    const find = (key, re) => doc.clauses.find((c) => c.key === key) || (re ? doc.clauses.find((c) => re.test(c.title)) : undefined);
    return { text, find };
  };
  const meaningful = (s) => String(s || '').replace(K.PH_RE, '').trim();
  const R = (status, msg, clause) => ({ status, msg, clause: clause || null });

  K.CHECKS = [
    {
      id: 'partes', title: 'Identificação das partes',
      desc: 'Nome completo e CPF/CNPJ válido de cada parte.',
      run(doc, ctx) {
        const c = ctx.find('partes', /parte|qualifica/i);
        const found = [...new Set(ctx.text.match(DOC_RE) || [])];
        const bad = found.filter((d) => !K.validDoc(d));
        if (!found.length) return R('fail', 'Nenhum CPF ou CNPJ encontrado no texto do contrato.', c && c.id);
        if (bad.length) return R('fail', `${bad.length > 1 ? 'Documentos inválidos' : 'Documento inválido'}: ${bad.join(', ')}. Os dígitos verificadores não conferem.`, c && c.id);
        if (found.length < 2) return R('warn', 'Só 1 CPF/CNPJ foi encontrado. As duas partes estão identificadas?', c && c.id);
        return R('ok', `${found.length} documentos válidos encontrados (${K.listJoin(found.map((d) => (K.digits(d).length === 14 ? 'CNPJ' : 'CPF')))}).`, c && c.id);
      },
    },
    {
      id: 'objeto', title: 'Objeto bem definido',
      desc: 'O bem, serviço ou acordo está descrito com clareza e detalhes.',
      run(doc, ctx) {
        const c = ctx.find('objeto', /objeto|função|atividades/i);
        if (!c) return R('fail', 'Não há cláusula de objeto no contrato.');
        if (K.hasPH(c.body)) return R('fail', 'A cláusula de objeto ainda tem campos a preencher.', c.id);
        if (meaningful(c.body).length < 110) return R('warn', 'A descrição do objeto está curta. Detalhe quantidades, características e entregas.', c.id);
        return R('ok', `Cláusula “${c.title}” com descrição detalhada.`, c.id);
      },
    },
    {
      id: 'valores', title: 'Valores e pagamentos',
      desc: 'Valor em R$, valor por extenso e forma de pagamento.',
      run(doc, ctx) {
        const c = ctx.find('pagamento', /pre[çc]o|pagamento|aluguel|remunera|sal[áa]rio|resultado/i);
        const pairs = [...ctx.text.matchAll(MONEY_EXT_RE)];
        if (!/R\$\s?\d/.test(ctx.text)) return R('fail', 'Nenhum valor em R$ encontrado no contrato.', c && c.id);
        const wrong = pairs.filter((m) => K.norm(K.valorExtenso(K.parseMoney(m[1]))) !== K.norm(m[2].trim()));
        if (wrong.length) {
          const w = wrong[0];
          const where = doc.clauses.find((x) => x.body.includes(w[0]));
          return R('warn', `O valor R$ ${w[1]} não confere com o extenso “${w[2]}”. O correto seria “${K.valorExtenso(K.parseMoney(w[1]))}”.`, (where || c || {}).id);
        }
        if (!c) return R('warn', 'Há valores no texto, mas nenhuma cláusula específica de pagamento.');
        if (!pairs.length) return R('warn', 'Valor encontrado sem a versão por extenso. Recomenda-se escrever o valor também por extenso.', c.id);
        return R('ok', `Valor principal: R$ ${pairs[0][1]} — extenso confere.`, c.id);
      },
    },
    {
      id: 'prazos', title: 'Prazos e datas',
      desc: 'Data de início, prazos de entrega, vigência ou término.',
      run(doc, ctx) {
        const c = ctx.find('prazo', /prazo|vig[êe]ncia|entrega|experi/i);
        const dates = [...new Set(ctx.text.match(DATE_RE) || [])];
        const invalid = dates.filter((d) => !K.validBRDate(d));
        const durs = ctx.text.match(DUR_RE) || [];
        if (invalid.length) return R('fail', `Data inexistente no calendário: ${invalid.join(', ')}.`, c && c.id);
        if (c && K.hasPH(c.body)) return R('fail', 'A cláusula de prazo tem campos a preencher.', c.id);
        if (!dates.length && !durs.length) return R('fail', 'Nenhuma data ou prazo encontrado no texto.', c && c.id);
        if (!c) return R('warn', 'Há datas no texto, mas nenhuma cláusula específica de prazo ou vigência.');
        return R('ok', `${dates.length} data(s) e ${durs.length} prazo(s) encontrados.`, c.id);
      },
    },
    {
      id: 'obrigacoes', title: 'Responsabilidades das partes',
      desc: 'O que cada parte deve fazer está descrito.',
      run(doc) {
        const cs = doc.clauses.filter((c) => c.key === 'obrigacoes' || /obriga|responsabilidade/i.test(c.title));
        if (!cs.length) return R('fail', 'Nenhuma cláusula de obrigações ou responsabilidades.');
        const weak = cs.find((c) => K.hasPH(c.body) || meaningful(c.body).length < 40);
        if (weak) return R('warn', `A cláusula “${weak.title}” está incompleta.`, weak.id);
        return R('ok', `${cs.length} cláusula(s) com as obrigações das partes.`, cs[0].id);
      },
    },
    {
      id: 'rescisao', title: 'Encerramento e penalidades',
      desc: 'Regras de rescisão, aviso prévio e multa.',
      run(doc, ctx) {
        const c = ctx.find('rescisao', /rescis|encerramento|extin/i);
        if (!c && !/rescis|rescind/i.test(ctx.text)) return R('fail', 'O contrato não diz como pode ser encerrado (rescisão).');
        if (c && K.hasPH(c.body)) return R('fail', 'A cláusula de rescisão tem campos a preencher (ex.: percentual da multa).', c.id);
        if (!/multa|penalidade/i.test(c ? c.body : ctx.text)) return R('warn', 'Há regra de rescisão, mas nenhuma multa ou penalidade prevista.', c && c.id);
        return R('ok', 'Rescisão prevista, com multa ou penalidade definida.', c && c.id);
      },
    },
    {
      id: 'foro', title: 'Foro e assinaturas',
      desc: 'Comarca para resolver conflitos e espaço para assinaturas e testemunhas.',
      run(doc, ctx) {
        const c = ctx.find('foro', /foro/i);
        const a = ctx.find('assinaturas', /assinatura/i);
        const m = ctx.text.match(/comarca de (.+?)(?= para |,|\.|\n|$)/i);
        const lines = (ctx.text.match(/_{10,}/g) || []).length;
        if (!m) return R('fail', 'Foro (comarca) não definido.', c && c.id);
        if (K.hasPH(m[1])) return R('fail', 'A cidade do foro não foi preenchida.', c && c.id);
        if (lines < 2) return R('warn', 'Faltam linhas para a assinatura das partes.', (a || c).id);
        if (!/testemunha/i.test(ctx.text)) return R('warn', `Foro: comarca de ${m[1]}. Não há espaço para testemunhas.`, (a || c).id);
        return R('ok', `Foro: comarca de ${m[1]}. Espaços para assinaturas e testemunhas presentes.`, c && c.id);
      },
    },
    {
      id: 'pendencias', title: 'Sem campos pendentes',
      desc: 'Nenhum trecho [PREENCHER] ou cláusula vazia no documento.',
      run(doc, ctx) {
        const phs = ctx.text.match(K.PH_RE) || [];
        if (phs.length) {
          const c = doc.clauses.find((x) => K.hasPH(x.body) || K.hasPH(x.title));
          const u = [...new Set(phs)];
          return R('fail', `${phs.length} campo(s) a preencher: ${u.slice(0, 3).join(', ')}${u.length > 3 ? '…' : ''}`, c && c.id);
        }
        const empty = doc.clauses.find((x) => !x.body.trim());
        if (empty) return R('fail', `A cláusula “${empty.title || 'sem título'}” está vazia.`, empty.id);
        return R('ok', 'Nenhum campo pendente ou cláusula vazia.');
      },
    },
    {
      id: 'revisao', title: 'Leitura e revisão final',
      desc: 'Ler o documento inteiro e avaliar se precisa de orientação profissional.',
      run: () => R('manual', 'Item de conferência humana: leia o contrato completo, confirme que ele reflete o que foi combinado e, se houver dúvida, procure um profissional.'),
    },
  ];

  /** Avalia todos os itens do checklist para um documento. */
  K.evaluate = (doc) => {
    const ctx = ctxOf(doc);
    return K.CHECKS.map((c) => {
      let r;
      try { r = c.run(doc, ctx); } catch (e) { r = R('warn', 'Não foi possível analisar este item automaticamente.'); }
      return { id: c.id, title: c.title, desc: c.desc, ...r };
    });
  };

  /** A análise automática está liberada no plano atual? (Pro: sim; Grátis: não) */
  K.autoCheck = () => !K.plan || K.plan.info().autoCheck !== false;

  /** Resumo: progresso, alertas e situação calculada do documento. */
  K.summary = (doc) => {
    const res = K.evaluate(doc);
    const checks = doc.checks || {};
    const total = res.length;
    const done = res.filter((r) => checks[r.id]).length;
    // Plano Grátis: checklist só manual (sem a análise automática do texto).
    const auto = K.autoCheck();
    const fails = auto ? res.filter((r) => r.status === 'fail').length : 0;
    const warns = auto ? res.filter((r) => r.status === 'warn').length : 0;
    const status = done === 0 ? 'rascunho' : done === total && fails === 0 ? 'conferido' : 'revisao';
    return { res, total, done, fails, warns, status, auto };
  };
})();

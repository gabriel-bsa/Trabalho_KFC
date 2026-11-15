/* Kit Contrato Fácil — Revisor (plano Pro)
 *
 * Para cada aviso do checklist, oferece uma correção:
 *  - auto: o próprio site corrige o texto (ex.: valor por extenso, cláusula que falta);
 *  - guiada: quando só a pessoa sabe o dado certo (ex.: CPF inválido, campo em branco),
 *    o editor leva até o trecho e deixa ele selecionado para digitar.
 */
(function () {
  'use strict';
  const K = window.KCF;

  const MONEY_ALL = /R\$\s?(\d{1,3}(?:\.\d{3})*,\d{2})(\s*\(([^)]+)\))?/g;
  const DOC_RE = /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
  const DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/g;
  const PH_ONE = /\[[^\]\n]{1,80}\]/;

  const typeOf = (doc) => K.TYPES[doc.tipo] || K.TYPES.servicos;
  const byKey = (doc, key, re) => doc.clauses.find((c) => c.key === key) || (re ? doc.clauses.find((c) => re.test(c.title)) : undefined);
  const newClause = (key, title, body, numbered = true) => ({ id: K.uid(), key, title, body, numbered });

  /** Insere a cláusula antes da primeira das cláusulas finais indicadas (ou no fim). */
  const insertBefore = (doc, clause, keys = ['gerais', 'foro', 'assinaturas']) => {
    const idx = doc.clauses.map((c, i) => (keys.includes(c.key) ? i : -1)).filter((i) => i >= 0);
    doc.clauses.splice(idx.length ? Math.min(...idx) : doc.clauses.length, 0, clause);
    return clause;
  };
  const insertAfterPartes = (doc, clause) => {
    const i = doc.clauses.findIndex((c) => c.key === 'partes');
    doc.clauses.splice(i >= 0 ? i + 1 : 0, 0, clause);
    return clause;
  };
  const cidadeDe = (doc) => {
    const f = doc.fields || {};
    return f.cidade && f.cidade.trim() ? f.cidade.trim() + (f.uf ? '/' + String(f.uf).toUpperCase() : '') : '[PREENCHER: cidade do foro]';
  };
  const blocoAssinaturas = (doc) => {
    const t = typeOf(doc), f = doc.fields || {};
    const n1 = (f.p1 && f.p1.nome) || '[PREENCHER: nome da parte 1]';
    const n2 = (f.p2 && f.p2.nome) || '[PREENCHER: nome da parte 2]';
    return `\n\n\n_____________________________________\n${n1}\n${t.p1}\n\n\n_____________________________________\n${n2}\n${t.p2}`;
  };
  const TESTEMUNHAS = '\n\n\nTESTEMUNHAS:\n\n1. ______________________________   CPF: ________________\n\n2. ______________________________   CPF: ________________';
  const guided = (clause, text, label, hint) => ({ guided: true, clause: clause && clause.id, text, label, hint });

  /** Correção sugerida para um item do checklist (ou null). */
  K.fixFor = (doc, r) => {
    if (!r || (r.status !== 'fail' && r.status !== 'warn')) return null;
    switch (r.id) {
      case 'partes': {
        const bad = [...new Set((K.docText(doc).match(DOC_RE) || []).filter((d) => !K.validDoc(d)))];
        if (bad.length) {
          const c = doc.clauses.find((x) => x.body.includes(bad[0]));
          return guided(c, bad[0], 'Corrigir número', `Digite o ${K.digits(bad[0]).length === 14 ? 'CNPJ' : 'CPF'} correto no trecho selecionado.`);
        }
        const c = byKey(doc, 'partes', /parte|qualifica/i);
        const ph = c && (c.body.match(PH_ONE) || [])[0];
        return guided(c, ph, 'Completar partes', 'Informe o nome e o CPF/CNPJ das duas partes.');
      }

      case 'objeto': {
        const c = byKey(doc, 'objeto', /objeto|função|atividades/i);
        if (!c) {
          return { auto: true, label: 'Criar cláusula de objeto', apply: (d) => { insertAfterPartes(d, newClause('objeto', 'Do objeto', 'O presente contrato tem por objeto [PREENCHER: descrição detalhada do objeto].')); return 'Cláusula de objeto criada. Complete a descrição no campo destacado.'; } };
        }
        const ph = (c.body.match(PH_ONE) || [])[0];
        return guided(c, ph, 'Detalhar objeto', 'Descreva o objeto com quantidades, características e entregas.');
      }

      case 'valores': {
        let n = 0;
        doc.clauses.forEach((c) => {
          for (const m of c.body.matchAll(MONEY_ALL)) {
            if (!m[2] || K.norm(K.valorExtenso(K.parseMoney(m[1]))) !== K.norm(m[3].trim())) n++;
          }
        });
        if (n) {
          return {
            auto: true,
            label: n > 1 ? `Arrumar ${n} valores por extenso` : 'Arrumar valor por extenso',
            apply: (d) => {
              let k = 0;
              d.clauses.forEach((c) => {
                c.body = c.body.replace(MONEY_ALL, (full, num, par, ext) => {
                  const ok = K.valorExtenso(K.parseMoney(num));
                  if (par && K.norm(ok) === K.norm(ext.trim())) return full;
                  k++;
                  return `R$ ${num} (${ok})`;
                });
              });
              return `${k > 1 ? k + ' valores por extenso corrigidos' : 'Valor por extenso corrigido'}, mantendo os números em R$.`;
            },
          };
        }
        if (!byKey(doc, 'pagamento', /pre[çc]o|pagamento|aluguel|remunera|sal[áa]rio|resultado/i)) {
          return { auto: true, label: 'Criar cláusula de pagamento', apply: (d) => { insertBefore(d, newClause('pagamento', 'Do preço e da forma de pagamento', 'O valor total deste contrato é de [PREENCHER: valor em R$], a ser pago [PREENCHER: forma de pagamento].')); return 'Cláusula de pagamento criada. Complete os campos destacados.'; } };
        }
        return null;
      }

      case 'prazos': {
        const c = byKey(doc, 'prazo', /prazo|vig[êe]ncia|entrega|experi/i);
        const badDate = [...new Set(K.docText(doc).match(DATE_RE) || [])].find((x) => !K.validBRDate(x));
        if (badDate) return guided(doc.clauses.find((x) => x.body.includes(badDate)), badDate, 'Corrigir data', `A data ${badDate} não existe no calendário. Digite a data correta.`);
        if (c && K.hasPH(c.body)) return guided(c, (c.body.match(PH_ONE) || [])[0], 'Preencher prazo', 'Complete o prazo no trecho selecionado.');
        if (!c) {
          const inicio = doc.fields && doc.fields.inicio ? K.fmtDate(doc.fields.inicio) : '[PREENCHER: data de início]';
          return { auto: true, label: 'Criar cláusula de prazo', apply: (d) => { insertBefore(d, newClause('prazo', 'Do prazo', `Este contrato entra em vigor em ${inicio} e vigorará pelo prazo de [PREENCHER: prazo de vigência].`)); return 'Cláusula de prazo criada. Informe a vigência no campo destacado.'; } };
        }
        return null;
      }

      case 'obrigacoes': {
        const cs = doc.clauses.filter((c) => c.key === 'obrigacoes' || /obriga|responsabilidade/i.test(c.title));
        if (!cs.length) {
          return { auto: true, label: 'Criar cláusula de obrigações', apply: (d) => { insertBefore(d, newClause('obrigacoes', 'Das obrigações das partes', 'Cada parte se obriga a:\na) cumprir fielmente as condições deste contrato, nos prazos ajustados;\nb) agir com boa-fé e comunicar por escrito qualquer fato que possa afetar o cumprimento do acordo;\nc) responder pelos encargos legais de sua própria atividade.')); return 'Cláusula de obrigações criada com um texto padrão. Ajuste ao seu caso.'; } };
        }
        const weak = cs.find((c) => K.hasPH(c.body) || c.body.replace(K.PH_RE, '').trim().length < 40);
        return guided(weak, weak && (weak.body.match(PH_ONE) || [])[0], 'Completar obrigações', 'Descreva o que cada parte deve fazer.');
      }

      case 'rescisao': {
        const c = byKey(doc, 'rescisao', /rescis|encerramento|extin/i);
        if (c && K.hasPH(c.body)) return guided(c, (c.body.match(PH_ONE) || [])[0], 'Preencher multa', 'Informe o percentual da multa no trecho selecionado.');
        if (!c) {
          return { auto: true, label: 'Criar cláusula de rescisão', apply: (d) => { insertBefore(d, newClause('rescisao', 'Da rescisão', 'Este contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio, por escrito, de 30 (trinta) dias.\n\nParágrafo único. Em caso de descumprimento de qualquer cláusula, a parte infratora pagará multa de 10% (dez por cento) sobre o valor total do contrato, sem prejuízo de perdas e danos.')); return 'Cláusula de rescisão criada, com aviso prévio de 30 dias e multa de 10%.'; } };
        }
        return {
          auto: true, label: 'Adicionar multa',
          apply: (d) => {
            const x = d.clauses.find((y) => y.id === c.id);
            const temUnico = /Parágrafo único\./.test(x.body);
            if (temUnico) x.body = x.body.replace('Parágrafo único.', 'Parágrafo primeiro.');
            x.body += `\n\n${temUnico ? 'Parágrafo segundo.' : 'Parágrafo único.'} O descumprimento de qualquer cláusula sujeitará a parte infratora à multa de 10% (dez por cento) sobre o valor total do contrato, sem prejuízo de perdas e danos.`;
            return 'Multa de 10% adicionada à cláusula de rescisão.';
          },
        };
      }

      case 'foro': {
        const text = K.docText(doc);
        const m = text.match(/comarca de (.+?)(?= para |,|\.|\n|$)/i);
        if (!m) {
          return { auto: true, label: 'Criar cláusula de foro', apply: (d) => { insertBefore(d, newClause('foro', 'Do foro', `Fica eleito o foro da comarca de ${cidadeDe(d)} para resolver quaisquer questões decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.`), ['assinaturas']); return 'Cláusula de foro criada.'; } };
        }
        if (K.hasPH(m[1])) return guided(byKey(doc, 'foro', /foro/i), (m[1].match(PH_ONE) || [])[0], 'Preencher cidade', 'Informe a cidade do foro.');
        const lines = (text.match(/_{10,}/g) || []).length;
        const a = byKey(doc, 'assinaturas', /assinatura/i);
        if (lines < 2) {
          return {
            auto: true, label: 'Adicionar assinaturas',
            apply: (d) => {
              const x = a && d.clauses.find((y) => y.id === a.id);
              if (x) x.body += blocoAssinaturas(d) + (/testemunha/i.test(x.body) ? '' : TESTEMUNHAS);
              else d.clauses.push(newClause('assinaturas', 'Assinaturas', 'E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.' + blocoAssinaturas(d) + TESTEMUNHAS, false));
              return 'Espaços de assinatura das partes e das testemunhas adicionados.';
            },
          };
        }
        if (!/testemunha/i.test(text)) {
          return {
            auto: true, label: 'Adicionar testemunhas',
            apply: (d) => {
              const x = a && d.clauses.find((y) => y.id === a.id);
              if (x) x.body += TESTEMUNHAS; else d.clauses.push(newClause('assinaturas', 'Testemunhas', TESTEMUNHAS.trim(), false));
              return 'Espaço para 2 testemunhas adicionado.';
            },
          };
        }
        return null;
      }

      case 'pendencias': {
        const c = doc.clauses.find((x) => K.hasPH(x.body));
        if (c) return guided(c, (c.body.match(PH_ONE) || [])[0], 'Preencher próximo campo', 'Digite a informação no lugar do campo selecionado.');
        const vazias = doc.clauses.filter((x) => !x.body.trim());
        if (vazias.length) {
          return { auto: true, label: vazias.length > 1 ? `Remover ${vazias.length} cláusulas vazias` : 'Remover cláusula vazia', apply: (d) => { const n = d.clauses.length; d.clauses = d.clauses.filter((x) => x.body.trim()); return `${n - d.clauses.length} cláusula(s) vazia(s) removida(s).`; } };
        }
        return null;
      }
      default:
        return null;
    }
  };

  /** Aplica todas as correções automáticas possíveis. Retorna a lista de mensagens. */
  K.fixAll = (doc) => {
    const msgs = [];
    for (let rodada = 0; rodada < 6; rodada++) {
      const fix = K.evaluate(doc).map((r) => K.fixFor(doc, r)).find((f) => f && f.auto);
      if (!fix) break;
      msgs.push(fix.apply(doc));
    }
    return msgs;
  };
  K.countAutoFixes = (doc) => K.evaluate(doc).map((r) => K.fixFor(doc, r)).filter((f) => f && f.auto).length;
})();

/* Kit Contrato Fácil — glossário de termos (t = termo, d = definição, ex = exemplo, m = padrão para destacar no texto) */
(function () {
  'use strict';
  const K = window.KCF;

  K.GLOSSARY = [
    { t: 'Cláusula', m: 'cláusulas?', d: 'Cada parte numerada do contrato. Descreve uma condição, regra, direito ou obrigação combinada entre as partes.', ex: '“Cláusula 3ª – Do preço” trata apenas do valor e da forma de pagamento.' },
    { t: 'Contratante', m: 'contratantes?', d: 'Em geral, a parte que contrata um serviço e paga por ele.', ex: 'A padaria que contrata uma agência para fazer seu site.' },
    { t: 'Contratado(a)', m: 'contratad[oa]s?', d: 'Em geral, a parte que aceita executar o serviço ou cumprir a prestação prevista no acordo.' },
    { t: 'Objeto do contrato', m: 'objeto', d: 'Aquilo a que o acordo se refere: um serviço, um bem ou determinada obrigação. Quanto mais detalhado, menor o risco de mal-entendidos.' },
    { t: 'Rescisão', m: 'rescis(?:ão|ões)|rescindid[oa]', d: 'Encerramento do contrato antes do prazo, por vontade de uma das partes ou por descumprimento, conforme as regras combinadas e a lei.' },
    { t: 'Vigência', m: 'vigência|vigorará', d: 'Período durante o qual o contrato produz efeitos, do início ao término.' },
    { t: 'Multa contratual', m: 'multas?', d: 'Penalidade em dinheiro prevista para quem descumprir o contrato ou atrasar pagamentos, sujeita aos limites da lei.', ex: 'Multa de 10% sobre o valor total em caso de descumprimento.' },
    { t: 'Obrigações', m: 'obrigaç(?:ão|ões)', d: 'Deveres que cada parte assume no acordo, como pagar, entregar um bem ou executar um serviço.' },
    { t: 'Foro', m: 'foro', d: 'Local (cidade/comarca) escolhido pelas partes para resolver na Justiça eventuais conflitos sobre o contrato.' },
    { t: 'Comarca', m: 'comarca', d: 'Território de atuação de um juiz de primeira instância, normalmente correspondente a um ou mais municípios.' },
    { t: 'Testemunhas', m: 'testemunhas?', d: 'Pessoas que assinam o contrato confirmando que presenciaram o acordo. Duas testemunhas tornam o contrato um título executivo, facilitando a cobrança.' },
    { t: 'Aviso prévio', m: 'aviso prévio', d: 'Comunicação antecipada, com prazo mínimo, de que uma das partes deseja encerrar o contrato.' },
    { t: 'Caução', m: 'caução', d: 'Valor ou bem entregue como garantia de que as obrigações serão cumpridas. Comum em locações, limitado a 3 aluguéis.' },
    { t: 'Fiador', m: 'fiador|fiança', d: 'Pessoa que se compromete a pagar a dívida caso o devedor principal não pague.' },
    { t: 'Reajuste', m: 'reajustad[oa]|reajuste', d: 'Atualização periódica de um valor (por exemplo, o aluguel) por um índice de inflação, como IPCA ou IGP-M.' },
    { t: 'Juros de mora', m: 'juros de mora', d: 'Acréscimo cobrado pelo atraso no pagamento, normalmente calculado por mês de atraso.' },
    { t: 'Correção monetária', m: 'correção monetária', d: 'Atualização de um valor para compensar a perda do poder de compra causada pela inflação.' },
    { t: 'Caso fortuito e força maior', m: 'caso fortuito|força maior', d: 'Acontecimentos imprevisíveis ou inevitáveis (enchentes, pandemias) que impedem o cumprimento do contrato sem culpa das partes.' },
    { t: 'Termo aditivo', m: 'termo aditivo', d: 'Documento assinado pelas partes para alterar ou complementar um contrato já existente.' },
    { t: 'Instrumento particular', m: 'instrumento particular|instrumento', d: 'Documento escrito e assinado pelas próprias partes, sem necessidade de cartório.' },
    { t: 'Ônus', m: 'ônus', d: 'Encargo ou restrição que pesa sobre um bem, como uma dívida, penhora ou alienação fiduciária.' },
    { t: 'Sucessores', m: 'sucessores', d: 'Quem assume os direitos e deveres de uma das partes no futuro, como herdeiros ou a empresa que a incorporar.' },
    { t: 'Vício oculto', m: 'vícios? ocultos?', d: 'Defeito que não pode ser percebido em uma inspeção comum no momento da compra.' },
    { t: 'Período de experiência', m: 'período de experiência', d: 'Fase inicial do contrato de trabalho, de até 90 dias, para empregador e empregado avaliarem a adaptação.' },
    { t: 'LGPD', m: 'LGPD', d: 'Lei Geral de Proteção de Dados (Lei nº 13.709/2018), que define regras para coletar, usar e guardar dados pessoais.' },
    { t: 'Confidencialidade', m: 'confidencialidade|sigilo', d: 'Compromisso de não divulgar informações recebidas por causa do contrato.' },
    { t: 'Comodato', m: 'comodato|comodante|comodatária', d: 'Empréstimo gratuito de um bem (equipamento, veículo, espaço) que deve ser devolvido no prazo combinado.', ex: 'Um café empresta sua máquina de espresso a uma livraria parceira.' },
    { t: 'Mútuo', m: 'mútuo|mutuante|mutuária', d: 'Empréstimo de dinheiro ou de coisas que se consomem, com devolução de quantia igual, podendo haver juros.' },
    { t: 'Distrato', m: 'distrato|distratar|distratante', d: 'Acordo em que as partes encerram, de comum acordo, um contrato que já existia.' },
    { t: 'Quitação', m: 'quitação', d: 'Declaração de que uma obrigação foi totalmente cumprida e de que nada mais é devido.' },
    { t: 'Comissão', m: 'comissão|comissões', d: 'Remuneração calculada como percentual sobre as vendas realizadas, comum na representação comercial.' },
    { t: 'NDA', m: 'NDA', d: 'Sigla em inglês para acordo de confidencialidade (Non-Disclosure Agreement): compromisso de não divulgar informações sigilosas.' },
    { t: 'Minuta', m: 'minuta', d: 'Versão preliminar de um contrato, ainda em discussão e sujeita a alterações antes da assinatura.' },
  ];

  /* ---------- Destaque de termos no texto (modo Visualizar) ---------- */
  let bigRe = null;
  const build = () => {
    K.GLOSSARY.forEach((g) => { g.re = new RegExp('^(?:' + (g.m || K.escRe(g.t)) + ')$', 'iu'); });
    const pats = K.GLOSSARY.map((g) => g.m || K.escRe(g.t)).sort((a, b) => b.length - a.length);
    bigRe = new RegExp('(?<![\\p{L}\\p{N}])(' + pats.join('|') + ')(?![\\p{L}\\p{N}])', 'giu');
  };
  /** Envolve a 1ª ocorrência de cada termo em <span class="gl"> com a definição. `html` já deve estar escapado. */
  K.glossarize = (html, seen) => {
    if (!bigRe) build();
    return html.replace(bigRe, (m) => {
      const g = K.GLOSSARY.find((x) => x.re.test(m));
      if (!g || seen.has(g.t)) return m;
      seen.add(g.t);
      return `<span class="gl" tabindex="0" data-tip="${K.esc(g.t + ': ' + g.d)}">${m}</span>`;
    });
  };
})();

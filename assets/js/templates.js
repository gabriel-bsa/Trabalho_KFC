/* Kit Contrato Fácil — tipos de contrato, modelos de cláusulas e renderização do documento */
(function () {
  'use strict';
  const K = window.KCF;

  /* ---------- Tipos de contrato ---------- */
  K.TYPES = {
    servicos: {
      label: 'Prestação de serviços', icon: '🛠️', nome: 'Contrato de Prestação de Serviços',
      titulo: 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS', p1: 'CONTRATANTE', p2: 'CONTRATADA',
      p1Label: 'Contratante (quem contrata)', p2Label: 'Contratada (quem presta o serviço)',
      desc: 'Para contratar um profissional ou empresa para executar um trabalho.',
      objetoLabel: 'Descrição dos serviços', objetoPh: 'Ex.: criação de site institucional com 5 páginas, incluindo layout, desenvolvimento e publicação.',
      valorLabel: 'Valor dos serviços (R$)', pagamento: true,
      extras: [{ k: 'entrega', label: 'Prazo de execução', ph: 'Ex.: 30 (trinta) dias corridos' }],
    },
    compra: {
      label: 'Compra e venda', icon: '📦', nome: 'Contrato de Compra e Venda',
      titulo: 'CONTRATO DE COMPRA E VENDA', p1: 'VENDEDORA', p2: 'COMPRADORA',
      p1Label: 'Vendedora (quem vende)', p2Label: 'Compradora (quem compra)',
      desc: 'Para vender ou comprar um bem, como equipamentos, veículos ou mercadorias.',
      objetoLabel: 'Descrição do bem', objetoPh: 'Ex.: 1 (um) forno industrial elétrico, marca X, modelo Y, nº de série 0000, usado, em bom estado.',
      valorLabel: 'Preço (R$)', pagamento: true,
      extras: [
        { k: 'entrega', label: 'Prazo de entrega', ph: 'Ex.: 10 (dez) dias úteis' },
        { k: 'garantia', label: 'Garantia', ph: 'Ex.: 90 (noventa) dias' },
      ],
    },
    locacao: {
      label: 'Locação', icon: '🏢', nome: 'Contrato de Locação de Imóvel',
      titulo: 'CONTRATO DE LOCAÇÃO DE IMÓVEL', p1: 'LOCADOR', p2: 'LOCATÁRIA',
      p1Label: 'Locador (proprietário)', p2Label: 'Locatária (quem aluga)',
      desc: 'Para alugar uma sala, loja, galpão ou imóvel residencial.',
      objetoLabel: 'Descrição do imóvel', objetoPh: 'Ex.: sala comercial nº 12, com 40 m², 1 banheiro e 1 vaga de garagem.',
      valorLabel: 'Aluguel mensal (R$)', vencimento: true, vigencia: true,
      extras: [
        { k: 'imovel', label: 'Endereço do imóvel', ph: 'Rua, número, bairro, cidade/UF' },
        { k: 'finalidade', label: 'Finalidade', options: ['comercial', 'residencial'] },
        { k: 'reajuste', label: 'Índice de reajuste anual', options: ['IPCA', 'IGP-M', 'INPC'] },
        { k: 'garantiaLoc', label: 'Garantia locatícia', options: ['caução equivalente a 3 (três) aluguéis', 'fiança prestada por fiador idôneo', 'seguro-fiança', 'sem garantia'] },
      ],
    },
    trabalho: {
      label: 'Trabalho', icon: '👷', nome: 'Contrato Individual de Trabalho',
      titulo: 'CONTRATO INDIVIDUAL DE TRABALHO', p1: 'EMPREGADORA', p2: 'EMPREGADO(A)',
      p1Label: 'Empregadora (empresa)', p2Label: 'Empregado(a)',
      desc: 'Para registrar a contratação de um funcionário pela CLT.',
      objetoLabel: 'Principais atividades', objetoPh: 'Ex.: atendimento ao público, operação de caixa e organização do estoque.',
      valorLabel: 'Salário mensal (R$)', semMulta: true,
      extras: [
        { k: 'cargo', label: 'Cargo/função', ph: 'Ex.: Atendente' },
        { k: 'jornada', label: 'Jornada de trabalho', ph: 'Ex.: 44 (quarenta e quatro) horas semanais, de segunda a sábado' },
        { k: 'experiencia', label: 'Período de experiência', options: ['90 (noventa) dias', '45 (quarenta e cinco) dias', 'sem período de experiência'] },
      ],
    },
    parceria: {
      label: 'Parceria', icon: '🤝', nome: 'Contrato de Parceria Comercial',
      titulo: 'CONTRATO DE PARCERIA COMERCIAL', p1: 'PRIMEIRA PARCEIRA', p2: 'SEGUNDA PARCEIRA',
      p1Label: 'Primeira parceira', p2Label: 'Segunda parceira',
      desc: 'Para duas empresas atuarem juntas em um projeto, evento ou ação.',
      objetoLabel: 'Finalidade da parceria', objetoPh: 'Ex.: divulgação conjunta e venda de produtos em eventos mensais.',
      valorLabel: 'Investimento previsto (R$)', vigencia: true,
      extras: [
        { k: 'divisao', label: 'Divisão de resultados e despesas', ph: 'Ex.: Lucros e despesas divididos em 50% (cinquenta por cento) para cada parte', textarea: true },
        { k: 'resp1', label: 'Responsabilidades da primeira parceira', ph: 'Ex.: ceder o espaço; divulgar nas redes sociais.', textarea: true },
        { k: 'resp2', label: 'Responsabilidades da segunda parceira', ph: 'Ex.: fornecer os produtos; organizar a programação.', textarea: true },
      ],
    },

    /* ----- Tipos exclusivos do plano Pro ----- */
    nda: {
      pro: true, label: 'Confidencialidade (NDA)', icon: '🛡️', nome: 'Acordo de Confidencialidade',
      titulo: 'ACORDO DE CONFIDENCIALIDADE (NDA)', p1: 'REVELADORA', p2: 'RECEPTORA',
      p1Label: 'Reveladora (quem compartilha a informação)', p2Label: 'Receptora (quem recebe a informação)',
      desc: 'Para proteger informações sigilosas compartilhadas em negociações ou projetos.',
      objetoLabel: 'Assunto das informações confidenciais', objetoPh: 'Ex.: receitas, lista de fornecedores e planilha de custos da empresa.',
      valorLabel: 'Multa por violação (R$)', vigencia: true,
      extras: [{ k: 'proposito', label: 'Por que as informações serão compartilhadas', ph: 'Ex.: avaliar uma possível parceria para venda em rede de cafeterias', textarea: true }],
    },
    comodato: {
      pro: true, label: 'Comodato (empréstimo de bem)', icon: '🔑', nome: 'Contrato de Comodato',
      titulo: 'CONTRATO DE COMODATO', p1: 'COMODANTE', p2: 'COMODATÁRIA',
      p1Label: 'Comodante (dono do bem)', p2Label: 'Comodatária (quem recebe o bem emprestado)',
      desc: 'Para emprestar gratuitamente um equipamento, veículo ou espaço por um prazo.',
      objetoLabel: 'Descrição do bem emprestado', objetoPh: 'Ex.: 1 (uma) máquina de café espresso, marca X, modelo Y, nº de série 0000.',
      valorLabel: 'Valor de referência do bem (R$)', vigencia: true,
      extras: [
        { k: 'usoBem', label: 'Uso permitido do bem', ph: 'Ex.: exclusivamente no atendimento aos clientes da loja' },
        { k: 'localBem', label: 'Onde o bem ficará', ph: 'Endereço' },
      ],
    },
    representacao: {
      pro: true, label: 'Representação comercial', icon: '💼', nome: 'Contrato de Representação Comercial',
      titulo: 'CONTRATO DE REPRESENTAÇÃO COMERCIAL', p1: 'REPRESENTADA', p2: 'REPRESENTANTE',
      p1Label: 'Representada (empresa dos produtos)', p2Label: 'Representante (quem vende e recebe comissão)',
      desc: 'Para um representante vender seus produtos em uma região, recebendo comissão.',
      objetoLabel: 'Produtos ou serviços representados', objetoPh: 'Ex.: linha de pães congelados e salgados para revenda.',
      valorLabel: 'Meta mensal de vendas (R$)', vencimento: true, vigencia: true,
      extras: [
        { k: 'territorio', label: 'Região de atuação', ph: 'Ex.: cidades de Campinas, Sumaré e Hortolândia/SP' },
        { k: 'comissao', label: 'Comissão (%)', ph: 'Ex.: 8', type: 'number' },
        { k: 'exclusividade', label: 'Exclusividade', options: ['sem exclusividade', 'com exclusividade na região'] },
      ],
    },
    mutuo: {
      pro: true, label: 'Empréstimo entre empresas', icon: '💰', nome: 'Contrato de Mútuo',
      titulo: 'CONTRATO DE MÚTUO (EMPRÉSTIMO)', p1: 'MUTUANTE', p2: 'MUTUÁRIA',
      p1Label: 'Mutuante (quem empresta)', p2Label: 'Mutuária (quem recebe o empréstimo)',
      desc: 'Para formalizar um empréstimo de dinheiro entre empresas ou sócios.',
      objetoLabel: 'Finalidade do empréstimo', objetoPh: 'Ex.: compra de equipamentos para ampliação da cozinha.',
      valorLabel: 'Valor emprestado (R$)', pagamento: true, pagamentoPadrao: 'parcelado',
      extras: [{ k: 'juros', label: 'Juros (% ao mês)', ph: 'Ex.: 1', type: 'number' }],
    },
    distrato: {
      pro: true, label: 'Distrato (encerramento)', icon: '📝', nome: 'Instrumento de Distrato',
      titulo: 'INSTRUMENTO PARTICULAR DE DISTRATO', p1: 'PRIMEIRA DISTRATANTE', p2: 'SEGUNDA DISTRATANTE',
      p1Label: 'Primeira parte', p2Label: 'Segunda parte',
      desc: 'Para encerrar de comum acordo um contrato que já existe, com acerto final.',
      objetoLabel: 'Contrato que está sendo encerrado', objetoPh: 'Ex.: Contrato de Prestação de Serviços de manutenção, assinado em 10/01/2026.',
      valorLabel: 'Valor do acerto final (R$)', pagamento: true,
      extras: [
        { k: 'devolucoes', label: 'Bens ou documentos a devolver', ph: 'Ex.: chaves, crachás e equipamentos emprestados', textarea: true },
        { k: 'pendencias', label: 'Pendências a resolver', ph: 'Ex.: entrega do último relatório mensal', textarea: true },
      ],
    },
  };

  const ATRASO = 'O atraso no pagamento sujeitará a parte devedora à multa de 2% (dois por cento) sobre o valor devido, acrescida de juros de mora de 1% (um por cento) ao mês e correção monetária.';

  /* ---------- Biblioteca de cláusulas avulsas (editor) ---------- */
  K.CLAUSE_LIB = [
    { key: 'confidencialidade', title: 'Da confidencialidade', body: 'As partes comprometem-se a manter sigilo sobre todas as informações comerciais, financeiras e técnicas a que tiverem acesso em razão deste contrato, não podendo divulgá-las a terceiros sem autorização por escrito da outra parte, durante a vigência deste instrumento e por 2 (dois) anos após o seu término.' },
    { key: 'lgpd', title: 'Da proteção de dados pessoais', body: 'As partes comprometem-se a tratar os dados pessoais eventualmente compartilhados em razão deste contrato em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados – LGPD), utilizando-os exclusivamente para as finalidades aqui previstas e adotando medidas de segurança adequadas para protegê-los.' },
    { key: 'forca', title: 'Do caso fortuito e da força maior', body: 'Nenhuma das partes será responsabilizada pelo descumprimento de suas obrigações quando decorrente de caso fortuito ou força maior, nos termos do art. 393 do Código Civil, devendo a parte afetada comunicar o fato à outra por escrito, assim que possível.' },
    { key: 'atraso', title: 'Da multa por atraso', body: ATRASO },
    { key: 'pi', title: 'Da propriedade intelectual', body: 'Os direitos patrimoniais sobre os materiais produzidos em razão deste contrato serão transferidos à CONTRATANTE após a quitação integral do valor ajustado, ressalvado o direito da CONTRATADA de mencioná-los em seu portfólio.' },
    { key: 'comunicacao', title: 'Das comunicações', body: 'Todas as comunicações entre as partes relativas a este contrato deverão ser feitas por escrito, por e-mail ou carta com aviso de recebimento, nos endereços indicados na qualificação das partes.' },
    { key: 'naoexclusividade', title: 'Da não exclusividade', body: 'Este contrato não estabelece exclusividade entre as partes, que poderão firmar acordos semelhantes com terceiros, desde que não prejudiquem o cumprimento das obrigações aqui assumidas.' },
  ];

  /* ---------- Gerador do contrato a partir do formulário ---------- */
  K.buildContract = function (f) {
    const t = K.TYPES[f.tipo] || K.TYPES.servicos;
    const x = f.extras || {};
    const P = (v, label) => (v != null && String(v).trim() ? String(v).trim() : `[PREENCHER: ${label}]`);
    const clean = (s) => String(s).replace(/[.;\s]+$/, '');
    const vNum = K.parseMoney(f.valor);
    const valor = vNum > 0 ? `R$ ${K.money(vNum)} (${K.valorExtenso(vNum)})` : '[PREENCHER: valor]';
    const inicio = f.inicio ? K.fmtDate(f.inicio) : '[PREENCHER: data de início]';
    const cidadeUF = f.cidade && f.cidade.trim() ? f.cidade.trim() + (f.uf && f.uf.trim() ? '/' + f.uf.trim().toUpperCase() : '') : '[PREENCHER: cidade do foro]';
    const mNum = parseInt(f.multa, 10);
    const multa = mNum > 0 ? `${mNum}% (${K.extenso(mNum)} por cento)` : '[PREENCHER: percentual da multa]';
    const meses = parseInt(f.prazoMeses, 10) || 0;
    const vig = meses ? `${meses} (${K.extenso(meses)}) ${meses === 1 ? 'mês' : 'meses'}` : '[PREENCHER: prazo em meses]';
    const fim = meses && f.inicio ? K.fmtDate(K.addMonths(f.inicio, meses)) : '[PREENCHER: data de término]';
    const vd = parseInt(f.vencimento, 10);
    const venc = vd > 0 ? `${vd} (${K.extenso(vd)})` : '[PREENCHER: dia de vencimento]';
    const objeto = clean(P(f.objeto, t.objetoLabel.toLowerCase()));
    const n1 = P(f.p1 && f.p1.nome, 'nome da parte 1');
    const n2 = P(f.p2 && f.p2.nome, 'nome da parte 2');
    const meio = f.meio ? `, por meio de ${f.meio}` : '';
    const parc = Math.max(2, parseInt(f.parcelas, 10) || 2);

    const qual = (p, role, i) => {
      p = p || {};
      const d = K.digits(p.doc);
      const lbl = d.length === 14 ? 'inscrita no CNPJ' : d.length === 11 ? 'inscrito(a) no CPF' : 'inscrito(a) no CPF/CNPJ';
      return `${P(p.nome, 'nome da parte ' + i)}, ${lbl} sob o nº ${P(p.doc, 'CPF/CNPJ da parte ' + i)}, com endereço em ${P(p.end, 'endereço da parte ' + i)}, doravante denominado(a) ${role}`;
    };
    const pagto = () => {
      switch (f.pagamento) {
        case 'sinal': return `da seguinte forma: 50% (cinquenta por cento) na assinatura deste contrato e 50% (cinquenta por cento) na conclusão/entrega${meio}`;
        case 'parcelado':
          return vNum > 0
            ? `dividido em ${parc} (${K.extenso(parc, true)}) parcelas mensais e consecutivas de R$ ${K.money(vNum / parc)} (${K.valorExtenso(vNum / parc)}), vencendo a primeira em ${inicio}${meio}`
            : `dividido em ${parc} (${K.extenso(parc, true)}) parcelas mensais e consecutivas, vencendo a primeira em ${inicio}${meio}`;
        case 'mensal': return `por mês, com vencimento todo dia ${venc} de cada mês${meio}`;
        case 'entrega': return `integralmente na conclusão/entrega, após a conferência pela parte que recebe${meio}`;
        case 'modelo': return 'da seguinte forma: (   ) à vista   (   ) 50% na assinatura e 50% na entrega   (   ) em [PREENCHER: nº de] parcelas mensais   (   ) outra: [PREENCHER: forma de pagamento]';
        default: return `à vista, na data de assinatura deste instrumento${meio}`;
      }
    };
    const total = f.pagamento === 'mensal' ? '' : 'total ';

    const cl = [];
    const add = (key, title, body, numbered = true) => cl.push({ id: K.uid(), key, title, body, numbered });
    const rescisao = () => add('rescisao', 'Da rescisão',
      `Este contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio, por escrito, de 30 (trinta) dias.\n\nParágrafo único. Em caso de descumprimento de qualquer cláusula, a parte prejudicada poderá rescindir o contrato imediatamente, e a parte infratora pagará multa de ${multa} sobre o valor total do contrato, sem prejuízo de eventuais perdas e danos.`);
    const gerais = () => {
      if (f.obs && f.obs.trim()) add('condicoes', 'Das condições adicionais', f.obs.trim());
      add('gerais', 'Das disposições gerais',
        'Qualquer alteração deste contrato somente terá validade se feita por escrito e assinada por ambas as partes, por meio de termo aditivo.\n\nA tolerância de uma das partes quanto ao descumprimento de qualquer obrigação não significa renúncia ao direito de exigi-la.\n\nEste contrato obriga as partes e seus sucessores a qualquer título.');
    };
    const foro = () => add('foro', 'Do foro', f.tipo === 'trabalho'
      ? `Eventuais controvérsias decorrentes deste contrato serão resolvidas pela Justiça do Trabalho, no foro da comarca de ${cidadeUF}, local da prestação dos serviços.`
      : `Fica eleito o foro da comarca de ${cidadeUF} para resolver quaisquer questões decorrentes deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.`);
    const assinaturas = () => add('assinaturas', 'Assinaturas',
      `E, por estarem assim justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma, na presença das testemunhas abaixo.\n\n${f.cidade && f.cidade.trim() ? f.cidade.trim() : '[PREENCHER: cidade]'}, ${f.inicio ? K.longDate(f.inicio) : '____ de ______________ de ______'}.\n\n\n_____________________________________\n${n1}\n${t.p1}\n\n\n_____________________________________\n${n2}\n${t.p2}\n\n\nTESTEMUNHAS:\n\n1. ______________________________   CPF: ________________\n\n2. ______________________________   CPF: ________________`, false);

    add('partes', 'Qualificação das partes',
      `Pelo presente instrumento particular, de um lado, ${qual(f.p1, t.p1, 1)}; e, de outro lado, ${qual(f.p2, t.p2, 2)}; têm entre si, justo e acordado, o presente ${t.nome}, que se regerá pelas cláusulas e condições seguintes.`, false);

    switch (f.tipo) {
      case 'compra':
        add('objeto', 'Do objeto', `A VENDEDORA vende à COMPRADORA, que adquire, o seguinte bem: ${objeto}, livre e desembaraçado de quaisquer ônus, dívidas ou restrições.`);
        add('pagamento', 'Do preço e da forma de pagamento', `Pelo bem objeto deste contrato, a COMPRADORA pagará à VENDEDORA o valor ${total}de ${valor}, ${pagto()}.\n\nParágrafo único. ${ATRASO}`);
        add('prazo', 'Da entrega', `O bem será entregue no prazo de ${P(x.entrega, 'prazo de entrega')}, contado a partir de ${inicio}, no endereço da COMPRADORA, ocasião em que será feita a conferência de seu estado e funcionamento.\n\nA propriedade e os riscos sobre o bem passam à COMPRADORA no momento da entrega.`);
        add('garantia', 'Da garantia', `A VENDEDORA garante o bem contra defeitos de funcionamento pelo prazo de ${P(x.garantia, 'prazo de garantia')}, contado da entrega, sem prejuízo das garantias previstas em lei.`);
        add('obrigacoes', 'Das obrigações das partes', 'São obrigações da VENDEDORA:\na) entregar o bem no prazo e nas condições descritas;\nb) fornecer manuais, notas fiscais e documentos relacionados ao bem;\nc) responder por eventuais vícios ocultos, nos termos da lei.\n\nSão obrigações da COMPRADORA:\na) efetuar o pagamento nas condições ajustadas;\nb) conferir o bem no ato da entrega e comunicar imediatamente qualquer divergência.');
        rescisao(); break;

      case 'locacao': {
        const fins = { comercial: 'comerciais', residencial: 'residenciais' }[x.finalidade] || 'comerciais';
        add('objeto', 'Do objeto', `O LOCADOR dá em locação à LOCATÁRIA o imóvel situado em ${clean(P(x.imovel, 'endereço do imóvel'))}, assim descrito: ${objeto}.\n\nO imóvel destina-se exclusivamente a fins ${fins}, sendo vedada a sublocação, cessão ou empréstimo, total ou parcial, sem autorização por escrito do LOCADOR.`);
        add('prazo', 'Do prazo da locação', `A locação vigorará pelo prazo de ${vig}, com início em ${inicio} e término em ${fim}, data em que a LOCATÁRIA deverá devolver o imóvel nas mesmas condições em que o recebeu, ressalvado o desgaste natural pelo uso.`);
        add('pagamento', 'Do aluguel e do reajuste', `O aluguel mensal é de ${valor}, a ser pago até o dia ${venc} de cada mês${meio}.\n\nO aluguel será reajustado a cada 12 (doze) meses pela variação do ${x.reajuste || 'IPCA'}.\n\nParágrafo único. ${ATRASO}`);
        add('garantia', 'Da garantia', !x.garantiaLoc || x.garantiaLoc === 'sem garantia'
          ? 'A presente locação é contratada sem garantia locatícia.'
          : `Em garantia do cumprimento das obrigações deste contrato, a LOCATÁRIA oferece ${x.garantiaLoc}, nos termos da Lei nº 8.245/1991 (Lei do Inquilinato).`);
        add('obrigacoes', 'Das obrigações das partes', 'São obrigações do LOCADOR:\na) entregar o imóvel em condições de uso;\nb) responder pelos vícios ou defeitos anteriores à locação;\nc) pagar os impostos e taxas que incidam sobre o imóvel, salvo disposição em contrário.\n\nSão obrigações da LOCATÁRIA:\na) pagar pontualmente o aluguel e os encargos (água, energia, condomínio);\nb) conservar o imóvel e reparar os danos que causar;\nc) não realizar modificações sem autorização por escrito do LOCADOR.');
        add('rescisao', 'Da rescisão', `Se a LOCATÁRIA devolver o imóvel antes do término do prazo, pagará multa equivalente a 3 (três) aluguéis, proporcional ao tempo restante do contrato, nos termos do art. 4º da Lei nº 8.245/1991.\n\nParágrafo único. O descumprimento de qualquer cláusula permite à parte prejudicada rescindir o contrato, com aplicação de multa de ${multa} sobre o valor anual do aluguel à parte infratora.`);
        break;
      }

      case 'trabalho':
        add('objeto', 'Da função e das atividades', `O(A) EMPREGADO(A) é admitido(a) para exercer a função de ${P(x.cargo, 'cargo')}, desempenhando as seguintes atividades: ${objeto}, além de outras compatíveis com sua condição pessoal e com a função contratada.`);
        add('prazo', 'Do início e do período de experiência', x.experiencia === 'sem período de experiência'
          ? `O contrato tem início em ${inicio} e vigorará por prazo indeterminado.`
          : `O contrato tem início em ${inicio}, sendo os primeiros ${x.experiencia || '90 (noventa) dias'} considerados período de experiência, nos termos do art. 445 da CLT. Encerrado esse período sem manifestação em contrário, o contrato passará a vigorar por prazo indeterminado.`);
        add('jornada', 'Da jornada de trabalho', `A jornada de trabalho será de ${clean(P(x.jornada, 'jornada de trabalho'))}, observados os intervalos previstos em lei. Eventuais horas extras serão remuneradas ou compensadas na forma da legislação e das normas coletivas aplicáveis.`);
        add('pagamento', 'Da remuneração', `O(A) EMPREGADO(A) receberá salário mensal de ${valor}, a ser pago até o 5º (quinto) dia útil do mês seguinte ao trabalhado, mediante recibo ou depósito em conta bancária.\n\nSerão devidos, ainda, o 13º salário, as férias acrescidas de 1/3 (um terço), o depósito do FGTS e os demais direitos previstos na legislação trabalhista.`);
        add('obrigacoes', 'Das obrigações das partes', 'São obrigações da EMPREGADORA:\na) registrar o contrato na Carteira de Trabalho Digital;\nb) pagar a remuneração nas datas ajustadas;\nc) oferecer condições seguras de trabalho e os equipamentos de proteção necessários.\n\nSão obrigações do(a) EMPREGADO(A):\na) cumprir a jornada e as normas internas da empresa;\nb) executar suas atividades com zelo, pontualidade e assiduidade;\nc) manter sigilo sobre informações internas da EMPREGADORA.');
        add('rescisao', 'Da rescisão', 'A rescisão deste contrato observará as disposições da Consolidação das Leis do Trabalho (CLT), inclusive quanto ao aviso prévio, às verbas rescisórias e às multas previstas em lei.');
        break;

      case 'parceria':
        add('objeto', 'Do objeto', `O presente contrato tem por objeto o estabelecimento de parceria comercial entre as partes para ${objeto}.\n\nA parceria não cria vínculo societário, trabalhista ou de representação entre as partes, que permanecem independentes e responsáveis por seus próprios encargos.`);
        add('obrigacoes', 'Das responsabilidades da primeira parceira', `Caberá à PRIMEIRA PARCEIRA: ${clean(P(x.resp1, 'responsabilidades da primeira parceira'))}.`);
        add('obrigacoes', 'Das responsabilidades da segunda parceira', `Caberá à SEGUNDA PARCEIRA: ${clean(P(x.resp2, 'responsabilidades da segunda parceira'))}.`);
        add('pagamento', 'Da divisão de resultados e despesas', `${clean(P(x.divisao, 'como resultados e despesas serão divididos'))}.\n\nO investimento previsto para a parceria é de ${valor}, a ser suportado conforme a divisão acima. As partes prestarão contas uma à outra mensalmente.`);
        add('prazo', 'Da vigência', `Esta parceria vigorará pelo prazo de ${vig}, com início em ${inicio} e término em ${fim}, podendo ser renovada mediante termo aditivo.`);
        add('confidencialidade', 'Da confidencialidade', K.CLAUSE_LIB[0].body);
        rescisao(); break;

      case 'nda':
        add('objeto', 'Do objeto', `O presente acordo tem por objeto proteger as informações confidenciais relativas a ${objeto}, compartilhadas pela REVELADORA com a RECEPTORA com a finalidade de ${clean(P(x.proposito, 'por que as informações serão compartilhadas'))}.`);
        add('definicao', 'Das informações confidenciais', 'Consideram-se confidenciais todas as informações técnicas, comerciais, financeiras e estratégicas transmitidas por escrito, verbalmente ou por meio eletrônico, incluindo dados de clientes, fornecedores, preços, receitas e processos.\n\nNão são confidenciais as informações que já eram públicas, que a RECEPTORA comprovadamente já conhecia ou que precisem ser reveladas por ordem judicial.');
        add('obrigacoes', 'Das obrigações da receptora', 'São obrigações da RECEPTORA:\na) usar as informações exclusivamente para a finalidade prevista neste acordo;\nb) não copiar, divulgar ou repassar as informações a terceiros sem autorização por escrito;\nc) limitar o acesso às pessoas que precisem conhecê-las, informando-as do dever de sigilo;\nd) devolver ou destruir todo o material recebido quando solicitado ou ao fim das tratativas.');
        add('prazo', 'Do prazo do sigilo', `As obrigações de sigilo vigorarão pelo prazo de ${vig}, a contar de ${inicio}, e permanecerão válidas mesmo que as partes não concluam o negócio.`);
        add('pagamento', 'Da multa por violação', `Em caso de violação do sigilo, a RECEPTORA pagará à REVELADORA multa de ${valor}, sem prejuízo da indenização por perdas e danos que forem comprovados.`);
        add('rescisao', 'Do encerramento', `Este acordo poderá ser encerrado por qualquer das partes, mediante comunicação por escrito. O encerramento não extingue o dever de sigilo sobre as informações já recebidas, sujeitando a parte infratora à multa prevista neste acordo.`);
        break;

      case 'comodato':
        add('objeto', 'Do objeto', `A COMODANTE empresta gratuitamente à COMODATÁRIA, que recebe em perfeito estado de conservação e funcionamento, o seguinte bem: ${objeto}.\n\nO bem ficará em ${clean(P(x.localBem, 'onde o bem ficará'))} e será usado ${clean(P(x.usoBem, 'uso permitido do bem'))}.`);
        add('prazo', 'Do prazo e da devolução', `O empréstimo vigorará pelo prazo de ${vig}, com início em ${inicio} e término em ${fim}, data em que a COMODATÁRIA deverá devolver o bem no mesmo estado em que o recebeu, ressalvado o desgaste natural pelo uso.`);
        add('obrigacoes', 'Das obrigações das partes', 'São obrigações da COMODATÁRIA:\na) usar o bem apenas para o fim combinado e com o devido cuidado;\nb) arcar com as despesas comuns de uso e conservação;\nc) não emprestar, alugar ou ceder o bem a terceiros;\nd) comunicar imediatamente qualquer defeito, perda ou dano.\n\nSão obrigações da COMODANTE:\na) entregar o bem em condições de uso;\nb) informar as instruções de uso e manutenção.');
        add('pagamento', 'Do valor de referência e da indenização', `O comodato é gratuito. Para fins de indenização em caso de perda, furto ou dano por mau uso, as partes atribuem ao bem o valor de referência de ${valor}.`);
        rescisao(); break;

      case 'representacao': {
        const pc = parseFloat(String(x.comissao || '').replace(',', '.'));
        const comissao = pc > 0 ? (Number.isInteger(pc) ? `${pc}% (${K.extenso(pc)} por cento)` : `${String(pc).replace('.', ',')}%`) : '[PREENCHER: percentual de comissão]';
        add('objeto', 'Do objeto', `A REPRESENTADA nomeia a REPRESENTANTE para promover e intermediar a venda dos seguintes produtos ou serviços: ${objeto}, na região de ${clean(P(x.territorio, 'região de atuação'))}, ${x.exclusividade || 'sem exclusividade'}, nos termos da Lei nº 4.886/1965.`);
        add('pagamento', 'Da comissão e da meta', `A REPRESENTANTE receberá comissão de ${comissao} sobre o valor líquido das vendas efetivamente pagas pelos clientes, até o dia ${venc} do mês seguinte${meio}.\n\nA meta mensal de vendas é de ${valor}, usada como referência de desempenho, sem desconto da comissão caso não seja atingida.`);
        add('prazo', 'Do prazo', `Este contrato vigorará pelo prazo de ${vig}, com início em ${inicio} e término em ${fim}, podendo ser renovado mediante termo aditivo.`);
        add('obrigacoes', 'Das obrigações das partes', 'São obrigações da REPRESENTANTE:\na) divulgar os produtos com zelo e seguir as tabelas de preço e condições da REPRESENTADA;\nb) enviar mensalmente relatório das vendas e visitas realizadas;\nc) não representar produtos concorrentes sem autorização por escrito.\n\nSão obrigações da REPRESENTADA:\na) fornecer catálogos, amostras e tabelas atualizadas;\nb) informar as vendas aprovadas e recusadas;\nc) pagar as comissões nas datas ajustadas.');
        add('rescisao', 'Da rescisão', `Este contrato poderá ser rescindido por qualquer das partes, mediante aviso prévio por escrito de 30 (trinta) dias.\n\nParágrafo único. Na rescisão sem justo motivo pela REPRESENTADA, será devida à REPRESENTANTE a indenização prevista na Lei nº 4.886/1965. O descumprimento de qualquer cláusula sujeita a parte infratora à multa de ${multa} sobre a média anual das comissões.`);
        break;
      }

      case 'mutuo': {
        const jj = parseFloat(String(x.juros || '').replace(',', '.'));
        const juros = jj > 0
          ? `Sobre o saldo devedor incidirão juros de ${String(jj).replace('.', ',')}% (${Number.isInteger(jj) ? K.extenso(jj) : String(jj).replace('.', ',')} por cento) ao mês, pagos junto com cada parcela.`
          : jj === 0 && x.juros !== undefined && String(x.juros).trim() !== '' ? 'Não haverá cobrança de juros.' : 'Sobre o saldo devedor incidirão juros de [PREENCHER: percentual de juros] ao mês, pagos junto com cada parcela.';
        add('objeto', 'Do objeto', `A MUTUANTE empresta à MUTUÁRIA a quantia de ${valor}, destinada a ${objeto}.`);
        add('prazo', 'Da entrega do valor', `O valor será entregue à MUTUÁRIA em ${inicio}${meio}, servindo o comprovante de transferência como recibo.`);
        add('pagamento', 'Da devolução e dos juros', `A MUTUÁRIA devolverá o valor emprestado ${pagto()}. ${juros}\n\nParágrafo único. ${ATRASO}`);
        add('obrigacoes', 'Das obrigações das partes', 'São obrigações da MUTUÁRIA:\na) usar o valor na finalidade informada;\nb) pagar as parcelas nas datas ajustadas;\nc) comunicar qualquer dificuldade de pagamento antes do vencimento.\n\nSão obrigações da MUTUANTE:\na) entregar o valor na data combinada;\nb) fornecer recibo de cada pagamento recebido.');
        add('rescisao', 'Do vencimento antecipado', `O atraso de 2 (duas) parcelas consecutivas ou o descumprimento de qualquer cláusula provoca o vencimento antecipado da dívida, que poderá ser cobrada integralmente, acrescida de multa de ${multa} sobre o saldo devedor.`);
        break;
      }

      case 'distrato':
        add('objeto', 'Do objeto', `As partes resolvem, de comum acordo, encerrar (distratar) o seguinte contrato: ${objeto}, com efeitos a partir de ${inicio}.`);
        add('pagamento', 'Do acerto final', `A título de acerto final, a PRIMEIRA DISTRATANTE pagará à SEGUNDA DISTRATANTE o valor de ${valor}, ${pagto()}.`);
        add('prazo', 'Das devoluções e prazos', `No prazo de 10 (dez) dias, contados de ${inicio}, as partes devolverão uma à outra: ${clean(P(x.devolucoes, 'bens ou documentos a devolver'))}.`);
        add('obrigacoes', 'Das pendências', `Até a quitação, as partes se comprometem a resolver as seguintes pendências: ${clean(P(x.pendencias, 'pendências a resolver'))}.`);
        add('quitacao', 'Da quitação', 'Cumpridas as obrigações deste distrato, as partes dão-se plena, geral e irrevogável quitação, nada mais tendo a reclamar uma da outra em relação ao contrato encerrado.');
        add('rescisao', 'Do descumprimento deste distrato', `O descumprimento de qualquer obrigação deste distrato sujeitará a parte infratora à multa de ${multa} sobre o valor do acerto final, sem prejuízo de perdas e danos.`);
        break;

      default: // servicos
        add('objeto', 'Do objeto', `O presente contrato tem por objeto a prestação, pela CONTRATADA, dos seguintes serviços: ${objeto}.`);
        add('prazo', 'Do prazo de execução', `Os serviços terão início em ${inicio} e serão executados no prazo de ${clean(P(x.entrega, 'prazo de execução'))}.`);
        add('obrigacoes', 'Das obrigações da contratante', 'São obrigações da CONTRATANTE:\na) fornecer à CONTRATADA as informações e os materiais necessários à execução dos serviços;\nb) efetuar os pagamentos nas datas e condições ajustadas;\nc) comunicar por escrito qualquer irregularidade observada na execução dos serviços.');
        add('obrigacoes', 'Das obrigações da contratada', 'São obrigações da CONTRATADA:\na) executar os serviços com qualidade, zelo e dentro dos prazos ajustados;\nb) manter a CONTRATANTE informada sobre o andamento dos trabalhos;\nc) responsabilizar-se pelos encargos trabalhistas, fiscais e previdenciários de seus profissionais;\nd) refazer, sem custo adicional, os serviços entregues em desacordo com este contrato.');
        add('pagamento', 'Do preço e da forma de pagamento', `Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor ${total}de ${valor}, ${pagto()}.\n\nParágrafo único. ${ATRASO}`);
        rescisao();
    }
    gerais(); foro(); assinaturas();
    return { heading: t.titulo, clauses: cl };
  };

  /* ---------- Documento salvo ---------- */
  K.newDoc = (fields, opts = {}) => {
    const b = K.buildContract(fields);
    const t = K.TYPES[fields.tipo];
    const now = Date.now();
    const who = (fields.p2 && fields.p2.nome) || (fields.p1 && fields.p1.nome) || 'sem nome';
    return {
      id: K.uid(),
      title: opts.title || `${t.label} — ${who}`,
      tipo: fields.tipo,
      heading: b.heading,
      clauses: b.clauses,
      fields: K.clone(fields),
      checks: {},
      versions: [{ id: K.uid(), at: now, label: 'Versão gerada pelo formulário', heading: b.heading, clauses: K.clone(b.clauses) }],
      createdAt: now,
      updatedAt: now,
      mock: !!opts.mock,
    };
  };
  K.duplicateDoc = (d) => {
    const c = K.clone(d);
    const now = Date.now();
    Object.assign(c, { id: K.uid(), title: d.title + ' (cópia)', checks: {}, mock: false, createdAt: now, updatedAt: now });
    c.clauses.forEach((x) => (x.id = K.uid()));
    c.versions = [{ id: K.uid(), at: now, label: 'Cópia de “' + d.title + '”', heading: c.heading, clauses: K.clone(c.clauses) }];
    return c;
  };
  K.snapshot = (doc, label) => {
    doc.versions = doc.versions || [];
    doc.versions.push({ id: K.uid(), at: Date.now(), label, heading: doc.heading, clauses: K.clone(doc.clauses) });
    if (doc.versions.length > 25) doc.versions.splice(1, doc.versions.length - 25); // mantém a versão original
  };

  /* ---------- Renderização ---------- */
  K.clauseLabel = (c, n) => (c.numbered !== false ? `CLÁUSULA ${n}ª – ${(c.title || '').toUpperCase()}` : (c.title || '').toUpperCase());

  /** Campo para preencher à mão (modelo impresso): linha com a legenda embaixo. */
  const blankField = (p) => {
    const label = p.replace(/^\[(PREENCHER:\s*)?|\]$/g, '');
    // Textos longos (descrições, atividades, responsabilidades) ganham várias linhas para escrever.
    if (/descri|atividades|finalidade|responsabilidades|como resultados|forma de pagamento/.test(label)) return `<span class="fill wide"><small>${K.esc(label)}</small></span>`;
    return `<span class="fill" style="min-width:${Math.max(70, Math.min(260, label.length * 6.5))}px"><small>${K.esc(label)}</small></span>`;
  };
  const fmtBody = (s, opts, seen) =>
    String(s || '')
      .split(/(\[[^\]\n]{1,80}\])/)
      .map((p, i) => (i % 2 ? (opts.blank ? blankField(p) : `<mark class="ph">${K.esc(p)}</mark>`) : opts.glossary ? K.glossarize(K.esc(p), seen) : K.esc(p)))
      .join('')
      .replace(/(<span class="fill wide"><small>[^<]*<\/small><\/span>)[.;,]/g, '$1') // sem pontuação solta após linhas largas
      .replace(/\n/g, '<br>');

  /** HTML do documento no formato "papel".
   *  opts.glossary destaca termos do glossário; opts.blank troca os campos pendentes por linhas para preencher à mão. */
  K.renderPaper = (doc, opts = {}) => {
    let n = 0;
    const seen = new Set();
    return `<h1 class="paper-title">${K.esc(doc.heading)}</h1>` +
      doc.clauses.map((c) => {
        const label = K.clauseLabel(c, c.numbered !== false ? ++n : 0);
        return `<div class="paper-clause" id="pc-${c.id}">${label ? `<h4>${K.esc(label)}</h4>` : ''}<p>${fmtBody(c.body, opts, seen)}</p></div>`;
      }).join('');
  };

  /** Modelo em branco do kit físico: mesmo contrato do site, com espaços para escrever e opções para marcar com X. */
  K.blankModel = (tipo) => {
    const b = K.buildContract({ tipo, p1: {}, p2: {}, extras: {}, pagamento: 'modelo' });
    const swaps = [
      ['[PREENCHER: valor]', 'R$ [PREENCHER: valor em números] ([PREENCHER: valor por extenso])'],
      ['fins comerciais', 'fins (   ) comerciais   (   ) residenciais'],
      ['pela variação do IPCA', 'pela variação do (   ) IPCA   (   ) IGP-M   (   ) INPC'],
      ['A presente locação é contratada sem garantia locatícia.', 'Em garantia do cumprimento das obrigações deste contrato, a LOCATÁRIA oferece: (   ) caução de até 3 (três) aluguéis   (   ) fiador   (   ) seguro-fiança   (   ) sem garantia.'],
      ['sendo os primeiros 90 (noventa) dias considerados', 'sendo os primeiros [PREENCHER: nº de] dias (até 90) considerados'],
      [', sem exclusividade, nos termos', ', (   ) sem exclusividade   (   ) com exclusividade na região, nos termos'],
    ];
    b.clauses.forEach((c) => swaps.forEach(([from, to]) => { c.body = c.body.split(from).join(to); }));
    return { heading: b.heading, clauses: b.clauses, tipo };
  };
  K.docText = (doc) => {
    let n = 0;
    return doc.heading + '\n\n' + doc.clauses.map((c) => K.clauseLabel(c, c.numbered !== false ? ++n : 0) + '\n' + c.body).join('\n\n') + '\n';
  };
  K.docWord = (doc) =>
    '﻿<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8">' +
    `<title>${K.esc(doc.title)}</title><style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.5}h1{text-align:center;font-size:14pt;margin-bottom:18pt}h4{font-size:12pt;margin:14pt 0 4pt}p{text-align:justify;margin:0 0 6pt}mark{background:#fff1c2}</style></head><body>` +
    K.renderPaper(doc) + '</body></html>';
})();

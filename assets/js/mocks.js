/* Kit Contrato Fácil — documentos de exemplo para a apresentação.
 * Todos os nomes, empresas e números são FICTÍCIOS. Os CPFs/CNPJs são gerados com dígitos válidos
 * (exceto um, de propósito, para demonstrar o checklist apontando o erro).
 */
(function () {
  'use strict';
  const K = window.KCF;
  const cnpj = K.completeCNPJ, cpf = K.completeCPF, d = K.isoFromNow;
  const daysAgo = (n) => Date.now() - n * 86400000;
  const ALL = 'all';

  const MOCKS = [
    {
      title: 'Site institucional — Padaria Grão Dourado', created: 6, updated: 1, checks: ALL, extra: ['lgpd'],
      note: 'Exemplo completo e conferido.',
      f: {
        tipo: 'servicos',
        p1: { nome: 'Padaria Grão Dourado Ltda', doc: cnpj('123456780001'), end: 'Rua das Acácias, 120, Centro, Campinas/SP' },
        p2: { nome: 'Estúdio Pixel Web Ltda', doc: cnpj('458712360001'), end: 'Av. Brasil, 2000, sala 5, Jardim Guanabara, Campinas/SP' },
        objeto: 'criação de site institucional com até 5 (cinco) páginas (Início, Sobre, Produtos, Encomendas e Contato), incluindo layout responsivo, cadastro de até 30 (trinta) produtos, integração com WhatsApp e publicação em servidor indicado pela CONTRATANTE',
        valor: 4800, pagamento: 'sinal', meio: 'PIX', inicio: d(-5), cidade: 'Campinas', uf: 'SP', multa: '10',
        extras: { entrega: '45 (quarenta e cinco) dias corridos' },
        obs: 'O conteúdo (textos e fotos) será fornecido pela CONTRATANTE em até 10 (dez) dias após a assinatura. Estão incluídas até 2 (duas) rodadas de ajustes no layout.',
      },
    },
    {
      title: 'Venda de forno industrial', created: 4, updated: 0.1, checks: ['partes', 'objeto', 'prazos', 'obrigacoes'],
      note: 'Valor alterado à mão sem atualizar o extenso — o checklist aponta a divergência.',
      tweak: (doc) => {
        const c = doc.clauses.find((x) => x.key === 'pagamento');
        c.body = c.body.replace('R$ 7.350,00', 'R$ 7.530,00');
      },
      f: {
        tipo: 'compra',
        p1: { nome: 'Cozinha Sabor & Arte ME', doc: cnpj('307915840001'), end: 'Rua Tiradentes, 88, Vila Nova, Belo Horizonte/MG' },
        p2: { nome: 'Doces da Vó Lurdes Ltda', doc: cnpj('219834560001'), end: 'Rua Pium-í, 1450, Cruzeiro, Belo Horizonte/MG' },
        objeto: '1 (um) forno industrial a gás, marca Fornalha, modelo FX-90, capacidade de 90 (noventa) litros, nº de série FX90-2231, usado, com 2 (dois) anos de uso, em perfeito estado de conservação e funcionamento',
        valor: 7350, pagamento: 'parcelado', parcelas: '3', meio: 'transferência bancária', inicio: d(-2), cidade: 'Belo Horizonte', uf: 'MG', multa: '10',
        extras: { entrega: '5 (cinco) dias úteis', garantia: '90 (noventa) dias' },
      },
    },
    {
      title: 'Locação — Sala comercial 12', created: 3, updated: 2, checks: ['objeto', 'valores'],
      note: 'CPF do locador inválido e endereço da locatária em branco — o checklist aponta os dois problemas.',
      f: {
        tipo: 'locacao',
        p1: { nome: 'Roberto Almeida Nunes', doc: '123.456.789-00', end: 'Rua Marechal Deodoro, 300, ap. 81, Centro, Curitiba/PR' },
        p2: { nome: 'Clínica Bem Estar Fisioterapia Ltda', doc: cnpj('563019270001'), end: '' },
        objeto: 'sala comercial com 42 m² (quarenta e dois metros quadrados), 1 (um) banheiro, copa e 1 (uma) vaga de garagem, entregue com pintura nova e instalações elétricas e hidráulicas em pleno funcionamento',
        valor: 2300, vencimento: '10', meio: 'PIX', prazoMeses: '30', inicio: d(10), cidade: 'Curitiba', uf: 'PR', multa: '10',
        extras: { imovel: 'Rua XV de Novembro, 455, sala 12, Centro, Curitiba/PR', finalidade: 'comercial', reajuste: 'IGP-M', garantiaLoc: 'caução equivalente a 3 (três) aluguéis' },
      },
    },
    {
      title: 'Contratação — Atendente de loja', created: 1, updated: 0.5, checks: [],
      note: 'Rascunho recém-gerado, ainda sem conferência.',
      f: {
        tipo: 'trabalho',
        p1: { nome: 'Mercadinho Bom Preço Ltda', doc: cnpj('640287150001'), end: 'Av. Getúlio Vargas, 512, Centro, Ribeirão Preto/SP' },
        p2: { nome: 'Juliana Costa Ribeiro', doc: cpf('274185963'), end: 'Rua das Hortênsias, 45, Jardim Paulista, Ribeirão Preto/SP' },
        objeto: 'atendimento ao público, operação de caixa, reposição de mercadorias nas gôndolas, controle de validade dos produtos e organização do estoque',
        valor: 1850, inicio: d(14), cidade: 'Ribeirão Preto', uf: 'SP',
        extras: { cargo: 'Atendente de loja', jornada: '44 (quarenta e quatro) horas semanais, de segunda a sábado, das 8h às 17h20, com 1 (uma) hora de intervalo para descanso e alimentação', experiencia: '90 (noventa) dias' },
      },
    },
    {
      title: 'Parceria Café & Livros', created: 20, updated: 8, checks: ALL,
      note: 'Parceria entre duas empresas, conferida.',
      f: {
        tipo: 'parceria',
        p1: { nome: 'Café Aroma Ltda', doc: cnpj('781245900001'), end: 'Rua Augusta, 1200, Consolação, São Paulo/SP' },
        p2: { nome: 'Livraria Página Nova Ltda', doc: cnpj('330129870001'), end: 'Rua Haddock Lobo, 340, Cerqueira César, São Paulo/SP' },
        objeto: 'realização de encontros mensais de leitura e lançamentos de livros no espaço da PRIMEIRA PARCEIRA, com venda de livros pela SEGUNDA PARCEIRA e de cafés e lanches pela PRIMEIRA PARCEIRA',
        valor: 3000, prazoMeses: '12', inicio: d(-20), cidade: 'São Paulo', uf: 'SP', multa: '5',
        extras: {
          divisao: 'Cada parte fica com a receita integral de suas próprias vendas. As despesas comuns de divulgação serão divididas em 50% (cinquenta por cento) para cada parte',
          resp1: 'ceder o espaço do café uma vez por mês, das 18h às 21h; organizar mobiliário e som; divulgar os eventos em suas redes sociais',
          resp2: 'definir a programação de autores e livros; levar o estoque de livros e realizar as vendas; divulgar os eventos em suas redes sociais e na loja',
        },
      },
    },
    {
      title: 'Consultoria contábil mensal', created: 40, updated: 3, checks: ['partes', 'objeto', 'valores', 'prazos', 'obrigacoes', 'rescisao'],
      note: 'Serviço com mensalidade, em revisão.',
      f: {
        tipo: 'servicos',
        p1: { nome: 'Ateliê Linha Fina ME', doc: cnpj('905671230001'), end: 'Rua Sete de Setembro, 77, Centro, Florianópolis/SC' },
        p2: { nome: 'Marcos Vinícius Prado', doc: cpf('381927465'), end: 'Av. Beira-Mar Norte, 2100, sala 304, Florianópolis/SC' },
        objeto: 'assessoria contábil e fiscal mensal, incluindo escrituração contábil, apuração de impostos do Simples Nacional, folha de pagamento de até 5 (cinco) funcionários e entrega das obrigações acessórias',
        valor: 650, pagamento: 'mensal', vencimento: '5', meio: 'boleto bancário', inicio: d(-40), cidade: 'Florianópolis', uf: 'SC', multa: '10',
        extras: { entrega: '12 (doze) meses, renovável automaticamente por iguais períodos' },
      },
    },
  ];

  K.buildMocks = () =>
    MOCKS.map((m) => {
      const doc = K.newDoc(K.clone(m.f), { title: m.title, mock: true });
      (m.extra || []).forEach((key) => {
        const l = K.CLAUSE_LIB.find((x) => x.key === key);
        const at = doc.clauses.findIndex((c) => c.key === 'gerais');
        doc.clauses.splice(at, 0, { id: K.uid(), key: l.key, title: l.title, body: l.body, numbered: true });
      });
      if (m.tweak) m.tweak(doc);
      doc.note = m.note;
      (m.checks === ALL ? K.CHECKS.map((c) => c.id) : m.checks).forEach((id) => (doc.checks[id] = true));
      doc.createdAt = daysAgo(m.created);
      doc.updatedAt = daysAgo(m.updated);
      doc.versions[0].at = doc.createdAt;
      doc.versions[0].clauses = K.clone(doc.clauses);
      return doc;
    });

  /* Dados para o botão "Preencher com exemplo" do formulário (versões sem erros). */
  K.EXAMPLES = {};
  MOCKS.forEach((m) => { if (!K.EXAMPLES[m.f.tipo]) K.EXAMPLES[m.f.tipo] = m.f; });
  K.EXAMPLES.locacao = Object.assign(K.clone(K.EXAMPLES.locacao), {
    p1: { nome: 'Roberto Almeida Nunes', doc: cpf('402718593'), end: 'Rua Marechal Deodoro, 300, ap. 81, Centro, Curitiba/PR' },
    p2: { nome: 'Clínica Bem Estar Fisioterapia Ltda', doc: cnpj('563019270001'), end: 'Rua XV de Novembro, 455, sala 12, Centro, Curitiba/PR' },
  });

  /* Exemplos dos 5 modelos exclusivos do Pro (dados fictícios). */
  Object.assign(K.EXAMPLES, {
    nda: {
      tipo: 'nda',
      p1: { nome: 'Padaria Grão Dourado Ltda', doc: cnpj('123456780001'), end: 'Rua das Acácias, 120, Centro, Campinas/SP' },
      p2: { nome: 'Rede Café Expresso Ltda', doc: cnpj('487210390001'), end: 'Av. Paulista, 900, Bela Vista, São Paulo/SP' },
      objeto: 'receitas de pães e bolos, lista de fornecedores, planilha de custos de produção e volumes de venda por produto',
      valor: 20000, prazoMeses: '24', inicio: d(0), cidade: 'Campinas', uf: 'SP', multa: '10',
      extras: { proposito: 'avaliar uma possível parceria para venda dos produtos da padaria nas lojas da rede' },
    },
    comodato: {
      tipo: 'comodato',
      p1: { nome: 'Café Aroma Ltda', doc: cnpj('781245900001'), end: 'Rua Augusta, 1200, Consolação, São Paulo/SP' },
      p2: { nome: 'Livraria Página Nova Ltda', doc: cnpj('330129870001'), end: 'Rua Haddock Lobo, 340, Cerqueira César, São Paulo/SP' },
      objeto: '1 (uma) máquina de café espresso profissional, marca Barista, modelo B-200, nº de série B200-7781, com 2 (dois) grupos e moedor acoplado',
      valor: 12000, prazoMeses: '12', inicio: d(0), cidade: 'São Paulo', uf: 'SP', multa: '10',
      extras: { usoBem: 'exclusivamente no espaço de leitura da livraria, para servir os clientes', localBem: 'Rua Haddock Lobo, 340, Cerqueira César, São Paulo/SP' },
    },
    representacao: {
      tipo: 'representacao',
      p1: { nome: 'Doces da Vó Lurdes Ltda', doc: cnpj('219834560001'), end: 'Rua Pium-í, 1450, Cruzeiro, Belo Horizonte/MG' },
      p2: { nome: 'Carlos Henrique Duarte', doc: cpf('513874296'), end: 'Rua dos Timbiras, 2200, Lourdes, Belo Horizonte/MG' },
      objeto: 'linha de doces artesanais, bolos de pote e tortas congeladas para revenda em cafeterias, padarias e mercados',
      valor: 15000, vencimento: '10', meio: 'PIX', prazoMeses: '12', inicio: d(0), cidade: 'Belo Horizonte', uf: 'MG', multa: '10',
      extras: { territorio: 'Belo Horizonte, Contagem e Betim/MG', comissao: '8', exclusividade: 'com exclusividade na região' },
    },
    mutuo: {
      tipo: 'mutuo',
      p1: { nome: 'Mercadinho Bom Preço Ltda', doc: cnpj('640287150001'), end: 'Av. Getúlio Vargas, 512, Centro, Ribeirão Preto/SP' },
      p2: { nome: 'Cozinha Sabor & Arte ME', doc: cnpj('307915840001'), end: 'Rua Tiradentes, 88, Vila Nova, Belo Horizonte/MG' },
      objeto: 'compra de um forno combinado e de uma câmara fria para ampliação da cozinha industrial',
      valor: 30000, pagamento: 'parcelado', parcelas: '10', meio: 'transferência bancária', inicio: d(0), cidade: 'Ribeirão Preto', uf: 'SP', multa: '10',
      extras: { juros: '1' },
    },
    distrato: {
      tipo: 'distrato',
      p1: { nome: 'Ateliê Linha Fina ME', doc: cnpj('905671230001'), end: 'Rua Sete de Setembro, 77, Centro, Florianópolis/SC' },
      p2: { nome: 'Marcos Vinícius Prado', doc: cpf('381927465'), end: 'Av. Beira-Mar Norte, 2100, sala 304, Florianópolis/SC' },
      objeto: 'Contrato de Prestação de Serviços de assessoria contábil mensal, assinado em 05/10/2026',
      valor: 650, pagamento: 'avista', meio: 'boleto bancário', inicio: d(0), cidade: 'Florianópolis', uf: 'SC', multa: '10',
      extras: { devolucoes: 'livros fiscais, senhas de acesso aos sistemas e documentos originais da empresa', pendencias: 'entrega do último balancete mensal e das guias de impostos do mês de encerramento' },
    },
  });
})();

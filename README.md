# Kit Contrato Fácil

Projeto acadêmico (Desenvolvimento de Produto): gerador de minutas de contrato com editor de cláusulas, checklist de conferência automático e glossário. Site 100% estático (HTML, CSS e JavaScript puro), sem servidor nem banco de dados.

## Equipe

Amanda Lima da Mata · Amanda Ribeiro Mazzetto · Beatriz Aparecida Moreira · Isadora Nagahara Kumagai · Natalie Camargo Alberto

## Modo apresentação

No rodapé de qualquer tela, o botão **🎬 Modo apresentação** deixa o site como numa primeira visita: restaura os 6 exemplos, limpa o rascunho do formulário e a conversa do assistente, zera os limites do plano Grátis e deixa escolher se a demonstração começa no Grátis ou no Pro. Contratos criados no navegador são apagados (o aviso mostra quantos).

## Como abrir

- **Mais simples:** dê dois cliques em `index.html` (Chrome, Edge, Firefox ou Safari).
- **Com servidor local (opcional):**

```bash
python3 -m http.server 8080
```

Depois acesse http://localhost:8080.

## Telas

| Rota | Tela | O que faz |
|---|---|---|
| `#/entrar` | Entrada | Primeira tela, sem menu: login simulado, *Criar conta* ou *Continuar sem login*, com os planos logo abaixo |
| `#/inicio` | Início | Apresentação, atalhos por tipo de contrato, documentos recentes e planos |
| `#/novo` | Novo contrato | Formulário guiado em 6 passos com prévia ao vivo, máscara e validação de CPF/CNPJ, valor por extenso e botão “Preencher com exemplo” |
| `#/documentos` | Meus documentos | Lista dos contratos gerados: busca, filtros, duplicar, exportar, excluir, backup e restauração dos exemplos |
| `#/editor/:id` | Editor | Edição livre de cada cláusula e título, reordenar, inserir modelos de cláusula, localizar e substituir, versões, modo leitura com glossário e **checklist no painel lateral** (análise automática + confirmação manual, relatório para impressão) |
| `#/glossario` | Glossário | Termos contratuais com busca |
| `#/planos` | Planos | Grátis e Pro (com promoção no anual), kit físico, ativação do código do kit, comparação e perguntas frequentes |
| `#/kit` | Kit físico | Monte a pasta: escolha de 1 a 10 modelos e as cópias de cada um, veja cada folha como sai impressa e faça o pedido (simulado) |

Em todas as telas há o botão **💬 Assistente** (canto inferior direito).

## Checklist automático

O checklist fica no painel lateral do editor. **No plano Grátis ele é só manual** (a pessoa marca cada item). **No Pro**, ele lê o **texto final** do contrato (inclusive o que foi editado à mão) e verifica:

1. CPF/CNPJ das partes (dígitos verificadores)
2. Cláusula de objeto detalhada
3. Valores em R$ e se o **valor por extenso confere** com o número
4. Datas válidas e prazos
5. Cláusulas de obrigações
6. Rescisão e multa
7. Foro, assinaturas e testemunhas
8. Campos `[PREENCHER]` pendentes ou cláusulas vazias
9. Revisão final (só manual)

Situação do documento: **Rascunho** (nada conferido), **Em revisão** e **Conferido** (todos os itens confirmados e nenhum problema).

## Tipos de contrato

- **Grátis (5):** prestação de serviços, compra e venda, locação, trabalho e parceria.
- **Exclusivos do Pro (5):** confidencialidade (NDA), comodato, representação comercial, empréstimo entre empresas (mútuo) e distrato. No Grátis dá para preencher e ver a prévia; para gerar, é preciso assinar o Pro.

## Revisor (Pro)

Em cada aviso do checklist aparece um botão para resolver:

- **🔧 Arrumar** (verde): o site corrige sozinho — valor por extenso divergente ou ausente, cláusula que falta (objeto, prazo, obrigações, pagamento, rescisão, foro), multa na rescisão, espaços de assinatura e testemunhas, cláusulas vazias.
- **✏️ Corrigir** (branco): quando só a pessoa sabe o dado certo (CPF/CNPJ inválido, data inexistente, campo em branco), o editor leva até o trecho e deixa ele selecionado.

Também há **Arrumar tudo automaticamente**. Antes de cada correção, uma versão é salva em *Versões*.

## Login (simulado)

O site abre sempre pela **tela de entrada**, sem menu nem outras telas: *Entrar*, *Criar conta* ou *Continuar sem login*. A escolha de continuar sem login vale até fechar a aba; *Sair* e o *Modo apresentação* voltam para a entrada. As contas ficam só no navegador e não há segurança real: é apenas demonstração. Conta pronta: usuário **demo**, senha **demo123**.

## Assistente jurídico (demonstração)

Não usa inteligência artificial nem internet: as respostas são montadas por regras (`assets/js/assistant.js`). Com um contrato aberto no editor, ele usa a análise real do checklist e consegue agir no documento.

Perguntas que funcionam bem na apresentação:

- “O que falta neste contrato?” → lista os problemas e oferece botões para ir até a cláusula
- “Corrija o valor por extenso” → pergunta qual valor está certo e corrige (no exemplo *Venda de forno*)
- “Resuma este contrato”
- “A multa está adequada?”
- “Escreva uma cláusula de confidencialidade” → botão para inserir no contrato
- “O que é foro?” / “O que é caução?” → explica e mostra onde o termo aparece
- “Vou alugar uma sala, qual contrato uso?”
- “O contrato precisa de testemunhas?” / “Tem validade sem cartório?”
- “Quanto custa o plano Pro?”

Toda alteração feita pelo assistente salva antes uma versão de segurança (botão *Versões* do editor).

## Planos (simulação)

| | Grátis | Pro |
|---|---|---|
| Preço | R$ 0 | R$ 24,90/mês |
| Promoção anual | — | **R$ 249/ano** (equivale a R$ 20,75/mês, 2 meses grátis) |
| Contratos | 3 por mês | Ilimitados |
| Assistente | 3 perguntas por dia | Ilimitado |
| Exportação | Com marca d’água | Sem marca d’água |

Também: kit físico (pasta) por R$ 119 com 3 meses de Pro.

Os limites do Grátis funcionam de verdade no site para mostrar o funil de venda: ao estourar, aparece a oferta de **assinar o Pro** (um clique, simulado). Nenhum pagamento é processado; o plano escolhido fica salvo só no navegador. Os documentos de exemplo não contam no limite. Para voltar ao Grátis: *Planos → Voltar para o Grátis*.

## Logo

Arquivo vetorial em `assets/img/logo.svg` (pasta + folha + ✓ de conferido), pronto para usar nos slides e na pasta física.

## Documentos de exemplo

Na primeira abertura são criados 6 contratos fictícios (um de cada tipo e mais um de serviços). Alguns têm erros de propósito para a demonstração:

- **Venda de forno industrial**: o valor foi alterado sem atualizar o extenso.
- **Locação — Sala comercial 12**: CPF do locador inválido e endereço da locatária em branco.

Para voltar ao estado original: *Meus documentos → Restaurar exemplos*.

## Estrutura

```
index.html
assets/css/style.css
assets/js/utils.js       utilidades (formatação, CPF/CNPJ, extenso, armazenamento, modal)
assets/js/glossary.js    termos do glossário e destaque no texto
assets/js/templates.js   tipos de contrato, cláusulas e geração do documento
assets/js/checklist.js   regras do checklist automático
assets/js/fixes.js       revisor: correções do checklist (Pro)
assets/js/mocks.js       documentos de exemplo
assets/js/plans.js       planos e limites do Grátis
assets/js/auth.js        login simulado
assets/js/kit.js         kit físico: folhas impressas, escolha de modelos e pedido
assets/js/app.js         rotas e telas
assets/js/assistant.js   assistente jurídico (simulado)
assets/img/logo.svg      logo
```

Os dados ficam no `localStorage` do navegador. Para levar os documentos a outro computador, use *Exportar backup* / *Importar backup*.

> Material educativo: as minutas não substituem a análise de um profissional habilitado.

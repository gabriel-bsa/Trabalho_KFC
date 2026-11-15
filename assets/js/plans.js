/* Kit Contrato Fácil — planos (modelo freemium de demonstração)
 * Nenhum pagamento é processado: a escolha do plano fica salva só neste navegador.
 */
(function () {
  'use strict';
  const K = window.KCF;

  K.PLANS = {
    gratis: {
      id: 'gratis', nome: 'Grátis', mensal: 0, anual: 0, docs: 3, ai: 3, marca: true, autoCheck: false, proTypes: false,
      resumo: 'Para conhecer e fazer contratos de vez em quando.',
      itens: ['3 contratos por mês', '5 tipos de contrato', 'Editor completo de cláusulas', 'Checklist manual de conferência', 'Assistente: 3 perguntas por dia', 'PDF e Word com marca d’água'],
    },
    pro: {
      id: 'pro', nome: 'Pro', mensal: 24.9, anual: 249, docs: Infinity, ai: Infinity, marca: false, autoCheck: true, proTypes: true, destaque: true,
      resumo: 'Para quem faz contratos com frequência.',
      itens: ['10 tipos de contrato: os 5 básicos + NDA, comodato, representação comercial, empréstimo e distrato', 'Checklist automático: valida CPF/CNPJ, valores e datas', 'Revisor: arruma os erros encontrados com um clique', 'Contratos ilimitados', 'Assistente jurídico ilimitado', 'Exportação sem marca d’água'],
    },
  };
  K.KIT = {
    preco: 119,
    itens: ['Você escolhe de 1 a 10 modelos impressos e quantas cópias quer de cada um', 'Pasta em papelão rígido e papel reciclado (32 × 24 × 6 cm)', 'Checklist de conferência em papel', 'Glossário ilustrado e guia rápido de uso', 'Cartão com 3 meses do plano Pro'],
  };

  K.plan = {
    get() {
      const p = K.prefs.get('plan', null);
      return p && K.PLANS[p.id] ? p : { id: 'gratis' };
    },
    info() { return K.PLANS[this.get().id]; },
    label() { const p = this.get(); return K.PLANS[p.id].nome + (p.id === 'pro' && p.ciclo === 'anual' ? ' anual' : p.id === 'pro' && p.ciclo === 'kit' ? ' · kit' : ''); },
    set(id, opts = {}) {
      K.prefs.set('plan', { id, ciclo: opts.ciclo || 'mensal', desde: Date.now() });
      this.renderChip();
      document.dispatchEvent(new CustomEvent('kcf:plan'));
    },
    /** Contratos gerados pelo formulário no mês atual (exemplos e cópias não contam). */
    docsThisMonth() {
      const now = new Date();
      return K.store.load().filter((d) => {
        if (d.origin !== 'form') return false;
        const c = new Date(d.createdAt);
        return c.getMonth() === now.getMonth() && c.getFullYear() === now.getFullYear();
      }).length;
    },
    canCreate() { return this.docsThisMonth() < this.info().docs; },
    /** Perguntas ao assistente usadas hoje. */
    aiUsed() { const q = K.prefs.get('aiq', null); return q && q.d === K.today() ? q.n : 0; },
    aiUse() { K.prefs.set('aiq', { d: K.today(), n: this.aiUsed() + 1 }); },
    aiLeft() { const lim = this.info().ai; return lim === Infinity ? Infinity : Math.max(0, lim - this.aiUsed()); },
    renderChip() {
      const el = K.$('#planChip');
      if (!el) return;
      const id = this.get().id;
      el.textContent = 'Plano ' + this.label();
      el.className = 'plan-chip ' + id;
    },
  };

  K.price = (n) => (n ? 'R$ ' + K.money(n) : 'R$ 0');

  /** Assinatura simulada do Pro (sem pagamento). */
  K.subscribePro = (ciclo = 'mensal') => { K.plan.set('pro', { ciclo }); K.toast(`Plano Pro ${ciclo === 'anual' ? 'anual ' : ''}ativado (demonstração).`); };

  /** Modal de upgrade. Resolve 'pro' se a pessoa assinou o Pro. */
  K.upsell = (reason) => {
    const txt = {
      docs: ['Limite do plano Grátis atingido', `O plano Grátis permite ${K.PLANS.gratis.docs} contratos por mês. No Pro você cria quantos quiser, usa o assistente sem limites e exporta sem marca d’água.`],
      ai: ['Perguntas grátis de hoje esgotadas', `No plano Grátis o assistente responde ${K.PLANS.gratis.ai} perguntas por dia. No Pro ele é ilimitado.`],
      tipos: ['Modelo exclusivo do plano Pro', 'Confidencialidade (NDA), comodato, representação comercial, empréstimo entre empresas e distrato são modelos exclusivos do Pro. Assine para gerar este contrato.'],
      auto: ['Análise automática é do plano Pro', 'No Grátis você confere o contrato marcando o checklist à mão. No Pro, o sistema lê o texto e aponta sozinho CPF/CNPJ inválidos, valores que não batem com o extenso, datas erradas e campos em branco.'],
      marca: ['Exportar sem marca d’água', 'No plano Grátis os arquivos saem com uma marca d’água no rodapé. Assine o Pro para exportar documentos limpos.'],
    }[reason] || ['Conheça o plano Pro', 'Contratos ilimitados, assistente sem limites e exportação sem marca d’água.'];
    return K.modal({
      title: txt[0],
      html: `<div class="upsell"><img src="assets/img/logo.svg" alt="" width="48" height="48"><p>${K.esc(txt[1])}</p></div>
        <ul class="check-list">${K.PLANS.pro.itens.slice(0, 3).map((i) => `<li>${K.esc(i)}</li>`).join('')}</ul>
        <p class="muted sm">Pro: ${K.price(K.PLANS.pro.mensal)}/mês. 🎉 Promoção anual: ${K.price(K.PLANS.pro.anual)}/ano (2 meses grátis). <i>(Demonstração: nenhum pagamento é processado.)</i></p>`,
      actions: [
        { label: 'Ver planos', value: 'planos', onClick: () => { location.hash = '#/planos'; return 'planos'; } },
        { label: `Assinar o Pro · ${K.price(K.PLANS.pro.mensal)}/mês`, cls: 'primary', value: 'pro', onClick: () => { K.subscribePro(); return 'pro'; } },
      ],
    });
  };
})();

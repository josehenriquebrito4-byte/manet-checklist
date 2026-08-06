// Consumo teórico de insumos a partir das vendas reais da Saipos.
//
// MUÇARELA: detalhado por ficha técnica/sabor (120g na Mussarela, 100g nos
// demais salgados, doces não usam muçarela). Regras de mapeamento:
//   - sabor salgado faltando num combo -> assume Mussarela
//   - sabor doce (Banana Nevada/Confete/Banana Canela) dentro de um combo
//     multi-pizza -> vira consumo de broto 20cm, nunca conta como salgada
//   - sabor sem ficha própria -> fallback Calabresa, exceto Frango Invertido
//     (-> Frango), Duquesa (-> Duqueza) e a família confete/chocolate/Prestígio
//     (-> Confete)
//   - "Tradicional" é recheio de borda, não sabor — ignorado
//   - mesmo sabor duplicado nas choices de uma pizza (bug do iFood) -> conta 1x
//   - se sobrar mais sabores que a composição oficial do combo, descarta o
//     excesso (mantém as primeiras ocorrências)
//
// REFRIGERANTE: fixo, 1 por combo vendido (Dupla/Trio/Dobro/Combo Galera),
// não depende das choices — é definição do combo, não contagem de escolha.
//
// CALABRESA/CATUPIRY/FRANGO/PRESUNTO: gramas por ficha técnica, extraídas da
// planilha PRECIFICAÇÃO-MANETPIZZA.xlsm (aba "Fichas das pizzas"), mesma
// fonte e lógica da muçarela. Catupiry é comprado em bisnaga de 1,5kg (ficha
// de ingredientes da planilha), mas a ficha técnica já traz o consumo em
// gramas por pizza, então não há conversão de unidade a fazer aqui.
//
// CAIXA: toda ficha técnica (30cm ou 20cm) inclui exatamente 1 caixa do
// tamanho correspondente — por isso a contagem de caixas é sempre igual à
// contagem de pizzas salgadas (30cm) e brotos doces (20cm) já computada.

const MUSSARELA_GRAMAS = {
  Mussarela: 120,
  Calabresa: 100,
  Frango: 100,
  Duqueza: 100,
  Manet: 100,
  Marguerita: 100,
  '5 Queijos': 100,
  Caprichosa: 100,
  Pepperoni: 100,
  Portuguesa: 100,
  'Banana Nevada': 0,
  Confete: 0,
  'Banana Canela': 0,
};

const CALABRESA_GRAMAS = {
  Mussarela: 0,
  Calabresa: 100,
  Frango: 0,
  Duqueza: 0,
  Manet: 100,
  Marguerita: 0,
  '5 Queijos': 0,
  Caprichosa: 0,
  Pepperoni: 0,
  Portuguesa: 50,
  'Banana Nevada': 0,
  Confete: 0,
  'Banana Canela': 0,
};

const CATUPIRY_GRAMAS = {
  Mussarela: 0,
  Calabresa: 0,
  Frango: 80,
  Duqueza: 80,
  Manet: 0,
  Marguerita: 0,
  '5 Queijos': 80,
  Caprichosa: 80,
  Pepperoni: 0,
  Portuguesa: 0,
  'Banana Nevada': 0,
  Confete: 0,
  'Banana Canela': 0,
};

const FRANGO_GRAMAS = {
  Mussarela: 0,
  Calabresa: 0,
  Frango: 100,
  Duqueza: 0,
  Manet: 0,
  Marguerita: 0,
  '5 Queijos': 0,
  Caprichosa: 0,
  Pepperoni: 0,
  Portuguesa: 0,
  'Banana Nevada': 0,
  Confete: 0,
  'Banana Canela': 0,
};

const PRESUNTO_GRAMAS = {
  Mussarela: 0,
  Calabresa: 0,
  Frango: 0,
  Duqueza: 0,
  Manet: 0,
  Marguerita: 0,
  '5 Queijos': 0,
  Caprichosa: 0,
  Pepperoni: 0,
  Portuguesa: 80,
  'Banana Nevada': 0,
  Confete: 0,
  'Banana Canela': 0,
};

const SALGADOS = [
  'Mussarela', 'Calabresa', 'Frango', 'Duqueza', 'Manet', 'Marguerita',
  '5 Queijos', 'Caprichosa', 'Pepperoni', 'Portuguesa',
];
const DOCES = ['Banana Nevada', 'Confete', 'Banana Canela'];
const FALLBACK_SALGADO = 'Calabresa';

function normalize(str) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\bbroto\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

const ALIAS_MAP = new Map([
  ['frangoinvertido', 'Frango'],
  ['duquesa', 'Duqueza'],
  ['duqueza', 'Duqueza'],
  ['pizzamucarela30cm', 'Mussarela'],
  ['mucarela', 'Mussarela'],
  ['mussarela', 'Mussarela'],
  ['chocolatecconfete', 'Confete'],
  ['confetecomchocolate', 'Confete'],
  ['confetechocolatepreto', 'Confete'],
  ['chocolatecomconfete', 'Confete'],
  ['confetecomchocolatebranco', 'Confete'],
  ['chocolatepreto', 'Confete'],
  ['prestigio', 'Confete'],
  ['confete', 'Confete'],
  ['banananevada', 'Banana Nevada'],
  ['bananacomcanela', 'Banana Canela'],
  ['bananacanela', 'Banana Canela'],
]);

const CANONICAL_NORM = new Map([...SALGADOS, ...DOCES].map(name => [normalize(name), name]));

const DRINK_RE = /pepsi|guaran|coca|refri|suco|\bagua\b|água|h2o|schin|itubaina|fanta|sprite|del valle|kuat|antartica|antártica|\bmate\b/i;
const NOISE_RE = /n[ãa]o quero|kit ketchup|kit maionese|sache de|talher|guardanapo|borda|catupiry|brigadeiro|\btradicional\b/i;

function classifyChoice(rawText) {
  const text = (rawText || '').trim();
  if (DRINK_RE.test(text)) return { kind: 'drink' };
  if (NOISE_RE.test(text)) return { kind: 'noise' };

  const norm = normalize(text);
  const canonical = CANONICAL_NORM.get(norm) || ALIAS_MAP.get(norm);

  if (canonical && DOCES.includes(canonical)) return { kind: 'doce', fichaTecnica: canonical };
  if (canonical && SALGADOS.includes(canonical)) return { kind: 'salgado', fichaTecnica: canonical };
  return { kind: 'salgado', fichaTecnica: FALLBACK_SALGADO, isFallback: true };
}

// composição oficial: quantos sabores salgados (30cm) e doces (broto 20cm)
const COMBO_COMPOSITION = {
  'dupla manet': { salgada: 1, doce: 0 },
  'trio manet': { salgada: 1, doce: 1 },
  'dobro manet': { salgada: 2, doce: 1 },
  'combo galera': { salgada: 4, doce: 1 },
};
const AVULSA_COMPOSITION = { salgada: 1, doce: 0 };
const AVULSA_NAME_RE = /^pizza\b|^broto\s*20\s*cm/i;

function matchCombo(descSaleItem) {
  const lower = (descSaleItem || '').toLowerCase();
  return Object.keys(COMBO_COMPOSITION).find(t => lower.includes(t)) || null;
}

function processItem(item) {
  const descSaleItem = item.desc_sale_item || '';
  const comboType = matchCombo(descSaleItem);
  const isAvulsa = !comboType && AVULSA_NAME_RE.test(descSaleItem.trim());
  if (!comboType && !isAvulsa) return null;

  const choices = item.choices || [];
  const salgadoRaw = [];
  const doceRaw = [];
  const seenSalgado = new Set();
  const seenDoce = new Set();

  for (const c of choices) {
    const text = (c.desc_sale_item_choice || '').trim();
    const result = classifyChoice(text);
    if (result.kind === 'drink' || result.kind === 'noise') continue;

    const key = normalize(text);
    if (result.kind === 'doce') {
      if (seenDoce.has(key)) continue;
      seenDoce.add(key);
      doceRaw.push({ fichaTecnica: result.fichaTecnica, raw: text });
    } else {
      if (seenSalgado.has(key)) continue;
      seenSalgado.add(key);
      salgadoRaw.push({ fichaTecnica: result.fichaTecnica, fallback: result.isFallback || undefined, raw: text });
    }
  }

  if (isAvulsa && salgadoRaw.length === 0 && doceRaw.length === 0) {
    const result = classifyChoice(descSaleItem);
    if (result.kind === 'doce') doceRaw.push({ fichaTecnica: result.fichaTecnica, raw: descSaleItem });
    else salgadoRaw.push({ fichaTecnica: result.fichaTecnica, fallback: result.isFallback || undefined, raw: descSaleItem });
  }

  const expected = comboType ? COMBO_COMPOSITION[comboType] : AVULSA_COMPOSITION;

  const pizzas30cm = salgadoRaw.slice(0, expected.salgada);
  const brotos20cm = doceRaw.slice(0, expected.doce);

  while (pizzas30cm.length < expected.salgada) {
    pizzas30cm.push({ fichaTecnica: 'Mussarela', implicita: true });
  }

  return { comboType, isAvulsa, descSaleItem, pizzas30cm, brotos20cm };
}

/**
 * @returns {{ mussarelaGramas: number, mussarelaKg: number, refrigerantes: number,
 *   totalSalgadas: number, totalBrotos: number, totalPizzas: number,
 *   totalCombos: number, porFicha: Record<string, number>,
 *   calabresaGramas: number, calabresaKg: number,
 *   catupiryGramas: number, catupiryKg: number,
 *   frangoGramas: number, frangoKg: number,
 *   presuntoGramas: number, presuntoKg: number,
 *   caixa30cm: number, caixa20cm: number, caixaTotal: number }}
 */
function computeConsumoTeorico(salesItemsResponse) {
  const porFicha = {};
  let totalSalgadas = 0;
  let totalBrotos = 0;
  let totalCombos = 0;
  let mussarelaGramas = 0;
  let calabresaGramas = 0;
  let catupiryGramas = 0;
  let frangoGramas = 0;
  let presuntoGramas = 0;

  for (const sale of salesItemsResponse) {
    if (!sale.items) continue;
    for (const item of sale.items) {
      const processed = processItem(item);
      if (!processed) continue;
      if (processed.comboType) totalCombos += 1; // 1 refrigerante fixo por combo

      processed.pizzas30cm.forEach(p => {
        totalSalgadas += 1;
        porFicha[p.fichaTecnica] = (porFicha[p.fichaTecnica] || 0) + 1;
        mussarelaGramas += MUSSARELA_GRAMAS[p.fichaTecnica] ?? 0;
        calabresaGramas += CALABRESA_GRAMAS[p.fichaTecnica] ?? 0;
        catupiryGramas += CATUPIRY_GRAMAS[p.fichaTecnica] ?? 0;
        frangoGramas += FRANGO_GRAMAS[p.fichaTecnica] ?? 0;
        presuntoGramas += PRESUNTO_GRAMAS[p.fichaTecnica] ?? 0;
      });

      totalBrotos += processed.brotos20cm.length;
    }
  }

  return {
    mussarelaGramas,
    mussarelaKg: mussarelaGramas / 1000,
    calabresaGramas,
    calabresaKg: calabresaGramas / 1000,
    catupiryGramas,
    catupiryKg: catupiryGramas / 1000,
    frangoGramas,
    frangoKg: frangoGramas / 1000,
    presuntoGramas,
    presuntoKg: presuntoGramas / 1000,
    refrigerantes: totalCombos,
    totalSalgadas,
    totalBrotos,
    totalPizzas: totalSalgadas + totalBrotos,
    totalCombos,
    caixa30cm: totalSalgadas,
    caixa20cm: totalBrotos,
    caixaTotal: totalSalgadas + totalBrotos,
    porFicha,
  };
}

export { computeConsumoTeorico, MUSSARELA_GRAMAS, CALABRESA_GRAMAS, CATUPIRY_GRAMAS, FRANGO_GRAMAS, PRESUNTO_GRAMAS };

/**
 * Synonym map for food search.
 * Key   = canonical search term (sent to the DB query)
 * Value = list of popular names users might type
 *
 * When a user's search term matches one of the Value entries, the
 * corresponding Key is injected as an additional search term so the
 * SQL query finds the canonical TACO name even when the user typed
 * the colloquial name.
 *
 * Rules:
 *   - All strings must be lowercase, accent-free (unaccented) equivalents
 *     are handled at query time via unaccent(), so you CAN use accents here.
 *   - Prefer the first significant word of the TACO canonical name as the Key
 *     (e.g. "frango" for all frango entries, "queijo" for cheese variants).
 *   - A single popular alias can appear in multiple entries if it maps to
 *     multiple canonical names (e.g. "proteína" → whey and albumina).
 */

// popular alias → canonical keyword(s) to inject into the search
export const FOOD_SYNONYMS: Record<string, string[]> = {
  // ── Frango ──────────────────────────────────────────────────────────────────
  'filé de frango':   ['frango peito'],
  'file de frango':   ['frango peito'],
  'peito de frango':  ['frango peito'],
  'frango grelhado':  ['frango peito'],
  'frango cozido':    ['frango peito'],
  'frango assado':    ['frango peito'],
  'frango frito':     ['frango peito'],
  'sobrecoxa':        ['frango coxa'],
  'coxinha da asa':   ['frango asa'],
  'asa de frango':    ['frango asa'],

  // ── Carne bovina ────────────────────────────────────────────────────────────
  'carne vermelha':   ['carne bovina'],
  'bife':             ['carne bovina'],
  'filé mignon':      ['carne bovina file mignon'],
  'file mignon':      ['carne bovina file mignon'],
  'contrafilé':       ['carne bovina contrafile'],
  'contrafile':       ['carne bovina contrafile'],
  'costela bovina':   ['carne bovina costela'],
  'coxão mole':       ['carne bovina coxao mole'],
  'coxão duro':       ['carne bovina coxao duro'],
  'carne moída':      ['carne bovina moida'],
  'carne moida':      ['carne bovina moida'],

  // ── Peixe / frutos do mar ────────────────────────────────────────────────────
  'salmão':           ['salmon', 'truta'],   // salmão não existe no TACO; truta é o mais próximo
  'salmon':           ['truta'],
  'atum lata':        ['atum'],
  'sardinha lata':    ['sardinha'],
  'bacalhau':         ['bacalhau'],
  'tilápia':          ['tilapia'],
  'camarão':          ['camarao'],
  'camarao':          ['camarao'],

  // ── Laticínios ──────────────────────────────────────────────────────────────
  'mussarela':        ['mozarela'],
  'muçarela':         ['mozarela'],
  'mucarela':         ['mozarela'],
  'muçarella':        ['mozarela'],
  'mussarella':       ['mozarela'],
  'mozarella':        ['mozarela'],
  'parmesão':         ['parmesao', 'queijo parmesao'],
  'parmesao':         ['queijo parmesao'],
  'queijo prato':     ['queijo prato'],
  'requeijão':        ['requeijao'],
  'requeijao':        ['requeijao'],
  'cream cheese':     ['creme de ricota', 'requeijao'],
  'queijo cottage':   ['cottage'],
  'iogurte grego':    ['iogurte'],   // iogurte grego ausente do TACO; iogurte integral é proxy
  'whey':             ['proteina de soro'],
  'whey protein':     ['proteina de soro'],
  'albumina':         ['clara de ovo'],
  'leite desnatado':  ['leite vaca desnatado'],
  'leite integral':   ['leite vaca integral'],
  'leite semi':       ['leite vaca semi'],

  // ── Ovos ────────────────────────────────────────────────────────────────────
  'ovo de galinha':   ['ovo galinha'],
  'clara':            ['ovo galinha clara'],
  'gema':             ['ovo galinha gema'],
  'ovo cozido':       ['ovo galinha cozido'],
  'ovo mexido':       ['ovo galinha mexido'],
  'ovo frito':        ['ovo galinha frito'],

  // ── Grãos / leguminosas ──────────────────────────────────────────────────────
  'feijão carioca':   ['feijao carioca'],
  'feijao carioca':   ['feijao carioca'],
  'feijão preto':     ['feijao preto'],
  'feijao preto':     ['feijao preto'],
  'feijão':           ['feijao'],
  'feijao':           ['feijao'],
  'grão de bico':     ['grao de bico'],
  'grao de bico':     ['grao de bico'],
  'lentilha':         ['lentilha'],
  'ervilha':          ['ervilha'],

  // ── Cereais / carboidratos ───────────────────────────────────────────────────
  'arroz branco':     ['arroz polido'],
  'arroz integral':   ['arroz integral'],
  'macarrão':         ['macarrao', 'espaguete', 'massa'],
  'macarrao':         ['macarrao'],
  'espaguete':        ['macarrao espaguete'],
  'pão francês':      ['pao frances'],
  'pao frances':      ['pao frances'],
  'pão de forma':     ['pao de forma'],
  'pao de forma':     ['pao de forma'],
  'tapioca':          ['tapioca'],
  'batata doce':      ['batata doce'],
  'batata inglesa':   ['batata inglesa'],
  'inhame':           ['inhame'],
  'mandioca':         ['mandioca', 'macaxeira', 'aipim'],
  'macaxeira':        ['mandioca'],
  'aipim':            ['mandioca'],

  // ── Oleaginosas ──────────────────────────────────────────────────────────────
  'amendoim':         ['amendoim'],
  'pasta de amendoim':['pasta amendoim', 'manteiga amendoim'],
  'castanha do pará': ['castanha do para'],
  'castanha do para': ['castanha do para'],
  'castanha de caju': ['castanha caju'],
  'amêndoa':          ['amendoa'],
  'amendoa':          ['amendoa'],
  'nozes':            ['noz'],
  'azeite':           ['azeite de oliva', 'oleo oliva'],
  'azeite de oliva':  ['azeite de oliva'],

  // ── Frutas ───────────────────────────────────────────────────────────────────
  'banana prata':     ['banana prata'],
  'banana nanica':    ['banana nanica'],
  'maçã':             ['maca'],
  'maca':             ['maca'],
  'abacate':          ['abacate'],
  'morango':          ['morango'],
  'uva':              ['uva'],
  'mamão':            ['mamao'],
  'mamao':            ['mamao'],
  'melancia':         ['melancia'],

  // ── Verduras / legumes ───────────────────────────────────────────────────────
  'alface':           ['alface'],
  'rúcula':           ['rucula'],
  'rucula':           ['rucula'],
  'espinafre':        ['espinafre'],
  'brócolis':         ['brocolis'],
  'brocolis':         ['brocolis'],
  'couve-flor':       ['couve flor'],
  'cenoura':          ['cenoura'],
  'beterraba':        ['beterraba'],
  'abobrinha':        ['abobrinha'],
  'chuchu':           ['chuchu'],
  'tomate':           ['tomate'],
  'pepino':           ['pepino'],
};

/**
 * Given a raw search term, returns an expanded list of terms to query.
 * The original term is always included; any synonym matches add their
 * canonical keywords on top.
 */
export function expandSearchTerms(input: string): string[] {
  const normalized = input.trim().toLowerCase();
  const extras = FOOD_SYNONYMS[normalized];
  if (!extras || extras.length === 0) return [input.trim()];
  // Return original + canonical keywords deduplicated
  const all = [input.trim(), ...extras];
  return [...new Set(all)];
}

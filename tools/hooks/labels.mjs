// The checks read English labels ("Finished", "Root cause:", "Security review: PASS"); an answer in the user's language
// meets them with its own: each label line is copied in English, for the checks only. Moved from hooks.mjs (plan: engine
// v2 only, step 1b) so both engines read answers the same way. A base module like settings.mjs, outside v2/.
import { config } from './settings.mjs';

// ---------- answers in the user's language ----------
// The checks look for English labels ("Root cause:", "Finished", "Learned (rule):"). An answer in another language
// meets them with its own labels: each line that has one is added again with the English label, for the checks only.
// Spanish is built in; "labelAliases" in config.json adds others ({"<regex>": "<English label>"}).
// Lesson: a Spanish-speaking user got answers full of English labels, because only English ones passed the checks.
// Every label a check reads in the answer has its Spanish form here (selfcheck tests each one), in order: phrases before
// the words inside them ("copia de seguridad" before "seguridad"). Lesson: a Spanish user's answers still carried
// "Assumed:", "Accessibility: PASS", "Visual review: PASS after 1 rounds" and an English security line, because only
// some labels had a Spanish form and the hints quoted the English ones.
export const LABELS_ES = [
  [/^(\s*(?:#{1,6}\s*|\*\*)?)(hecho|listo)(\**)\s*$/gim, '$1Finished$3'],
  [/\b(terminado|finalizado|resumen final)\b/gi, 'Finished'], [/\bcausa (ra[ií]z|de fondo)\b/gi, 'Root cause'],
  [/\brevisi[oó]n visual\b/gi, 'Visual review'], [/(visual review\**\s*:\s*\**)(?:(?:est[aá]|qued[oó]|sali[oó]|es)\s+)?(correct[ao]|aprobad[ao]|pasa|superad[ao]|sin problemas|bien|ok)\b/gi, '$1PASS'],
  // ("está bien", "quedó correcta"; the first time is one round. Lesson, trial round 9: "está bien después de 2 rondas"
  // and "correcta a la primera" were refused and rewritten into the template's words)
  [/\b(a la primera|al primer intento|en el primer intento|en la primera (ronda|vuelta))(?![\wáéíóúñ])/gi, 'after 1 round'], [/\b(despu[eé]s de|tras)\s+(\d+)\s+(rondas?|vueltas?)\b/gi, 'after $2 rounds'],
  [/(visual review\**\s*:\s*\**)(detenid[ao]|parad[ao]|interrumpid[ao])\b/gi, '$1STOPPED'], [/\b(rondas?|vueltas?)\b/gi, 'rounds'],
  [/\baccesibilidad\b/gi, 'Accessibility'], [/(accessibility\**\s*:[^\n]*?)\b(correct[ao]|aprobad[ao]|pasa|bien)\b/gi, '$1pass'],
  [/\bcontraste\b/gi, 'contrast'], [/\bteclado\b/gi, 'keyboard'], [/\bfoco\b/gi, 'focus'], [/\betiquetas?\b/gi, 'labels'], [/\blector(es)? de pantalla\b/gi, 'screen reader'],
  [/\brevisi[oó]n de seguridad\b/gi, 'Security review'], [/(security review\**\s*:\s*\**)(pasa|correct[ao]|aprobad[ao]|sin fallos|todo bien|ok)\b/gi, '$1PASS'],
  // (the plain sentence too: "La revisión de seguridad salió bien", "... encontró un problema y lo corregí". Lesson: only
  // the "Security review: PASS" marker passed, so plain sentences were rewritten into stiff status lines)
  [/(security review\W{0,6})(sali[oó] bien|pas[oó]|super[oó]|aprobad[ao]|sin (problemas|fallos)|no encontr[oó] (nada|problemas|fallos)|todo bien)(?![\wáéíóúñ])/gi, '$1PASS'],
  [/(security review[^\n]*?)\bencontr[oó](?![\wáéíóúñ])/gi, '$1found'], [/(security review[^\n]*?)\b(correg[ií]\w*|arregl[eéoó]\w*)/gi, '$1fixed'],
  [/(\d+)\s+[aá]reas\b/gi, '$1 areas'], [/\|\s*(PASA|CORRECTO|APROBADO)\s*(?=\|)/g, '| PASS '], [/\|\s*NO APLICA\s*(?=\|)/g, '| N/A '],
  [/\bfall[ao]\s*(->|→)\s*(corregid[ao]|arreglad[ao])\b/gi, 'FAIL -> fixed'], [/\bfall[ao]\s*(->|→)\s*(abiert[ao]|pendiente)\b/gi, 'FAIL -> open'], [/\|\s*FALL[AO]\b/g, '| FAIL'],
  [/\b(copias? de seguridad|respaldo)\b/gi, 'backup'], [/\brestaur\w*/gi, 'restore'],
  [/\bseguridad\b/gi, 'security'], [/\b(presupuestos?|l[ií]mites? de (rendimiento|velocidad|tama[nñ]o|peso))\b/gi, 'budget'], [/\b(rendimiento|velocidad|rapidez)\b/gi, 'performance'],
  [/\b(usabilidad|facilidad de uso|f[aá]cil de usar|sencill[oa] de usar|amigable)(?![\wáéíóúñ])/gi, 'usability'],
  [/^(\s*[-*]?\s*(?:\*\*)?)(supuesto|asumido|asum[ií]|decid[ií])(\**)\s*:/gim, '$1Assumed$3:'],
  [/\b(evaluad[oa]|examinad[oa]|investigad[oa])\s*:/gi, 'Vetted:'], [/\blicencia\b/gi, 'license'],
  [/\bhabilidades( existentes)? (revisadas|buscadas|comprobadas)\s*:/gi, 'Existing skills checked:'],
  [/\b(gu[ií]a|procedimiento)\s*:/gi, 'Playbook:'], [/\bhabilidad\s*:/gi, 'Skill:'], [/\b(vale|merece) la pena\s*:/gi, 'Worth it:'], [/\b(vale|merece) la pena\b/gi, 'worth it'], [/\b(cost[eo]s?|cuestan?)(?![\wáéíóúñ])/gi, 'cost'],
  [/^(\s*\**)fuentes(\**\s*:?\s*\**)\s*$/gim, '$1Sources$2'], [/\bnada registrado\b/gi, 'nothing recorded'], [/\bno est[aá] (registrado )?en el proyecto\b/gi, 'not in the project'],
  [/\bfuentes?\b/gi, 'source'], [/\bvoz de (la )?marca\b/gi, 'brand voice'],
  [/\b(\d+)\s+(afirmaciones|datos|hechos)\b/gi, '$1 claims'], [/\b(busqu[eé]|buscado)\s*:/gi, 'searched:'], [/(searched:[^\n]*?)\b(nada|ning[uú]n resultado)\b/gi, '$1nothing'],
  [/\bconsulta r[aá]pida\s*:/gi, 'quick lookup:'],
  [/\bc[oó]mo se (calcul[oó]|calcularon|ha calculado|obtuvo|obtuvieron)\s*:/gi, 'How it was computed:'], [/\((calculado|c[aá]lculo)\s*:/gi, '(calculated:'],
  [/\bno (es|constituye) (un )?(asesoramiento|asesor[ií]a|consejo) (legal|jur[ií]dic[oa])\b/gi, 'not legal advice'],
  [/\b(revertir|reversi[oó]n|marcha atr[aá]s|volver atr[aá]s|deshacer)\b/gi, 'rollback'],
  [/\batribuci[oó]n\b/gi, 'attribution'], [/(attribution[^\n]*?)\b(limpi[ao]|ninguna|pasa)\b/gi, '$1clean'],
  [/\b(lo )?que se (escap[oó]|col[oó])(?![\wáéíóúñ])/gi, 'what slipped'], [/\bcambio de proceso\b/gi, 'process change'],
  [/\b(nueva comprobaci[oó]n|nuevo control|nuevo chequeo)\b/gi, 'new check'], [/\breforzad[oa]s?\b/gi, 'hardened'], [/\bhallazgos?\b/gi, 'findings'],
  [/\bantes\s*\/\s*despu[eé]s\b/gi, 'Before/after'], [/\bantes\b/gi, 'before'], [/\bdespu[eé]s\b/gi, 'after'],
  [/\b(direcci[oó]n|plan) de dise[nñ]o\b/gi, 'design direction'],
  [/\bconfianza\W{0,4}alta\b/gi, 'confidence: high'], [/\bconfianza\W{0,4}media\b/gi, 'confidence: medium'], [/\bconfianza\W{0,4}baja\b/gi, 'confidence: low'],
  [/\baprend(ido|iste|imos)\s*:/gi, 'learned:'], [/\b(\d+) de (\d+)\b/g, '$1 of $2'], [/\bdecisi[oó]n que (informa|apoya)\b/gi, 'decision it informs'],
  [/^([ \t>*_-]*)continuidad([*_]*\s*:)/gim, '$1Continuity$2'], [/\b(combinad[oa]s?|en conjunto|juntos|fusionad[oa]s?)\b/gi, 'combined'],
  [/\b(todas las (pruebas|comprobaciones)|(pruebas|comprobaciones) completas|suite completa)\b/gi, 'full checks'],
  [/\b(lo que )?(pediste|pedido|petici[oó]n)\s*:/gi, 'Asked for:'], [/\blecci[oó]n (de la habilidad|del skill|para la habilidad)\s*:\s*ninguna\b/gi, 'skill lesson: none'],
  [/\b(desactualizad[oa]s?|a fecha de)\b/gi, 'as of'], [/\b(avisos?|advertencias?)\b([^\n]*)\baceptad[oa]s?\b/gi, 'warnings$2accepted'],
  [/\bya (estaba|est[aá]) (ah[ií]|hech[oa]|puest[oa])(?![\wáéíóúñ])/gi, 'already there'], [/\b(sin cambios|ning[uú]n cambio|nada cambi[oó])(?![\wáéíóúñ])/gi, 'no changes'],
  [/\b(aprendido|aprend[ií]|lecci[oó]n aprendida)\s*\(/gi, 'Learned ('], [/\bpregunta para (ti|usted)\b/gi, 'Question for you'],
  [/\bqu[eé] cambi[oó](?![\wáéíóúñ])|\blo que cambi[oó](?![\wáéíóúñ])/gi, 'what changed'],
  [/\bmismo resultado\b/gi, 'same result'], [/\btienes? raz[oó]n\b/gi, "you're right"], [/\ben parte\s*[:,]/gi, 'Partly:'],
  // ("no verificado" before "verificado", or it read "no verified". Lesson: a Spanish "NO VERIFICADO" never counted.)
  [/\beso no (es|fue) lo que pas[oó](?![\wáéíóúñ])/gi, "that isn't what happened"], [/\b(la )?queja no (se sostiene|es cierta|se confirma)(?![\wáéíóúñ])/gi, "the complaint doesn't hold"], [/\bno verificad[oa]s?\b|\bsin verificar\b/gi, 'NOT VERIFIED'], [/\bverificad[oa]s?\b/gi, 'verified'],
  [/\bpasa(n|ron)? (las|los) pruebas\b|\blas pruebas pasa(n|ron)\b/gi, 'tests pass'],
  [/\((regla)\)/gi, '(rule)'], [/\((comprobaci[oó]n|chequeo|control)\)/gi, '(check)'], [/\((lecci[oó]n)\)/gi, '(lesson)'],
  [/\((habilidad)\)/gi, '(skill)'], [/\((motor)\)/gi, '(engine)'], [/\((puntual)\)/gi, '(one-off)'],
  // the reviewer's verdict, a "Checked:" line before agreeing, and the promise that a miss can't come back, in Spanish.
  // Lesson: Spanish answers said "veredicto final SHIP", because only the English verdict met the review check.
  [/\b(veredicto( final)?\W{0,4})?list[oa]s? para (publicar|entregar|salir|lanzar)\b|\bveredicto( final)?\W{0,4}(list[oa]|aprobad[oa])\b/gi, 'verdict: SHIP'],
  [/\bveredicto( final)?\W{0,4}(corregir|hay que corregir|a corregir)\b/gi, 'verdict: FIX'],
  [/^([\s>*_-]*)(comprobado|revis[eé])(\**\s*:)/gim, '$1Checked$3'],
  [/\bno (vuelva|volver[aá]) a (pasar|ocurrir|suceder)\b|\bno se (repita|repetir[aá])\b/gi, "won't happen again"],
];
// REQ: worth-it. The weighing of an addition: the marker, or a plain sentence that names the gain and the cost.
export const WORTH_IT = /\bworth it\s*:\s*\S[^\n]*\/|\bworth (it|adding|having|the cost)\b[^\n]{0,200}\b(cost|costs|price|downside|trade-?off)\b|\b(cost|costs|downside)\b[^\n]{0,200}\bworth (it|adding|having)\b/i;
// A label line as the checks read it: without Markdown emphasis around the label ("**Label:**", "**Label**:",
// "*Label:*", "__Label:__") and without the list marker or quote in front of it ("- **Label:** ..."), so every check
// that reads a label meets it however the answer formats it. Only a line whose start is a short label followed by a
// colon is touched: "- Finished the import" stays a list item.
// Lesson: "**Revisión visual:** correcta tras 5 rondas" was blocked four times although the line was there, and the
// agent moved it out of its bullet list to get past the check.
const EM = String.raw`(?:\*\*|__|\*|_)`;
const LABEL_LINE = new RegExp(String.raw`^(\s*)(?:>\s*)*(?:(?:[-+•]|\*(?=\s)|\d{1,2}[.)])\s+)?(${EM})?([^\s*_:|\x60#][^\n:*_|\x60]{0,59}?)\s*(?:\2\s*:|:\s*\2)(?=[\s*_]|$)(?:\s*${EM}(?=\s|$))?\s*`);
export function plainLabel(line) {
  const m = LABEL_LINE.exec(line);
  if (!m || !(m[2] || /^\s*(?:>\s*)*(?:[-+•*]|\d{1,2}[.)])\s/.test(line))) return line;
  return `${m[1]}${m[3].trim()}: ${line.slice(m[0].length)}`.replace(/\s+$/, '');
}
// The English copies of the label lines follow the answer after this line, so a check that reads where the answer
// itself ends (a closing question) can cut them off.
export const EN_COPIES = '\n<!-- labels as the checks read them -->\n';
export function inEnglish(text, cfg = config()) {
  const own = Object.entries(cfg.labelAliases || {}).map(([k, v]) => { try { return [new RegExp(k, 'gi'), v]; } catch { return null; } }).filter(Boolean);
  const lines = String(text).split('\n'), all = [...LABELS_ES, ...own];
  const mapped = lines.map(l => all.reduce((s, [r, v]) => s.replace(r, v), plainLabel(l)));
  // a "Fuentes:" heading is read with the numbered list under it, so the list comes along with its English copy
  const extra = [];
  // (a copy carries no citation markers: placed after the Sources list, "[1]" there would have no source line after it.
  // Lesson, trial rounds 13 to 15: a "**Done:** ... [1]" line's copy failed research-cited on a correctly cited answer)
  mapped.forEach((l, i) => {
    if (l === lines[i]) return;
    extra.push(/^\s*\**(sources|fuentes):?\**\s*$/i.test(l) ? l : l.replace(/\s*\[\d+\]/g, ''));
    if (/^\s*\**sources:?\**\s*$/i.test(l)) for (let j = i + 1; j < lines.length && /^\s*[-*]?\s*\[\d+\]/.test(lines[j]); j++) extra.push(lines[j]);
  });
  return extra.length ? `${text}${EN_COPIES}${extra.join('\n')}` : String(text);
}

// The closest runbook to a request by shared content words, and the patterns that tell a request's kind (an opinion asked,
// a question led by a question word, a Spanish task). Shared by both engines; moved here from hooks.mjs unchanged.
// closestRunbook(prompt, books, coreRunbook): books are [{ name, file, fm: { summary }, triggers }].

// The runbooks every project has, for any kind of work: not a project's own subject.
export const coreRunbook = n => String(n).startsWith('_') || /^(project|feature|bugfix|deliverable|qa|plan)$/.test(n);
// A request that asks for work, as the old engine tells it: a task verb (English or Spanish), 3 words or more, not an
// opinion asked, not a one-sentence question led by a question word. (relayed: the caller's own relay test)
export const isTaskRequest = (p, taskVerbs, relayed = false) => {
  const t = String(p || '').trim(), wh = QUESTION_LED.test(t) && /[?？]\s*$/.test(t) && !/[.!:;]\s+\S/.test(t);
  return (taskVerbs.test(t) || TASK_ES.test(fold(t))) && t.split(/\s+/).length >= 3 && !OPINION.test(t) && !relayed && !wh;
};

// The runbook whose name, summary and triggers share the most content words with a request (word stems of 5 letters,
// so "invoices" meets "invoice" and "boxes" meets "boxed"), when at least two are shared. Generic runbooks are left out.
export const STOP_STEMS = new Set('about after again their there these those which while where would could should thing pleas thank with make have from this that want need help into more some just like what when your mine also very much'.split(' ').map(w => w.slice(0, 5)));
// Text without its accents: "añade" is "anade", "línea" is "linea".
export const fold = s => String(s).normalize('NFD').replace(/\p{M}/gu, '');
// Common Spanish words of a request, in English, so a Spanish request finds an English runbook by its words too.
// Lesson: a Spanish request found nothing, while the same request in English found the closest runbook.
export const ES_EN = { mejor: 'best', mejores: 'best', peor: 'worse', mejora: 'better', mejorar: 'improve', ruta: 'route', rutas: 'route',
  dia: 'day', dias: 'day', viaje: 'trip', viajes: 'trip',
  nota: 'note', notas: 'note', linea: 'line', archivo: 'file', archivos: 'file', informe: 'report', reporte: 'report', lista: 'list', precio: 'price',
  precios: 'price', presupuesto: 'budget', pantalla: 'screen', boton: 'button', pagina: 'page', datos: 'data', factura: 'invoice', facturas: 'invoice',
  cliente: 'customer', clientes: 'customer', correo: 'email', mensaje: 'message', prueba: 'test', pruebas: 'test', fallo: 'bug', regla: 'rule',
  reglas: 'rule', construye: 'build', construir: 'build', crea: 'create', crear: 'create', busca: 'search', buscar: 'search', compara: 'compare',
  comparar: 'compare', calidad: 'quality', colores: 'color', color: 'color', semana: 'week', comida: 'meal', comidas: 'meal', receta: 'recipe' };
export function closestRunbook(prompt, books, coreRunbook) {
  // (a plural "s" goes first: "invoices" was "invoices" and "invoice" was "invoice", so the two never met)
  const stems = (s, tr) => new Set((fold(String(s).toLowerCase()).match(/[a-z]{4,}/g) || []).map(w => tr && ES_EN[w] || w)
    .map(w => (w.length >= 5 ? w.replace(/s$/, '') : w).slice(0, 5)).filter(w => !STOP_STEMS.has(w)));
  const want = stems(prompt, true);
  const all = books.filter(pb => !coreRunbook(pb.name)).map(pb => ({ pb, named: stems(pb.name.replace(/-/g, ' ')), have: stems(`${pb.name.replace(/-/g, ' ')} ${pb.fm.summary || ''} ${(pb.triggers || []).join(' ')}`) }));
  // a word that many runbooks share says less than one only this runbook has ("order" in every order runbook), and a word
  // of the runbook's own name says the most. Lesson: a question tied between a build runbook and a guide
  // runbook on "best" and "order", and the first one by name won.
  const df = w => all.filter(a => a.have.has(w)).length || 1;
  let best = null;
  for (const { pb, named, have } of all) {
    const words = [...want].filter(w => have.has(w));
    const score = words.reduce((a, w) => a + (named.has(w) ? 2 : 1) / df(w), 0);
    if (words.length >= 2 && (!best || score > best.score)) best = { file: pb.file, words, score };
  }
  return best && { file: best.file, words: best.words };
}
// Questions that ask for the agent's own view, or talk about the conversation itself, are not a runbook's task.
// Lesson: "do you think ..." and "based on what we have" routed to research and demanded sources for an opinion.
export const OPINION = /\b(do|did|would|will) you (think|reckon|believe|feel|agree|prefer|suggest|recommend)\b|\bwhat do you (think|reckon|make of|suggest|recommend)\b|\bin your (opinion|view)\b|\byour (honest )?(opinion|view|take|thoughts)\b|\bhow do you feel\b|\bbased on what (we|you|i) (have|know|discussed|did|said)\b/i;
export const QUESTION_LED = /^(how|what|what's|whats|where|which|who|why|when|qu[eé]|cu[aá]l(es)?|c[oó]mo|d[oó]nde|qui[eé]n(es)?|por qu[eé]|cu[aá]ndo)(?![\wáéíóúñ])/i;
// Spanish task verbs, matched without accents: the command ("añade"), the infinitive ("¿puedes añadir ...?") and the
// "quiero que añadas" form, each with an attached pronoun ("añádelo", "hazme"). A request in Spanish is work too.
// Lesson: only the command form counted, so "¿puedes añadir una línea ...?" was no request at all.
// (forms that are also English words, "prepares", "compares", "revises", are left out)
export const TASK_ES = /\b(depura|depurar|depures|haz|hacer|hagas|pon|poner|pongas|crea|crear|construye|construir|construyas|escribe|escribir|escribas|redacta|redactar|redactes|anade|anadir|anadas|agrega|agregar|agregues|actualiza|actualizar|actualices|arregla|arreglar|arregles|corrige|corregir|corrijas|investiga|investigar|investigues|busca|buscar|busques|planifica|planificar|compara|comparar|organiza|organizar|organices|configura|configurar|analiza|analizar|analices|resume|resumir|resumas|revisa|revisar|genera|generar|generes|convierte|convertir|conviertas|cambia|cambiar|cambies|edita|editar|edites|reescribe|reescribir|elimina|eliminar|elimines|borra|borrar|borres|mueve|mover|muevas|importa|importar|prepara|preparar|calcula|calcular|calcules|disena|disenar|traduce|traducir|traduzcas|limpia|limpiar|limpies|ordena|ordenar|prueba|probar|pruebes|documenta|documentar|renombra|renombrar|instala|instalar|instales|publica|publicar|publiques|mejora|mejorar|quita|quitar|quites|modifica|modificar|modifiques|anota|anotar|apunta|apuntar|guarda|guardar|registra|registrar)(me|te|lo|la|los|las|le|les|melo|mela|selo|sela)?\b/i;
export const isTaskEs = s => TASK_ES.test(fold(s || ''));

// ---------- what the user typed: not text they pasted, the hooks' own output, or a relayed message ----------
// A question with no request to make something does not route on a one-word trigger alone ("guide" in "no images in
// any guide???" is not a request to write one). Lesson: a frustrated question routed to deliverable.md.
export const MAKE_REQUEST = /\b(write|make|create|draft|build|prepare|produce|put together|turn [^.?!]{0,30} into|export|save|generate|compose|update|edit|fix|add)\b/i;
// Text the user pasted, and text that is the hooks' own output, are not the user's words: they never route or count as
// a request. Lesson: a pasted audit line ("... 26 sweeps") was taken as a request for 26 sweeps.
export const HOOK_MARK = /^\s*(-\s+)?(ROUTE|ALSO ROUTE|WEAK MATCH|CLOSEST RUNBOOK|ROUTINES DUE|FEEDBACK FROM PROJECTS|SKILL|NO RUNBOOK|RULE REQUEST|RECALL|MENU CODE|MENU FLAG|SCOPE|SETUP IN PROGRESS|BOOTSTRAP NEEDED|LAST WORK TURN|INBOX|STALE KNOWLEDGE|PRAISE|THE USER SOUNDS|SUSPENDED|FRICTION ON|UNKNOWN MENU|SKILL HARDENING|SKILL CLEANUP|UPGRADE REVIEW|OPEN PLANS|MUST FOLLOW|AUTONOMY|CHECKS|RELAYED|STATUS QUESTION|SHARED STEPS|PAUSE)\b/;
export const HOOK_LINE = /^\s*(\[rules\]|\[project hooks|audit:\s*(PASS|FAIL)|selfcheck:|ablation:|TRIAL:\s*(PASS|FAIL)|CLAIMS:\s*(PASS|FAIL)|(PASS|FAIL|WARN)\s+\d+\.\s)/i;
export const HOOK_BLOCK = /^\s*(stop hook\b|almost done:)/i;
// Messages from other sessions, sub-agents and the host are not the user's words, wherever they sit in a message: the
// whole block goes, not just its first line. Lesson: a relayed agent message counted as the user's words, so the
// engine files an upgrade wrote were flagged for copying them (REQ: no-verbatim-examples).
export const RELAYED = /<(cross-session-message|agent-message|system-reminder|task-notification)\b[^>]*>[\s\S]*?(<\/\1>|$(?![\s\S]))/gi;
export const relayedOut = s => String(s || '').replace(RELAYED, ' ');
export function userWords(prompt) {
  const out = [];
  let inBlock = false; // a pasted Stop message: its numbered steps run until "For the agent: ... Names: ..." or a blank line
  for (const l of relayedOut(String(prompt || '').replace(/<pasted_content\b[^>]*>[\s\S]*?<\/pasted_content(?:\s[^>]*)?>/gi, ' ').replace(/<pasted_content\b[^>]*\/>/gi, ' ')).split(/\r?\n/)) {
    if (/^\s*Another Claude session\b/i.test(l)) break; // a relayed message runs to the end: none of it is the user's
    if (HOOK_BLOCK.test(l)) { inBlock = true; continue; }
    if (inBlock) { if (!l.trim() || /^\s*for the agent:/i.test(l)) inBlock = false; continue; }
    if (!HOOK_MARK.test(l) && !HOOK_LINE.test(l)) out.push(l);
  }
  return out.join('\n');
}

// ---------- key words (moved from hooks.mjs, shared with engine v2) ----------
// (Spanish articles, prepositions and possessives too. Lesson: "una" and "sus" counted as key words, so a Spanish
// trigger needed them typed and a Spanish request matched on them)
export const STOP = new Set(['a', 'an', 'the', 'this', 'that', 'these', 'to', 'of', 'for', 'in', 'on', 'at', 'my', 'me', 'it', 'its', 'is', 'are', 'be', 'do', 'does', 'did', 'and', 'or', 'with', 'from', 'by', 'i', 'we', 'our', 'you', 'your',
  'un', 'una', 'unos', 'unas', 'el', 'la', 'los', 'las', 'de', 'del', 'al', 'en', 'y', 'o', 'que', 'mi', 'mis', 'tu', 'tus', 'su', 'sus', 'por', 'para', 'con', 'lo', 'le', 'se', 'es']);
// Plural and past forms meet their base word: notes and noted are note, boxes is box, created is create, added is add.
// Lesson: "-es" was cut from every word, so "notes" became "not", a common word, and "in my notes" could never route.
// A four-letter word loses only a plural "s" ("bugs" is bug, "keys" is key), never "-ed" or "-ing" ("need", "ring" stay).
// Lesson: words of four letters kept their "s", so "bugs", "keys", "logs" and "apps" never met their trigger.
export const stem = w => w.length <= 3 || /(ss|us|is)$/.test(w) ? w
  : w.length === 4 ? (/s$/.test(w) ? w.slice(0, -1) : w)
  : /ies$/.test(w) ? w.slice(0, -3) + 'y'
  : /(s|x|z|ch|sh)es$/.test(w) ? w.slice(0, -2)
  : /s$/.test(w) ? w.slice(0, -1)
  : /ing$/.test(w) ? w.slice(0, -3)
  : /ssed$/.test(w) ? w.slice(0, -2)
  : /([aiou]t|[vcsz]|[aeiou]g|[nr]g)ed$/.test(w) ? w.slice(0, -1)
  : /ed$/.test(w) ? w.slice(0, -2) : w;
// Accents are folded first ("añade" is "anade", "línea" is "linea"). Lesson: accented letters split Spanish words into
// fragments ("a", "ade", "l", "nea"), so a Spanish request could never meet a trigger by its key words.
export const keyWords = s => fold(String(s).toLowerCase()).split(/[^a-z0-9]+/).filter(w => w && !STOP.has(w)).map(stem);

// ---------- the user handing the work over (moved from hooks.mjs, shared with engine v2) ----------
// The user handing the work over: "without my input", "don't ask me", "keep going until it's finished", "go go go".
// ("don't ask me for the api key again" is about one thing, not the whole job. Lesson: "you decide", "I trust you",
// "no need to check with me" and "without stopping" were missed, and that one false alarm counted)
export const AUTONOMY_WORDS =/\byou decide\b|\bi trust you\b|\bno need to (ask|check with) me\b|\bwithout stopping\b|\bwithout (my|any) (input|approval|questions?|ok)\b|\bdon'?t (ask|bother) me\b(?!\s+(for|about)\b)|\bno (more )?questions\b|\bkeep going (until|till) (it'?s |you'?re |everything is )?(done|finished|complete)\b|\bgo,? go,? go\b|\bdon'?t stop (until|till|for)\b|\bdecide (everything|for me|yourself)\b|\bdon'?t want to be (bothered|asked|interrupted)\b|\b(handle|do|figure out) (it|this|everything|all of it|the rest) (yourself|on your own|without me)\b|\bwithout checking (in )?with me\b|\bi('?m| am) (going )?(away|offline|out)\b[^\n]{0,40}\b(keep|carry on|continue)\b|\bdo not (ask|bother) me\b(?!\s+(for|about)\b)|\b(not|won'?t be) (available|around) to (answer|reply|respond)\b|(?<![\p{L}])(decide (todo )?t[uú]|t[uú] decides|no me preguntes|sin preguntarme|no estoy disponible|no me molestes|sigue hasta (que )?(termines|acabes)|no pares hasta)(?![\p{L}])/iu;

// ---------- a long message's own words (moved from hooks.mjs, shared with engine v2) ----------
// A long message is mostly pasted material, a transcript or a log: its start and end hold the user's own words.
// Lesson (a field report): a pasted session transcript with two calm lines read as an upset user.
export const PASTE_LONG = 3000;
export const ownEnds = s => { const t = String(s || ''); return t.length > PASTE_LONG ? `${t.slice(0, 600)} ... ${t.slice(-600)}` : t; };

// ---------- examples of a wider point (moved from hooks.mjs, shared with engine v2) ----------
// REQ: scope-general. A request that names examples of a wider point ("or something else", "there might be other ones
// too"): the named items are cases of it, and the work covers every case. Lesson (a field report): over many turns the
// user named one or two items each time, with "there might be others", and each change fixed only the ones named.
export const EXAMPLE_CLASS = /\b(or (something|anything|whatever) else|(there )?(might|may|could) (even )?be (even )?(other|more) [a-z]+|(and )?others? like (it|this|that|these|those|them)|ones? like (it|this|that|these|those)|(any|every) other [a-z]+ like)\b/i;

// ---------- several tasks in one request (moved from hooks.mjs, shared with engine v2) ----------
// A request with several tasks: their shared steps (a read, a build, a test run, a helper) are done once. Lesson, the
// user: "even if the user says to do x and also x2 and x3 and x4 but then to do x1 it must do x3 so it does both again
// and is redundant. My worry is that it will take too long and waste tokens".
export const SHARED_HINT = "SHARED STEPS: this request has several tasks. Before starting, list each one's steps, merge the steps they share (a task another one already does, the same read, build, test run or helper), and do each once, in one order (plan skill, \"Shared steps once\"). Repeat a step only where the user asked for it.";
export function multiPart(p) {
  const t = String(p);
  const items = t.split(/\r?\n/).filter(l => /^\s*([-*\u2022]|\d+[.)])\s+\S/.test(l)).length;
  const joins = (t.match(/(?<!\p{L})(and also|also|and then|as well as|además|también|y luego)(?!\p{L})/giu) || []).length;
  return items >= 3 || joins >= 2;
}

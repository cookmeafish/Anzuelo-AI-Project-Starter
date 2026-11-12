// REQ: answer-traced, shared by both engines: "Did I make that up?". Every number in a factual answer, and every
// number written into the knowledge base, appears in something read this turn; every project file the answer cites was
// opened; a claim cited to a project file shares its key words with it. Moved here from hooks.mjs unchanged; the project's
// files come in through io, so engine v2 runs it with its own root.
// io: { read(abs), abs(rel), exists(rel), rel(p), esc(s), today(), knowledgeRe(cfg), textOf(content), noteDirs(cfg) }
export function makeTrace(io) {
  const { read, abs, exists, rel, esc, today, knowledgeRe, textOf, noteDirs } = io;
  // REQ: answer-traced (cited claims). A claim cited to a project file ("[1]" with "[1] characters.md", or "from
  // docs/knowledge/x.md") shares its key words with that file: at least half of the content words and numbers of each
  // part of the claim (an inference joined with "so", "therefore", ";" or ":" is a part of its own) appear in the file.
  // Otherwise the claim is the agent's own inference and says so ("my guess:", "inferido:"). Checked in the answer and in
  // the notes and drafts this turn wrote. Lesson: an outline cited characters.md for "a blind or weaker side is on the
  // left", where the file only said "scar over the left eye".
  const CITE_STOP = new Set(('the and for with that this from into over under after before about their there them they then than what when where which while were have has had been being would could should will shall must also only just more most some such each every other another very much many even still well here your yours ours mine his her its our not but any all both either neither nor because since until unless does did done make made like same able upon onto onto via per les las los una uno unos unas del con por para como pero sus esta este esto estos estas ese esa eso esos esas aquel que qui cual cuales cuando donde porque sobre entre hasta desde tiene tienen tenia era eran fue son ser estar está están muy más menos tambien también solo sólo cada otro otra otros otras todo toda todos todas nada algo alguien' +
    // (words about the file itself, not about what it says: "it links to your note", "the note says")
    ' note notes file files link links linked says said mentions mentioned lists listed page pages section line lines text shows shown written record records recorded knowledge base project folder source sources nota notas archivo enlace enlaces dice fuente fuentes').split(' '));
  const CITE_OWN = /\b(my (guess|inference|reading|suggestion)|inferred|(an )?inference|i assume|assumed)\b|(?<!\p{L})(inferid[oa]|mi suposici[oó]n|supongo|suposici[oó]n)(?!\p{L})/iu;
  const stemOf = w => w.length > 5 ? w.replace(/(ingly|ations?|ments?|ness|ings?|edly|iones|ción|mente|ers?|est|ies|ed|es|ly|s)$/, '') : w.replace(/s$/, '');
  // The files whose citations are judged: notes (the knowledge folders, docs/notes) and drafts in outputs/.
  const citedFile = (p, cfg) => /\.md$/i.test(p) && (/^(docs\/notes|outputs)\//i.test(p) || noteDirs(cfg || {}).some(d => p.toLowerCase().startsWith(d.toLowerCase() + '/')));
  function citedClaimGaps(texts, readFile = p => (exists(p) ? read(abs(p)) : '')) {
    const out = [];
    for (const { text, where } of texts) {
      const t = String(text || '');
      const refs = {};
      for (const m of t.matchAll(/^\s*\[(\d+)\]:?\s+(.+)$/gm)) {
        const p = (/`([^`]+\.\w{1,6})`|\]\(<?([^)>\s]+)>?\)|((?:[\w.-]+\/)*[\w. -]*[\w-]\.\w{1,6})/.exec(m[2]) || []).slice(1).find(Boolean);
        if (p && !/^https?:/i.test(p)) refs[m[1]] = p.replace(/\\/g, '/').replace(/^\.\//, '').trim();
      }
      const body = t.replace(/^\s*\[(\d+)\]:?\s+.+$/gm, '').replace(/^---\n[\s\S]*?\n---\n/, '');
      for (const s of body.split(/(?<=[.!?])\s+|\r?\n/)) {
        if (CITE_OWN.test(s)) continue;
        // a "[n]" marker (or a run of them, "[1][3]", read together) cites the text before it, back to the previous
        // marker or the start of the sentence
        const cites = [];
        let from = 0;
        for (const m of s.matchAll(/(?:\[\d+\][\s,]*)+/g)) {
          const fs_ = [...m[0].matchAll(/\[(\d+)\]/g)].map(n => refs[n[1]]).filter(Boolean);
          if (fs_.length) cites.push([fs_, s.slice(from, m.index)]);
          from = m.index + m[0].length;
        }
        // ("from <file>" names where a fact came from; "started from", "built from", "copied from" say where a file came from)
        for (const m of s.matchAll(/\b(?:from|according to|per|seg[uú]n|source:|fuente:)\s+`?((?:[\w.-]+\/)*[\w.-]+\.(?:md|txt|csv|json))`?/gi))
          if (!/\b(start|began|built|made|copied|taken|moved|imported|loaded|generated|created|pulled|came|comes|read|merged|split)\w*\b[^.]{0,40}$/i.test(s.slice(0, m.index))) cites.push([[m[1]], s]);
        const seen = new Set();
        for (const [fl, text] of cites) {
          // (a data file holds figures a script computes from, not sentences: its words say nothing about a claim)
          const files = fl.filter(f => /\.(md|markdown|txt)$/i.test(f)), f = files.join(' + ');
          if (!files.length || seen.has(f + text)) continue; seen.add(f + text);
          const src = files.map(readFile).join('\n').toLowerCase();
          if (!src.trim()) continue;
          // (code spans go first, whole: "from `x.md` (commit `e348b41`)" lost its first backtick to the "from" rule, and
          // the commit's digits were read as figures the file lacked. Lesson (a field report). A number inside a word or
          // name, like a commit, is no figure either)
          const claim = text.replace(/`[^`]*`/g, ' ').replace(/\[\d+\]|\b(?:from|according to|per|seg[uú]n)\s+\S+\.\w{1,5}\b|\([^)]*\.\w{1,5}\)|\*\*[^*]+\*\*|\b\d{4}-\d\d-\d\d\b/gi, ' ');
          for (const part of claim.split(/\b(?:so|therefore|thus|hence|which means|meaning|that means)\b|[;:]|(?<!\p{L})(?:as[ií] que|por lo tanto|o sea)(?!\p{L})/iu)) {
            const words = [...new Set((part.toLowerCase().match(/[a-záéíóúñü]{4,}|(?<![a-z0-9])\d{2,}(?![a-z0-9])/g) || []).filter(w => !CITE_STOP.has(w)))];
            // (a part of fewer than 3 content words is a label or a verdict, "Point of view:", "so it finds no problem")
            if (words.length < 3) continue;
            const found = words.filter(w => /^\d+$/.test(w) ? new RegExp(`(?<!\\d)${w}(?!\\d)`).test(src) : src.includes(stemOf(w)));
            // (a third, not a half: measured on 147 real cited claims of three trial rounds, a half also flagged a fair
            // elaboration, "right-handed: hammer, sword or reins in the right hand"; a third still catches every
            // inference passed off as the file's)
            if (found.length * 3 < words.length) { out.push({ where, file: f, claim: part.trim().slice(0, 100), missing: words.filter(w => !found.includes(w)).slice(0, 5) }); break; }
          }
        }
      }
    }
    return out;
  }
  // What was actually opened this turn: fetched pages, commands and their output, files read, helpers' reports; not a
  // search's list of results, and not the agent's own words. (REQ: answer-traced, web sources)
  // A fetch that got no page back: a redirect notice, an error, a block or cookie wall.
  const NO_PAGE = /^\s*(REDIRECT DETECTED|.{0,80}\b(redirect(s|ed)? to|moved (permanently|temporarily))\b|(request failed|error|failed to fetch)\b|.{0,60}\b(status( code)?|HTTP)\s*(30[1-8]|4\d\d|5\d\d)\b|.{0,80}\b(access denied|forbidden|not found|just a moment|enable (cookies|javascript)|captcha)\b)/i;
  // pagesOnly: a fetch's own address counts only when its reply was a page, not a redirect or an error. Lesson, trial
  // round 15: doi.org links fetched once, each answered only by a redirect, counted as read, and the user could not open them.
  function openedText(entries, { pagesOnly = false } = {}) {
    const names = new Map(), inputs = new Map(), out = [];
    for (const r of entries) {
      const c = r.message?.content;
      if (r.type === 'assistant' && Array.isArray(c)) for (const x of c) if (x?.type === 'tool_use') {
        names.set(x.id, x.name);
        if (/^(WebFetch|Bash|PowerShell)$/.test(x.name) || /^mcp__.*fetch/i.test(x.name)) { if (pagesOnly && /^WebFetch$|fetch/i.test(x.name)) inputs.set(x.id, JSON.stringify(x.input || {})); else out.push(JSON.stringify(x.input || {})); }
      }
      if (r.type === 'user') {
        if (typeof c === 'string') out.push(c);
        else if (Array.isArray(c)) for (const x of c) if (x?.type === 'tool_result' && !/^(WebSearch|web_search)$/i.test(names.get(x.tool_use_id) || '')) {
          const t = textOf(x.content);
          if (inputs.has(x.tool_use_id) && !x.is_error && !NO_PAGE.test(t)) out.push(inputs.get(x.tool_use_id));
          out.push(t);
        }
      }
      if (r.type === 'attachment') out.push(JSON.stringify(r.attachment || {}));
    }
    return out.join('\n');
  }
  // The Stop check: x is the old engine's turn record; opts.promptWords false (engine v2) leaves out the path the
  // prompt's words start (a question about the project's numbers), retired 2026-11-07 for both engines' new work.
  function traceGaps(x, cfg, { ledgerRuns, knowledge, researched, promptWords = true, answerFigures = false } = {}) {
    const miss = [], add = (tag, msg, short) => miss.push(short ? { tag, msg, short } : { tag, msg });
    // REQ: answer-traced. "Did I make that up?": every number in a factual answer, and every number written into the
    // knowledge base, appears in something read this turn; every project file the answer cites was opened.
    // A cited file is a bare path, a markdown link's target or a path in backticks, so one with spaces counts too, in any
    // knowledge folder or sources/. Lesson: "sources/2026-10-18 scan.pdf" and links to vault notes were never traced.
    const kRe = knowledgeRe(cfg), inKb = new RegExp(`^${kRe}`);
    const kbOrSrc = new RegExp(`^(?:${kRe}|sources/)`);
    const dec = s => { try { return decodeURI(s); } catch { return s; } };
    const cited = [...new Set([...(x.answer.match(new RegExp(`(?<![\\w/])(?:${kRe}|sources/)[\\w./-]+\\.\\w+`, 'g')) || []),
      ...[...x.answer.matchAll(/\]\(<?([^)>\s]+)>?\)/g)].map(m => dec(m[1])), ...[...x.answer.matchAll(/`([^`\n]+\.\w+)`/g)].map(m => m[1])]
      .map(p => p.replace(/[.,;:)]+$/, '').replace(/^\.\//, '')).filter(p => kbOrSrc.test(p)))];
    // Facts written into the knowledge base are traced even when no research skill ran (an event, not a request).
    // Lesson: numbers typed into docs/knowledge outside the research skill were never checked against a source.
    const kbWritten = x.toolsKnown && x.uses.some(u => /^(Write|Edit|MultiEdit)$/.test(u.name) && inKb.test(rel(u.input.file_path || '')));
    // A question about the project's own numbers ("how did we do last month") is traced too, in any project: its figures
    // must come from something read this turn. Lesson: "1,240 croissants, $4,300, up 12%" was answered from nothing.
    const dataQuestion = promptWords && x.toolsKnown && NUMBERS_ASK.test(x.prompt)
      && /[$€£]\s?\d|\d\s?%|\b\d{1,3}(,\d{3})+\b|\b\d{3,}\b/.test(x.answer.replace(/`[^`]*`|https?:\/\/\S+|\b[\w.-]+\/[\w./-]+/g, ''));
    // (engine v2: the answer's own data figures start the trace, whatever the prompt said, and only those figures are
    // traced when nothing else started it. Oversight decision 2026-11-10: words in the prompt force nothing; a figure the
    // answer states as data is what needs a source, asked or not)
    const dataFigs = answerFigures && x.toolsKnown ? dataFigures(x.answer) : [];
    const traceAnswer = (knowledge && (researched || cited.length)) || ledgerRuns.length || dataQuestion || dataFigs.length;
    const onlyFigures = !((knowledge && (researched || cited.length)) || ledgerRuns.length || dataQuestion);
    if (traceAnswer || kbWritten) {
      const ledgers = ledgerRuns.map(r => /claims\.mjs\s+check\s+"?([^"\s]+)/.exec(r.cmd)?.[1]).filter(Boolean);
      // A file the agent wrote this turn is a valid source for what it wrote (citing it is not citing something unread),
      // but not for outside facts: its own text never traces the facts written into it.
      // Lesson: an answer cited a knowledge note the agent had written 26 seconds earlier from pages it had just fetched,
      // and Stop said it cited the note "without opening it".
      const wroteNow = new Set(x.uses.filter(u => /^(Write|Edit|MultiEdit)$/.test(u.name)).map(u => rel(u.input.file_path || '')));
      // Lesson: numbers the agent itself wrote into files earlier in the session were flagged as made up: what it wrote
      // (its Write/Edit inputs, this session) is part of what it knows, like what it read.
      // (today's date is not in it: the answer's own mention of today's date is left out below instead, so its year, month
      // and day never trace another number. Lesson (the old suite, 2026-11-12 by UTC): "they last 12 years" passed as
      // traced because the date's "12" was in the text read)
      const corpus = [x.results, x.sessionResults, x.prompt, x.allPrompts?.join('\n'), ...ledgers.map(p => read(abs(p))), ...cited.filter(p => !wroteNow.has(p)).map(p => read(abs(p)))].join('\n').replace(/(\d),(?=\d{3}\b)/g, '$1');
      const ownWrites = String(x.sessionWrites || '').replace(/(\d),(?=\d{3}\b)/g, '$1');
      // A rounded form of a traced figure is traced ("238,000" or "238 thousand" for 238166, "103 million" for 103383574),
      // and so is the total of the figures in one tool result (a sum of usage lines). Lesson (a field report): an answer
      // about token use was blocked three rounds in a row for figures it had only rounded or added up from tool output.
      const figures = [...new Set([...`${corpus}\n${ownWrites}`.matchAll(/(?<![\w.])\d+(?:\.\d+)?(?![\w])/g)].map(m => Number(m[0])))].filter(n => n >= 10).slice(0, 20000);
      // (the total of any run of figures in a row in one result: the usage lines of some agents, not all of them)
      const sums = new Set((x.resultsList || []).map(r => [...String(r).replace(/(\d),(?=\d{3}\b)/g, '$1').matchAll(/(?<![\w.])\d+(?![\w.])/g)].map(m => Number(m[0])).filter(n => n >= 10))
        .filter(ns => ns.length >= 2 && ns.length <= 200).flatMap(ns => ns.flatMap((_, i) => { let t = ns[i]; return ns.slice(i + 1).map(n => (t += n)); })));
      const MULT = { thousand: 1e3, k: 1e3, million: 1e6, m: 1e6, mn: 1e6, billion: 1e9, bn: 1e9, b: 1e9, mil: 1e3, millones: 1e6, mill: 1e6 };
      const roundedOf = (n, after) => {
        const mult = MULT[(/^\s*(thousand|million|billion|millones|mil|mill|mn|bn|[kmb])\b/i.exec(after)?.[1] || '').toLowerCase()] || 1;
        const v = Number(n) * mult;
        if (!Number.isFinite(v) || v < 10) return false;
        if (sums.has(v)) return true;
        // the precision the answer gives: its last significant digit (238000: thousands; 103 million: millions; 1.5k: hundreds)
        const dec = (String(n).split('.')[1] || '').length, sig = String(n).replace('.', '').replace(/0+$/, '');
        const step = mult === 1 && !dec ? 10 ** (String(n).length - sig.length) : mult / 10 ** dec;
        if (step < 10) return false;
        return figures.some(c => Math.abs(c - v) <= step / 2 && c !== v);
      };
      const untraced = (text, own = '') => {
        const out = [];
        const body = text.replace(/^---\n[\s\S]*?\n---\n/, '').split(/^#{1,6}\s*\**finished\b|^\**finished\**\s*$/im)[0];
        for (const line of body.split(/\r?\n/)) {
          if (/calculated|estimate|approx|not verified|my inference|rounded|^\s*verified\s*:/i.test(line)) continue;
          const clean = line.split(today()).join(' ').replace(/^\s*((playbook|skill)s?\s*:\s*\S+\s*)+/i, ' ').replace(/https?:\/\/\S+|`[^`]*`|\b[\w.-]+\/[\w./-]+|\[S\d+(?:,\s*S\d+)*\]|\bS\d+\b|\[\d+\]/g, ' ').replace(/^\s*(\d+\.|-|\*)\s+/, '');
          for (const m of clean.matchAll(/(?<![\w.])([$€£]?)(\d[\d,]*(?:\.\d+)?)(\s?%)?(?![\w])/g)) {
            const n = m[2].replace(/,(?=\d{3}\b)/g, '').replace(/[.,]$/, '');
            if (!m[1] && !m[3] && !n.includes('.') && n.length < 2) continue; // a single plain digit is a count, not a fact
            const at = new RegExp(`(?<![\\d.])${esc(n)}(?![\\d])`);
            if (!at.test(corpus) && !at.test(own) && !roundedOf(n, clean.slice(m.index + m[0].length))) out.push(m[0].trim());
          }
        }
        return [...new Set(out)];
      };
      // A figure worked out from two traced figures of the same answer (their sum, their difference, or the change between
      // them in percent) is traced too. Lesson: "692 ... That's 213 more than week 41 (479)" was flagged as made up, and
      // the forced second pass only wedged a source sentence into the middle of the paragraph.
      const computed = (text, list) => {
        if (!list.length) return list;
        const num = s => Number(String(s).replace(/[$€£%\s,]/g, ''));
        const all = [...new Set([...text.replace(/(\d),(?=\d{3}\b)/g, '$1').matchAll(/(?<![\w.])\d+(?:\.\d+)?(?![\w])/g)].map(m => m[0]))].filter(n => !list.some(u => num(u) === Number(n)));
        // (a single digit is a count or a list number, not a figure: it explains nothing)
        const known = all.map(Number).filter(n => Number.isFinite(n) && (n >= 10 || !Number.isInteger(n)));
        const near = (a, b) => Math.abs(a - b) <= Math.max(0.051, Math.abs(b) * 0.0005);
        return list.filter(u => {
          const n = num(u);
          if (!Number.isFinite(n)) return true;
          for (const a of known) for (const b of known) {
            if (a === b) continue;
            if (near(n, a - b) || near(n, a + b)) return false;
            if (/%/.test(u) && (near(n, ((a - b) / b) * 100) || near(n, Math.round(((a - b) / b) * 1000) / 10))) return false;
          }
          return true;
        });
      };
      const numOf = s => String(s).replace(/[$€£%\s]/g, '').replace(/,(?=\d{3}\b)/g, '').replace(/[.,]$/, '');
      const figNums = new Set(dataFigs.map(f => f.num));
      const fromAnswer = traceAnswer ? computed(x.answer, untraced(x.answer, ownWrites)).filter(u => !onlyFigures || figNums.has(numOf(u))) : []; // what goes into the knowledge base itself must trace to a source
      // (in a data file, where a mark goes on a picture or a page - its box, point, size or crop - is layout, not a fact.
      // Lesson (a field report): helpers drew markup on pictures, and the box corners 0.28 and 0.6 were "made up")
      const LAYOUT = /"(box|at|x|y|w|h|x[12]|y[12]|width|height|max_width|max_height|left|top|right|bottom|size|font_size|scale|zoom|rotate|angle|opacity|crop|pos|position|points?|from|to|radius|stroke|thickness|padding|margin)"\s*:\s*(\[[-\d.,\s\[\]]*\]|-?\d+(?:\.\d+)?)/gi;
      const written = x.uses.filter(u => /^(Write|Edit|MultiEdit)$/.test(u.name) && inKb.test(rel(u.input.file_path || '')))
        // (a figure worked out there from two traced ones is traced, as in the answer. Lesson (trial v29): "+88.00
        // (calculated: 242 - 154)" written into the knowledge file was flagged as made up)
        .flatMap(u => { const t = [u.input.content, u.input.new_string, ...(u.input.edits || []).map(e => e.new_string)].filter(Boolean).join('\n')
          .replace(/\.json$/i.test(u.input.file_path || '') ? LAYOUT : /(?!)/g, ' '); return computed(t, untraced(t)); });
      const machine = [];
      // (a Grep run on the file itself read it: its output holds the lines without the file's name. Lesson, trial round 14:
      // a quote found that way was "not opened", and the agent read the file four more times)
      const grepped = p => x.uses.some(u => u.name === 'Grep' && rel(String(u.input?.path || '')) === p);
      const unopened = x.toolsKnown ? cited.filter(p => !x.reads.has(p) && !wroteNow.has(p) && !x.cmds.some(c => c.includes(p)) && !x.results.includes(p) && !grepped(p)) : [];
      // the web links in the answer's sources were opened too: a link a search only listed was never read. Lesson: an
      // answer cited 2 of 3 studies by links it never opened, and the citation check passed it
      if (x.toolsKnown && (researched || knowledge)) {
        const src = /^[ \t]*\**sources:?\**[ \t]*$([\s\S]*)/im.exec(x.answer)?.[1] || '';
        // (a research ledger checked this turn counts: helpers record there what they read)
        const opened = `${openedText(x.entries || [], { pagesOnly: true })}\n${ledgerRuns.map(r => read(abs(/claims\.mjs\s+check\s+"?([^"\s]+)/.exec(r.cmd)?.[1] || '.'))).join('\n')}`.replace(/\\\//g, '/');
        const key = u => u.replace(/^https?:\/\/(www\.)?/i, '').replace(/[)\].,;>]+$/, '').replace(/\/$/, '');
        // An article's DOI link counts as opened when that DOI was read by any route (an API query, a mirror, the
        // publisher's page): the reader gets the page a person can open. A data address (an API, a JSON feed) in the
        // sources is no page a person can open. Lesson (trial round 12): to pass this check an agent replaced working
        // doi.org links with the API addresses it had fetched, and the user found half the links would not open.
        const lowOpened = opened.toLowerCase(), decoded = (() => { try { return decodeURIComponent(lowOpened); } catch { return lowOpened; } })();
        for (const u of new Set((src.match(/https?:\/\/[^\s)>\]]+/g) || []).map(key))) {
          const doi = /^(?:dx\.)?doi\.org\/(10\.\d{4,9}\/\S+)$/i.exec(u)?.[1]?.toLowerCase();
          if (/(^|[./])api[./]|\/api\/|\/rest\/|[?&](format|output)=json\b|\.json(\?|$)/i.test(u)) machine.push(u);
          else if (!opened.includes(u) && !(doi && (lowOpened.includes(doi) || decoded.includes(doi)))) unopened.push(u);
        }
      }
      if (fromAnswer.length || written.length || unopened.length || machine.length)
        add('answer-traced', 'Did you make that up? ' + [fromAnswer.length && `The answer states ${fromAnswer.slice(0, 6).join(', ')}, found in nothing read this turn`,
          written.length && `the knowledge base got ${written.slice(0, 6).join(', ')}, found in nothing read this turn`,
          unopened.length && `the answer cites ${unopened.slice(0, 4).join(', ')} without opening it`,
          machine.length && `the sources list ${machine.slice(0, 3).join(', ')}, a data address no reader can open: cite the article's page instead (its DOI link, PubMed or the publisher's page)`].filter(Boolean).join('; ') +
          '. Open the source and quote it, cut the claim, or mark the line "(not verified)", "(calculated: ...)" or "(estimate)". Research skill, section D.');
    }
    // REQ: answer-traced (cited claims). A claim cited to a project file shares its key words with it (citedClaimGaps).
    const weakCites = citedClaimGaps([{ text: x.answer, where: 'the answer' }, ...x.changed.filter(p => citedFile(p, cfg) && exists(p)).map(p => ({ text: read(abs(p)), where: p }))]);
    if (weakCites.length)
      add('answer-traced', `${weakCites.slice(0, 3).map(w => `${w.where} cites ${w.file} for "${w.claim}", but the file says nothing like it (no ${w.missing.slice(0, 3).join(', ')})`).join('; ')}. ` +
        'Quote what the file does say, or mark the line as your own inference ("my guess: ...", "inferido: ...") and keep the citation for the part the file holds.',
        // (the short step keeps the claim: the usual shortening drops quotes, and left "... cites characters.md for".
        // Lesson, trial round 23: the agent guessed the wrong claim and spent a second Stop round)
        `Back the claim "${weakCites[0].claim.replace(/\s+/g, ' ').slice(0, 60)}${weakCites[0].claim.length > 60 ? '...' : ''}" with ${weakCites[0].file.split('/').pop()}, or mark it as your inference${weakCites.length > 1 ? ` (+${weakCites.length - 1} more)` : ''}`);
    return miss;
  }
  return { traceGaps, citedFile, citedClaimGaps, openedText };
}

// The data figures an answer states (engine v2's trigger for answer-traced): money, a percentage, a number with thousands
// separators, or a count with a data unit, each 10 or more unless money or a percentage. Left out, as the trace leaves
// them out: code, links, paths, list numbers, the Finished section and lines marked as worked out, estimated or not
// verified. Incidental numbers ("3 options", "step 12", "line 245", "v1.2.3", dates, times) are none of these kinds.
// { text, num } each, num as the trace compares it (no symbols, no thousands commas).
const UNIT = String.raw`(?:orders?|sales|customers?|clients?|users?|visitors?|visits|members?|subscribers?|followers?|views?|clicks?|downloads?|installs?|sign-?ups?|leads?|tickets?|units?|items? sold|tokens?|calories|kcal|kg|kilos?|lbs?|pounds|tons?|tonnes?|km|miles?|hours?|hrs?|minutes? of|days? of|people|employees|staff|students|patients|cases|deaths|votes?|games? (?:won|lost|played)|wins?|losses|matches|copies|pedidos|ventas|clientes|usuarios|visitas|personas|horas)`;
// A request about the project's numbers ("how did we do last month"): the old engine's trace trigger, and engine v2's
// reminder hint only.
export const NUMBERS_ASK = /\b(how (much|many|did (we|i|it) do)|total|revenue|sales|profit|spend|spent|average|per (day|week|month)|last (week|month|quarter|year)|growth|grew|percent|numbers?|figures?|stats?|metrics?)\b/i;
// (a figure right after a data word: "sales were 4300", "revenue of 12000", "the total came to 830")
const DATA_WORD = String.raw`(?:sales|revenue|income|profit|earnings|spend|spending|spent|costs?|total|average|median|turnover|margin|budget|ventas|ingresos|ganancias?|gastos?)`;
export function dataFigures(answer) {
  const body = String(answer || '').replace(/^---\n[\s\S]*?\n---\n/, '').split(/^#{1,6}\s*\**(?:finished|terminado)\b|^\**(?:finished|terminado)\**\s*$/im)[0];
  const out = [];
  for (const line of body.split(/\r?\n/)) {
    if (/calculated|estimate|approx|not verified|my inference|my guess|rounded|not found|^\s*verified\s*:/i.test(line)) continue;
    const clean = line.replace(/https?:\/\/\S+|`[^`]*`|\b[\w.-]+\/[\w./-]+|\[S\d+(?:,\s*S\d+)*\]|\bS\d+\b|\[\d+\]/g, ' ').replace(/^\s*(\d+\.|-|\*)\s+/, '');
    const rx = new RegExp(String.raw`(?<![\w.])([$€£]\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:k|m|bn|million|billion|thousand))?|\d[\d,]*(?:\.\d+)?\s?(?:%|percent\b|por ciento\b)|\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s?(?:USD|EUR|GBP|MXN|dollars?|euros?|pesos?)\b|\d[\d,]*(?:\.\d+)?\s(?:[a-z]+\s)?${UNIT}\b|${DATA_WORD}\s+(?:(?:was|were|is|are|came to|reached|hit|totaled|totalled|of|at)\s+)?(?:about\s+|around\s+|roughly\s+)?\d[\d,]*(?:\.\d+)?|\d[\d,]*(?:\.\d+)?\s(?:more|less|fewer|higher|lower)\s(?:than|from)\b)`, 'gi');
    for (const m of clean.matchAll(rx)) {
      const t = m[1].trim(), num = (/\d[\d,]*(?:\.\d+)?/.exec(t)?.[0] || '').replace(/,(?=\d{3}\b)/g, '').replace(/[.,]$/, '');
      const money = /[$€£]|USD|EUR|GBP|MXN|dollar|euro|peso/i.test(t), pct = /%|percent|por ciento/i.test(t);
      if (!num || (!money && !pct && Number(num) < 10)) continue;
      out.push({ text: t, num });
    }
  }
  return out;
}

// REQ: research-verified, shared by both engines (moved from hooks.mjs unchanged). Facts from the web go through the
// research skill's ledger: several independent sources, paid and biased ones screened out. A knowledge project has no
// quick lookups; elsewhere "Quick lookup:" marks one. x: { toolsKnown, uses: [{ name }], cmds: [cmd], said };
// ledgerRuns: the claims.mjs check runs ({ out }), oldest first. The message, or null.
export function researchVerified(x, cfg, { ledgerRuns = [], knowledge = false, researched = false } = {}) {
  // (a curl to this machine, such as the project's own app server, is not the web. Lesson, field report: polling the
  // app's local API with curl set off the whole research ledger)
  const web = x.toolsKnown && (x.uses.some(u => /^(WebSearch|WebFetch)$/.test(u.name)) || x.cmds.some(c => /\bddgs\s|search\.mjs|\bcurl\b[^|;&]*https?:\/\/(?!(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\])(?![\w.-]))/.test(c)));
  const ledgerOk = ledgerRuns.length && /CLAIMS: PASS/.test(ledgerRuns[ledgerRuns.length - 1].out || '');
  // a search that found nothing has no claims to verify: it says what was searched, where, and when
  // ("Searched: <what> - nothing found (<where>, 2026-10-20)"). Lesson: a "no proven list found" lookup was sent through
  // the whole three-source ledger.
  const nothingFound = /\bsearched:[^\n]*\b(nothing|no \w+( \w+)? found|not found|none found)\b[^\n]*\(\s*[^)\n]*\d{4}-\d\d-\d\d\s*\)/i.test(x.said);
  // a project whose own research rule already asks for sources and a date names that rule's line in config
  // ("researchCoveredBy": "<regex>"); an answer that carries it has met the project's rule instead. Lesson: an adopted
  // project's market lookups, with their own source and date line, were sent through the whole ledger too.
  const ownRule = (() => { try { return !!cfg.researchCoveredBy && new RegExp(cfg.researchCoveredBy, 'im').test(x.said); } catch { return false; } })();
  if (!(web && (knowledge || researched) && !nothingFound && !ownRule && !(ledgerOk && /verified:\s*\d+\s+claims/i.test(x.said)) && !(!knowledge && /\bquick lookup:/i.test(x.said)))) return null;
  return `This turn used the web${knowledge ? ' in a knowledge project' : ''}. Follow the research skill, situation C: a ledger (node skills/research/scripts/claims.mjs new "<question>"), ` +
    'at least three independent sources with sponsored and biased ones screened out, claims.mjs check passing, and the answer ending with "Verified: <n> claims ..."' +
    (knowledge ? '.' : '. A one-fact lookup for the work at hand instead says so: "Quick lookup:" with its link.') +
    ' A search that found nothing says "Searched: <what> - nothing found (<where>, <date>)".' +
    (cfg.researchCoveredBy ? ` The project's own research rule counts too: its line (config researchCoveredBy: ${cfg.researchCoveredBy}).` : '');
}

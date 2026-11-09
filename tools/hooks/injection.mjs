// Text that reads as instructions to an AI, read by both engines (the old one in hooks.mjs, v2's end check).
// REQ: injection-guard: planted in a file the project keeps (rules, skills, runbooks, knowledge), which every future
// session reads: "ignore previous instructions", fake system tags, invisible characters.
export const INJ_PLANTED = /ignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|rules|prompts?)|disregard (all |the )?(previous|prior|above|system)\b|\byou are now (a|an|in)\b|<\/?(system|assistant)>|\bnew system prompt\b|[​-‏‪-‮⁠-⁤﻿]/i;
// REQ: injection-flagged: aimed at the AI in something read this turn ("note for AI assistants", "don't tell the user").
export const INJ_AIMED = /\b(note|message|instructions?)\s+(for|to)\s+(any\s+)?(ai|llm|language model|assistants?|agents?|chatbots?)\b|\b(ai|llm) (assistants?|agents?|models?)\s+(processing|reading|summari[sz]ing)\b|\bignore (all |any )?(the )?(previous|prior|above|earlier) (instructions|rules|prompts?)|\bdo not (mention|reveal|tell)\b[^.\n]{0,40}\b(the )?user\b|\bnew system prompt\b/i;
// the answer warns the user about it (hidden instructions, prompt injection, instructions aimed at assistants)
export const INJ_WARNED = /\b(hidden|embedded|planted|buried|secret)\b[^.\n]{0,80}\b(instruction|note|comment|text|message)s?|prompt[- ]injection|\binstructions?\b[^.\n]{0,40}\b(aimed at|addressed to|written (to|for))\b[^.\n]{0,20}\b(ai|assistants?|agents?)/i;

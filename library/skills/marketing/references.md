# Marketing: templates and checklists

Deeper material for [SKILL.md](SKILL.md). Numbers here are rough rules of thumb, not benchmarks. Use the user's own
results or sourced figures (research skill) for targets.

## Brand voice file
Save as `brand-voice.md` in `docs/` once the user agrees.

```markdown
# Our brand voice
Personality: <the brand as a person, in one or two sentences>
Audience: <who we talk to, what they know, how they like to be addressed>

## Voice attributes (3 to 5)
### <Attribute>
- Means: <in practice>
- Doesn't mean: <the misreading to avoid>
- Sounds like: "<example line>"
- Never sounds like: "<counter-example>"

## Messaging pillars (3 to 5, in order)
- <pillar>: <the audience need it answers> | proof: <source>

## Tone by context
- <channel or situation>: <which attributes go up or down>

## Style rules
- Headings: sentence case | title case
- Serial comma: yes | no
- Numbers: <rule> | Dates: <format> | Times: <format>
- Contractions, exclamation marks, emoji, capitals for emphasis: <rule per channel>

## Words
| Use | Avoid | Why |
|---|---|---|

## Names and competitors
- Product names and capitalization: <..> (keep the master list in docs/names.json)
- How we refer to competitors: <by name | generically>
- Category terms we use, and rival-coined terms we avoid: <..>
```

**Ways to describe a voice** (pick a point on each line that matters): formal to casual; expert to peer; warm to
matter-of-fact; technical to simple; bold to calm; playful to serious; new to proven.

**Tone moves, voice stays.** The attributes never change; the mix shifts with context. A launch turns up confidence.
An outage turns up openness and care. A price rise is honest and offers a way forward. A comparison with a competitor
stays fair and factual.

**Inclusive and clear language:** they/them for unknown people; no ableist slang; person-first wording where people
prefer it; idioms that travel badly replaced; "simple" or "quick" instead of promising something is "easy".

## Claim flags (section A)
| Flag | Example of the risk | What to ask for |
|---|---|---|
| Superlative | "The fastest tool on the market" | A source, or soften it ("built for speed") |
| Comparison | "Twice as accurate as <rival>" | A fair, current, sourced test, or remove the name |
| Promise | "Guaranteed savings", health or money outcomes | A disclaimer, or a lawyer's or compliance check |
| Testimonial | A quote with no name, or a paid endorser not disclosed | Attribution and permission; disclose paid or gifted relationships |
| Close copy | A paragraph that tracks a competitor's page | Rewrite in the brand's own words |
| Regulated topic | Finance, health, children, alcohol | Compliance review before use |

## Channel guide (section B)
| Type | Channels | Good for |
|---|---|---|
| Owned | Website and blog, email, own social accounts, webinars, podcast | Search, education, nurture, retention, community |
| Earned | Press, guest articles, partners and creators, communities, reviews | Reach, trust, credibility |
| Paid | Search and social ads, display banners, sponsored articles, event sponsorship | Intent capture, fast reach, retargeting |

Choose by: where the audience already is, the stage the goal serves, money versus time available, the assets that
exist, and what worked before (the user's data).

**Measures by goal:**
| Goal | Main measures |
|---|---|
| Awareness | Reach, mentions, share of voice, direct visits, audience growth |
| Lead generation | Leads, qualified leads, cost per lead, lead-to-qualified rate, pipeline |
| Launch | Sign-ups or trials, activation, press coverage, use of the new feature |
| Retention | Churn change, engagement, satisfaction scores, expansion revenue |
| Events | Registrations, attendance rate, engagement during, conversions after |

**Campaign plan outline:**
1. Name, one-line summary, goal and secondary goals.
2. Audience and the message ladder with proof.
3. Channels with fit, format, effort and budget.
4. Calendar table (week, piece, channel, owner, due, depends on) and the asset list.
5. Measures and targets; the budget split with a reserve, if a budget exists.
6. Risks and responses, approvals, first actions.

## Content structures (section C1)
| Type | Parts |
|---|---|
| Blog post | Headline with the main phrase; an opening that names the reader's problem and what the post will give them; 3 to 5 sections under descriptive subheadings, one idea each with an example or sourced data point; a close with the takeaway and one call to action; a meta description |
| Social post | A first line that earns the next; 2 to 4 short points or a mini story; one ask (comment, click, save); a few relevant tags where the platform uses them. Fit the platform's length and habits |
| Newsletter | Subject line; preview text that adds to it; a one-line value statement up top; 2 or 3 scannable blocks; one main button; footer with unsubscribe and contact |
| Landing page | Headline with the main benefit; a subheadline that explains it; the main button near the top; 3 or 4 benefit blocks; proof (quotes, logos, numbers, all real); answers to objections; the button again at the end |
| Press release | A factual headline; place and date; a first paragraph with who, what, when, where and why; detail and quotes (real, approved); company boilerplate; media contact |
| Case study | "<Customer> got <result> with <product>"; a snapshot (industry, size, result); the challenge; what was done; results with real numbers; an approved quote; next step |

**Headline angles:** how to get a result (without a common pain); a number of ways; a belief turned on its head; a
complete guide; this, not that; what a big body of experience taught; what an audience needs to know now.

**Opening lines:** a sourced surprising fact; a contrarian claim; a direct question; a short scenario; a quick story.

**Calls to action:** an action verb; say what happens next; real urgency only; lower the risk where true (free trial,
cancel any time); one main ask per page or email. Place it after the value is clear, and repeat it at the end of long
pages.

## Sequence shapes (section C2)
| Type | Typical length | Arc |
|---|---|---|
| Onboarding | 5 to 7 emails, 2 to 3 weeks | welcome and what to expect; a quick win; the core feature; a deeper feature or integration; proof and community; check-in; next step or upgrade |
| Nurture | 4 to 6 emails, 3 to 4 weeks | useful teaching; name the pain; the solution with proof; results; soft ask; direct ask |
| Re-engagement | 3 to 4 emails, about 2 weeks | a reason to come back; what they are missing; an offer; last call with a date |
| Win-back | 3 to 5 emails, about a month | what went wrong?; what's new; an offer; ask for feedback; goodbye with the door open |
| Launch | 4 to 6 emails, 2 to 3 weeks | teaser; announcement; a feature or use case; early results; time-limited bonus; reminder |
| Event follow-up | 3 to 4 emails, about 10 days | thanks and the recording; resources; next step; survey |
| Upgrade | 3 to 5 emails, 2 to 3 weeks | a milestone; the limit they are hitting; what the upgrade gives, with proof; an incentive; plan comparison |
| Course by email | 5 to 8 emails, 4 to 6 weeks | what they will learn; lessons from basic to advanced; a practice task; resources; wrap-up |

**Flow diagram example:**
```
[Trigger] -> Email 1 (day 0)
  opened? no  -> Email 1b (day 2) -> Email 3
  opened? yes -> Email 2 (day 3)
                   clicked? yes -> [EXIT: converted]
                   clicked? no  -> Email 3 (day 7) -> Email 4 (day 10) -> [EXIT: finished]
```

## Competitor frameworks (section D)
- **Message breakdown:** the promise; the proof offered; how it works; what only they claim.
- **Story they tell:** the enemy (old tools, complexity, the status quo); the hero (customer or product); the
  before and after; the cost of doing nothing.
- **Message quality:** clear in five seconds?; distinct or generic?; backed by proof?; consistent across channels?;
  aimed at a real pain?
- **Positioning line:** For <audience>, <brand> is the <category> that <main benefit> because <reason to believe>.
- **Map:** plot rivals on the two axes buyers care about most (price and capability, simple and powerful, small
  business and enterprise, single tool and platform, new and proven) and look for the empty corner.
- **Category choice:** create a new category, reframe the current one, win it head-on, or own a niche in it.
- **Positioning traps:** defining yourself against a rival rather than for a customer need; too many differentiators;
  jargon buyers don't use; features instead of outcomes; changing position too often.
- **Content gap table:** rows are topics or formats, columns are the user and each rival, the last column says gap,
  edge or even.

**Battlecard (one page):**
- Rival and date updated; what they do and for whom; pricing model; recent moves.
- Their pitch and top claims; where they are genuinely strong; common complaints (sourced).
- Our differences, each with why it matters and proof.
- Objection replies; questions to ask early that bring out our strengths; questions they may plant, with answers.
- Win and loss patterns.

Refresh it every quarter and after any big move by the rival.

## Report measures (section E)
| Scope | Measures |
|---|---|
| Campaign | Reach, click rate, conversion rate, cost per conversion, return on spend, conversions |
| Email | Delivered, bounces, opens, clicks, click-to-open, unsubscribes, conversions |
| Social | Reach, engagement rate, audience growth, clicks, top posts |
| Paid | Spend, impressions, clicks, cost per click and per thousand views, conversions, cost per conversion, return on spend, frequency |
| Search | Organic visits, ranking changes, indexed pages, new links, top entry pages, organic conversion rate |
| Content | Views, unique visitors, time on page, scroll depth, shares, leads attributed |
| Whole funnel | Leads, qualified leads, pipeline, cost to acquire a customer, payback time, revenue sourced and influenced |

Write each rate with its formula the first time (for example, click-to-open = unique clicks / unique opens).

**Cadence shapes:**
- Weekly: top 3 measures, one win, one concern, priorities.
- Monthly: summary, metrics table, channel results, campaign highlights, worked and didn't, next month, spend
  against plan.
- Quarterly: results against goals, year to date, return by channel, market notes, next quarter's plan and budget,
  experiments learned from.

**Reading trends:** direction over several periods; turning points matched to events; seasonality; one-off spikes;
which measures move first. Forecasts are ranges, shorter is safer, and few data points mean low confidence.

**Attribution views:** last touch (credits the closer, hides awareness); first touch (credits discovery, hides the
closer); equal split; more credit near the conversion; weighted to first and last; data-driven (needs a lot of
volume). Use any of them as a direction, not as truth, and never judge one channel by one view alone.

**Fixes by funnel stage:**
| Stage | Symptom | Levers |
|---|---|---|
| Awareness | Few people reached | Budget, targeting, channel mix, format |
| Interest | Low clicks or engagement | Creative, headline, hook, audience |
| Consideration | Visitors leave fast | Page content, speed, relevance, layout |
| Conversion | Few complete the action | Offer, button, form length, trust signals |
| Retention | People drift away | Onboarding, nurture emails, product, support |

**Testing:** one change per test; the winning measure chosen first; a sample size worked out before starting; at
least one full business cycle; every result written down, including the dull ones.

## On-page checks (section F)
- Title: present, unique, about 50 to 60 characters, includes the main phrase.
- Meta description: present, about 150 to 160 characters, gives a reason to click.
- One H1 that matches the topic; H2 and H3 in a logical order.
- The main phrase early in the text and used naturally, never stuffed.
- Internal links to related pages with descriptive link text; no orphan pages.
- Every image has descriptive alt text.
- Short, readable URLs without deep nesting or tracking clutter.

**Technical checks:**
- Load speed and its likely causes (heavy images, blocking scripts, redirect chains).
- Mobile layout and tap targets.
- Structured data worth adding (FAQ, how-to, product, article, organization, breadcrumbs).
- Robots rules, sitemap, canonical tags, noindex use, duplicate pages.
- Broken links, HTTPS and mixed content.
- Core Web Vitals, only where a tool measured them.

**Content gap angles:** competitor topics missing here; pages not updated in over a year; thin pages; missing formats
(guides, comparisons, glossaries, tools, templates); funnel stages with nothing; pillar pages with supporting posts.

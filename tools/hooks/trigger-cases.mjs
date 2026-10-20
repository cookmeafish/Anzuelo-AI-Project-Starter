// Trigger cases: realistic user messages that must (fire) or must not (quiet) set off each prompt trigger, so trigger
// recall and the checks keyed on the request can never silently regress. tools/hooks/selfcheck.mjs runs every message
// through the engine (promptHints, and the "promptMatches" of the prompt-keyed Stop checks) and reports recall per
// target, the misses, and any near miss that sets off a hint whose Stop check would block.
// Targets: "ROUTE: <runbook>", "SKILL: <skill>", "MUST FOLLOW: <skill or runbook>", a notice kind ("THE USER SOUNDS
// UPSET", "RULE REQUEST", "REQUIREMENT", "PRAISE", "AUTONOMY"), or "CHECK: <tag>" for a Stop check whose condition is
// the request itself (when.promptMatches). A target whose runbook, skill or check is not installed is skipped.
// Messages are generic on purpose: this file ships to every project. Engine file: an upgrade replaces it; a project's
// own cases go in its tools/hooks/project-scenarios.mjs.
// Origin: a trigger audit found 53% of 363 realistic requests set off nothing.
export default {
  // ---------- runbooks ----------
  'ROUTE: bugfix': { fire: [
    'the export button does nothing when I click it',
    'ugh the totals on the invoice page are off by a few cents',
    'why is the app showing a blank screen after I sign in?',
    "saving a recipe throws 'undefined is not a function'",
    'the csv import chokes on files with accents',
    "stuff got messed up after yesterday's change, the sidebar is gone",
    'it freezes when i hit save'], quiet: [
    'add a dark mode toggle to settings',
    'write a short guide on how customers should report errors to us'] },
  'ROUTE: feature': { fire: [
    'can we let users export their reports as csv?',
    "I'd like a way to filter orders by date",
    'users should be able to reset their own password',
    'add a search box to the recipes page',
    'make the app remember the last opened project',
    "it'd be nice if the list could be sorted by price"], quiet: [
    'the date filter is broken',
    'what features does the app have right now?'] },
  'ROUTE: gui': { fire: [
    'the header looks cramped on my laptop',
    'make the settings page prettier',
    'the buttons are hard to tap on my phone',
    'can you tidy up the visuals of the dashboard',
    'text is way too small on the reports screen',
    'the colours clash, fix it'], quiet: [
    'the dashboard numbers are wrong',
    'how many screens does the app have?'] },
  'ROUTE: ingest': { fire: [
    "I added a file to the inbox, have a look",
    'I put the supplier invoices in the inbox folder',
    "here are last month's bank statements",
    'just dropped a pdf in there, can you go through it',
    'attaching the menu photo',
    'new price list from the vendor came in, pls process it',
    'uploaded the contract scan'], quiet: [
    'where should I put files I want you to read?',
    'make the export save as a pdf'] },
  'ROUTE: install-update': { fire: [
    "make it so the app can be installed and started with one command on a new machine",
    "the desktop shortcut doesn't open the app anymore",
    'make a one-click installer for windows',
    "the app should update itself when there's a new version",
    'the first time someone opens it, it should ask for their name',
    'set up a Start.bat so my parents can launch it with a double click'], quiet: [
    'install the dependencies',
    'update the readme'] },
  'ROUTE: perf': { fire: [
    'the app takes forever to open',
    'scrolling the list is janky',
    'the report page hangs for like 10 seconds',
    'why is this so sluggish?',
    'it eats all my RAM',
    'page load is painfully slow'], quiet: [
    'make the fade animation slower',
    'how fast should the export be?'] },
  'ROUTE: plan': { fire: [
    'before you start, lay out the steps',
    "let's map out how we'll build the booking system",
    'what order should we do this in?',
    'this is big, break it into tasks first',
    'can you write up a roadmap for v2',
    'pick up where the plan left off'], quiet: [
    "I'm going on holiday next week, plan around it",
    "we don't need a plan, just fix the typo"] },
  'ROUTE: project': { fire: [
    'where did we leave off?',
    "what's left to do?",
    'do a full health check of the project setup',
    'add a hook that blocks commits without tests',
    'which skills do we even have?',
    'make the agent stop forgetting the changelog'], quiet: [
    "what's the http status code for not found?",
    "the order status isn't updating after payment"] },
  'ROUTE: qa': { fire: [
    'go through the app and find anything broken before launch',
    'can you look over my PR',
    'did you actually test this??',
    'test the checkout flow end to end',
    'look over my changes before I merge'], quiet: [
    'what does qa stand for',
    'write a faq page'] },
  'ROUTE: release': { fire: [
    "let's ship v1.3",
    'push it live',
    'time to put out a new version',
    'deploy to production please',
    'get this onto the app store',
    'cut 2.0'], quiet: [
    'push the button colour a bit darker',
    'what changed in the latest framework release?'] },
  'ROUTE: security-review': { fire: [
    'is this safe to put online?',
    'could someone hack the sign in?',
    'I accidentally committed my api key',
    "check we're not leaking customer emails",
    'is the upload form safe?',
    'anyone can open the admin page right now'], quiet: [
    'make the security guard rota for next week',
    'the secure badge icon is misaligned'] },
  'ROUTE: deliverable': { fire: [
    'put together a one page summary for the board',
    'I need a handout for new staff',
    'can you make a price comparison sheet I can print',
    'turn these notes into a proper report',
    'write up the meeting',
    'make a pdf of the menu'], quiet: [
    'what does the guide say about refunds?',
    'the letter E is cut off in the logo'] },
  'ROUTE: data-change': { fire: [
    "we need to store the customer's phone number too",
    'move the data from json files to sqlite',
    'add a notes column to orders',
    "rename the 'qty' field to 'quantity' in the db",
    'change how dates are saved',
    'the old records need converting to the new format'], quiet: [
    'what format is the export?',
    'clean out the storage room inventory list'] },
  'ROUTE: app-foundation': { fire: [
    'start a new app for tracking my workouts',
    'set up the project skeleton for a react app',
    'bootstrap a new web app from nothing',
    "we're starting the app, lay the groundwork right"], quiet: [
    'what is the foundation of a good sourdough?',
    'fix the scaffolding page typo',
    'the new app version should start faster on my machine'] },

  // ---------- skills ----------
  'SKILL: debug': { fire: [
    'the tests are red and I have no idea why',
    'npm test fails on the date helper',
    'figure out why the build keeps breaking',
    'this crashes with a TypeError, find out why',
    'it works on my machine but not on the server'], quiet: [
    'add a debug log toggle to settings',
    'write tests for the parser'] },
  'SKILL: research': { fire: [
    'what is the best budget standing desk right now?',
    'is it true that coffee dehydrates you?',
    'how much does a used family car go for these days',
    'dig up what other bakeries charge for custom cakes',
    'whats the current version of node',
    'which of these two suppliers is cheaper?'], quiet: [
    'do you think we should keep this layout?',
    'compare is a reserved word in the old api, rename the function'] },
  'SKILL: teach': { fire: [
    'explain how this recursion works',
    'i dont get closures, can you help?',
    'teach me git branching',
    'quiz me on the french verbs',
    'how does the hook system work?'], quiet: [
    'explain why the build failed in one line',
    'test me later'] },
  'SKILL: correspondence': { fire: [
    'write back to the landlord about the leak',
    'draft an email to the supplier about the late order',
    'can you answer this customer complaint',
    'send a nice thank you to the volunteers',
    'nudge the client about the unpaid invoice'], quiet: [
    'the email field on the form is broken',
    'what email did the supplier send yesterday?'] },
  'SKILL: data-analysis': { fire: [
    "what's the average order value in sales.csv",
    'make a chart of monthly signups',
    'look at the spreadsheet and tell me which product sells best',
    'any trends in the survey answers?',
    'crunch the numbers in the export'], quiet: [
    'the chart colours are ugly',
    'add a median field to the form'] },
  'SKILL: data-pipeline': { fire: [
    'the nightly import broke again',
    'a column got renamed in the new export',
    "totals from the import don't add up",
    'rerun the pipeline on the october batch',
    'set up an etl from the shop export into the db'], quiet: [
    'export the report as csv',
    'pipeline of sales leads in the crm doc'] },
  'SKILL: incident-response': { fire: [
    "site's down!!",
    'nobody can log in right now',
    'customers are getting 500 errors on checkout',
    'prod is down',
    'the server crashed and wont come back up'], quiet: [
    'write an incident report template',
    'the dropdown menu goes down too far'] },
  'SKILL: knowledge-capture': { fire: [
    'remember that the supplier closes on mondays',
    'jot down that the wifi password changed',
    'fyi our vat number is GB123, save that',
    'note: the meeting moved to thursday',
    'keep in mind my coworker is allergic to nuts'], quiet: [
    'there needs to be role selection obvious to the player, keep in mind that every phase has different roles', // a requirement: REQUIREMENT handles it
    'remember to run the tests',
    'what notes do we have on pricing?'] },
  'SKILL: legal-review': { fire: [
    'review this contract before I sign',
    'is our cookie banner gdpr compliant?',
    'can I use this font commercially?',
    'check the terms of service',
    'go over the nda from the new supplier'], quiet: [
    'the terms page has a typo',
    'add a contracts tab to the dashboard'] },
  'SKILL: marketing': { fire: [
    'write an instagram post for the new menu',
    'write a product description for the fern', // a live trial made a duplicate runbook when this found nothing
    'plan the launch campaign',
    'check this copy sounds like us',
    'write the newsletter for october',
    'who are our competitors and how do we compare'], quiet: [
    'the newsletter signup form crashes',
    'post the release'] },
  'SKILL: codebase-map': { fire: [
    'give me a tour of the code',
    'how is this codebase organized?',
    'where does the payment logic live?',
    'map the codebase'], quiet: [
    'map the delivery routes for tomorrow',
    'add a map page'] },
  'SKILL: commit-archaeologist': { fire: [
    'why does this code exist',
    'who added this weird hack and why',
    'is this check deliberate or a leftover?',
    'what could break if i change this function'], quiet: [
    'why does this page load slowly',
    'who should I email about the invoice'] },
  'SKILL: dependency-update': { fire: [
    'update all the npm packages',
    'npm audit shows 5 vulnerabilities',
    'upgrade react to 19',
    'add lodash',
    'is it safe to bump express?'], quiet: [
    'update the package description in the readme',
    'add a package tracking page'] },
  'SKILL: frontend-design': { fire: [
    'redesign the landing page',
    'pick a nicer colour palette',
    'is the contrast ok for people with bad eyesight?',
    'make it work with a screen reader',
    'review this mockup'], quiet: [
    'design a database for orders',
    'the error message says null'] },
  'SKILL: architecture': { fire: [
    'should we use postgres or mongo?',
    'which framework should we use for the new app',
    'how should we split the backend into services',
    'whats our biggest tech debt',
    'pick the stack for the booking app'], quiet: [
    'the architecture page has a broken link',
    'choose between these two fonts'] },
  'SKILL: backend-patterns': { fire: [
    'add an api endpoint for orders',
    'the orders query is super slow, n+1 maybe',
    'add a background job to send reminders',
    'cache the product list on the server'], quiet: [
    'the backend team meeting notes',
    'add a cache-busting query to the css link'] },
  'SKILL: mcp-builder': { fire: [
    'build an MCP server for our crm',
    'expose our database to the AI agent as a tool',
    'add a tool to the mcp server',
    'make a model context protocol connector'], quiet: [
    'what is an mcp?',
    'add a tool tip to the button'] },
  'SKILL: ml-experiments': { fire: [
    'retrain the model with the new data',
    'try a few learning rates',
    'is the model overfitting?',
    'compare the models we trained last week'], quiet: [
    'the model of the car is wrong in the listing',
    'train the new staff next week'] },
  'SKILL: mobile-app': { fire: [
    'make an android version',
    'the ios build fails',
    'add push notifications',
    'get it into the app stores'], quiet: [
    'make the site work on mobile',
    'the app store link in the footer is broken'] },
  'SKILL: modular-code': { fire: [
    'this file is 3000 lines, split it up',
    'make it easy to add new payment providers later',
    'decouple the ui from the database code',
    'we want to white label the app'], quiet: [
    'split the bill between 3 people',
    'add a new module page to the course'] },
  'SKILL: notes-vault': { fire: [
    'what do my notes say about the trip?',
    'check the links in my vault',
    'update the note on pricing',
    'add this to my obsidian'], quiet: [
    'take notes during the meeting',
    'release notes for 1.2'] },
  'SKILL: obsidian': { fire: [
    'what is related to the pricing note?',
    'connect the notes about suppliers',
    'which notes are orphans?',
    'open it in obsidian'], quiet: [
    'make a graph of sales',
    'related products section on the shop page'] },
  'SKILL: orchestrate': { fire: [
    'run a bunch of agents on this overnight and keep track',
    'coordinate the agents working on the migration',
    'supervise the agents'], quiet: [
    'orchestrate the band rehearsal schedule'] },
  'SKILL: package-release': { fire: [
    "prepare src/lib as an npm package other people can install",
    'publish the library to npm',
    'is this a breaking change?',
    'put it on pypi',
    'bump the semver for the new api'], quiet: [
    'publish the blog post'] },
  'SKILL: parallel-agents': { fire: [
    'do these three things in parallel',
    'use subagents for the research',
    'split the work between a few agents',
    'fan out over the 5 failing tests'], quiet: [
    'show the two charts side by side'] },
  'SKILL: repo-setup': { fire: [
    'get it running on my machine',
    'I just cloned it, how do I run it?',
    'install everything so I can run it locally',
    'make a worktree for the new branch'], quiet: [
    'run the report'] },
  'SKILL: routines': { fire: [
    'every monday make the order list',
    'remind me every week to check the stock',
    'do this monthly',
    'make this a weekly thing'], quiet: [
    'what did we order last monday?'] },
  'SKILL: security-hardening': { fire: [
    'lock down the server',
    'fix all the security issues you found',
    'harden the api',
    'make the app more secure overall'], quiet: [
    'harden the skill for invoices'] },
  'SKILL: skill-finder': { fire: [
    'is there a skill for making slides?',
    'find a ready-made skill for pdf forms',
    'install the docx skill',
    'any existing skills for invoices?'], quiet: [
    'what skills does the new hire need?'] },
  'SKILL: user-research': { fire: [
    'write questions for interviewing customers',
    'sum up what users said in the interviews',
    'design a survey for our members',
    'run a usability test on the checkout'], quiet: [
    'research the best laptop'] },
  'SKILL: web-app-patterns': { fire: [
    "where should the cart state live? it's passed through props everywhere", // found by a live trial
    'move the cart state out of App.tsx into one place so every component reads the same cart',
    'the react component re-renders forever',
    'old search results show up after new ones',
    'add form validation to signup',
    'the bundle is huge, lazy load the charts page'], quiet: [
    'add a component list to the docs'] },
  'SKILL: game-dev': { fire: [
    'the player falls through the floor in godot',
    'export the game for the web build',
    'the jump feels floaty',
    'add controller support'], quiet: [
    'make a game night poster'] },
  'SKILL: manuscript': { fire: [
    'does chapter 4 match the character notes?',
    'check my novel for continuity errors',
    'summarize each chapter',
    'my editor sent feedback, make a revision plan'], quiet: [
    'chapter 2 of the user manual has a typo'] },
  'SKILL: compress-for-ai': { fire: [
    'the agents.md is too long, shrink it',
    'use fewer tokens in your answers',
    'compress the skills'], quiet: [
    'compress the images on the site'] },

  // ---------- MUST FOLLOW: the request makes a skill or runbook mandatory (its Stop check blocks) ----------
  'MUST FOLLOW: security-review': { fire: [
    'let people log in with their social media account',
    'add a forgot-my-password link',
    'store the payment provider key somewhere',
    'users can upload a profile photo',
    'only admins should be able to delete orders',
    'save the customer addresses in the db',
    'set up a ci workflow to run tests',
    'put it in docker',
    'deploy it to a cloud host',
    'add an env var for the db url',
    'host it on a cheap vps',
    'make the repo public',
    'publish it on npm',
    "let's go live tonight",
    'share the repo publicly for everyone'], quiet: [
    'every phase of the raid has different roles and most do not repeat', // game roles, not access control (a real project)
    'the sign in button text is too small',
    'write a blog post about baking cookies',
    'add an upload date column to the photos table',
    'what is docker?',
    'publish the newsletter draft to outputs/'] },
  'MUST FOLLOW: release': { fire: [
    'ship v2',
    'tag the release',
    'put out a new version',
    'push it live'], quiet: [
    'what changed in the latest framework release?'] },
  'MUST FOLLOW: data-change': { fire: [
    'add a column for allergies',
    'migrate to postgres',
    'change the db schema',
    "store the customer's phone number too",
    'rename the qty field in the database'], quiet: [
    'what schema does the export use?',
    'migrate my notes to obsidian'] },
  'MUST FOLLOW: install-update': { fire: [
    'make a one-click installer',
    "the desktop shortcut doesn't work",
    'the app should update itself',
    'make a Start.bat to launch it'], quiet: [
    'install the dependencies'] },
  'MUST FOLLOW: ingest': { fire: [
    "here's the new pdf",
    'attached the spreadsheet',
    'I uploaded 3 files',
    'here are the receipts',
    'dropped the bank statements in inbox'], quiet: [
    'make a new file for the notes',
    'the new pdf export is broken'] },
  'MUST FOLLOW: frontend-design': { fire: [
    'add a contact form',
    'build a settings page',
    'redesign the sign-in screen',
    'we need a popup to confirm deletes',
    'add a sidebar with filters'], quiet: [
    'add a page break to the report pdf'] },
  'MUST FOLLOW: mcp-builder': { fire: [
    'build an MCP server for our crm',
    'expose our database to the AI agent as a tool'], quiet: [
    'what does the mcp acronym stand for?'] },
  'MUST FOLLOW: architecture': { fire: [
    'should we switch to postgres',
    'add a redis cache',
    "let's use an orm for the db",
    'pull in lodash',
    'add a job queue for emails'], quiet: [
    'switch to dark mode'] },
  'MUST FOLLOW: incident-response': { fire: [
    "site's down!!",
    'prod is down',
    'customers getting 500 errors',
    'nobody can log in right now',
    'checkout is broken for everyone',
    'the server crashed and wont come back up'], quiet: [
    'the dropdown is down too far',
    'write an outage notice template'] },
  'MUST FOLLOW: data-analysis': { fire: [
    "what's the average order in the csv",
    'how many customers are in the export',
    'total sales from the spreadsheet',
    'what share of orders got refunded last month',
    'sum the amounts in sales.xlsx'], quiet: [
    'count the words in my essay'] },
  'MUST FOLLOW: legal-review': { fire: [
    'write a privacy policy',
    'check this contract',
    'terms of service for the app',
    'can I use this font commercially?',
    'draft an NDA for the freelancer'], quiet: [
    'an agreement on the meeting time'] },

  // ---------- notices ----------
  'THE USER SOUNDS UPSET': { fire: [
    'you did it AGAIN',
    'this is not what I asked for',
    'the images are still missing',
    'I literally said no emojis',
    'ugh, wrong file',
    'this is useless',
    'did you even read the brief?',
    'the totals are wrong again.',
    'no. that is wrong. read it properly this time',
    'how hard is it to keep the footer'], quiet: [
    'can you try again with a warmer tone?',
    'I asked you to add the footer earlier, thanks for doing it',
    'come on over to the new page design, what do you think'] },
  'RULE REQUEST': { fire: [
    'always use metric units',
    'from now on put the date in the filename',
    "don't ever push without asking me",
    'every time you finish, run the tests',
    'please stop adding emojis',
    'no more em dashes, anywhere',
    'remember I prefer short answers',
    'in future, use British spelling',
    'make sure you always cite sources'], quiet: [
    'add an always-on-top option to the window',
    'never mind, just do it',
    'I always forget my password, add a reset link'] },
  'REQUIREMENT': { fire: [
    'every recipe needs a photo',
    'each report must include a summary at the top',
    'all prices should show VAT',
    'the invoices must always show the due date',
    'reports without a chart are no good to me'], quiet: [
    'this one report should have a chart'] },
  'PRAISE': { fire: [
    'love it',
    'this is perfect',
    'great job',
    "that's exactly it, thanks!",
    'nice work',
    'yes! that is the one'], quiet: [
    'not perfect yet, the logo is off',
    'write a guide to the perfect pizza'] },
  'AUTONOMY': { fire: [
    "just do it all, don't ask me anything",
    "I'm going to bed, keep going till it's done",
    'you decide',
    'handle it, I trust you',
    'work through the whole list without stopping',
    'no need to check with me'], quiet: [
    "don't ask me for the api key again, it is in .env"] },

  // ---------- Stop checks whose condition is the request itself ----------
  'CHECK: decision-logged': { fire: [
    "let's go with option B",
    "ok we'll use the cheaper payment provider",
    'decided: postgres',
    'go with the blue one',
    'I pick the second design',
    'fine, monthly billing it is'], quiet: [
    'which one should we go with?'] },
  'CHECK: redo-changes': { fire: [
    'try again',
    'redo it',
    'have another go at it',
    'check it again please',
    'can you double check the numbers',
    'look again, I think you missed some',
    'verify your answer'], quiet: [
    'try the other api'] },
  'CHECK: praise-captured': { fire: [
    'keep doing this',
    'do it like this every time',
    'this is exactly how I want it',
    'more like this please',
    'this format is great, use it from now on',
    'stick with this style'], quiet: [
    'keep this file open'] },
  'CHECK: qa-incident': { fire: [
    'QA missed that the totals were wrong',
    'how did this slip through testing?',
    "the tests didn't catch it",
    'your QA was useless, the export is broken',
    'did you test it at all?'], quiet: [
    'QA the export please'] },
  'CHECK: incident-trigger': { fire: [
    "site's down!!",
    'nobody can log in right now',
    'checkout is broken for everyone',
    'the server crashed and wont come back up',
    'website is down'], quiet: [
    'the dropdown is down too far',
    'write an outage notice template'] }
};

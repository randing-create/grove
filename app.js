(function () {
  'use strict';

  var KEY = 'grove-v1';
  var OLD_KEY = 'wal-studio-v1';
  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');

  var LEVELS = ['Empty', 'Low', 'Okay', 'Good', 'High'];
  var DECISIONS = [['continue', 'Continue'], ['adjust', 'Adjust'], ['pause', 'Pause']];
  var LINES = {
    heavy: { title: 'When the day feels heavy', lines: ['I can start with the energy I have.', 'I can feel unsure and still take one small step.', 'What would make the next ten minutes more doable?'] },
    testing: { title: 'When I\'m testing an idea', lines: ['I can care about this idea and stay curious about what happens.', 'I\'m allowed to learn something I didn\'t expect.', 'One honest observation gives me something to work with.'] },
    showing: { title: 'When I\'m ready to show the work', lines: ['I can let one real person see this version.', 'I can share it simply and leave room for a response.', 'I can ask for help with one specific thing.'] },
    inviting: { title: 'When I\'m inviting or following up', lines: ['I can make a clear invitation and let the other person choose.', 'I can follow up once, warmly and plainly.', 'I can hear a no and let it teach me something.'] }
  };

  var ICON = {
    seed: '<path d="M12 3c4 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2-7 6-11z"/><path d="M12 13v5"/>',
    root: '<path d="M12 8.5C12 5.5 10 3.5 7 3.5c0 3 2 5 5 5z"/><path d="M12 8.5c0-2.6 2-4.6 5-4.6 0 2.6-2 4.6-5 4.6z"/><path d="M8 9.5h8c0 4.5-1.4 8.3-4 11.5-2.6-3.2-4-7-4-11.5z"/><path d="M9.6 13.5h2.2M12.4 16h2"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 12c0-3 2.5-5 6-5 0 3-2.5 5-6 5z"/>',
    bloom: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="5.5" r="2.5"/><circle cx="18.5" cy="12" r="2.5"/><circle cx="12" cy="18.5" r="2.5"/><circle cx="5.5" cy="12" r="2.5"/>',
    pollinate: '<ellipse cx="12" cy="14.5" rx="4" ry="5.5"/><path d="M8.4 13h7.2M8.4 16h7.2"/><path d="M9.5 9.5C6.5 9.5 4 7.5 4.3 5c2.6-.6 5.2.8 6 3.6"/><path d="M14.5 9.5c3 0 5.5-2 5.2-4.5-2.6-.6-5.2.8-6 3.6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    pause: '<path d="M9 5.5v13M15 5.5v13"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>'
  };
  /* Grounding pause: a short guided audio, played only when the person taps it. Replace pause.m4a with
     Ran's recording (same name, or change this line). The current file is a text-to-speech placeholder. */
  /* Guided audio recorded by Ran (2026-11-20). Grounding pause on the working page before you start; NSDR in Rest. */
  var TRACKS = {
    grounding: { src: 'grounding.m4a', title: 'Grounding pause', intro: 'A short guided breath with Ran to settle in before you start.', note: 'About two and a half minutes, before you start.' },
    nsdr: { src: 'nsdr.m4a', title: 'NSDR · deep rest', intro: 'Guided deep rest with Ran, about nine minutes. Lie down or lean back.', note: 'About nine minutes. Lie down or lean back if you can.' }
  };
  var RESULTS = [['done', 'Did it'], ['part', 'Did part of it'], ['stuck', 'Got stuck'], ['changed', 'Changed the plan'], ['not', 'Did not get to it']];
  var LOGO = '<svg class="logo" aria-hidden="true" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="24" cy="24" r="16.3"/><circle cx="24" cy="24" r="10.8"/><circle cx="24" cy="24" r="5.3"/></g><ellipse cx="35.3" cy="10.8" rx="8.2" ry="4.1" transform="rotate(-45 35.3 10.8)" fill="#D9E76C" stroke="currentColor" stroke-width="2.4"/></svg>';
  /* The feedback relay (relay/feedback-worker.js). When set, "Send to Ran" posts feedback straight into
     the Notion feedback table. When empty, Grove falls back to the share sheet. */
  var FEEDBACK_ENDPOINT = 'https://grove-feedback.randing-work.workers.dev/';
  function svg(name, size) {
    return '<svg aria-hidden="true" width="' + (size || 26) + '" height="' + (size || 26) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + '</svg>';
  }

  var MAP = [
    { key: 'seed', name: 'Seed', title: 'Choose what matters', fields: ['what', 'why'], prompts: ['vision', 'landscape', 'canvas'],
      when: 'You are unsure why this is worth building, or you keep switching ideas.',
      write: 'Why this matters to you, who gets stuck and when, and what you would notice if things got better for them.',
      tryIt: 'Pick the part you are least sure about and make it this week\'s goal. Then show it to one other person, and listen. That is Reach.',
      question: 'Which part of this idea am I least sure about?' },
    { key: 'root', name: 'Root', title: 'Know who it is for', fields: ['who', 'before', 'after'], prompts: ['profile', 'storyboard', 'conversation', 'persona'],
      when: 'You are building for "everyone", or you have not talked to anyone yet.',
      write: 'One real person. What is happening around them, what they tell themselves, how that feels, what they do or avoid. Then the same once the problem is solved.',
      tryIt: 'Ask one person about the last time the problem happened. What did they do, what did they try, what did it cost them? Save one sentence in their words. That is Reach.',
      question: 'What did one real person do the last time this problem came up?' },
    { key: 'sprout', name: 'Sprout', title: 'Make the smallest offer', fields: ['offer'], prompts: ['demo', 'concept'],
      when: 'You keep adding features, or you cannot say what it is in one breath.',
      write: 'The smallest version you could put in front of someone, who it is for and who it is not for.',
      tryIt: 'Watch one real person use it on their own task. Say as little as you can. That is Reach.',
      question: 'What happens when one person tries the smallest version on their own task?' },
    { key: 'bloom', name: 'Bloom', title: 'Show the work', fields: ['place'], prompts: ['content', 'videoscript', 'notebooklm', 'handmade'],
      when: 'The work exists and nobody has seen it.',
      write: 'One place and one kind of person, and the one thing you want them to do next.',
      tryIt: 'Share it once, there, with that ask. Note who actually does it. Each reaction is Reach.',
      question: 'Who takes the next step when I show this in one place?' },
    { key: 'pollinate', name: 'Pollinate', title: 'Invite, follow up, let it travel', fields: ['invite'], prompts: ['pitch', 'followup', 'investors'],
      when: 'People say "nice" and nothing happens, or the work is not travelling beyond the people you know.',
      write: 'A concrete invitation and what saying yes involves, such as bringing a project, booking a trial, or paying a stated price.',
      tryIt: 'Ask one person directly. Follow up once. Then ask who else might like to see it. Record what they did and what a no or a silence taught you. A no counts as Reach.',
      question: 'Who says yes to a concrete invitation, and who do they pass it on to?' }
  ];

  /* The questions Grove asks before it builds a prompt. Answers are saved, so each is written once. */
  var FIELDS = {
    what: ['project.what', 'Your goal', 'A sentence is enough.'],
    why: ['project.why', 'Why does this matter to you?', 'Your own reason, in your own words.'],
    place: ['project.place', 'Where will you show it, and to whom?', 'One place and one kind of person.'],
    invite: ['project.invite', 'What do you want them to do next?', 'Try it, book a call, bring a project, pay a stated price.'],
    contact: ['project.contact', 'How can they reach you?', 'A link, an email or a handle. It stays on this device until you share the card.'],
    who: ['project.who', 'Who is it for? One real person is best.', 'A name, or someone like "a freelance designer with two clients".'],
    before: ['project.before', 'What is it like for them now?', 'What is happening, what they tell themselves, how it feels, what they do.'],
    after: ['project.after', 'What would be different once this is solved?', ''],
    offer: ['project.offer', 'What is the smallest thing you could offer them?', ''],
    question: ['week.question', 'This week\'s goal', ''],
    sign: ['week.sign', 'What sign would show it is going well?', ''],
    step: ['day.step', 'What is today\'s step?', ''],
    idealPlace: ['project.idealPlace', 'Where you are, and what you notice', 'e.g. the light, the sounds, the room'],
    idealDoing: ['project.idealDoing', 'What you are doing, and with whom', 'e.g. the work itself, the people it is for'],
    idealFeel: ['project.idealFeel', 'How it feels', 'e.g. in your body, your mood, your breath']
  };
  var PROMPTS = {
    conversation: { title: 'Prepare a real user conversation', blurb: 'Five neutral questions about the last time the problem came up, and a sentence to ask for the talk.', fields: ['what', 'who', 'question'],
      ask: ['Help me prepare one conversation with a real person this week.', 'Give me five neutral questions about the last time this problem came up for them: what they did, what they tried, what it cost them.', 'No leading questions and no pitching. Then write one short, friendly sentence I can use to ask for the conversation.'] },
    smaller: { title: 'Make this step smaller', blurb: 'Three ten-minute versions of today\'s step that can still teach you something.', fields: ['what', 'question', 'step'],
      ask: ['Give me three smaller versions of today\'s step. Each should take about ten minutes and still move this week\'s goal forward.'] },
    vision: { title: 'Say what this is in two sentences', blurb: 'A short description in your own words, and one small next step.', fields: ['what', 'who', 'after'],
      ask: ['Using only my words above, write two sentences: who this is for and what changes for them.', 'Then suggest one small next step I could take in ten to thirty minutes.', 'Do not add claims I did not make.'] },
    landscape: { title: 'What do people use today?', blurb: 'A look at how this problem gets solved now, including doing nothing.', fields: ['what', 'who'],
      ask: ['List what people in this situation already use to deal with this problem, including doing nothing or using a spreadsheet.', 'For each: what it does well, and where it falls short for the person I described.', 'Say which points you are unsure about. Do not invent product names, prices or numbers.'] },
    profile: { title: 'Describe the person I am building for', blurb: 'A one-page picture of one person, before and after.', fields: ['who', 'before', 'after'],
      ask: ['Write a short profile of this one person from my notes: their situation, what they tell themselves, how it feels, and what they do or avoid. Then the same four points once the problem is solved.', 'Mark anything you are guessing with (guess), so I can check it with a real person.'] },
    persona: { title: 'Rehearse with a stand-in', blurb: 'The AI plays your person so you can practise before the real talk.', fields: ['who', 'before', 'offer'],
      ask: ['Play this person so I can rehearse a conversation. Stay in character and answer as they honestly would, including doubts and polite brush-offs.', 'Start by asking what I want to talk about. After five exchanges, step out of character and tell me which of my questions were leading.', 'This is practice. It does not replace talking to a real person.'] },
    demo: { title: 'Plan the roughest demo', blurb: 'What to build, what to fake and what to leave out, explained so you can change it yourself.', fields: ['what', 'who', 'offer'],
      ask: ['Help me plan the roughest demo that lets one person try this on their own task in ten minutes.', 'Tell me the one screen or step that matters, what I can fake, and what to leave out. Then write a prompt I can give to an AI building tool.', 'Explain each choice so I can change it myself.'] },
    concept: { title: 'Plan a quick test', blurb: 'What to show, what to ask, what to watch for, and what would change your mind.', fields: ['offer', 'who', 'question'],
      ask: ['Write a short test plan: what I show, what I ask the person to do, what I watch for, and what result would change my mind.', 'Remind me to stay quiet while they try.'] },
    videoscript: { title: 'Write a one-minute video script', blurb: 'A hook, three short shots and an invitation, ready to record on your phone.', fields: ['what', 'who', 'before', 'after', 'invite'],
      ask: ['Write a script for a 60-second phone video about this project, for the person described above.', 'Structure: a one-line hook for the first three seconds; three short shots, each with what I say and what the camera shows; one clear invitation at the end.', 'Use my own words where you can, keep sentences short, and mark anything you guessed with (guess). Do not invent results.'] },
    notebooklm: { title: 'Make a short video in NotebookLM', blurb: 'A brief to paste into NotebookLM with your notes, so its video overview explains your project.', fields: ['what', 'who', 'after', 'question', 'invite'],
      ask: ['Write a brief I can paste into NotebookLM together with my notes, so that its video overview explains this project to the person described above.', 'Include: who the video is for, the three points it should make in plain words, one real moment from this week (leave a blank for me to fill in), and the one thing I want viewers to do next.', 'Keep it under 200 words. Do not invent results or numbers.'] },
    handmade: { title: 'Make it by hand', blurb: 'A paper or physical prototype you can put in front of someone this week.', fields: ['what', 'who', 'offer'],
      ask: ['Help me make a hand-made prototype of this that I can put in front of one real person this week: paper, cardboard, sticky notes, a printed page, or a role-played session.', 'Give me two options. For each: the materials, how to make it in under an hour, and three things to ask the person while they try it.', 'Nothing digital is needed.'] },
    content: { title: 'What could I share, and where?', blurb: 'Five things to share that lead to one next action, and where to find these people.', fields: ['who', 'before', 'after', 'offer'],
      ask: ['Suggest five things I could share in one place where these people already are. Each one starts from their situation today and points to one next action.', 'Then suggest three kinds of places where I might find them.', 'Do not invent facts about my work or results.'] },
    pitch: { title: 'Practise the invitation', blurb: 'The AI plays your person while you make a concrete ask.', fields: ['who', 'offer', 'after'],
      ask: ['Play this person while I make a concrete invitation, including a price if I state one. Raise the two or three most likely hesitations, one at a time.', 'Afterwards, tell me where I over-explained and give me a shorter version of my ask.'] },
    followup: { title: 'Set up a follow-up list', blurb: 'A simple list of who you asked and when, and one warm follow-up message.', fields: ['who', 'offer'],
      ask: ['Set up a simple follow-up list I can keep in a note or a spreadsheet: the columns, one example row, and a short follow-up message I can send once.', 'The message should be warm and plain, and easy to say no to.'] },
    canvas: { title: 'Sketch the business on one page', blurb: 'A first-draft business model canvas from your notes, with the guesses marked.', fields: ['what', 'who', 'offer', 'after'],
      ask: ['Fill in a business model canvas from my notes: who it serves, the value to them, how it reaches them, how the relationship works, how money comes in, key activities, key resources, key partners and main costs.', 'Mark every box you had to guess with (guess). Then tell me which two guesses are riskiest and how I could test each one this week.'] },
    storyboard: { title: 'Storyboard one person\'s day', blurb: 'Six frames, from the moment the problem shows up to the moment it is solved.', fields: ['who', 'before', 'after', 'offer'],
      ask: ['Write a six-frame storyboard for this one person: the moment the problem shows up, what they try, where it goes wrong, how they come across my offer, the first time they use it, and what is different afterwards.', 'One or two sentences per frame, in plain words. Mark what you are guessing with (guess).'] },
    investors: { title: 'Keep track of supporters and funders', blurb: 'A simple list of people who might back the project, and a monthly update to send them.', fields: ['what', 'who', 'after', 'invite'],
      ask: ['Set up a simple list for people who might support or fund this: the columns, one example row, and what to note after each conversation.', 'Then draft a short update I could send once a month: what I tried, what I learned, what I need. Leave the numbers blank for me to fill in.'] }
  };

  /* ---------- state ---------- */

  function blank() {
    return {
      v: 2, screen: 'today',
      project: { what: '', why: '', who: '', before: '', after: '', offer: '', place: '', invite: '', contact: '', idealPlace: '', idealDoing: '', idealFeel: '', ideal1: '', ideal2: '', ideal3: '', ideal4: '', ideal5: '', ideal6: '', offerPath: '', fit: '', periodGoal: '', soThat: '', weeks: 4 },
      weeks: {}, days: {}, rings: [], paused: false,
      review: { decision: '', reason: '' },
      feedback: { name: '', contact: '', again: '', tried: '', stuck: '', change: '', include: false, shareCounts: true, first: '' },
      usage: { prompts: 0, offers: 0 },
      ui: { confirm: '', viewWeek: '', note: '', theme: 'light', promptKind: '', promptFrom: 'week', lineIdx: 0, toured: false, tourIdx: 0, mapSeen: false, setupDone: false, setupIdx: 0, idealStep: 0, isExample: false }
    };
  }

  function migrateOld(old) {
    var s = blank();
    s.project.what = (old.project && old.project.what) || '';
    s.project.who = (old.project && old.project.who) || '';
    Object.keys(old.days || {}).forEach(function (k) {
      var o = old.days[k];
      s.days[k] = { energy: o.energy || 0, energySkipped: o.checkin === 'skipped', planned: '', step: o.step || '', shrunk: false, rest: !!o.rest,
        happened: o.evidence || '', changes: o.learned || '', person: false, evidence: !!(o.evidence && o.kind === 'evidence'), out: !!(o.done || o.rest) };
    });
    var wk = monday(today());
    s.weeks[wk] = { question: old.goal || (old.card && old.card.learn) || '', sign: (old.card && old.card.evidence) || '', who: '', plan: {} };
    if (old.queued) s.weeks[wk].plan[today()] = { step: old.queued, rest: false };
    return s;
  }

  /* The four one-tap "so that" options from v0.7.4, kept only to move old answers (see load). */
  var OLD_SO_THAT = ['I earn from what I know', 'I prove to myself I can', 'it helps people like me', 'just for the joy of it'];
  function load() {
    var base = blank();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.v === 2) {
          Object.keys(d).forEach(function (k) { base[k] = d[k]; });
          ['project', 'review', 'feedback', 'ui'].forEach(function (k) { base[k] = Object.assign({}, blank()[k], d[k] || {}); });
          base.ui.confirm = ''; base.ui.pause = ''; base.ui.editStep = false; base.ui.shrink = false; base.ui.custom = false; base.ui.outDate = '';
          if (base.screen === 'checkout' || base.screen === 'tour' || base.screen === 'setup') base.screen = 'today';
          /* v0.7.5: a "so that" picked from the old one-tap options moves from project.why to project.soThat */
          if (!base.project.soThat && OLD_SO_THAT.indexOf((base.project.why || '').trim()) >= 0) { base.project.soThat = base.project.why.trim(); base.project.why = ''; }
        }
      } else {
        var oldRaw = localStorage.getItem(OLD_KEY);
        if (oldRaw) { var old = JSON.parse(oldRaw); if (old && old.v === 1) base = migrateOld(old); }
      }
    } catch (e) { /* storage unavailable: run without saving */ }
    return base;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } }

  /* ---------- helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function iso(d) {
    var z = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate());
  }
  function today() { return iso(new Date()); }
  function parse(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
  function addDays(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function monday(s) { var dow = (parse(s).getDay() + 6) % 7; return addDays(s, -dow); }
  function nice(s) { return parse(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function shortDay(s) { return parse(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' }); }
  function range(wk) { return nice(wk) + ' to ' + nice(addDays(wk, 6)); }
  function has(s) { return !!(s && String(s).trim()); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }

  var S = load();
  /* Everyone goes through setup once, new or not (v0.7). It can be skipped, and opened again from the footer.
     The five-card tour stays under "How Grove works". */
  if (!S.ui.setupDone) { S.screen = 'setup'; S.ui.setupIdx = 0; S.ui.idealStep = 0; }

  function W(key) {
    if (!S.weeks[key]) S.weeks[key] = { question: '', sign: '', who: '', plan: {} };
    if (!S.weeks[key].plan) S.weeks[key].plan = {};
    return S.weeks[key];
  }
  function planFor(date) {
    var w = W(monday(date));
    if (!w.plan[date]) w.plan[date] = { step: '', rest: false };
    return w.plan[date];
  }
  function D() {
    var t = today();
    if (!S.days[t]) S.days[t] = { energy: 0, energySkipped: false, planned: '', step: '', shrunk: false, rest: false, happened: '', changes: '', person: false, evidence: false, out: false,
      ready: false, startedAt: '', result: '', line: '' };
    var rec = S.days[t];
    var p = planFor(t).step || '';
    if (!rec.out && rec.planned !== p) {
      if (!has(rec.step) || rec.step === rec.planned) rec.step = p;
      rec.planned = p;
    }
    return rec;
  }
  /* The day being checked out: today, or an earlier day that was started and never wrapped up. */
  function outRec() { return (S.ui.outDate && S.days[S.ui.outDate]) || D(); }
  function openYesterday() {
    var y = addDays(today(), -1), r = S.days[y];
    return r && r.startedAt && !r.out ? y : '';
  }
  function clock(isoTime) {
    var t = new Date(isoTime);
    return isNaN(t) ? '' : t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  /* Working-page timer. The spec is in docs/PRODUCT.md, "The working page"; change that first.
     It never starts by itself: idle -> running (tap Start) -> paused (Pause) or done (reaches zero).
     Reset goes back to idle. The breathing shape keeps breathing and empties like water as time runs. */
  var CHIPS = { work: [5, 25, 45], rest: [5, 10, 15] };
  var REST_IDEAS = [
    ['Walk outside', 'A few minutes outdoors, without your phone if you can.'],
    ['NSDR', 'Non-sleep deep rest. Ran\'s guided version is just below.'],
    ['Stretch', 'Neck, shoulders and back, slowly.'],
    ['Drink water', 'A glass of water, away from your desk.'],
    ['Look far away', 'Out of a window, at something in the distance.']
  ];
  function defaultMins(d, mode) {
    if (mode === 'rest') return d.restMins || 5;
    if (d.workMins) return d.workMins;
    return d.energy && d.energy <= 2 ? 5 : (d.energy >= 4 ? 45 : 25);
  }
  function timerOf(d) {
    var t = d.timer;
    if (!t || !t.mins) { var m = defaultMins(d, 'work'); t = d.timer = { mode: 'work', mins: m, end: '', left: m * 60000 }; }
    if (t.start && t.end === undefined) { t.end = new Date(new Date(t.start).getTime() + t.mins * 60000).toISOString(); delete t.start; } /* v0.6.x records */
    return t;
  }
  function running(t) { return !!t.end; }
  /* v0.7.6: the timer is folded away until asked for (Wendy, 11-25). It stays open once used that day. */
  function timerShown(d) { var t = d.timer; return !!(d.timerOn || (t && (t.end || (typeof t.left === 'number' && t.left < t.mins * 60000)))); }
  function leftMs(t) { return running(t) ? new Date(t.end).getTime() - Date.now() : (typeof t.left === 'number' ? t.left : t.mins * 60000); }
  function timerDone(t) { return running(t) && leftMs(t) <= 0; }
  function msLeft(ms) {
    var s0 = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s0 / 3600), m = Math.floor(s0 % 3600 / 60), x = s0 % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  }
  function level(t) { return Math.max(0, Math.min(1, leftMs(t) / (t.mins * 60000))); }
  function timerBlob(d) {
    var t = timerOf(d);
    return '<span id="t-blob" class="blob lv' + (d.energy || 3) + ' breathe-slow timer-blob' + (t.mode === 'rest' ? ' rest' : '') + '" aria-hidden="true">' +
      '<span id="t-water" class="water" style="--level:' + level(t).toFixed(3) + '"></span></span>';
  }
  function timerBlock(d) {
    var t = timerOf(d), rest = t.mode === 'rest';
    var modes = '<div class="mode-seg" role="group" aria-label="Timer mode">' +
      '<button class="' + (rest ? '' : 'on') + '" data-act="setMode" data-arg="work" aria-pressed="' + !rest + '">Work</button>' +
      '<button class="' + (rest ? 'on' : '') + '" data-act="setMode" data-arg="rest" aria-pressed="' + rest + '">Rest</button></div>';
    if (timerDone(t)) {
      return modes + '<p class="t-done serif">' + (rest ? 'Rest is over.' : 'Time is up.') + '</p>' +
        '<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">' + (rest
          ? '<button class="btn small-btn" data-act="startWork">Start working again</button>'
          : '<button class="btn small-btn" data-act="startRest">Start a ' + defaultMins(d, 'rest') + '-minute rest</button><button class="btn ghost small-btn" data-act="moreTime">10 more minutes</button>') + '</div>';
    }
    var idle = !running(t) && leftMs(t) >= t.mins * 60000, paused = !running(t) && !idle;
    var controls = running(t)
      ? '<button class="btn ghost small-btn" data-act="timerPause">Pause</button><button class="link" data-act="timerReset">Reset</button>'
      : '<button class="btn small-btn t-start" data-act="timerStart">' + (paused ? 'Resume' : (rest ? 'Start rest' : 'Start timer')) + '</button>' + (paused ? '<button class="link" data-act="timerReset">Reset</button>' : '');
    var chips = '';
    if (idle) {
      chips = CHIPS[t.mode].map(function (x) {
        return '<button class="' + (t.mins === x ? 'on' : '') + '" data-act="setBox" data-arg="' + x + '" aria-pressed="' + (t.mins === x) + '">' + x + ' min</button>';
      }).join('');
      var custom = CHIPS[t.mode].indexOf(t.mins) < 0;
      chips += S.ui.custom
        ? '<span class="custom-min"><input id="custom-min" type="number" inputmode="numeric" min="1" max="180" value="' + t.mins + '" aria-label="Minutes"><button data-act="setCustom">Set</button></span>'
        : '<button class="' + (custom ? 'on' : '') + '" data-act="customToggle">' + (custom ? t.mins + ' min' : 'Custom') + '</button>';
      chips = '<div class="seg chips box-chips" aria-label="Minutes">' + chips + '</div>';
    }
    return modes + '<span id="t-left" class="t-left" role="timer" aria-live="off">' + msLeft(leftMs(t)) + '</span>' +
      '<span class="small muted">' + (running(t) ? (rest ? 'resting' : 'left') : (paused ? 'paused' : 'Starts when you tap ' + (rest ? 'Start rest' : 'Start timer'))) + '</span>' +
      chips + '<div class="row" style="justify-content:center;gap:14px;margin-top:4px">' + controls + '</div>';
  }
  function restIdeas() {
    return '<div class="rest-ideas stack"><span class="label">Ideas for a good rest</span>' +
      REST_IDEAS.map(function (r) { return '<div class="rest-idea"><strong>' + r[0] + '</strong><span class="small muted">' + r[1] + '</span></div>'; }).join('') +
      '</div>';
  }
  function setTimer(d, mode, mins, start) {
    d.timer = { mode: mode, mins: mins, end: start ? new Date(Date.now() + mins * 60000).toISOString() : '', left: mins * 60000 };
    if (mode === 'work') d.workMins = mins; else d.restMins = mins;
    S.ui.custom = false; S.ui.timerDone = false; render();
  }
  function minutesWorked(d) {
    if (!d.startedAt || !d.wrappedAt) return 0;
    var m = Math.round((new Date(d.wrappedAt) - new Date(d.startedAt)) / 60000);
    return m > 0 && m < 720 ? m : 0;
  }
  function viewWeek() { return S.ui.viewWeek || monday(today()); }
  function weekDays(wk) { var out = []; for (var i = 0; i < 7; i++) out.push(addDays(wk, i)); return out; }
  function notesIn(wk) {
    return weekDays(wk).filter(function (k) { return S.days[k] && S.days[k].out; }).map(function (k) { return Object.assign({ date: k }, S.days[k]); });
  }
  function reviewWeek() {
    var cur = monday(today()), prev = addDays(cur, -7);
    var ringed = S.rings.some(function (r) { return r.week === prev; });
    if (!notesIn(cur).length && notesIn(prev).length && !ringed) return prev;
    return cur;
  }
  function lastPerson() {
    var keys = Object.keys(S.days).filter(function (k) { return S.days[k].person && S.days[k].out; }).sort();
    return keys.length ? keys[keys.length - 1] : '';
  }
  /* Low energy (1-2): a few questions to look at it differently before choosing the step.
     Self-compassion (asking what you would tell a friend) and reappraisal (what would make it easier). */
  var DRAINS = ['Sleep', 'Worry', 'Too much on my plate', 'My body', 'Not sure'];
  function reframeCard(d) {
    if (!(d.energy && d.energy <= 2) || d.reframe === 'skipped') return '';
    if (d.reframe === 'done') {
      var bits = [d.drain, d.kind, d.easier].filter(has);
      return bits.length ? '<button class="notice reframe-done" data-act="reframeOpen"><span class="label">What you noticed</span><span class="small">' + esc(bits.join(' · ')) + '</span></button>' : '';
    }
    var chips = DRAINS.map(function (x) { return '<button class="' + (d.drain === x ? 'on' : '') + '" aria-pressed="' + (d.drain === x) + '" data-act="drain" data-arg="' + esc(x) + '">' + x + '</button>'; }).join('');
    return '<div class="reframe stack"><span class="label">Low energy today? A few questions, if you like</span>' +
      '<p class="small">What is taking your energy today?</p><div class="seg chips">' + chips + '</div>' +
      field('If a friend felt like this, what would you tell them?', 'day.kind', d.kind, 'e.g. you are allowed to go slowly today', 2) +
      field('What would make the next ten minutes a little easier?', 'day.easier', d.easier, 'e.g. tea first, phone in another room', 2) +
      '<div class="row" style="gap:14px"><button class="btn ghost small-btn" data-act="reframeDone">Done</button><button class="link" data-act="reframeSkip">Skip</button></div></div>';
  }
  function stepExamples(d) {
    if (d.energy && d.energy <= 2) return ['Write three bullet points about it', 'Fix one small part, five minutes', 'Reread yesterday\'s note'];
    if (d.energy === 3) return ['Work on one part for 25 minutes', 'Draft the next section', 'Write down the question I am stuck on'];
    if (d.energy >= 4) return ['Show it to one person and ask one question', 'Make a rough version I can show', 'Ask someone who has done this before'];
    return ['Work on one part for 25 minutes', 'Write three bullet points about it', 'Show it to one person'];
  }
  function exampleBanner() {
    return S.ui.isExample ? '<div class="notice row" style="justify-content:space-between;gap:10px;flex-wrap:wrap"><span class="small">You are looking at an example.</span>' +
      '<button class="btn ghost small-btn" data-act="clearExample">Clear it and start my own</button></div>' : '';
  }
  /* The Reach line: one reaction from someone else, each week (v0.7.6, was "someone it is for"). Personal when This Week has a name. */
  function personLine() {
    var last = lastPerson(), wk = monday(today()), who = (W(wk).who || '').trim();
    if (last && last >= wk) {
      var n = daysBetween(last, today());
      return { text: 'Reach: someone else reacted ' + (n === 0 ? 'today' : (n === 1 ? 'yesterday' : n + ' days ago')) + '.', warn: false };
    }
    if (who) return { text: 'This week: a reaction from ' + who + '. Not yet.', warn: true };
    return { text: 'This week: one reaction from someone else. Not yet. Tap to pick who.', warn: true };
  }
  function hasAnyData() {
    return has(S.project.what) || Object.keys(S.days).some(function (k) { return S.days[k].out || has(S.days[k].step) || S.days[k].energy; }) ||
      Object.keys(S.weeks).some(function (k) { var w = S.weeks[k]; return has(w.question) || has(w.sign) || Object.keys(w.plan || {}).some(function (d) { return has(w.plan[d].step); }); });
  }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 2400);
  }
  function sizeLine(energy) {
    if (!energy) return '';
    if (energy <= 2) return 'Low energy: what is the smallest step that still tells you something? Five minutes is enough.';
    if (energy === 3) return 'Steady energy: what could you do in about half an hour?';
    return 'Good energy: is there a step you have been saving for a day like this, like watching someone use it?';
  }
  function linesFor(d) {
    var step = d.step || '';
    var kind = d.energy && d.energy <= 2 ? 'heavy'
      : (/invite|follow|price|pay|offer/i.test(step) ? 'inviting'
        : (/send|show|share|ask|post|call|message|email|meet|interview/i.test(step) ? 'showing' : 'testing'));
    return LINES[kind].lines;
  }
  /* Picked once a day and kept, so the same line is there when the person comes back. */
  function lineFor(d) {
    if (!has(d.line)) { var list = linesFor(d); d.line = list[parse(today()).getDate() % list.length]; }
    return d.line;
  }
  function applyTheme() {
    var dark = S.ui.theme === 'dark';
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute('content', dark ? '#121412' : '#F7F3EC');
  }

  /* ---------- prompts (copied to the person's own AI; nothing is sent from here) ---------- */

  function fieldValue(key) {
    var p = FIELDS[key][0].split('.');
    if (p[0] === 'project') return S.project[p[1]] || '';
    if (p[0] === 'week') return W(monday(today()))[p[1]] || '';
    return D()[p[1]] || '';
  }
  function promptFilled(kind) { return PROMPTS[kind].fields.filter(function (k) { return has(fieldValue(k)); }).length; }
  function buildPrompt(kind) {
    var P = PROMPTS[kind];
    var lines = ['Help me move my project forward. Here is what I have so far.', ''];
    P.fields.forEach(function (k) {
      var v = fieldValue(k);
      lines.push(FIELDS[k][1].replace(/\?.*$/, '').replace(/\.$/, '') + ': ' + (has(v) ? v.trim() : '(not written yet)'));
    });
    if (P.fields.indexOf('what') >= 0 && S.project.weeks) lines.push('Time I am giving it: ' + S.project.weeks + ' weeks');
    var d = D();
    if (d.energy) lines.push('My energy today: ' + d.energy + ' of 5');
    lines.push('');
    P.ask.forEach(function (a) { lines.push(a); });
    lines.push('Suggest, don\'t decide for me. If something is unclear, ask me one question first.');
    return lines.join('\n');
  }
  /* v0.7.6: a small daily reminder. Grove makes a calendar file on the phone; nothing is sent anywhere. */
  function remindRow() {
    if (!S.ui.remindOpen) return '<button class="link remind-link" data-act="remindOpen">' + svg('bell', 18) + '<span>' + (S.ui.remindAt ? 'Daily reminder at ' + esc(S.ui.remindAt) + ' · change' : 'Remind me tomorrow') + '</span></button>';
    return '<div class="card stack remind-card"><label class="label" for="remind-time">Remind me each day at</label>' +
      '<div class="row" style="gap:10px;align-items:center"><input id="remind-time" class="remind-time" type="time" value="' + esc(S.ui.remindAt || '09:00') + '">' +
      '<button class="btn ghost small-btn" data-act="remindAdd">Add to calendar</button></div>' +
      '<span class="small muted">It goes into your own calendar and repeats each day. Delete it there any time.</span></div>';
  }
  function icsFile(hhmm) {
    var p = (hhmm || '09:00').split(':'), t = new Date(); t.setDate(t.getDate() + 1); t.setHours(Number(p[0]) || 9, Number(p[1]) || 0, 0, 0);
    var two = function (n) { return String(n).padStart(2, '0'); };
    var local = t.getFullYear() + two(t.getMonth() + 1) + two(t.getDate()) + 'T' + two(t.getHours()) + two(t.getMinutes()) + '00';
    var now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var url = 'https://randing-create.github.io/grove/';
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Grove//Daily reminder//EN', 'BEGIN:VEVENT',
      'UID:grove-daily-' + Date.now() + '@grove', 'DTSTAMP:' + now, 'DTSTART:' + local, 'DURATION:PT10M', 'RRULE:FREQ=DAILY',
      'SUMMARY:Grove · one small step', 'DESCRIPTION:Open Grove and check in: ' + url, 'URL:' + url,
      'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:Grove · one small step', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'].join('\r\n') + '\r\n';
  }
  function copyText(text, okMsg) {
    var done = function () { toast(okMsg || 'Copied.'); };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy. Open the preview and select the text.'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }
  function seenThisWeek() { var l = lastPerson(); return l && l >= monday(today()) ? 'Yes' : 'Not yet'; }
  function recordedText() {
    var wk = monday(today()), st = statsFor(wk), u = S.usage || {};
    var mapKeys = []; MAP.forEach(function (m) { mapKeys = mapKeys.concat(m.fields); });
    var mapDone = mapKeys.filter(function (k) { return has(fieldValue(k)); }).length;
    return ['This week: Show up ' + st.shown + ' of 7, Learn ' + st.learn + ' of 3, Reach ' + st.reach + '.',
      'Setup done: ' + (S.ui.setupDone ? 'yes' : 'no') + '. Weeks planned: ' + (S.project.weeks || '-') + '. Weekly goal written: ' + (has(W(wk).question) ? 'yes' : 'no') + '. Growth Rings saved: ' + S.rings.length + '.',
      'Growth Map answers: ' + mapDone + ' of ' + mapKeys.length + '. Prompts copied: ' + (u.prompts || 0) + '. Offer cards shared: ' + (u.offers || 0) + '.', 'Grove version: ' + APP_VERSION + '.'].join('\n');
  }
  function sharedNotes() {
    if (!S.feedback.include) return '';
    var w = W(monday(today()));
    var out = ['This week\'s goal: ' + (has(w.question) ? w.question.trim() : '(not written)')];
    notesIn(monday(today())).forEach(function (n) {
      if (has(n.happened) || has(n.changes)) out.push(shortDay(n.date) + ': ' + (n.happened || '').trim() + (has(n.changes) ? ' → ' + n.changes.trim() : ''));
    });
    return out.join('\n');
  }
  /* Anonymous counts (agreed by Ran, 2026-11-19): the week's ring numbers and a random device id, no names and no
     text, sent through the feedback relay. Once a day when Grove opens, and after each check-out. Off switch in
     setup and in This Week. When a new week starts, last week's final numbers go first. */
  function countsPayload(wk) {
    var st = statsFor(wk);
    return { type: 'counts', device: S.ui.deviceId, week: wk, show: st.shown, learn: st.learn, reach: st.reach,
      setup: !!S.ui.setupDone, weeks: S.project.weeks || 0, version: APP_VERSION };
  }
  function sendCounts(force) {
    if (!FEEDBACK_ENDPOINT || S.feedback.shareCounts === false || (navigator.onLine === false)) return;
    if (!S.ui.setupDone && !hasAnyData()) return;
    var t = today(); if (!force && S.ui.countsDay === t) return;
    if (!S.ui.deviceId) S.ui.deviceId = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
    var wk = monday(t), weeks = [wk];
    if (S.ui.countsDay && S.ui.countsDay < wk) weeks.unshift(monday(S.ui.countsDay));
    Promise.all(weeks.map(function (w) {
      return fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(countsPayload(w)) })
        .then(function (r) { if (!r.ok) throw new Error('relay ' + r.status); });
    })).then(function () { S.ui.countsDay = t; save(); }).catch(function () { /* try again next time */ });
  }
  function feedbackPayload() {
    var f = S.feedback;
    return { name: (f.name || '').trim(), contact: (f.contact || '').trim(), again: f.again || '', tried: (f.tried || '').trim(), stuck: (f.stuck || '').trim(),
      change: (f.change || '').trim(), seen: seenThisWeek(), recorded: recordedText(), notes: sharedNotes() };
  }
  function feedbackText() {
    var p = feedbackPayload();
    var v = function (s) { return has(s) ? s : '(left empty)'; };
    var out = ['Grove feedback · ' + nice(today()) + (p.name ? ' · ' + p.name : ''), '',
      'Would open Grove again next week: ' + v(p.again), 'What I tried: ' + v(p.tried), 'Where I stopped or got stuck: ' + v(p.stuck), 'What I would change: ' + v(p.change),
      'Someone else reacted this week: ' + p.seen, '', 'Recorded by Grove:', p.recorded];
    if (p.contact) out.push('', 'Reach me: ' + p.contact);
    if (p.notes) out.push('', p.notes);
    return out.join('\n');
  }

  /* ---------- view pieces ---------- */

  function backBtn(target) { return '<button class="icon-btn" aria-label="Back" data-act="go" data-arg="' + target + '">' + svg('back', 24) + '</button>'; }
  /* Before someone has checked out once, Today keeps to the main line (v0.7.4). */
  function everOut() { return Object.keys(S.days).some(function (k) { return S.days[k] && S.days[k].out; }); }
  function tabs(active) {
    var t = [['today', 'Today'], ['week', 'This Week'], ['map', 'Growth Map']];
    return '<nav class="tabs" aria-label="Main"><span class="brand rail-brand">' + LOGO + 'Grove</span>' + t.map(function (x) {
      var dot = x[0] === 'map' && !S.ui.mapSeen && everOut() ? '<span class="newdot" aria-label="not opened yet"></span>' : '';
      return '<button data-act="go" data-arg="' + x[0] + '"' + (active === x[0] ? ' class="on"' : '') + '>' + x[1] + dot + '</button>';
    }).join('') + '</nav>';
  }
  function field(label, bind, value, placeholder, rows) {
    var id = 'f-' + bind.replace(/\./g, '-');
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label>' +
      '<textarea id="' + id + '" rows="' + (rows || 2) + '" data-bind="' + bind + '" placeholder="' + esc(placeholder || '') + '">' + esc(value) + '</textarea></div>';
  }
  function check(label, bind, on) {
    return '<label class="check"><input type="checkbox" data-check="' + bind + '"' + (on ? ' checked' : '') + '><span>' + esc(label) + '</span></label>';
  }
  function confirmBox(kind, text) {
    if (S.ui.confirm !== kind) return '';
    return '<div class="notice stack"><p>' + esc(text) + '</p><div class="row">' +
      '<button class="btn small-btn" data-act="' + kind + '" data-arg="yes">Yes, do it</button>' +
      '<button class="btn ghost small-btn" data-act="cancelConfirm">Cancel</button></div></div>';
  }
  function energyPicker() {
    return '<div class="energy"><div class="blob-wrap"><div id="blob" class="blob lv3"></div></div>' +
      '<p id="energy-word" class="serif" style="text-align:center">Okay</p>' +
      '<label class="sr" for="energy-range">Energy from 1 to 5</label>' +
      '<input id="energy-range" type="range" min="1" max="5" step="1" value="3">' +
      '<div class="row between small muted"><span>Empty</span><span>High</span></div></div>';
  }
  /* The three weekly rings guard against the three ways a side project dies (spec in docs/PRODUCT.md):
     outer Show up (you stop) = days you checked in: started a step, chose rest, or recorded the day; target 7;
     middle Learn (you polish) = days you checked out with at least one line written (not rest days); target 3;
     inner Reach (you hide) = a reaction from someone else; target 1. */
  function ringStats(recs) {
    return { shown: recs.filter(function (r) { return r.startedAt || r.out || r.rest; }).length, target: 7,
      learn: recs.filter(function (r) { return r.out && !r.rest && (has(r.happened) || has(r.changes)); }).length, learnTarget: 3,
      reach: recs.filter(function (r) { return r.out && r.person; }).length };
  }
  function statsFor(wk) { return ringStats(weekDays(wk).map(function (k) { return S.days[k]; }).filter(Boolean)); }
  function weekRing(st, size) {
    var arcs = [[50, Math.min(1, st.shown / st.target), 'var(--green)'], [37, Math.min(1, st.learn / st.learnTarget), 'var(--gold)'], [24, Math.min(1, st.reach), 'var(--lilac)']];
    var out = '<svg class="weekring" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" role="img" aria-label="Show up ' + st.shown + ' of ' + st.target + ', learn ' + st.learn + ' of ' + st.learnTarget + ', reach ' + (st.reach ? 'done' : 'not yet') + '">';
    arcs.forEach(function (a) {
      var c = 2 * Math.PI * a[0];
      out += '<circle cx="60" cy="60" r="' + a[0] + '" fill="none" stroke="var(--line)" stroke-width="10"/>';
      if (a[1] > 0) out += '<circle class="arc" cx="60" cy="60" r="' + a[0] + '" fill="none" stroke="' + a[2] + '" stroke-width="10" stroke-linecap="round" transform="rotate(-90 60 60)" stroke-dasharray="' + c.toFixed(1) + '" style="--c:' + c.toFixed(1) + ';stroke-dashoffset:' + (c * (1 - a[1])).toFixed(1) + '"/>';
    });
    return out + '</svg>';
  }
  function ringLegend(st) {
    var row = function (color, text) { return '<span class="row small"><span class="key" style="background:var(--' + color + ')"></span>' + text + '</span>'; };
    var closed = st.shown >= st.target && st.learn >= st.learnTarget && st.reach >= 1;
    return '<div class="stack" style="gap:8px">' + row('green', 'Show up ' + Math.min(st.shown, st.target) + ' of ' + st.target) + row('gold', 'Learn ' + Math.min(st.learn, st.learnTarget) + ' of ' + st.learnTarget) +
      row('lilac', 'Reach ' + (st.reach ? 'done' : 'not yet')) + (closed ? '<span class="small warn">All three rings closed this week.</span>' : '<span class="small muted">Ideas die three ways: you stop, you polish, you hide.</span>') + '</div>';
  }
  function offerText() {
    var v = function (k) { return (fieldValue(k) || '').trim(); };
    var out = [];
    if (v('who')) out.push('For: ' + v('who'));
    if (v('before')) out.push('Right now: ' + v('before'));
    if (v('after')) out.push('With this: ' + v('after'));
    if (v('offer')) out.push('What I am offering: ' + v('offer'));
    if (v('invite')) out.push('Next step: ' + v('invite'));
    if (v('contact')) out.push(v('contact'));
    return out.join('\n');
  }
  function offerCardInner() {
    var rows = [['For', 'who'], ['Right now', 'before'], ['With this', 'after'], ['The offer', 'offer'], ['Next step', 'invite']];
    var body = rows.map(function (r) {
      var val = (fieldValue(r[1]) || '').trim();
      return '<div><span class="label">' + r[0] + '</span><p' + (val ? '' : ' class="empty"') + '>' + (val ? esc(val) : 'Not written yet') + '</p></div>';
    }).join('');
    var contact = (fieldValue('contact') || '').trim();
    return '<div class="offer-head">' + LOGO + '<span>An offer to try</span></div>' + body + (contact ? '<p class="offer-contact">' + esc(contact) + '</p>' : '');
  }
  function offerImage(done) {
    var W0 = 1080, H0 = 1350, pad = 96;
    var cv = document.createElement('canvas'); cv.width = W0; cv.height = H0;
    var g = cv.getContext('2d');
    g.fillStyle = '#F7F3EC'; g.fillRect(0, 0, W0, H0);
    g.fillStyle = '#D9E76C'; g.fillRect(0, 0, W0, 190);
    g.strokeStyle = '#244B3F'; g.lineWidth = 7;
    [44, 29, 14].forEach(function (r) { g.beginPath(); g.arc(pad + 44, 95, r, 0, Math.PI * 2); g.stroke(); });
    g.fillStyle = '#1F2420'; g.font = '600 46px "Instrument Sans", system-ui, sans-serif'; g.textBaseline = 'middle';
    g.fillText('An offer to try', pad + 120, 97);
    var y = 280;
    var wrap = function (text, font, lh, maxLines) {
      g.font = font; var words = text.split(/\s+/); var line = ''; var lines = [];
      words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > W0 - pad * 2 && line) { lines.push(line); line = w; } else line = t; });
      if (line) lines.push(line);
      if (lines.length > maxLines) { lines = lines.slice(0, maxLines); lines[maxLines - 1] = lines[maxLines - 1].replace(/.{0,3}$/, '') + '…'; }
      lines.forEach(function (l) { g.fillText(l, pad, y); y += lh; });
    };
    g.textBaseline = 'alphabetic';
    [['FOR', 'who', 2], ['RIGHT NOW', 'before', 3], ['WITH THIS', 'after', 3], ['THE OFFER', 'offer', 3], ['NEXT STEP', 'invite', 2]].forEach(function (r) {
      var val = (fieldValue(r[1]) || '').trim(); if (!val) return;
      g.fillStyle = '#244B3F'; g.font = '600 26px "Instrument Sans", system-ui, sans-serif'; g.fillText(r[0], pad, y); y += 54;
      g.fillStyle = '#1F2420'; wrap(val, '50px "Instrument Serif", Georgia, serif', 62, r[2]); y += 34;
    });
    var contact = (fieldValue('contact') || '').trim();
    g.fillStyle = '#244B3F'; g.font = '500 34px "Instrument Sans", system-ui, sans-serif';
    if (contact) g.fillText(contact.slice(0, 48), pad, H0 - 130);
    g.fillStyle = '#5B625A'; g.font = '28px "Instrument Sans", system-ui, sans-serif'; g.fillText('Made with Grove by WoMen AI Lab', pad, H0 - 70);
    cv.toBlob(function (blob) { done(blob); }, 'image/png');
  }
  function promptCard(kind, from) {
    var P = PROMPTS[kind]; var n = promptFilled(kind);
    return '<div class="starter"><span class="brand">' + esc(P.title) + '</span><p class="small muted">' + esc(P.blurb) + '</p>' +
      '<div class="row between"><span class="small muted">' + n + ' of ' + P.fields.length + ' answers ready</span>' +
      '<button class="btn ghost small-btn" data-act="openPrompt" data-arg="' + kind + '|' + from + '">Open</button></div></div>';
  }
  /* Bump with every release that goes live, and add a line to CHANGELOG.md. */
  var APP_VERSION = 'v0.7.6';
  var IDLE_TITLE = 'Grove \u00b7 the builder\'s journal';
  /* Where "Community" in the footer goes. Empty until there is a page: then it says it is coming soon. Plan: WoMen AI Lab, later the WAL Academy. */
  var COMMUNITY_URL = '';
  var FOOT = '<p class="foot">Grove by WoMen AI Lab · ' + APP_VERSION + '<br><button class="link foot-link" data-act="tour">How Grove works</button> · <button class="link foot-link" data-act="setupAgain">Setup</button> · <button class="link foot-link" data-act="openFeedback">Feedback</button> · <button class="link foot-link" data-act="community">Community</button></p>';

  /* The tour: the five things worth knowing first. */
  var TOUR = [
    { art: function () { return '<span class="blob lv3 tour-blob" aria-hidden="true"></span>'; },
      title: 'One small step a day',
      body: 'How much energy do you have today? Grove sizes one step to fit. On a low day, five minutes counts.' },
    { art: function () { return weekRing({ shown: 5, target: 7, learn: 2, learnTarget: 3, reach: 1 }, 132); },
      title: 'Ideas die three ways: you stop, you polish, you hide',
      body: 'Three rings guard against them. Show up: a day you checked in, to work or to rest. Learn: check out and write what happened. Reach, in the middle: one reaction from someone else.' },
    { art: function () { return '<span class="logo-big tour-logo">' + LOGO + '</span>'; },
      title: 'Decide on Sunday',
      body: 'Look back at what happened and choose: continue, adjust or pause. Each review is kept as a Growth Ring.' },
    { art: function () { return '<span class="tour-tiles">' + MAP.map(function (m) { return '<span class="tile t-' + m.key + '">' + svg(m.key, 26) + '</span>'; }).join('') + '</span>'; },
      title: 'The Growth Map, when you want more',
      body: 'Five steps from idea to offer: Seed, Root, Sprout, Bloom, Pollinate. What you write there fills in your AI prompts and your offer card. It is optional.' },
    { art: function () { return '<span class="donemark tour-lock">' + svg('lock', 40) + '</span>'; },
      title: 'Your notes stay with you',
      body: 'What you write stays on this phone. Grove sends Ran anonymous weekly counts (no names, no notes), and you can switch that off.' }
  ];

  /* ---------- screens ---------- */

  var screens = {};

  screens.today = function () {
    var d = D();
    var w = W(monday(today()));
    var pl = personLine();
    var head = '<header class="top"><span class="brand">' + LOGO + 'Grove</span><span class="small muted">' + esc(nice(today())) + '</span></header>';
    var intro = exampleBanner() + (hasAnyData() ? '' :
      '<div class="notice stack"><span class="logo-big">' + LOGO + '</span><span class="label">Grove · the builder\'s journal</span><p class="serif">Make the thing you keep putting off.</p>' +
      '<ul class="howlist small"><li>Check in with your energy and pick one small step.</li><li>Do it on a quiet page with a timer.</li><li>Check out: what happened, and did someone react? Once a week, decide what\'s next.</li><li class="muted">When you want to think it through: the Growth Map, from idea to offer.</li></ul>' +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="setupAgain">Set up my goal</button>' +
      '<button class="btn ghost small-btn" data-act="example">See an example</button></div></div>');
    var due = (!S.paused && reviewWeek() !== monday(today()))
      ? '<div class="notice stack"><p>Last week has not been reviewed yet.</p><div class="row"><button class="btn ghost small-btn" data-act="go" data-arg="review">Review last week</button></div></div>'
      : '';
    var weekLine = '<button class="row" style="background:none;border:none;text-align:left;padding:0;gap:14px;align-items:flex-start;width:100%" data-act="go" data-arg="week"><span class="stack" style="gap:6px;flex:1;min-width:0">' +
      (has(w.question)
        ? '<span class="label">This week\'s goal</span><span class="serif">' + esc(w.question) + '</span>'
        : (has(S.project.what)
          ? '<span class="label">Your goal</span><span class="serif">' + esc(goalSentence()) + '</span>'
          : '<span class="label">Your goal</span><span class="serif empty">No goal yet. Tap Setup at the bottom to add one.</span>')) +
      (everOut() ? '<span class="small ' + (pl.warn ? 'warn' : 'muted') + '">' + esc(pl.text) + '</span>' : '') + '</span>' + (everOut() ? weekRing(statsFor(monday(today())), 68) : '') + '</button>';
    var body;
    var yOpen = openYesterday();
    var yNote = yOpen ? '<div class="notice stack"><p>Yesterday\'s step was started but not wrapped up.</p><div class="row"><button class="btn ghost small-btn" data-act="wrapUp" data-arg="' + yOpen + '">Wrap up yesterday</button></div></div>' : '';
    var lineCard = function () {
      return '<div class="mantra"><span class="label">A line for today</span><span class="serif">' + esc(lineFor(d)) + '</span><button class="mantra-next" data-act="nextLine" aria-label="Show another line">' + svg('refresh', 20) + '</button></div>';
    };

    if (!S.paused && !d.out && d.startedAt) {
      /* Working: the step has started. Stays here after a reload or a later visit, until the person wraps up. */
      var stepBlock = S.ui.editStep
        ? '<div class="card"><div><label class="label" for="step-input">Today\'s step</label>' +
          '<textarea id="step-input" class="plain" rows="3" data-bind="day.step">' + esc(d.step) + '</textarea></div>' +
          '<button class="btn ghost small-btn" style="align-self:flex-start" data-act="editStep">Done</button></div>'
        : '<div class="stack working-step"><span class="label">Today\'s step</span><p class="serif step-now">' + esc(d.step) + '</p></div>';
      var isRest = timerOf(d).mode === 'rest';
      body = stepBlock + lineCard() + (isRest ? '' : pausePanel('grounding')) +
        '<div class="working-orb">' + timerBlob(d) + '</div>' +
        (timerShown(d) ? '<div id="work-time" class="working-time">' + timerBlock(d) + '</div>'
          : '<div class="working-time"><button class="btn ghost small-btn" data-act="timerOpen">Use a timer</button><span class="small muted">Optional. You can just do the step and wrap up.</span></div>') +
        (isRest ? pausePanel('nsdr') + restIdeas() : '') +
        field('Notice something? Jot it down', 'day.happened', d.happened, 'It will be waiting in your check-out.', 2) +
        '<div style="flex:1"></div>' +
        '<button class="btn" data-act="wrapUp">Wrap up for today</button>' +
        '<div class="row" style="justify-content:center;gap:18px">' + (S.ui.editStep ? '' : '<button class="link" data-act="editStep">Change the step</button>') +
        '<button class="link" data-act="unstart">Not started yet</button></div>';
      return '<section class="screen">' + head + yNote + body + FOOT + '</section>' + tabs('today');
    }

    if (S.paused) {
      body = '<div class="grow center"><h1 class="big">Paused.</h1><p class="muted">Nothing is lost. Pick it up when you are ready.</p>' +
        '<button class="btn" data-act="resume">Resume</button></div>';
    } else if (d.out) {
      var tomorrow = planFor(addDays(today(), 1)).step;
      body = '<div class="grow center"><span class="donemark">' + svg('check', 44) + '</span>' +
        '<h1 class="big">' + (d.rest ? 'Rest counts too.' : 'You showed up today.') + '</h1>' +
        (!d.rest && !S.ui.firstAsked && FEEDBACK_ENDPOINT ? '<div class="notice stack first-q" style="text-align:left;align-self:stretch"><span class="label">One question from Ran</span>' +
          field('What almost stopped you today?', 'feedback.first', S.feedback.first, 'A few words is plenty.', 2) +
          '<div class="row" style="gap:14px"><button class="btn small-btn" data-act="sendFirst">Send to Ran</button><button class="link" data-act="skipFirst">Skip</button></div></div>' : '') +
        (has(d.step) && !d.rest ? '<p><span class="struck">' + esc(d.step) + '</span></p>' : '') +
        (resultLabel(d.result) ? '<span class="pill">' + esc(resultLabel(d.result)) + '</span>' : '') +
        (!d.rest && (d.result === 'stuck' || d.result === 'not') ? '<button class="link" data-act="openIdeal" data-arg="today">Want to picture the day it works?</button>' : '') +
        (has(d.happened) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">What happened</span><p>' + esc(d.happened) + '</p></div>' : '') +
        (has(d.changes) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">What it changes</span><p>' + esc(d.changes) + '</p></div>' : '') +
        (has(tomorrow) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">Tomorrow</span><p>' + esc(tomorrow) + '</p></div>' : '') +
        remindRow() +
        (parse(today()).getDay() === 0 ? '<button class="btn" data-act="go" data-arg="review">Review this week</button>' : '') +
        '<button class="btn ghost" data-act="go" data-arg="week">Open This Week</button>' +
        '<button class="link" data-act="reopen">Change today\'s entry</button></div>';
    } else {
      var energy = (!d.energy && !d.energySkipped)
        ? '<div class="stack"><h1>How much energy do you have today?</h1><p class="small muted">This sets how big today\'s step is. Low energy, smaller step.</p>' + energyWhy() + energyPicker() +
          '<button class="btn ghost" data-act="setEnergy">That is my energy</button>' +
          '<button class="link" style="align-self:center" data-act="skipEnergy">Skip</button></div>'
        : '<button class="link" style="align-self:flex-start" data-act="redoEnergy">' + (d.energy ? 'Energy ' + d.energy + ' of 5, ' + LEVELS[d.energy - 1].toLowerCase() + ' · change' : 'Energy skipped · check now') + '</button>';
      var planned = has(d.planned) && d.planned.trim() !== (d.step || '').trim() ? '<span class="small muted">Planned: ' + esc(d.planned) + '</span>' : '';
      var size = sizeLine(d.energy);
      var restNote = planFor(today()).rest && !has(d.step) ? '<p class="small muted">Today is marked as a rest day in your plan.</p>' : '';
      body = energy + restNote + reframeCard(d) +
        '<div class="card"><div><label class="label" for="step-input">Today\'s step</label>' + planned +
        '<span class="small muted">' + (has(S.project.what) ? 'What is one small thing that moves "' + esc(S.project.what) + '" forward today?' : 'What is one small thing you could do today?') + '</span>' +
        '<textarea id="step-input" class="plain" rows="3" data-bind="day.step" placeholder="Write one small step">' + esc(d.step) + '</textarea>' +
        (size ? '<span class="small muted">' + esc(size) + '</span>' : '') +
        (d.energy && d.energy <= 2 && has(d.step) && !d.shrunk && !S.ui.shrink ? '<button class="link" style="align-self:flex-start;padding:0" data-act="smaller">Show smaller versions</button>' : '') +
        (!has(d.step) ? '<div class="seg chips step-examples" aria-label="Examples">' + stepExamples(d).map(function (x) { return '<button data-act="useExampleStep" data-arg="' + esc(x) + '">' + esc(x) + '</button>'; }).join('') + '</div>' : '') + '</div></div>' +
        shrinkPanel(d) +
        '<button class="btn" data-act="startStep">Start my step</button>' +
        '<div class="step-links"><span class="small muted">Or:</span>' +
        '<button class="link" data-act="smaller">Make it smaller</button>' +
        '<button class="link" data-act="moveStep">Move to tomorrow</button>' +
        '<button class="link" data-act="rest">Rest today</button>' +
        '<button class="link" data-act="wrapUp">Just record today</button></div>';
    }
    return '<section class="screen">' + head + intro + due + yNote + weekLine + body + FOOT + '</section>' + tabs('today');
  };

  /* Make it smaller: three ready-made smaller versions of the step, one tap to use. No AI involved. */
  var SHRINK = [
    ['Just the first 10 minutes of: ', 'Do only the start.'],
    ['A rough version only, not finished: ', 'Rough is enough to learn from.'],
    ['Tell one person I plan to: ', 'Saying it out loud counts.']
  ];
  function baseStep(step) {
    var t = String(step || '').trim().replace(/[.\s]+$/, '');
    SHRINK.forEach(function (x) { if (t.indexOf(x[0]) === 0) t = t.slice(x[0].length); });
    return t;
  }
  function shrinkPanel(d) {
    if (!S.ui.shrink || !has(d.step)) return '';
    var b = baseStep(d.step);
    return '<div class="shrink stack" role="region" aria-label="Smaller versions">' +
      '<div class="pause-head"><span class="label">Pick a smaller version</span><button class="link" data-act="smaller">Close</button></div>' +
      SHRINK.map(function (x, i) {
        return '<button class="shrink-opt" data-act="useShrink" data-arg="' + i + '"><span>' + esc(x[0] + b) + '</span><span class="small muted">' + x[1] + '</span></button>';
      }).join('') +
      '<div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:6px"><button class="link" data-act="shrinkOwn">Write my own</button>' +
      '<button class="link" data-act="shrinkAI">Ask your AI for more</button></div></div>';
  }

  function resultLabel(key) { var r = RESULTS.filter(function (x) { return x[0] === key; })[0]; return r ? r[1] : ''; }

  /* Guided audio players. The audio object lives outside the screen, so redrawing never cuts it off.
     S.ui.pause holds the open track key ('grounding' or 'nsdr'), or '' when closed. */
  var pauseAudio = null, pauseKey = '';
  function getAudio(key) {
    if (pauseAudio && pauseKey === key) return pauseAudio;
    if (pauseAudio) { pauseAudio.pause(); }
    pauseKey = key;
    pauseAudio = new Audio(TRACKS[key].src);
    pauseAudio.preload = 'metadata';
    pauseAudio.addEventListener('timeupdate', updatePause);
    pauseAudio.addEventListener('loadedmetadata', updatePause);
    pauseAudio.addEventListener('play', updatePause);
    pauseAudio.addEventListener('pause', updatePause);
    pauseAudio.addEventListener('ended', function () { this.currentTime = 0; S.ui.pauseEnded = true; if (S.ui.pause) render(); });
    pauseAudio.addEventListener('error', function () { S.ui.pause = ''; if (S.screen === 'today') render(); toast('The audio could not load. You can go on without it.'); });
    return pauseAudio;
  }
  function mmss(s) { s = Math.max(0, Math.round(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  function updatePause() {
    var a = pauseAudio; if (!a) return;
    var t = document.getElementById('pause-time'); if (t) t.textContent = mmss(a.currentTime) + (isFinite(a.duration) ? ' / ' + mmss(a.duration) : '');
    var bar = document.getElementById('pause-bar'); if (bar) bar.style.width = (isFinite(a.duration) && a.duration ? a.currentTime / a.duration * 100 : 0) + '%';
    var b = document.getElementById('pause-play');
    if (b) { b.innerHTML = svg(a.paused ? 'play' : 'pause', 26); b.setAttribute('aria-label', a.paused ? 'Play' : 'Pause'); }
    var blob = document.getElementById('pause-blob'); if (blob) blob.classList.toggle('breathing', !a.paused);
  }
  function stopPause() { if (pauseAudio) { pauseAudio.pause(); pauseAudio.currentTime = 0; } S.ui.pause = ''; S.ui.pauseEnded = false; }
  function pausePanel(key) {
    var T = TRACKS[key]; if (!T) return '';
    if (S.ui.pause !== key) {
      return '<div class="stack pause-closed" style="gap:6px"><button class="btn ghost pause-open" data-act="pauseOpen" data-arg="' + key + '">' + svg('play', 20) + '<span>' + T.title + ' <span class="muted">· optional</span></span></button>' +
        '<span class="small muted" style="text-align:center">' + T.intro + '</span></div>';
    }
    var a = pauseKey === key ? pauseAudio : null, playing = a && !a.paused;
    /* Before you start: show what the person wrote about what makes starting easy, and today's step. */
    var extra = '';
    if (key === 'grounding') {
      var easy = (S.project.ideal2 || '').trim(), step = (D().step || '').trim();
      extra = (easy ? '<div class="stack" style="gap:2px"><span class="label">What makes starting easy for you</span><span class="small">' + esc(easy) + '</span></div>' : '') +
        (step ? '<div class="stack" style="gap:2px"><span class="label">Today\'s step</span><span class="small">' + esc(step) + '</span></div>' : '');
    }
    return '<div class="pause-card stack" role="region" aria-label="' + T.title + '">' +
      '<div class="pause-head"><span class="label">' + T.title + '</span><button class="link" data-act="pauseClose">Close</button></div>' +
      '<div class="pause-row"><button id="pause-play" class="pause-play" data-act="pauseToggle" aria-label="' + (playing ? 'Pause' : 'Play') + '">' + svg(playing ? 'pause' : 'play', 26) + '</button>' +
      '<span id="pause-blob" class="blob lv3 pause-blob' + (playing ? ' breathing' : '') + '" aria-hidden="true"></span>' +
      '<span class="stack" style="gap:6px;flex:1"><span class="pause-track"><span id="pause-bar"></span></span><span id="pause-time" class="small muted">0:00</span></span></div>' +
      extra +
      '<p class="small muted">' + (S.ui.pauseEnded ? (key === 'grounding' ? 'That is the pause. Ready for the first small move?' : 'Rest done. Your step will still be there.') : T.note + ' Stop whenever you want.') + '</p></div>';
  }

  /* Setup (v0.7.4): what Grove is, your goal, the first week. Every step can be skipped. The ideal working day
     moved to its own optional screen ("Picture the day it works", in the Growth Map); why energy matters moved next to the energy question. */
  var GOAL_STARTERS = ['Finish ', 'Test ', 'Launch ', 'Write ', 'Learn ', 'Get better at '];
  /* Ideal working day: four short scenes, each a few questions, with a box to jot right there.
     The moments that matter for getting started: waking, starting, working, stopping. */
  var IDEAL_PROMPTS = [
    'A few months from now, the thing you kept putting off is moving. It is time to work on it. Where are you, and what makes starting easy?',
    'You are in the middle of it. What are you making, and how does it feel?',
    'You are done for today. Who is it for, and what small detail do you want to keep?'
  ];
  /* Saved under the same keys as the earlier four scenes (2 = starting, 3 = middle, 4 = done), so old notes still show
     and the grounding pause still finds "what makes starting easy" in ideal2. */
  var IDEAL_KEYS = ['ideal2', 'ideal3', 'ideal4'];
  var ENERGY_GUIDE = [
    ['Empty', 'drained, numb', 'rest counts, or five minutes'],
    ['Low', 'tired, foggy, worried', 'something small and familiar'],
    ['Okay', 'steady, a bit flat', 'one focused block'],
    ['Good', 'clear, curious', 'the step that teaches most'],
    ['High', 'bright, brave', 'the bold one: show it, ask, invite']
  ];
  var SETUP_STEPS = 3;
  /* Setup screen 1 (v0.7.4): three ways an idea stalls, so people recognise themselves. One tap, optional. */
  var FIT_OPTIONS = [['start', 'An idea I keep not starting'], ['polish', 'I keep polishing and never show it'], ['stop', 'I start strong, then stop']];
  /* Setup screen 2: the "so that" of a user story, in the person's own words (v0.7.5; no ready-made options).
     Kept apart from the Growth Map's "Why does this matter to you?" (project.why). */
  function goalSentence() {
    var g = (S.project.what || '').trim().replace(/[.\s]+$/, '');
    var w = (S.project.soThat || '').trim().replace(/^so that\s+/i, '').replace(/[.\s]+$/, '');
    if (!g) return '';
    return w ? g + ', so that ' + w + '.' : g + '.';
  }
  /* Text boxes grow with what is written, so the whole entry stays visible. */
  function autosize(el) { if (el && el.tagName === 'TEXTAREA') { el.style.height = 'auto'; el.style.height = (el.scrollHeight + 2) + 'px'; } }
  function idealLines() {
    var jots = [1, 2, 3, 4, 5, 6].map(function (n) { return S.project['ideal' + n]; }).filter(has);
    return jots.length ? jots : [S.project.idealPlace, S.project.idealDoing, S.project.idealFeel].filter(has);
  }
  function idealText() { return idealLines().join(' · '); }
  function energyWhy() {
    return '<details class="why"><summary class="small">Why?</summary><div class="stack" style="gap:8px;padding-top:8px">' +
      '<p class="small muted">Low energy narrows what feels possible; higher energy widens it. Grove sizes the step to fit (Fredrickson, 2001).</p>' +
      '<div class="energy-guide">' + ENERGY_GUIDE.map(function (e, n) {
        return '<div class="eg-row"><span class="blob lv' + (n + 1) + ' eg-dot" aria-hidden="true"></span><span class="small"><strong>' + e[0] + '</strong> <span class="muted">→ ' + e[2] + '</span></span></div>';
      }).join('') + '</div></div></details>';
  }
  screens.setup = function () {
    var i = Math.min(Math.max(S.ui.setupIdx || 0, 0), SETUP_STEPS - 1), body = '', next = '';
    if (i === 0) {
      var fits = FIT_OPTIONS.map(function (f) {
        var on = S.project.fit === f[0];
        return '<button class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="setFit" data-arg="' + f[0] + '">' + esc(f[1]) + '</button>';
      }).join('');
      body = '<div class="tour-art"><span class="logo-big tour-logo">' + LOGO + '</span></div>' +
        '<div class="stack tour-text"><span class="label">Grove · the builder\'s journal</span><h1>Make the thing you keep putting off</h1>' +
        '<p class="muted">One small step a day, one real reaction a week.</p></div>' +
        '<div class="stack" style="gap:10px"><span class="label">Sounds like you?</span><div class="seg chips fit-chips">' + fits + '</div></div>';
      next = '<button class="btn" data-act="setupStep" data-arg="1">Set it up · one minute</button>';
    } else if (i === 1) {
      var chips = GOAL_STARTERS.map(function (g) { return '<button data-act="goalStarter" data-arg="' + esc(g) + '">' + esc(g.trim()) + '…</button>'; }).join('');
      var sentence = goalSentence();
      body = '<div class="stack tour-text"><h1>What do you want to make?</h1></div>' +
        '<div class="seg chips goal-chips" aria-label="Start with">' + chips + '</div>' +
        '<div class="card"><div><label class="label" for="goal-input">I want to</label>' +
        '<textarea id="goal-input" class="plain" rows="2" data-bind="project.what" placeholder="e.g. Finish the first chapter">' + esc(S.project.what) + '</textarea></div></div>' +
        '<div class="card"><div><label class="label" for="sothat-input">So that… (optional)</label>' +
        '<textarea id="sothat-input" class="plain" rows="2" data-bind="project.soThat" placeholder="In your own words. You can leave it empty.">' + esc(S.project.soThat) + '</textarea></div></div>' +
        '<p id="goal-sentence" class="small muted"' + (sentence ? '' : ' hidden') + '>' + esc(sentence) + '</p>';
      next = '<button class="btn" data-act="setupStep" data-arg="2">Next</button>';
    } else {
      var wk = monday(today()), w = W(wk), weeks = S.project.weeks || 4;
      var wopts = [2, 4, 8, 12]; if (wopts.indexOf(weeks) < 0) wopts.push(weeks); wopts.sort(function (a, b) { return a - b; });
      var wchips = wopts.map(function (n) { return '<button class="' + (weeks === n ? 'on' : '') + '" aria-pressed="' + (weeks === n) + '" data-act="setWeeks" data-arg="' + n + '">' + n + ' weeks</button>'; }).join('');
      body = '<div class="stack tour-text"><h1>Plan it</h1></div>' +
        '<div class="stack" style="gap:10px"><span class="label">How long will you give it?</span><div class="seg">' + wchips + '</div></div>' +
        field('By the end of ' + weeks + ' weeks, what would you like to have?', 'project.periodGoal', S.project.periodGoal, 'e.g. The site is live and five people have seen it', 2) +
        check('Share anonymous weekly counts, so Ran can see if Grove works (no names, no notes)', 'feedback.shareCounts', S.feedback.shareCounts !== false);
      next = '<button class="btn" data-act="setupFinish">Finish setup</button>';
    }
    if (S.ui.setupFinish) {
      /* v0.7.6: a clear end to setup, so people know the daily part starts here (Wendy, 11-25). */
      var gs = goalSentence();
      return '<section class="screen tour setup">' +
        '<header class="top"><button class="icon-btn" aria-label="Back" data-act="setupStep" data-arg="' + (SETUP_STEPS - 1) + '">' + svg('back', 24) + '</button><span></span></header>' +
        '<div class="stack tour-text"><span class="label">Setup done</span><h1>You are set up</h1>' +
        (gs ? '<p class="serif">' + esc(gs) + '</p>' : '') + '</div>' +
        '<div class="card stack setup-daily"><span class="label">From now on, each day</span>' +
        '<p><strong>1. Check your energy.</strong> <span class="muted">It sets how big today\'s step is.</span></p>' +
        '<p><strong>2. Pick one small step and do it.</strong></p>' +
        '<p><strong>3. Wrap up.</strong> <span class="muted">One line on what happened.</span></p></div>' +
        '<div style="flex:1"></div>' +
        '<button class="btn" data-act="setupDone">Start today</button>' +
        '<button class="link" style="align-self:center" data-act="setupDone" data-arg="later">I will start later</button></section>';
    }
    var dots = []; for (var k2 = 0; k2 < SETUP_STEPS; k2++) dots.push('<span class="tdot' + (k2 === i ? ' on' : '') + '"></span>');
    return '<section class="screen tour setup">' +
      '<header class="top">' + (i ? '<button class="icon-btn" aria-label="Back" data-act="setupStep" data-arg="' + (i - 1) + '">' + svg('back', 24) + '</button>' : '<span class="brand">' + LOGO + 'Grove</span>') +
      '<button class="link" data-act="setupDone">Skip setup</button></header>' +
      body + '<div style="flex:1"></div><div class="tdots" aria-hidden="true">' + dots.join('') + '</div>' + next + '</section>';
  };

  /* Optional: the ideal working day, for when it is hard to start (v0.7.4, moved out of setup). */
  screens.ideal = function () {
    var goal = (S.project.what || '').trim();
    var k = Math.min(S.ui.idealStep || 0, IDEAL_PROMPTS.length);
    var from = S.ui.idealFrom === 'map' ? 'map' : 'today';
    var guide = k < IDEAL_PROMPTS.length
      ? '<div class="ideal-guide"><span class="blob lv3 breathe-slow ideal-blob" aria-hidden="true"></span>' +
        '<p class="serif ideal-text">' + esc(IDEAL_PROMPTS[k]) + '</p>' +
        '<textarea id="jot-' + IDEAL_KEYS[k] + '" class="ideal-jot" rows="2" data-bind="project.' + IDEAL_KEYS[k] + '" placeholder="A few words, or tap the microphone on your keyboard and just speak.">' + esc(S.project[IDEAL_KEYS[k]] || '') + '</textarea>' +
        '<span class="small muted">' + (k + 1) + ' of ' + IDEAL_PROMPTS.length + '</span>' +
        '<div class="row" style="justify-content:center;gap:16px">' + (k > 0 ? '<button class="link" data-act="idealBack">Back</button>' : '') +
        '<button class="btn ghost small-btn" data-act="idealNext">' + (k === IDEAL_PROMPTS.length - 1 ? 'Finish' : 'Continue') + '</button></div></div>'
      : '<div class="ideal-recap stack"><span class="label">Your ideal working day</span>' + (idealText() ? idealLines().map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') : '<p class="small muted">Nothing written this time. That is fine.</p>') +
        '<button class="link" style="align-self:flex-start" data-act="idealRestart">Walk through it again</button></div>';
    return '<section class="screen tour setup">' +
      '<header class="top"><button class="icon-btn" aria-label="Back" data-act="go" data-arg="' + from + '">' + svg('back', 24) + '</button><span></span></header>' +
      '<div class="stack tour-text"><h1>Picture the day it works</h1>' +
      '<p class="muted">It is easier to start when you can feel where you are going. Picture' + (goal ? ' "' + esc(goal) + '"' : ' it') + ' going well, and jot a few words.</p></div>' +
      guide +
      '<p class="small muted">Adapted from the ideal-day visualization in Martha Beck\'s life-coaching method.</p>' +
      '<div style="flex:1"></div><button class="btn" data-act="go" data-arg="' + from + '">' + (from === 'map' ? 'Back to Growth Map' : 'Back to today') + '</button></section>';
  };

  screens.tour = function () {
    var i = Math.min(Math.max(S.ui.tourIdx || 0, 0), TOUR.length - 1), t = TOUR[i], last = i === TOUR.length - 1;
    var dots = TOUR.map(function (x, k) { return '<span class="tdot' + (k === i ? ' on' : '') + '"></span>'; }).join('');
    return '<section class="screen tour" aria-roledescription="tour">' +
      '<header class="top">' + (i ? '<button class="icon-btn" aria-label="Back" data-act="tourStep" data-arg="-1">' + svg('back', 24) + '</button>' : '<span class="brand">' + LOGO + 'Grove</span>') +
      (last ? '<span></span>' : '<button class="link" data-act="tourDone" data-arg="today">Skip</button>') + '</header>' +
      '<div class="tour-art">' + t.art() + '</div>' +
      '<div class="stack tour-text"><span class="label">' + (i + 1) + ' of ' + TOUR.length + '</span><h1>' + t.title + '</h1><p class="muted">' + t.body + '</p></div>' +
      '<div style="flex:1"></div><div class="tdots" aria-hidden="true">' + dots + '</div>' +
      (last
        ? '<button class="btn" data-act="tourDone" data-arg="today">Start today</button><button class="btn ghost" data-act="tourDone" data-arg="map">Open the Growth Map</button>'
        : '<button class="btn" data-act="tourStep" data-arg="1">Next</button>' +
          (i === 3 ? '<button class="link" data-act="tourDone" data-arg="map">Open the Growth Map now</button>' : '')) +
      '</section>';
  };

  /* Why it works: the ideas behind Grove, in our own words, with where each comes from. Reached quietly from
     the bottom of the Growth Map. Sources were checked before they were added; add only ones you can check. */
  var WHY = [
    { title: 'Picture where you are going',
      body: 'A vivid, sensory picture of a good working day gives the small daily steps a direction you can feel, not only reason about. That is the ideal working day in setup.',
      source: 'Adapted from the ideal-day visualization in Martha Beck\'s life-coaching method, in which Ran is certified.' },
    { title: 'Energy changes what feels possible',
      body: 'Feelings vary in how pleasant and how activated they are. Pleasant states tend to widen attention and the options we can see; heavy ones narrow it. Grove asks about energy first and sizes the step to it.',
      source: 'Barbara Fredrickson, "The role of positive emotions in positive psychology: The broaden-and-build theory of positive emotions", American Psychologist, 2001. James Russell, "A circumplex model of affect", Journal of Personality and Social Psychology, 1980. The low-energy questions borrow from self-compassion research: Kristin Neff, "Self-compassion", Self and Identity, 2003.' },
    { title: 'Small enough for your worst day',
      body: 'A step you can take on a low day beats a plan you keep putting off. That is why Grove asks about your energy first and sizes the step to it.',
      source: 'Martha Beck\'s coaching work, which Ran trained and is certified in. She calls these "turtle steps": steps so small you could take them on your worst day. Finding Your Own North Star, 2001.' },
    { title: 'Decide when, not only what',
      body: 'Intentions turn into action more often when you have already decided when you will act. The weekly plan gives each day one step, and Start my step turns it into now.',
      source: 'Peter Gollwitzer, "Implementation intentions: Strong effects of simple plans", American Psychologist, 1999.' },
    { title: 'Learn from real people, not from guessing',
      body: 'You find out whether an idea works by showing it to other people, early and often, and asking what they actually did rather than what they might do. That is the third ring.',
      source: 'Steve Blank, The Four Steps to the Epiphany, 2005. Eric Ries, The Lean Startup, 2011. Rob Fitzpatrick, The Mom Test, 2013.' },
    { title: 'Seeing progress keeps you going',
      body: 'Small, visible progress on work that matters to you is one of the strongest reasons people keep going. The rings and Growth Rings are there to make it visible.',
      source: 'Teresa Amabile and Steven Kramer, The Progress Principle, 2011.' },
    { title: 'Look back, then decide',
      body: 'People learn from experience when they stop to think about it and choose what to try next. The Sunday review ends in one choice: continue, adjust or pause.',
      source: 'David Kolb, Experiential Learning, 1984.' },
    { title: 'A set time, then a choice',
      body: 'Giving a step a fixed amount of time keeps it from quietly growing into a project, and planned rests keep you going. Grove uses a gentle version: the shape slowly empties, and at the end you choose to rest, carry on or wrap up.',
      source: 'Francesco Cirillo, The Pomodoro Technique. Timeboxing from software teams.' }
  ];
  screens.why = function () {
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('map') + '<span class="small muted">Why it works</span></header>' +
      '<h1>Why it works</h1>' +
      '<p class="muted">Grove borrows a few ideas that have been tested in research or in practice. Here is each one, what Grove does with it, and where it comes from.</p>' +
      WHY.map(function (w) {
        return '<div class="why-item stack"><h2 class="serif">' + w.title + '</h2><p>' + w.body + '</p><p class="small muted">' + w.source + '</p></div>';
      }).join('') +
      '<div class="notice stack"><span class="label">What we do not claim</span><p class="small">The five energy levels and their descriptions are our own simplification, and so is how the pieces fit together. Ran also draws on David Hawkins\'s Map of Consciousness as a personal lens; its numbers are not scientific, so Grove does not use them. No study shows that Grove itself works. The pilot is how we find out. Grove is a tool, not coaching or therapy.</p></div>' +
      FOOT + '</section>';
  };

  screens.checkout = function () {
    var d = outRec();
    var date = S.ui.outDate && S.days[S.ui.outDate] ? S.ui.outDate : today();
    var tm = addDays(date, 1);
    var summary = '';
    if (has(d.planned) || has(d.step)) {
      summary = '<div class="card">' +
        (has(d.planned) && d.planned.trim() !== (d.step || '').trim() ? '<div><span class="label">Planned</span><span class="small">' + esc(d.planned) + '</span></div>' : '') +
        '<div><span class="label">' + (has(d.planned) && d.planned.trim() !== (d.step || '').trim() ? 'Chose' : 'Today\'s step') + '</span><span class="small' + (has(d.step) ? '' : ' empty') + '">' + (has(d.step) ? esc(d.step) + (d.shrunk ? ' (made smaller)' : '') : 'No step today') + '</span></div>' +
        (d.startedAt ? '<div><span class="label">Started</span><span class="small">' + esc(clock(d.startedAt)) + (date !== today() ? ', ' + esc(nice(date)) : '') +
          (minutesWorked(d) ? ' · about ' + minutesWorked(d) + ' min' : '') + '</span></div>' : '') + '</div>';
    }
    var results = '<div class="stack" style="gap:10px"><span class="label">How did it go?</span><div class="seg chips">' + RESULTS.map(function (r) {
      return '<button class="' + (d.result === r[0] ? 'on' : '') + '" data-act="result" data-arg="' + r[0] + '" aria-pressed="' + (d.result === r[0]) + '">' + r[1] + '</button>';
    }).join('') + '</div></div>';
    var instead = d.result === 'changed' ? field('What did you do instead?', 'day.step', d.step, 'The step you actually took.', 2) : '';
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('today') + '<span class="small muted">Check-out' + (date !== today() ? ' · ' + esc(nice(date)) : '') + '</span></header>' +
      '<h1>One thing I learned</h1>' + summary + results + instead +
      field('What actually happened?', 'day.happened', d.happened, 'What you saw or heard, in plain words.', 3) +
      field('What will you do differently next time?', 'day.changes', d.changes, 'One line is enough.', 2) +
      check('Someone else reacted to it today', 'day.person', d.person) +
      '<p class="small muted" style="margin-top:-12px">A reply, a question, even a no. Even if you are making it for yourself, one outside look helps.</p>' +
      field((date !== today() ? 'Step for ' + nice(tm) : 'Tomorrow\'s step') + ' (optional)', 'plan.' + tm, planFor(tm).step, 'Leave it empty if you do not know yet.', 2) +
      '<div style="flex:1"></div>' +
      '<button class="btn" data-act="saveCheckout">' + (date !== today() ? 'Save this day' : (d.out ? 'Save changes' : 'Save today')) + '</button></section>';
  };

  screens.week = function () {
    var cur = monday(today());
    var wk = viewWeek();
    var w = W(wk);
    var isCur = wk === cur;
    var pl = personLine();
    var rows = weekDays(wk).map(function (k) {
      var p = planFor(k); var rec = S.days[k];
      var mark = rec && rec.out ? '<span class="dot filled' + (!rec.rest && has(rec.changes) ? ' evidence' : '') + '"></span>' : '<span class="dot' + (k === today() ? ' today' : '') + '"></span>';
      var did = rec && rec.out && has(rec.happened) ? '<span class="small muted">' + (rec.person ? 'Reach · ' : '') + esc(rec.happened) + '</span>' : '';
      return '<div class="dayrow"><div class="row" style="gap:10px">' + mark + '<label class="label" for="p-' + k + '" style="width:58px">' + esc(shortDay(k)) + '</label>' +
        '<input id="p-' + k + '" type="text" data-bind="plan.' + k + '" value="' + esc(p.step) + '" placeholder="' + (p.rest ? 'Rest' : 'One small step') + '">' +
        '<button class="btn ghost small-btn rest' + (p.rest ? ' on' : '') + '" aria-pressed="' + p.rest + '" data-act="toggleRest" data-arg="' + k + '">Rest</button></div>' + did + '</div>';
    }).join('');
    var ringList = S.rings.length ? '<div class="list">' + S.rings.slice().reverse().map(function (r) {
      var rn = r.notes || [];
      return '<div>' + weekRing(ringStats(rn.map(function (n) { return Object.assign({ out: true }, n); })), 48) + '<span><span class="small muted">' + esc(range(r.week)) + ' · ' + esc(r.decisionLabel) + '</span><br>' +
        (has(r.question) ? esc(r.question) + '<br>' : '') + (has(r.reason) ? '<span class="small muted">' + esc(r.reason) + '</span>' : '') + '</span></div>';
    }).join('') + '</div>' : '<p class="muted">A finished review becomes a Growth Ring here.</p>';
    var dark = S.ui.theme === 'dark';

    return '<section class="screen wide">' +
      '<header class="top"><span class="brand">' + (isCur ? 'This Week' : 'Next Week') + '</span><span class="small muted">' + esc(range(wk)) + '</span></header>' + exampleBanner() +
      (S.ui.note ? '<div class="notice">' + esc(S.ui.note) + '</div>' : '') +
      (S.ui.askRan ? '<div class="notice stack"><p>Anything to tell Ran about Grove this week?</p><div class="row" style="gap:14px"><button class="btn ghost small-btn" data-act="openFeedback">Tell Ran</button><button class="link" data-act="dismissAsk">Not now</button></div></div>' : '') +
      '<div class="seg" role="group" aria-label="Which week">' +
      '<button class="' + (isCur ? 'on' : '') + '" aria-pressed="' + isCur + '" data-act="showWeek" data-arg="' + cur + '">This week</button>' +
      '<button class="' + (!isCur ? 'on' : '') + '" aria-pressed="' + !isCur + '" data-act="showWeek" data-arg="' + addDays(cur, 7) + '">Plan next week</button></div>' +
      '<div class="cols"><div class="g g1">' +
      (isCur ? '<div class="row" style="gap:18px">' + weekRing(statsFor(cur), 132) + ringLegend(statsFor(cur)) + '</div>' : '') +
      field('Your ' + (S.project.weeks || 4) + '-week goal', 'project.periodGoal', S.project.periodGoal, 'What would you like to have by the end?', 2) +
      field('This week\'s goal', 'week.question', w.question, 'A piece of the bigger goal: what would you like done or found out by Sunday?', 2) +
      field('One sign you could observe', 'week.sign', w.sign, 'What would you see or hear if it is going well?', 2) +
      field('Who could react to it this week?', 'week.who', w.who, 'A name is better than a group.', 2) +
      '<p class="small muted" style="margin-top:-12px">Not sure who? Someone you already know who has this problem is enough. <button class="link" style="padding:0;min-height:0;font-size:inherit" data-act="copyAsk">Copy a message to send them</button></p>' +
      (isCur ? '<p class="small ' + (pl.warn ? 'warn' : 'muted') + '">' + esc(pl.text) + '</p>' : '') +
      '<div class="stack"><span class="label">One small step per day, if you like</span>' + rows + '</div>' +
      (isCur ? '<button class="btn ghost" data-act="go" data-arg="review">' + (reviewWeek() === cur ? 'Review this week' : 'Review last week') + '</button>' : '') +
      '</div><div class="g g2">' +
      '<div class="section"><span class="brand">AI Tool Shed</span>' +
      '<p class="small muted">Grove asks you a few questions, then builds a prompt from your answers for the AI you already use. More cards are inside each Growth Map step.</p>' +
      promptCard('conversation', 'week') + promptCard('smaller', 'week') + '</div>' +
      '<div class="section"><span class="brand">Offer card</span>' +
      '<p class="small muted">One card that says who it is for, what changes and what to do next. Send it to a real person.</p>' +
      '<div class="row"><button class="btn ghost small-btn" data-act="go" data-arg="offer">Make an offer card</button></div></div>' +
      '<div class="section"><span class="brand">Project notes</span>' +
      field('What are you working on?', 'project.what', S.project.what, 'A sentence is enough.', 2) +
      field('Who is it for? One real person is best.', 'project.who', S.project.who, '', 2) + '</div>' +
      '</div><div class="g g3">' +
      '<div class="section"><span class="brand">Growth Rings</span>' + ringList + '</div>' +
      '<div class="section"><span class="brand">Share and feedback</span>' +
      '<p class="small muted">Grove has no server. Nothing you write is sent anywhere unless you choose to share it.</p>' +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="invite">Invite a friend</button>' +
      '<button class="btn ghost small-btn" data-act="go" data-arg="feedback">Send feedback</button></div></div>' +
      '<div class="section"><span class="brand">Appearance</span><div class="seg" role="group" aria-label="Appearance">' +
      '<button class="' + (!dark ? 'on' : '') + '" aria-pressed="' + !dark + '" data-act="theme" data-arg="light">Light</button>' +
      '<button class="' + (dark ? 'on' : '') + '" aria-pressed="' + dark + '" data-act="theme" data-arg="dark">Dark</button></div></div>' +
      '<div class="section"><span class="brand">Your data</span>' +
      '<p class="small muted">Saved in this browser only. Export to move it to another device, then import it there.</p>' +
      check('Share anonymous weekly counts with Ran (no names, no notes)', 'feedback.shareCounts', S.feedback.shareCounts !== false) +
      confirmBox('example', 'This replaces what you have written so far. Load the example anyway?') +
      confirmBox('clear', 'This deletes everything saved in this browser. It cannot be undone.') +
      confirmBox('importData', 'Importing replaces what is saved in this browser. Continue?') +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="exportData">Export</button>' +
      '<button class="btn ghost small-btn" data-act="importData">Import</button>' +
      '<button class="btn ghost small-btn" data-act="example">Load example</button>' +
      '<button class="btn ghost small-btn" data-act="clear">Clear everything</button></div>' +
      '<input id="import-file" type="file" accept="application/json,.json" class="sr" tabindex="-1" aria-label="Import a Grove export file"></div>' +
      FOOT + '</div></div></section>' + tabs('week');
  };

  screens.prompt = function () {
    var kind = PROMPTS[S.ui.promptKind] ? S.ui.promptKind : 'conversation';
    var P = PROMPTS[kind];
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn(S.ui.promptFrom === 'map' ? 'map' : (S.ui.promptFrom === 'review' ? 'review' : 'week')) + '<span class="small muted">AI Tool Shed</span></header>' +
      '<h1>' + esc(P.title) + '</h1><p class="muted">' + esc(P.blurb) + '</p>' +
      '<p class="small muted">Answer what you can. Grove keeps your answers, so you only write them once.</p>' +
      P.fields.map(function (k) { var f = FIELDS[k]; return field(f[1], f[0], fieldValue(k), f[2], 2); }).join('') +
      '<details open><summary class="small">What will be copied</summary><pre id="prompt-preview">' + esc(buildPrompt(kind)) + '</pre></details>' +
      '<div style="flex:1"></div>' +
      '<button class="btn" data-act="copyPrompt" data-arg="' + kind + '">Copy for my own AI</button>' +
      '<p class="small muted" style="text-align:center">Paste it into the AI you use, then bring back what you want to keep.</p></section>';
  };

  screens.feedback = function () {
    var f = S.feedback;
    var again = [['Yes', 'Yes'], ['Maybe', 'Maybe'], ['No', 'No']].map(function (x) {
      var on = f.again === x[0];
      return '<button class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="again" data-arg="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    var where = FEEDBACK_ENDPOINT ? 'It goes straight to Ran\'s private Notion page. Nothing else leaves this device.' : 'You choose where to send it, for example a message to Ran.';
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn(S.ui.feedbackFrom || 'week') + '<span class="small muted">Feedback</span></header>' +
      '<h1>Tell Ran how it went</h1>' +
      '<p class="muted">Grove has already noted how you used it this week. Add what only you can say. Every question is optional.</p>' +
      '<div class="stack" style="gap:8px"><span class="label">Would you open Grove again next week?</span><div class="seg" role="group" aria-label="Would you open Grove again next week?">' + again + '</div></div>' +
      field('What did you try?', 'feedback.tried', f.tried, 'A step, a prompt card, the offer card…', 2) +
      field('Where did you stop or get stuck?', 'feedback.stuck', f.stuck, '', 2) +
      field('What would you change?', 'feedback.change', f.change, '', 2) +
      field('Your name or nickname', 'feedback.name', f.name, 'Remembered for next time', 1) +
      field('How can Ran reach you? (optional)', 'feedback.contact', f.contact, 'Remembered for next time', 1) +
      check('Also share this week\'s goal and my check-out notes', 'feedback.include', f.include) +
      '<details><summary class="small">What will be sent</summary><pre id="feedback-preview">' + esc(feedbackText()) + '</pre></details>' +
      '<p class="small muted">' + where + '</p>' +
      '<div style="flex:1"></div>' +
      '<button class="btn" id="send-feedback" data-act="sendFeedback">' + (FEEDBACK_ENDPOINT ? 'Send to Ran' : 'Share it') + '</button>' +
      '<button class="btn ghost" data-act="copyFeedback">Copy instead</button></section>';
  };

  screens.offer = function () {
    var keys = ['who', 'before', 'after', 'offer', 'invite', 'contact'];
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('week') + '<span class="small muted">Offer card</span></header>' +
      '<h1>An offer someone can try</h1>' +
      '<p class="muted">Fill in what you can. The card updates as you type. Send it to one real person.</p>' +
      keys.map(function (k) { var f = FIELDS[k]; return field(f[1], f[0], fieldValue(k), f[2], 2); }).join('') +
      '<div id="offer-preview" class="offercard">' + offerCardInner() + '</div>' +
      '<button class="btn" data-act="shareOffer">Share as text</button>' +
      '<button class="btn ghost" data-act="saveOfferImage">Save as an image</button></section>';
  };

  screens.review = function () {
    var wk = reviewWeek();
    var w = W(wk);
    var notes = notesIn(wk);
    var withNote = notes.filter(function (n) { return has(n.happened); });
    var st = statsFor(wk);
    var people = st.reach;
    var steps = notes.filter(function (n) { return has(n.step) && !n.rest; }).length;
    var notice = '';
    if (!people) {
      notice = '<div class="notice stack"><span class="tag"><span class="ring"></span>No reach yet</span><p>No reaction from someone else this week. That is the first thing to change next week.</p></div>';
    } else if (st.learn < st.learnTarget) {
      notice = '<div class="notice stack"><span class="tag"><span class="ring"></span>Little to learn from</span><p>' + st.learn + ' of ' + st.learnTarget + ' check-outs had a note this week. Fewer is thin. You can still decide.</p></div>';
    }
    var seg = DECISIONS.map(function (x) {
      var on = S.review.decision === x[0];
      return '<button class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="decision" data-arg="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('week') + '<span class="small muted">Review · ' + esc(range(wk)) + '</span></header>' +
      '<h1>What did the week show you?</h1>' +
      '<div class="two"><div><span class="label">This week\'s goal</span><span' + (has(w.question) ? '' : ' class="empty"') + '>' + (has(w.question) ? esc(w.question) : 'Not set') + '</span>' +
      (has(w.sign) ? '<span class="small muted">Sign: ' + esc(w.sign) + '</span>' : '') +
      (has(S.project.periodGoal) ? '<span class="small muted">Toward: ' + esc(S.project.periodGoal) + '</span>' : '') + '</div>' +
      '<div><span class="label">What happened</span>' + (withNote.length ? withNote.map(function (n) {
        return '<span><span class="small muted">' + esc(shortDay(n.date)) + (n.person ? ' · reach' : '') + '</span><br>' + esc(n.happened) + (has(n.changes) ? '<br><span class="small muted">Next time: ' + esc(n.changes) + '</span>' : '') + '</span>';
      }).join('') : '<span class="empty">Nothing written down yet</span>') + '</div></div>' +
      '<div class="row" style="gap:18px">' + weekRing(st, 96) + ringLegend(st) + '</div>' +
      notice +
      (idealText() ? '<div class="notice stack" style="gap:4px"><span class="label">Your ideal working day</span><p class="small">' + esc(idealText()) + '</p><span class="small muted">Did this week move you closer to it?</span></div>' : '') +
      '<details class="stack"><summary class="label">Show your work next week · ask your AI for help</summary>' +
      promptCard('videoscript', 'review') + promptCard('notebooklm', 'review') + promptCard('handmade', 'review') + '</details>' +
      '<p class="serif">What do you want to do next? Your call.</p>' +
      '<div class="seg" role="group" aria-label="Decision">' + seg + '</div>' +
      field('Why?', 'review.reason', S.review.reason, 'One or two sentences in your own words.', 3) +
      '<div style="flex:1"></div>' +
      '<button class="btn" data-act="saveReview">Save as a Growth Ring</button></section>';
  };

  screens.map = function () {
    return '<section class="screen">' +
      '<header class="top"><span class="brand">Growth Map</span><span class="small muted">Optional</span></header>' + exampleBanner() +
      (has(S.project.what) ? '<div class="notice stack" style="gap:4px"><span class="label">Your goal</span><span>' + esc(S.project.what) + '</span></div>' : '') +
      '<button class="card map-ideal" data-act="openIdeal" data-arg="map"><span class="stack" style="gap:2px"><span class="serif">Picture the day it works</span>' +
      '<span class="small muted">' + (idealText() ? 'You wrote this before. Read it again, or walk through it.' : 'Three short questions, when you want to remember why.') + '</span></span><span class="chev">' + svg('chev', 22) + '</span></button>' +
      '<p class="small muted">For turning a project into something you offer others. Not sure where to start? Open the step that sounds most like where you are now.</p>' +
      '<p class="muted">Work through the five steps in order, or open only the one you need. What you write here fills in your AI prompts and your offer card.</p>' +
      MAP.map(function (m, i) {
        return '<details class="mapstep"><summary><span class="tile t-' + m.key + '">' + svg(m.key, 28) + '</span>' +
          '<span class="stack" style="gap:2px"><span class="label">' + (i + 1) + ' · ' + m.name + ' · ' + m.fields.filter(function (k) { return has(fieldValue(k)); }).length + ' of ' + m.fields.length + ' written</span><span class="serif">' + m.title + '</span></span>' +
          '<span class="chev">' + svg('chev', 22) + '</span></summary>' +
          '<div class="stack" style="gap:16px">' +
          '<div><span class="label">Open it when</span><p>' + esc(m.when) + '</p></div>' +
          '<div class="stack"><span class="label">Write down</span><p class="small muted">' + esc(m.write) + '</p>' + m.fields.map(function (k) { var f = FIELDS[k]; return field(f[1], f[0], fieldValue(k), f[2], 2); }).join('') + '</div>' +
          '<div><span class="label">Try it</span><p>' + esc(m.tryIt) + '</p></div>' +
          '<div class="stack goal-offer" style="gap:6px"><span class="label">A goal for this week</span><p class="serif">' + esc(m.question) + '</p>' +
          '<button class="btn ghost small-btn" style="align-self:flex-start" data-act="useQuestion" data-arg="' + i + '">Make this my goal this week</button></div>' +
          (m.key === 'sprout' ? '<button class="btn ghost small-btn" style="align-self:flex-start" data-act="go" data-arg="offer">Make an offer card</button>' : '') +
          '<span class="label">Ask your AI for help</span>' + m.prompts.map(function (k) { return promptCard(k, 'map'); }).join('') +
          '</div></details>';
      }).join('') +
      '<button class="link why-link" data-act="go" data-arg="why">Why it works</button>' +
      FOOT + '</section>' + tabs('map');
  };

  /* ---------- actions ---------- */

  function go(screen) {
    S.screen = screen; S.ui.confirm = '';
    if (screen !== 'week') { S.ui.note = ''; S.ui.viewWeek = ''; }
    if (screen !== 'checkout') S.ui.outDate = '';
    if (screen === 'map') S.ui.mapSeen = true;
    if (screen !== 'today') { stopPause(); S.ui.editStep = false; S.ui.shrink = false; }
    render();
  }
  function reveal(el, cb) {
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || !el) return cb();
    var r = el.getBoundingClientRect();
    var o = document.createElement('div');
    o.className = 'reveal'; o.style.left = (r.left + r.width / 2) + 'px'; o.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(o);
    requestAnimationFrame(function () { requestAnimationFrame(function () { o.classList.add('go'); }); });
    setTimeout(function () { cb(); o.classList.add('out'); setTimeout(function () { o.remove(); }, 380); }, 440);
  }

  function loadExample() {
    var t = today(); var wk = monday(t); var theme = S.ui.theme;
    S = blank(); S.ui.theme = theme;
    S.project = { what: 'Grove: help women make the thing they keep putting off, one small step at a time.',
      why: 'I kept polishing my own idea instead of showing it to anyone. I want a tool that gets me out of that.',
      who: 'An independent consultant, freelancer or creative with years of experience, who wants to turn what she knows into a small product.',
      before: 'She has started on an idea she cares about. She keeps refining it or learning another tool. At the end of the week she still does not know how someone would use it.',
      after: 'Every week one real person sees or tries her work, and she knows what to build or sell next.',
      offer: 'Two weeks with Grove: a few minutes a day, one small step sized to your energy, and a short review at the end of each week.',
      place: 'The WoMen AI Lab group, to builders who have something they can test this week.',
      invite: 'Open the link, set this week\'s goal, and tell me after seven days what you would skip.',
      contact: 'randing-create.github.io/grove', weeks: 4, offerPath: 'yes',
      ideal1: 'Birds outside, rested, a little excited to open it', ideal2: 'At my desk at nine, coffee, phone in the other room',
      ideal3: 'Recording a short demo, shoulders loose', ideal4: 'Sent it to two builders, proud of something small' };
    S.weeks[wk] = {
      question: 'Get one WAL builder to try Grove and tell me what they would skip',
      sign: 'A note, in my own words, of a day when the step I took was not the one I had planned.',
      who: 'One WAL builder who has something she can test this week.',
      plan: {}
    };
    S.weeks[wk].plan[t] = { step: 'Open Grove, check my energy, and write down the one step I would otherwise skip.', rest: false };
    S.weeks[monday(addDays(t, 1))] = S.weeks[monday(addDays(t, 1))] || { question: '', sign: '', who: '', plan: {} };
    planFor(addDays(t, 1)).step = 'Ask one builder to try Today on her own project while I watch.';
  }

  var acts = {
    go: function (arg) { go(arg); },
    example: function (arg) {
      if (hasAnyData() && arg !== 'yes') { S.ui.confirm = 'example'; return render(); }
      var ui = { setupDone: true, toured: true, mapSeen: S.ui.mapSeen };
      loadExample(); Object.assign(S.ui, ui, { isExample: true }); render(); toast('This is an example. Clear it any time from the banner at the top.');
    },
    clear: function (arg) {
      if (arg !== 'yes') { S.ui.confirm = 'clear'; return render(); }
      var theme = S.ui.theme; S = blank(); S.ui.theme = theme; render(); toast('Everything cleared.');
    },
    importData: function (arg) {
      if (hasAnyData() && arg !== 'yes') { S.ui.confirm = 'importData'; return render(); }
      S.ui.confirm = ''; var el = document.getElementById('import-file'); if (el) el.click();
    },
    cancelConfirm: function () { S.ui.confirm = ''; render(); },
    exportData: function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'grove-' + today() + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    },
    theme: function (arg) { S.ui.theme = arg === 'dark' ? 'dark' : 'light'; render(); },
    openPrompt: function (arg) { var p = arg.split('|'); S.ui.promptKind = p[0]; S.ui.promptFrom = p[1]; go('prompt'); },
    copyPrompt: function (arg) {
      if (!promptFilled(arg)) return toast('Answer at least one question first, so the prompt is about you.');
      S.usage = S.usage || {}; S.usage.prompts = (S.usage.prompts || 0) + 1; save();
      copyText(buildPrompt(arg), 'Copied. Paste it into your own AI, then bring back what you want to keep.');
    },
    invite: function () {
      var url = location.origin + location.pathname;
      var text = 'I am trying Grove, the builder\'s journal. It helps you make the thing you keep putting off: one small step a day, one real reaction a week. Want to try it for a week?';
      /* The link goes inside the text: with a separate url, some apps show only a link preview and drop the sentence. */
      if (navigator.share) navigator.share({ text: text + '\n' + url }).catch(function () {});
      else copyText(text + ' ' + url, 'Invitation copied. Paste it into a message.');
    },
    again: function (arg) { S.feedback.again = S.feedback.again === arg ? '' : arg; render(); },
    sendFeedback: function (arg, el) {
      var p = feedbackPayload();
      if (!p.again && !p.tried && !p.stuck && !p.change) return toast('Pick an answer or write one line first.');
      var share = function (msg) {
        var text = feedbackText();
        if (navigator.share) navigator.share({ text: text }).catch(function () {});
        else copyText(text, msg || 'Copied. Paste it into a message to Ran.');
      };
      if (!FEEDBACK_ENDPOINT) return share();
      if (el) { el.disabled = true; el.textContent = 'Sending…'; }
      fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p) })
        .then(function (r) { if (!r.ok) throw new Error('relay ' + r.status); return r.json(); })
        .then(function () {
          S.feedback.tried = ''; S.feedback.stuck = ''; S.feedback.change = ''; S.feedback.again = ''; S.feedback.include = false;
          S.screen = 'week'; render(); toast('Sent to Ran. Thank you.');
        })
        .catch(function () {
          if (el) { el.disabled = false; el.textContent = 'Send to Ran'; }
          toast('Could not send right now. Nothing is lost. Try again, or copy it instead.');
        });
    },
    sendFirst: function (arg, el) {
      var text = (S.feedback.first || '').trim();
      if (!text) return toast('Write a few words first, or skip.');
      if (el) { el.disabled = true; el.textContent = 'Sending…'; }
      fetch(FEEDBACK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        name: (S.feedback.name || '').trim(), tried: 'First check-out question: what almost stopped you today?', stuck: text,
        seen: seenThisWeek(), recorded: recordedText() }) })
        .then(function (r) { if (!r.ok) throw new Error('relay'); S.ui.firstAsked = true; S.feedback.first = ''; render(); toast('Sent to Ran. Thank you.'); })
        .catch(function () { if (el) { el.disabled = false; el.textContent = 'Send to Ran'; } toast('Could not send right now. Try again later.'); });
    },
    skipFirst: function () { S.ui.firstAsked = true; render(); },
    copyAsk: function () {
      var g = (S.project.what || '').trim();
      copyText('Hi! I\'m working on ' + (g ? g.charAt(0).toLowerCase() + g.slice(1) : 'a small project') + '. Could I show you a rough version and ask you one question? 10 minutes is plenty.', 'Copied. Paste it into a message.');
    },
    copyFeedback: function () { copyText(feedbackText(), 'Copied. Paste it into a message to Ran.'); },
    setEnergy: function () {
      var el = document.getElementById('energy-range'); var d = D();
      d.energy = el ? Number(el.value) : 3; d.energySkipped = false; render();
    },
    shareOffer: function () {
      var text = offerText();
      if (!text) return toast('Write at least one line first.');
      S.usage = S.usage || {}; S.usage.offers = (S.usage.offers || 0) + 1; save();
      if (navigator.share) navigator.share({ title: 'An offer to try', text: text }).catch(function () {});
      else copyText(text, 'Copied. Paste it into a message.');
    },
    saveOfferImage: function () {
      if (!offerText()) return toast('Write at least one line first.');
      S.usage = S.usage || {}; S.usage.offers = (S.usage.offers || 0) + 1; save();
      offerImage(function (blob) {
        if (!blob) return toast('Could not make the image on this device.');
        var file = null;
        try { file = new File([blob], 'grove-offer.png', { type: 'image/png' }); } catch (e) { file = null; }
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) return navigator.share({ files: [file], title: 'An offer to try' }).catch(function () {});
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'grove-offer.png';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000); toast('Image saved.');
      });
    },
    nextLine: function () {
      var d = D(), list = linesFor(d), i = list.indexOf(lineFor(d));
      d.line = list[(i + 1) % list.length]; render();
    },
    tour: function () { S.ui.tourIdx = 0; go('tour'); },
    drain: function (arg) { var d = D(); d.drain = d.drain === arg ? '' : arg; render(); },
    reframeDone: function () { D().reframe = 'done'; render(); },
    reframeSkip: function () { D().reframe = 'skipped'; render(); },
    reframeOpen: function () { D().reframe = ''; render(); },
    useExampleStep: function (arg) { var d = D(); d.step = arg; render(); var el = document.getElementById('step-input'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } },
    setupAgain: function () { S.ui.setupIdx = 0; go('setup'); },
    setupFinish: function () { S.ui.setupFinish = true; render(); },
    setupStep: function (arg) { S.ui.setupFinish = false; S.ui.setupIdx = Math.min(Math.max(Number(arg) || 0, 0), SETUP_STEPS - 1); render(); },
    setWeeks: function (arg) { S.project.weeks = Number(arg); render(); },
    setupDone: function (arg) { S.ui.setupDone = true; S.ui.toured = true; S.ui.setupIdx = 0; S.ui.setupFinish = false; go('today'); if (arg === 'later') toast('Grove will be here when you are ready.'); },
    goalStarter: function (arg) {
      var cur = (S.project.what || '').trim(), was = GOAL_STARTERS.filter(function (g) { return cur.indexOf(g.trim()) === 0; })[0];
      S.project.what = was ? arg + cur.slice(was.trim().length).trim() : (cur ? arg + cur.charAt(0).toLowerCase() + cur.slice(1) : arg);
      render(); var el = document.getElementById('goal-input'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    },
    openFeedback: function () { S.ui.feedbackFrom = ['today', 'week', 'map'].indexOf(S.screen) >= 0 ? S.screen : 'week'; S.ui.askRan = false; go('feedback'); },
    dismissAsk: function () { S.ui.askRan = false; render(); },
    community: function () {
      if (COMMUNITY_URL) { window.open(COMMUNITY_URL, '_blank', 'noopener'); return; }
      toast('Coming soon: the WoMen AI Lab community, to share what you are making and see what others make.');
    },
    setFit: function (arg) { S.project.fit = S.project.fit === arg ? '' : arg; render(); },
    openIdeal: function (arg) { S.ui.idealStep = 0; S.ui.idealFrom = arg === 'map' ? 'map' : 'today'; go('ideal'); },
    offerPath: function (arg) { S.project.offerPath = S.project.offerPath === arg ? '' : arg; render(); },
    idealNext: function () { S.ui.idealStep = (S.ui.idealStep || 0) + 1; render(); },
    idealBack: function () { S.ui.idealStep = Math.max(0, (S.ui.idealStep || 0) - 1); render(); },
    idealRestart: function () { S.ui.idealStep = 0; render(); },
    clearExample: function () { var theme = S.ui.theme; S = blank(); S.ui.theme = theme; S.ui.setupDone = true; S.ui.toured = true; S.ui.mapSeen = true; go('setup'); toast('Example cleared. This one is yours.'); },
    tourStep: function (arg) { S.ui.tourIdx = Math.min(Math.max((S.ui.tourIdx || 0) + Number(arg), 0), TOUR.length - 1); render(); },
    tourDone: function (arg) { S.ui.toured = true; S.ui.tourIdx = 0; go(arg === 'map' ? 'map' : 'today'); },
    startStep: function () {
      var d = D();
      if (!has(d.step)) { toast('Write today\'s step first, or just record today.'); var el = document.getElementById('step-input'); if (el) el.focus(); return; }
      d.step = d.step.trim(); d.ready = true; S.ui.shrink = false;
      d.startedAt = new Date().toISOString(); d.timer = null; S.ui.timerDone = false; render();
    },
    remindOpen: function () { S.ui.remindOpen = true; render(); },
    remindAdd: function () {
      var el = document.getElementById('remind-time'), v = (el && el.value) || '09:00';
      S.ui.remindAt = v; S.ui.remindOpen = false; save();
      var a = document.createElement('a');
      a.href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(icsFile(v));
      a.download = 'grove-reminder.ics'; document.body.appendChild(a); a.click(); a.remove();
      render(); toast('Open the file to add it to your calendar.');
    },
    timerOpen: function () { D().timerOn = true; render(); },
    timerStart: function () { var d = D(), t = timerOf(d); t.end = new Date(Date.now() + leftMs(t)).toISOString(); S.ui.timerDone = false; S.ui.custom = false; render(); },
    timerPause: function () { var t = timerOf(D()); t.left = Math.max(0, leftMs(t)); t.end = ''; render(); },
    timerReset: function () { var t = timerOf(D()); t.left = t.mins * 60000; t.end = ''; S.ui.timerDone = false; render(); },
    setBox: function (arg) { var d = D(); setTimer(d, timerOf(d).mode, Number(arg)); },
    setMode: function (arg) { var d = D(), m = arg === 'rest' ? 'rest' : 'work'; if (timerOf(d).mode === m) return; stopPause(); setTimer(d, m, defaultMins(d, m)); },
    startRest: function () { var d = D(); setTimer(d, 'rest', defaultMins(d, 'rest'), true); },
    startWork: function () { var d = D(); setTimer(d, 'work', defaultMins(d, 'work'), true); },
    moreTime: function () { var d = D(); d.timer = { mode: 'work', mins: 10, end: new Date(Date.now() + 600000).toISOString(), left: 600000 }; S.ui.timerDone = false; render(); },
    customToggle: function () { S.ui.custom = true; render(); var el = document.getElementById('custom-min'); if (el) { el.focus(); el.select(); } },
    setCustom: function () {
      var el = document.getElementById('custom-min'), n = Math.round(Number(el && el.value));
      if (!(n >= 1 && n <= 180)) return toast('Pick between 1 and 180 minutes.');
      var d = D(); setTimer(d, timerOf(d).mode, n);
    },
    unstart: function () { var d = D(); d.startedAt = ''; d.wrappedAt = ''; d.timer = null; S.ui.editStep = false; render(); },
    editStep: function () {
      var d = D();
      if (S.ui.editStep && !has(d.step)) return toast('The step cannot be empty.');
      if (S.ui.editStep) d.step = d.step.trim();
      S.ui.editStep = !S.ui.editStep; render();
      if (S.ui.editStep) { var el = document.getElementById('step-input'); if (el) el.focus(); }
    },
    wrapUp: function (arg) {
      S.ui.editStep = false;
      if (!arg) { var t = D(); if (t.startedAt && !t.out) t.wrappedAt = new Date().toISOString(); }
      if (arg && S.days[arg]) { stopPause(); S.screen = 'checkout'; S.ui.outDate = arg; S.ui.confirm = ''; return render(); }
      go('checkout');
    },
    result: function (arg) { var d = outRec(); d.result = d.result === arg ? '' : arg; render(); },
    pauseOpen: function (arg) {
      var key = TRACKS[arg] ? arg : 'grounding';
      S.ui.pause = key; S.ui.pauseEnded = false; render();
      var a = getAudio(key); var p = a.play(); if (p && p.catch) p.catch(function () { updatePause(); });
    },
    pauseToggle: function () {
      var a = getAudio(S.ui.pause || 'grounding'); S.ui.pauseEnded = false;
      if (a.paused) { var p = a.play(); if (p && p.catch) p.catch(function () {}); } else a.pause();
    },
    pauseClose: function () { stopPause(); render(); },
    energy: function (arg) { var d = D(); d.energy = Number(arg); d.energySkipped = false; render(); },
    skipEnergy: function () { D().energySkipped = true; render(); },
    redoEnergy: function () { var d = D(); d.energy = 0; d.energySkipped = false; render(); },
    smaller: function () {
      var d = D();
      if (!has(d.step)) { toast('Write the step first, then make it smaller.'); var el0 = document.getElementById('step-input'); if (el0) el0.focus(); return; }
      S.ui.shrink = !S.ui.shrink; render();
      if (S.ui.shrink) { var p = document.querySelector('.shrink'); if (p) p.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
    },
    useShrink: function (arg) {
      var d = D(), x = SHRINK[Number(arg)]; if (!x) return;
      d.step = x[0] + baseStep(d.step); d.shrunk = true; S.ui.shrink = false; render(); toast('Smaller. You can still edit it.');
    },
    shrinkOwn: function () {
      var d = D(); d.shrunk = true; S.ui.shrink = false; render();
      var el = document.getElementById('step-input'); if (el) { el.focus(); el.select(); }
    },
    shrinkAI: function () {
      S.usage = S.usage || {}; S.usage.prompts = (S.usage.prompts || 0) + 1; save();
      copyText(buildPrompt('smaller'), 'Copied. Paste it into your own AI, then bring back the version you like.');
    },
    moveStep: function () {
      var d = D();
      if (!has(d.step)) return toast('There is no step to move.');
      var tm = addDays(today(), 1); var p = planFor(tm);
      p.step = has(p.step) ? p.step + ' / ' + d.step.trim() : d.step.trim();
      planFor(today()).step = ''; d.step = ''; d.planned = ''; d.moved = true;
      render(); toast('Moved to ' + nice(tm) + '.');
    },
    rest: function () { var d = D(); d.rest = true; d.out = true; go('today'); },
    /* A rest day goes back to check-in. A checked-out day opens its check-out again, filled in, and stays done. */
    reopen: function () {
      var d = D();
      if (d.rest) { d.out = false; d.rest = false; d.ready = false; d.startedAt = ''; return render(); }
      go('checkout');
    },
    saveCheckout: function (arg, el) {
      var pastDate = S.ui.outDate && S.days[S.ui.outDate] ? S.ui.outDate : '';
      var d = outRec();
      if (d.result === 'changed') d.step = (d.step || '').trim();
      reveal(el, function () { d.out = true; d.rest = false; go('today'); if (pastDate) toast('Saved ' + nice(pastDate) + '.'); sendCounts(true); });
    },
    showWeek: function (arg) { S.ui.viewWeek = arg === monday(today()) ? '' : arg; S.ui.note = ''; render(); },
    toggleRest: function (arg) { var p = planFor(arg); p.rest = !p.rest; render(); },
    decision: function (arg) { S.review.decision = arg; render(); },
    saveReview: function () {
      var r = S.review;
      if (!r.decision) return toast('Choose continue, adjust or pause first.');
      var wk = reviewWeek(); var w = W(wk); var next = addDays(wk, 7);
      var label = DECISIONS.filter(function (x) { return x[0] === r.decision; })[0][1];
      S.rings.push({ week: wk, savedOn: today(), decision: r.decision, decisionLabel: label, reason: (r.reason || '').trim(),
        question: w.question, sign: w.sign, notes: notesIn(wk).map(function (n) { return { date: n.date, happened: n.happened, changes: n.changes, person: n.person, evidence: n.evidence, rest: n.rest }; }) });
      var decision = r.decision; S.review = { decision: '', reason: '' };
      if (decision === 'pause') { S.paused = true; return go('today'); }
      var nw = W(next);
      if (decision === 'continue') {
        if (!has(nw.question)) nw.question = w.question;
        if (!has(nw.sign)) nw.sign = w.sign;
        if (!has(nw.who)) nw.who = w.who;
      }
      S.screen = 'week'; S.ui.confirm = '';
      S.ui.viewWeek = next === monday(today()) ? '' : next;
      S.ui.note = decision === 'continue' ? 'Saved as a Growth Ring. Same goal for the next week. Change anything you like.' : 'Saved as a Growth Ring. What would you like to try next week?';
      S.ui.askRan = true;
      render();
    },
    resume: function () { S.paused = false; render(); },
    useQuestion: function (arg) {
      var w = W(monday(today()));
      if (has(w.question)) return toast('You already have a question this week. Change it in This Week.');
      w.question = MAP[Number(arg)].question; save(); toast('Added to This Week. Edit it to fit.');
    }
  };

  function setBind(b, v) {
    var p = b.split('.');
    if (p[0] === 'day') (S.screen === 'checkout' ? outRec() : D())[p[1]] = v;
    else if (p[0] === 'week') W(S.screen === 'prompt' ? monday(today()) : viewWeek())[p[1]] = v;
    else if (p[0] === 'plan') planFor(p[1]).step = v;
    else if (p[0] === 'project') S.project[p[1]] = v;
    else if (p[0] === 'review') S.review[p[1]] = v;
    else if (p[0] === 'feedback') S.feedback[p[1]] = v;
  }
  function refreshPreviews() {
    var gs = document.getElementById('goal-sentence'); if (gs) { var s1 = goalSentence(); gs.textContent = s1; gs.hidden = !s1; }
    var a = document.getElementById('prompt-preview'); if (a) a.textContent = buildPrompt(S.ui.promptKind);
    var b = document.getElementById('feedback-preview'); if (b) b.textContent = feedbackText();
    var c = document.getElementById('offer-preview'); if (c) c.innerHTML = offerCardInner();
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !acts[el.dataset.act]) return;
    acts[el.dataset.act](el.dataset.arg, el);
  });
  app.addEventListener('input', function (e) {
    if (e.target.id === 'energy-range') {
      var n = Number(e.target.value);
      var blob = document.getElementById('blob'); if (blob) blob.className = 'blob lv' + n;
      var word = document.getElementById('energy-word'); if (word) word.textContent = LEVELS[n - 1];
      return;
    }
    autosize(e.target);
    var b = e.target.dataset && e.target.dataset.bind;
    if (!b) return;
    setBind(b, e.target.value); save(); refreshPreviews();
  });
  app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.check) { setBind(t.dataset.check, t.checked); save(); refreshPreviews(); return; }
    if (t.id === 'import-file' && t.files && t.files[0]) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var d = JSON.parse(String(reader.result));
          if (!d || d.v !== 2 || typeof d.days !== 'object' || typeof d.weeks !== 'object') throw new Error('not a Grove export');
          var base = blank(); base.ui.theme = S.ui.theme;
          ['weeks', 'days', 'rings', 'paused'].forEach(function (k) { if (d[k] !== undefined) base[k] = d[k]; });
          base.project = Object.assign({}, base.project, d.project || {});
          S = base; S.screen = 'today'; render(); toast('Imported.');
        } catch (err) { toast('That file is not a Grove export.'); }
      };
      reader.readAsText(t.files[0]);
    }
  });

  /* Swipe left or right through the tour on a phone. */
  var touchX = null;
  app.addEventListener('touchstart', function (e) { touchX = S.screen === 'tour' ? e.touches[0].clientX : null; }, { passive: true });
  app.addEventListener('touchend', function (e) {
    if (touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 50) acts.tourStep(dx < 0 ? '1' : '-1');
  });

  function render() {
    applyTheme();
    /* v0.7.6: the background takes a soft tint from today's energy (Ran picked option B, 2026-11-26). */
    var td = S.days[today()], en = td && td.energy;
    document.documentElement.setAttribute('data-energy', en ? (en <= 2 ? 'low' : (en >= 4 ? 'high' : 'mid')) : 'none');
    var fn = screens[S.screen] || screens.today;
    app.innerHTML = fn();
    Array.prototype.forEach.call(app.querySelectorAll('textarea'), autosize);
    save();
    window.scrollTo(0, 0);
  }

  render();
  setTimeout(function () { sendCounts(false); }, 3000);
  /* Every second while working: update the countdown, how full the shape is, and the tab title.
     At zero, redraw the timer once to offer the next move, and buzz gently where phones allow it. */
  setInterval(function () {
    var d = S.days[today()];
    var working = S.screen === 'today' && d && d.startedAt && !d.out && !S.paused;
    if (!working) { if (document.title !== IDLE_TITLE) document.title = IDLE_TITLE; return; }
    var t = timerOf(d);
    if (!running(t)) { if (document.title !== IDLE_TITLE) document.title = IDLE_TITLE; return; }
    var left = leftMs(t);
    document.title = (left > 0 ? msLeft(left) + (t.mode === 'rest' ? ' rest' : '') : (t.mode === 'rest' ? 'Rest is over' : 'Time is up')) + ' · Grove';
    var el = document.getElementById('t-left'); if (el) el.textContent = msLeft(left);
    var wv = document.getElementById('t-water'); if (wv) wv.style.setProperty('--level', level(t).toFixed(3));
    var typing = document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName);
    if (left <= 0 && !S.ui.timerDone && !typing) {
      S.ui.timerDone = true;
      var box = document.getElementById('work-time');
      if (box) box.innerHTML = timerBlock(d); else render();
      if (navigator.vibrate) try { navigator.vibrate([120, 80, 120]); } catch (e) { /* ignore */ }
    }
  }, 1000);

  /* Offline support only on a real https site, so local previews never serve stale files. */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();

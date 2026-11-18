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
  var PAUSE_AUDIO = 'pause.m4a';
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
      tryIt: 'Pick the part you are least sure about and make it this week\'s question.',
      question: 'Which part of this idea am I least sure about?' },
    { key: 'root', name: 'Root', title: 'Know who it is for', fields: ['who', 'before', 'after'], prompts: ['profile', 'storyboard', 'conversation', 'persona'],
      when: 'You are building for "everyone", or you have not talked to anyone yet.',
      write: 'One real person. What is happening around them, what they tell themselves, how that feels, what they do or avoid. Then the same once the problem is solved.',
      tryIt: 'Ask one person about the last time the problem happened. What did they do, what did they try, what did it cost them? Save one sentence in their words.',
      question: 'What did one real person do the last time this problem came up?' },
    { key: 'sprout', name: 'Sprout', title: 'Make the smallest offer', fields: ['offer'], prompts: ['demo', 'concept'],
      when: 'You keep adding features, or you cannot say what it is in one breath.',
      write: 'The smallest version you could put in front of someone, who it is for and who it is not for.',
      tryIt: 'Watch one real person use it on their own task. Say as little as you can.',
      question: 'What happens when one person tries the smallest version on their own task?' },
    { key: 'bloom', name: 'Bloom', title: 'Show the work', fields: ['place'], prompts: ['content'],
      when: 'The work exists and nobody has seen it.',
      write: 'One place and one kind of person, and the one thing you want them to do next.',
      tryIt: 'Share it once, there, with that ask. Note who actually does it.',
      question: 'Who takes the next step when I show this in one place?' },
    { key: 'pollinate', name: 'Pollinate', title: 'Invite, follow up, let it travel', fields: ['invite'], prompts: ['pitch', 'followup', 'investors'],
      when: 'People say "nice" and nothing happens, or the work is not travelling beyond the people you know.',
      write: 'A concrete invitation and what saying yes involves, such as bringing a project, booking a trial, or paying a stated price.',
      tryIt: 'Ask one person directly. Follow up once. Then ask them who else should see it. Record what they did and what a no or a silence taught you.',
      question: 'Who says yes to a concrete invitation, and who do they pass it on to?' }
  ];

  /* The questions Grove asks before it builds a prompt. Answers are saved, so each is written once. */
  var FIELDS = {
    what: ['project.what', 'What are you working on?', 'A sentence is enough.'],
    why: ['project.why', 'Why does this matter to you?', 'Your own reason, in your own words.'],
    place: ['project.place', 'Where will you show it, and to whom?', 'One place and one kind of person.'],
    invite: ['project.invite', 'What do you want them to do next?', 'Try it, book a call, bring a project, pay a stated price.'],
    contact: ['project.contact', 'How can they reach you?', 'A link, an email or a handle. It stays on this device until you share the card.'],
    who: ['project.who', 'Who is it for? One real person is best.', 'A name, or someone like "a freelance designer with two clients".'],
    before: ['project.before', 'What is it like for them now?', 'What is happening, what they tell themselves, how it feels, what they do.'],
    after: ['project.after', 'What would be different once this is solved?', ''],
    offer: ['project.offer', 'What is the smallest thing you could offer them?', ''],
    question: ['week.question', 'What do you want to find out this week?', ''],
    sign: ['week.sign', 'What sign would show it is going well?', ''],
    step: ['day.step', 'What is today\'s step?', '']
  };
  var PROMPTS = {
    conversation: { title: 'Prepare a real user conversation', blurb: 'Five neutral questions about the last time the problem came up, and a sentence to ask for the talk.', fields: ['what', 'who', 'question'],
      ask: ['Help me prepare one conversation with a real person this week.', 'Give me five neutral questions about the last time this problem came up for them: what they did, what they tried, what it cost them.', 'No leading questions and no pitching. Then write one short, friendly sentence I can use to ask for the conversation.'] },
    smaller: { title: 'Make this step smaller', blurb: 'Three ten-minute versions of today\'s step that can still teach you something.', fields: ['what', 'question', 'step'],
      ask: ['Give me three smaller versions of today\'s step. Each should take about ten minutes and still teach me something about this week\'s question.'] },
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
      project: { what: '', why: '', who: '', before: '', after: '', offer: '', place: '', invite: '', contact: '' },
      weeks: {}, days: {}, rings: [], paused: false,
      review: { decision: '', reason: '' },
      feedback: { name: '', contact: '', again: '', tried: '', stuck: '', change: '', include: false },
      usage: { prompts: 0, offers: 0 },
      ui: { confirm: '', viewWeek: '', note: '', theme: 'light', promptKind: '', promptFrom: 'week', lineIdx: 0, toured: false, tourIdx: 0, mapSeen: false }
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

  function load() {
    var base = blank();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.v === 2) {
          Object.keys(d).forEach(function (k) { base[k] = d[k]; });
          ['project', 'review', 'feedback', 'ui'].forEach(function (k) { base[k] = Object.assign({}, blank()[k], d[k] || {}); });
          base.ui.confirm = ''; base.ui.pause = false; base.ui.editStep = false; base.ui.shrink = false; base.ui.custom = false; base.ui.outDate = '';
          if (base.screen === 'checkout' || base.screen === 'tour') base.screen = 'today';
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
  /* Everyone sees the five-card tour once, new or not. It can be skipped and opened again from the footer. */
  if (!S.ui.toured) { S.screen = 'tour'; S.ui.tourIdx = 0; }

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
  /* Timer on the working screen: a countdown for work or for rest. The breathing shape slowly empties as
     the time runs down, so the breathing itself is never boxed in. At zero Grove offers the next move. */
  var CHIPS = { work: [5, 25, 45], rest: [5, 10, 15] };
  function defaultMins(d, mode) {
    if (mode === 'rest') return d.restMins || 5;
    if (d.workMins) return d.workMins;
    return d.energy && d.energy <= 2 ? 5 : (d.energy >= 4 ? 45 : 25);
  }
  function timerOf(d) {
    if (!d.timer || !d.timer.start) d.timer = { mode: 'work', start: d.startedAt || new Date().toISOString(), mins: defaultMins(d, 'work') };
    return d.timer;
  }
  function leftMs(t) { return new Date(t.start).getTime() + t.mins * 60000 - Date.now(); }
  function stale(t) { return Date.now() - new Date(t.start).getTime() > 12 * 3600000; }
  function msLeft(ms) {
    var s0 = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s0 / 3600), m = Math.floor(s0 % 3600 / 60), x = s0 % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  }
  function level(t) { return Math.max(0, Math.min(1, leftMs(t) / (t.mins * 60000))); }
  function timerBlob(d) {
    var t = timerOf(d);
    return '<span id="t-blob" class="blob lv' + (d.energy || 3) + ' breathe-slow timer-blob' + (t.mode === 'rest' ? ' rest' : '') + '" style="--level:' + level(t).toFixed(3) + '" aria-hidden="true"></span>';
  }
  function timerBlock(d) {
    var t = timerOf(d), done = leftMs(t) <= 0 || stale(t), rest = t.mode === 'rest';
    var modes = '<div class="mode-seg" role="group" aria-label="Timer mode">' +
      '<button class="' + (rest ? '' : 'on') + '" data-act="setMode" data-arg="work" aria-pressed="' + !rest + '">Work</button>' +
      '<button class="' + (rest ? 'on' : '') + '" data-act="setMode" data-arg="rest" aria-pressed="' + rest + '">Rest</button></div>';
    if (done) {
      return modes + '<p class="t-done serif">' + (rest ? 'Rest is over.' : 'Time is up.') + '</p>' +
        '<div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap">' + (rest
          ? '<button class="btn ghost small-btn" data-act="startWork">Back to work</button><button class="btn ghost small-btn" data-act="startRest">5 more minutes</button>'
          : '<button class="btn ghost small-btn" data-act="startRest">Rest ' + defaultMins(d, 'rest') + ' min</button><button class="btn ghost small-btn" data-act="moreTime">10 more minutes</button>') + '</div>';
    }
    var chips = CHIPS[t.mode].map(function (x) {
      return '<button class="' + (t.mins === x ? 'on' : '') + '" data-act="setBox" data-arg="' + x + '" aria-pressed="' + (t.mins === x) + '">' + x + ' min</button>';
    }).join('');
    var custom = CHIPS[t.mode].indexOf(t.mins) < 0;
    chips += S.ui.custom
      ? '<span class="custom-min"><input id="custom-min" type="number" inputmode="numeric" min="1" max="180" value="' + t.mins + '" aria-label="Minutes"><button data-act="setCustom">Set</button></span>'
      : '<button class="' + (custom ? 'on' : '') + '" data-act="customToggle">' + (custom ? t.mins + ' min' : 'Custom') + '</button>';
    return modes + '<span id="t-left" class="t-left" role="timer" aria-live="off">' + msLeft(leftMs(t)) + '</span>' +
      '<span class="small muted">' + (rest ? 'resting' : 'left') + ' · ' + t.mins + ' min</span>' +
      '<div class="seg chips box-chips" aria-label="Minutes">' + chips + '</div>';
  }
  function restartTimer(d, mode, mins) {
    d.timer = { mode: mode, start: new Date().toISOString(), mins: mins };
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
  function personLine() {
    var last = lastPerson();
    if (!last) return { text: 'Nobody else has seen the work yet.', warn: true };
    var n = daysBetween(last, today());
    var when = n === 0 ? 'today' : (n === 1 ? 'yesterday' : n + ' days ago');
    return { text: 'Someone else last saw it ' + when + '.', warn: last < monday(today()) };
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
    if (energy <= 2) return 'Low energy: pick the least effort that can still teach you something. Five minutes is enough.';
    if (energy === 3) return 'Steady energy: about half an hour on the step that teaches you most.';
    return 'Good energy: a day for the step that teaches the most, like watching someone use it.';
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
    var lines = ['I am using Grove, a journal that helps me turn an idea into an offer I can test with real people, one week at a time.', ''];
    P.fields.forEach(function (k) {
      var v = fieldValue(k);
      lines.push(FIELDS[k][1].replace(/\?$/, '') + ': ' + (has(v) ? v.trim() : '(not written yet)'));
    });
    var d = D();
    if (d.energy) lines.push('My energy today: ' + d.energy + ' of 5');
    lines.push('');
    P.ask.forEach(function (a) { lines.push(a); });
    lines.push('Suggest, do not decide for me. If something above is unclear, ask me one question first instead of guessing.');
    return lines.join('\n');
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
    var wk = monday(today());
    var days = weekDays(wk).map(function (k) { return S.days[k]; }).filter(Boolean);
    var out = days.filter(function (d) { return d.out; }).length;
    var energy = days.filter(function (d) { return d.energy; }).length;
    var steps = days.filter(function (d) { return d.out && !d.rest && has(d.step); }).length;
    var seen = days.filter(function (d) { return d.out && d.person; }).length;
    var mapKeys = []; MAP.forEach(function (m) { mapKeys = mapKeys.concat(m.fields); });
    var mapDone = mapKeys.filter(function (k) { return has(fieldValue(k)); }).length;
    var u = S.usage || {};
    return ['This week: checked out ' + out + ' of 7 days, energy check on ' + energy + ', ' + steps + ' day' + (steps === 1 ? '' : 's') + ' with a step, seen by someone on ' + seen + '.',
      'Weekly question written: ' + (has(W(wk).question) ? 'yes' : 'no') + '. Growth Rings saved: ' + S.rings.length + '.',
      'Growth Map answers: ' + mapDone + ' of ' + mapKeys.length + '. Prompts copied: ' + (u.prompts || 0) + '. Offer cards shared: ' + (u.offers || 0) + '.', 'Grove version: ' + APP_VERSION + '.'].join('\n');
  }
  function sharedNotes() {
    if (!S.feedback.include) return '';
    var w = W(monday(today()));
    var out = ['This week\'s question: ' + (has(w.question) ? w.question.trim() : '(not written)')];
    notesIn(monday(today())).forEach(function (n) {
      if (has(n.happened) || has(n.changes)) out.push(shortDay(n.date) + ': ' + (n.happened || '').trim() + (has(n.changes) ? ' → ' + n.changes.trim() : ''));
    });
    return out.join('\n');
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
      'Someone else saw my work this week: ' + p.seen, '', 'Recorded by Grove:', p.recorded];
    if (p.contact) out.push('', 'Reach me: ' + p.contact);
    if (p.notes) out.push('', p.notes);
    return out.join('\n');
  }

  /* ---------- view pieces ---------- */

  function backBtn(target) { return '<button class="icon-btn" aria-label="Back" data-act="go" data-arg="' + target + '">' + svg('back', 24) + '</button>'; }
  function tabs(active) {
    var t = [['today', 'Today'], ['week', 'This Week'], ['map', 'Growth Map']];
    return '<nav class="tabs" aria-label="Main"><span class="brand rail-brand">' + LOGO + 'Grove</span>' + t.map(function (x) {
      var dot = x[0] === 'map' && !S.ui.mapSeen ? '<span class="newdot" aria-label="not opened yet"></span>' : '';
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
  function statsFor(wk) {
    var notes = notesIn(wk);
    return { shown: notes.length, evidence: notes.filter(function (n) { return n.evidence && has(n.happened); }).length, person: notes.filter(function (n) { return n.person; }).length };
  }
  function weekRing(st, size) {
    var arcs = [[50, Math.min(1, st.shown / 7), 'var(--green)'], [37, Math.min(1, st.evidence / 3), 'var(--gold)'], [24, Math.min(1, st.person), 'var(--lilac)']];
    var out = '<svg class="weekring" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" role="img" aria-label="Showed up ' + st.shown + ' of 7 days, ' + st.evidence + ' of 3 evidence notes, seen by someone on ' + st.person + (st.person === 1 ? ' day' : ' days') + '">';
    arcs.forEach(function (a) {
      var c = 2 * Math.PI * a[0];
      out += '<circle cx="60" cy="60" r="' + a[0] + '" fill="none" stroke="var(--line)" stroke-width="10"/>';
      if (a[1] > 0) out += '<circle class="arc" cx="60" cy="60" r="' + a[0] + '" fill="none" stroke="' + a[2] + '" stroke-width="10" stroke-linecap="round" transform="rotate(-90 60 60)" stroke-dasharray="' + c.toFixed(1) + '" style="--c:' + c.toFixed(1) + ';stroke-dashoffset:' + (c * (1 - a[1])).toFixed(1) + '"/>';
    });
    return out + '</svg>';
  }
  function ringLegend(st) {
    var row = function (color, text) { return '<span class="row small"><span class="key" style="background:var(--' + color + ')"></span>' + text + '</span>'; };
    var closed = st.shown >= 7 && st.evidence >= 3 && st.person >= 1;
    return '<div class="stack" style="gap:8px">' + row('green', 'Showed up ' + Math.min(st.shown, 7) + ' of 7') + row('gold', 'Evidence ' + Math.min(st.evidence, 3) + ' of 3') +
      row('lilac', 'Seen by someone ' + (st.person ? 'yes' : 'not yet')) + (closed ? '<span class="small warn">All three rings closed this week.</span>' : '<span class="small muted">Rest days count as showing up.</span>') + '</div>';
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
  var APP_VERSION = 'v0.6';
  var FOOT = '<p class="foot">Grove by WoMen AI Lab · ' + APP_VERSION + ' · <button class="link foot-link" data-act="tour">How Grove works</button></p>';

  /* The tour: the five things worth knowing first. */
  var TOUR = [
    { art: function () { return '<span class="blob lv3 tour-blob" aria-hidden="true"></span>'; },
      title: 'One small step a day',
      body: 'Tell Grove how much energy you have, and size one step to fit. On a low day, ten minutes counts.' },
    { art: function () { return weekRing({ shown: 4, evidence: 2, person: 1 }, 132); },
      title: 'Three rings tell you if the idea got out this week',
      body: 'One for the days you showed up (rest days count), one for notes that count as evidence, one for someone else seeing the work. That last one matters most.' },
    { art: function () { return '<span class="logo-big tour-logo">' + LOGO + '</span>'; },
      title: 'Decide on Sunday',
      body: 'Look back at what happened and choose: continue, adjust or pause. Each review is kept as a Growth Ring.' },
    { art: function () { return '<span class="tour-tiles">' + MAP.map(function (m) { return '<span class="tile t-' + m.key + '">' + svg(m.key, 26) + '</span>'; }).join('') + '</span>'; },
      title: 'The Growth Map, when you want more',
      body: 'Five steps from idea to offer: Seed, Root, Sprout, Bloom, Pollinate. What you write there fills in your AI prompts and your offer card. It is optional.' },
    { art: function () { return '<span class="donemark tour-lock">' + svg('lock', 40) + '</span>'; },
      title: 'Your notes stay with you',
      body: 'What you write stays in this browser. Nothing leaves it unless you tap Send feedback, and you see exactly what goes first.' }
  ];

  /* ---------- screens ---------- */

  var screens = {};

  screens.today = function () {
    var d = D();
    var w = W(monday(today()));
    var pl = personLine();
    var head = '<header class="top"><span class="brand">' + LOGO + 'Grove</span><span class="small muted">' + esc(nice(today())) + '</span></header>';
    var intro = hasAnyData() ? '' :
      '<div class="notice stack"><span class="logo-big">' + LOGO + '</span><p class="serif">Turn an idea you care about into an offer you can test.</p>' +
      '<p class="small muted">Start with a step below. Nothing else needs filling in first.</p>' +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="example">Load the Grove example</button>' +
      '<button class="btn ghost small-btn" data-act="go" data-arg="week">Plan this week</button>' +
      '<button class="btn ghost small-btn" data-act="go" data-arg="map">Set up step by step</button></div></div>';
    var due = (!S.paused && reviewWeek() !== monday(today()))
      ? '<div class="notice stack"><p>Last week has not been reviewed yet.</p><div class="row"><button class="btn ghost small-btn" data-act="go" data-arg="review">Review last week</button></div></div>'
      : '';
    var weekLine = '<button class="row" style="background:none;border:none;text-align:left;padding:0;gap:14px;align-items:flex-start;width:100%" data-act="go" data-arg="week"><span class="stack" style="gap:6px;flex:1;min-width:0">' +
      '<span class="label">This week\'s question</span>' +
      '<span class="serif' + (has(w.question) ? '' : ' empty') + '">' + (has(w.question) ? esc(w.question) : 'No question yet. Add one in This Week.') + '</span>' +
      '<span class="small ' + (pl.warn ? 'warn' : 'muted') + '">' + esc(pl.text) + '</span></span>' + weekRing(statsFor(monday(today())), 68) + '</button>';
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
        : '<div class="stack working-step"><span class="label">' + (d.timer && d.timer.mode === 'rest' ? 'Your step' : 'Working on') + '</span><p class="serif step-now">' + esc(d.step) + '</p></div>';
      var w0 = W(monday(today()));
      body = (has(w0.question) ? '<p class="small muted center-text">This week: ' + esc(w0.question) + '</p>' : '') +
        '<div class="working-orb">' + timerBlob(d) + '</div>' +
        '<div id="work-time" class="working-time">' + timerBlock(d) + '</div>' +
        stepBlock +
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
        (has(d.step) && !d.rest ? '<p><span class="struck">' + esc(d.step) + '</span></p>' : '') +
        (resultLabel(d.result) ? '<span class="pill">' + esc(resultLabel(d.result)) + '</span>' : '') +
        (has(d.happened) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">What happened</span><p>' + esc(d.happened) + '</p></div>' : '') +
        (has(d.changes) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">What it changes</span><p>' + esc(d.changes) + '</p></div>' : '') +
        (has(tomorrow) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">Tomorrow</span><p>' + esc(tomorrow) + '</p></div>' : '') +
        (parse(today()).getDay() === 0 ? '<button class="btn" data-act="go" data-arg="review">Review this week</button>' : '') +
        '<button class="btn ghost" data-act="go" data-arg="week">Open This Week</button>' +
        '<button class="link" data-act="reopen">Change today\'s entry</button></div>';
    } else {
      var energy = (!d.energy && !d.energySkipped)
        ? '<div class="stack"><h1>How much energy do you have today?</h1>' + energyPicker() +
          '<button class="btn ghost" data-act="setEnergy">That is my energy</button>' +
          '<button class="link" style="align-self:center" data-act="skipEnergy">Skip</button></div>'
        : '<button class="link" style="align-self:flex-start" data-act="redoEnergy">' + (d.energy ? 'Energy ' + d.energy + ' of 5, ' + LEVELS[d.energy - 1].toLowerCase() + ' · change' : 'Energy skipped · check now') + '</button>';
      var planned = has(d.planned) && d.planned.trim() !== (d.step || '').trim() ? '<span class="small muted">Planned: ' + esc(d.planned) + '</span>' : '';
      var size = sizeLine(d.energy);
      var restNote = planFor(today()).rest && !has(d.step) ? '<p class="small muted">Today is marked as a rest day in your plan.</p>' : '';
      body = energy + restNote +
        '<div class="card"><div><label class="label" for="step-input">Today\'s step</label>' + planned +
        '<textarea id="step-input" class="plain" rows="3" data-bind="day.step" placeholder="Write one small step">' + esc(d.step) + '</textarea>' +
        (size ? '<span class="small muted">' + esc(size) + '</span>' : '') +
        (d.energy && d.energy <= 2 && has(d.step) && !d.shrunk && !S.ui.shrink ? '<button class="link" style="align-self:flex-start;padding:0" data-act="smaller">Show smaller versions</button>' : '') + '</div></div>' +
        '<div class="row wrap">' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="smaller">Make it smaller</button>' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="moveStep">Move to tomorrow</button>' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="rest">Rest today</button></div>' +
        shrinkPanel(d) +
        (d.energy || d.energySkipped ? lineCard() + pausePanel() : '') +
        '<button class="btn" data-act="startStep">Start my step</button>' +
        '<button class="link" data-act="wrapUp">Just record today</button>';
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

  /* The guided pause. The audio object lives outside the screen, so redrawing never cuts it off. */
  var pauseAudio = null;
  function getAudio() {
    if (pauseAudio) return pauseAudio;
    pauseAudio = new Audio(PAUSE_AUDIO);
    pauseAudio.preload = 'metadata';
    pauseAudio.addEventListener('timeupdate', updatePause);
    pauseAudio.addEventListener('loadedmetadata', updatePause);
    pauseAudio.addEventListener('play', updatePause);
    pauseAudio.addEventListener('pause', updatePause);
    pauseAudio.addEventListener('ended', function () { pauseAudio.currentTime = 0; S.ui.pauseEnded = true; if (S.ui.pause) render(); });
    pauseAudio.addEventListener('error', function () { S.ui.pause = false; if (S.screen === 'today') render(); toast('The pause audio could not load. You can start without it.'); });
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
  function stopPause() { if (pauseAudio) { pauseAudio.pause(); pauseAudio.currentTime = 0; } S.ui.pause = false; S.ui.pauseEnded = false; }
  function pausePanel() {
    if (!S.ui.pause) {
      return '<button class="btn ghost pause-open" data-act="pauseOpen">' + svg('play', 20) + '<span>Grounding pause <span class="muted">· optional</span></span></button>';
    }
    var a = pauseAudio, playing = a && !a.paused;
    return '<div class="pause-card stack" role="region" aria-label="Grounding pause">' +
      '<div class="pause-head"><span class="label">Grounding pause</span><button class="link" data-act="pauseClose">Close</button></div>' +
      '<div class="pause-row"><button id="pause-play" class="pause-play" data-act="pauseToggle" aria-label="' + (playing ? 'Pause' : 'Play') + '">' + svg(playing ? 'pause' : 'play', 26) + '</button>' +
      '<span id="pause-blob" class="blob lv3 pause-blob' + (playing ? ' breathing' : '') + '" aria-hidden="true"></span>' +
      '<span class="stack" style="gap:6px;flex:1"><span class="pause-track"><span id="pause-bar"></span></span><span id="pause-time" class="small muted">0:00</span></span></div>' +
      '<p class="small muted">' + (S.ui.pauseEnded ? 'That is the pause. Start whenever you like.' : 'Stop whenever you want. Your step is waiting below.') + '</p></div>';
  }

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
    { title: 'Small enough for your worst day',
      body: 'A step you can take on a low day beats a plan you keep putting off. That is why Grove asks about your energy first and sizes the step to it.',
      source: 'Martha Beck\'s coaching work, which Ran trained and is certified in. She calls these "turtle steps": steps so small you could take them on your worst day. Finding Your Own North Star, 2001.' },
    { title: 'Decide when, not only what',
      body: 'Intentions turn into action more often when you have already decided when you will act. The weekly plan gives each day one step, and Start my step turns it into now.',
      source: 'Peter Gollwitzer, "Implementation intentions: Strong effects of simple plans", American Psychologist, 1999.' },
    { title: 'Learn from real people, not from guessing',
      body: 'You find out whether an idea works by putting it in front of the people it is for, early and often, and asking what they actually did rather than what they might do. That is the third ring.',
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
      '<div class="notice stack"><span class="label">What we do not claim</span><p class="small">The energy check is our own idea, and so is how the pieces fit together. No study shows that Grove itself works. The pilot is how we find out. Grove is a tool, not coaching or therapy.</p></div>' +
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
      field('What does it change about my next step?', 'day.changes', d.changes, 'One line is enough.', 2) +
      check('Someone other than me saw or tried it today', 'day.person', d.person) +
      check('Count this note as evidence for this week\'s question', 'day.evidence', d.evidence) +
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
      var mark = rec && rec.out ? '<span class="dot filled' + (rec.evidence ? ' evidence' : '') + '"></span>' : '<span class="dot' + (k === today() ? ' today' : '') + '"></span>';
      var did = rec && rec.out && has(rec.happened) ? '<span class="small muted">' + (rec.person ? 'Seen by someone · ' : '') + esc(rec.happened) + '</span>' : '';
      return '<div class="dayrow"><div class="row" style="gap:10px">' + mark + '<label class="label" for="p-' + k + '" style="width:58px">' + esc(shortDay(k)) + '</label>' +
        '<input id="p-' + k + '" type="text" data-bind="plan.' + k + '" value="' + esc(p.step) + '" placeholder="' + (p.rest ? 'Rest' : 'One small step') + '">' +
        '<button class="btn ghost small-btn rest' + (p.rest ? ' on' : '') + '" aria-pressed="' + p.rest + '" data-act="toggleRest" data-arg="' + k + '">Rest</button></div>' + did + '</div>';
    }).join('');
    var ringList = S.rings.length ? '<div class="list">' + S.rings.slice().reverse().map(function (r) {
      var rn = r.notes || [];
      return '<div>' + weekRing({ shown: rn.length, evidence: rn.filter(function (n) { return n.evidence && has(n.happened); }).length, person: rn.filter(function (n) { return n.person; }).length }, 48) + '<span><span class="small muted">' + esc(range(r.week)) + ' · ' + esc(r.decisionLabel) + '</span><br>' +
        (has(r.question) ? esc(r.question) + '<br>' : '') + (has(r.reason) ? '<span class="small muted">' + esc(r.reason) + '</span>' : '') + '</span></div>';
    }).join('') + '</div>' : '<p class="muted">A finished review becomes a Growth Ring here.</p>';
    var dark = S.ui.theme === 'dark';

    return '<section class="screen wide">' +
      '<header class="top"><span class="brand">' + (isCur ? 'This Week' : 'Next Week') + '</span><span class="small muted">' + esc(range(wk)) + '</span></header>' +
      (S.ui.note ? '<div class="notice">' + esc(S.ui.note) + '</div>' : '') +
      '<div class="seg" role="group" aria-label="Which week">' +
      '<button class="' + (isCur ? 'on' : '') + '" aria-pressed="' + isCur + '" data-act="showWeek" data-arg="' + cur + '">This week</button>' +
      '<button class="' + (!isCur ? 'on' : '') + '" aria-pressed="' + !isCur + '" data-act="showWeek" data-arg="' + addDays(cur, 7) + '">Plan next week</button></div>' +
      '<div class="cols"><div class="g g1">' +
      (isCur ? '<div class="row" style="gap:18px">' + weekRing(statsFor(cur), 132) + ringLegend(statsFor(cur)) + '</div>' : '') +
      field('One question or outcome for the week', 'week.question', w.question, 'What do you want to find out?', 2) +
      field('One sign you could observe', 'week.sign', w.sign, 'What would you see or hear if it is going well?', 2) +
      field('Who will see or try it this week?', 'week.who', w.who, 'A name is better than a group.', 2) +
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
      '<header class="top">' + backBtn(S.ui.promptFrom === 'map' ? 'map' : 'week') + '<span class="small muted">AI Tool Shed</span></header>' +
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
      '<header class="top">' + backBtn('week') + '<span class="small muted">Feedback</span></header>' +
      '<h1>Tell Ran how it went</h1>' +
      '<p class="muted">Grove has already noted how you used it this week. Add what only you can say. Every question is optional.</p>' +
      '<div class="stack" style="gap:8px"><span class="label">Would you open Grove again next week?</span><div class="seg" role="group" aria-label="Would you open Grove again next week?">' + again + '</div></div>' +
      field('What did you try?', 'feedback.tried', f.tried, 'A step, a prompt card, the offer card…', 2) +
      field('Where did you stop or get stuck?', 'feedback.stuck', f.stuck, '', 2) +
      field('What would you change?', 'feedback.change', f.change, '', 2) +
      field('Your name or nickname', 'feedback.name', f.name, 'Remembered for next time', 1) +
      field('How can Ran reach you? (optional)', 'feedback.contact', f.contact, 'Remembered for next time', 1) +
      check('Also share this week\'s question and my check-out notes', 'feedback.include', f.include) +
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
    var evidence = notes.filter(function (n) { return n.evidence && has(n.happened); }).length;
    var people = notes.filter(function (n) { return n.person; }).length;
    var steps = notes.filter(function (n) { return has(n.step) && !n.rest; }).length;
    var notice = '';
    if (!people) {
      notice = '<div class="notice stack"><span class="tag"><span class="ring"></span>Nobody else saw it</span><p>No one other than you saw or tried the work this week. That is the first thing to change next week.</p></div>';
    } else if (evidence < 3) {
      notice = '<div class="notice stack"><span class="tag"><span class="ring"></span>Can\'t tell yet</span><p>' + evidence + ' note' + (evidence === 1 ? '' : 's') + ' counted as evidence. Fewer than three is thin. You can still decide.</p></div>';
    }
    var seg = DECISIONS.map(function (x) {
      var on = S.review.decision === x[0];
      return '<button class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="decision" data-arg="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('week') + '<span class="small muted">Review · ' + esc(range(wk)) + '</span></header>' +
      '<h1>What did the week show you?</h1>' +
      '<div class="two"><div><span class="label">The question</span><span' + (has(w.question) ? '' : ' class="empty"') + '>' + (has(w.question) ? esc(w.question) : 'Not set') + '</span>' +
      (has(w.sign) ? '<span class="small muted">Sign: ' + esc(w.sign) + '</span>' : '') + '</div>' +
      '<div><span class="label">What happened</span>' + (withNote.length ? withNote.map(function (n) {
        return '<span><span class="small muted">' + esc(shortDay(n.date)) + (n.evidence ? ' · evidence' : '') + (n.person ? ' · seen by someone' : '') + '</span><br>' + esc(n.happened) + '</span>';
      }).join('') : '<span class="empty">Nothing written down yet</span>') + '</div></div>' +
      '<p class="small muted">' + steps + ' day' + (steps === 1 ? '' : 's') + ' with a step · someone else saw it on ' + people + ' day' + (people === 1 ? '' : 's') + '</p>' +
      notice +
      '<p class="serif">What do you want to do next? Your call.</p>' +
      '<div class="seg" role="group" aria-label="Decision">' + seg + '</div>' +
      field('Why?', 'review.reason', S.review.reason, 'One or two sentences in your own words.', 3) +
      '<div style="flex:1"></div>' +
      '<button class="btn" data-act="saveReview">Save as a Growth Ring</button></section>';
  };

  screens.map = function () {
    return '<section class="screen">' +
      '<header class="top"><span class="brand">Growth Map</span><span class="small muted">Optional</span></header>' +
      '<p class="muted">Work through the five steps in order, or open only the one you need. What you write here fills in your AI prompts and your offer card.</p>' +
      MAP.map(function (m, i) {
        return '<details class="mapstep"><summary><span class="tile t-' + m.key + '">' + svg(m.key, 28) + '</span>' +
          '<span class="stack" style="gap:2px"><span class="label">' + (i + 1) + ' · ' + m.name + ' · ' + m.fields.filter(function (k) { return has(fieldValue(k)); }).length + ' of ' + m.fields.length + ' written</span><span class="serif">' + m.title + '</span></span>' +
          '<span class="chev">' + svg('chev', 22) + '</span></summary>' +
          '<div class="stack" style="gap:16px">' +
          '<div><span class="label">Open it when</span><p>' + esc(m.when) + '</p></div>' +
          '<div class="stack"><span class="label">Write down</span><p class="small muted">' + esc(m.write) + '</p>' + m.fields.map(function (k) { var f = FIELDS[k]; return field(f[1], f[0], fieldValue(k), f[2], 2); }).join('') + '</div>' +
          '<div><span class="label">Try it</span><p>' + esc(m.tryIt) + '</p></div>' +
          '<button class="btn ghost small-btn" style="align-self:flex-start" data-act="useQuestion" data-arg="' + i + '">Use as this week\'s question</button>' +
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
    S.project = { what: 'Grove: a journal that helps women turn an idea into an offer they can test.',
      why: 'I kept polishing my own idea instead of showing it to anyone. I want a tool that gets me out of that.',
      who: 'An independent consultant, freelancer or creative with years of experience, who wants to turn what she knows into a small product.',
      before: 'She has started on an idea she cares about. She keeps refining it or learning another tool. At the end of the week she still does not know how someone would use it.',
      after: 'Every week one real person sees or tries her work, and she knows what to build or sell next.',
      offer: 'Two weeks with Grove: a few minutes a day, one small step sized to your energy, and a short review at the end of each week.',
      place: 'The WoMen AI Lab group, to builders who have something they can test this week.',
      invite: 'Open the link, write this week\'s question, and tell me after seven days what you would skip.',
      contact: 'randing-create.github.io/grove' };
    S.weeks[wk] = {
      question: 'Does planning one small step a day change what I actually do next?',
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
      loadExample(); render(); toast('Example loaded. Everything in it can be edited.');
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
      var text = 'I am trying Grove, a small journal for turning an idea into an offer you can test. Want to try it for a week?';
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
    tourStep: function (arg) { S.ui.tourIdx = Math.min(Math.max((S.ui.tourIdx || 0) + Number(arg), 0), TOUR.length - 1); render(); },
    tourDone: function (arg) { S.ui.toured = true; S.ui.tourIdx = 0; go(arg === 'map' ? 'map' : 'today'); },
    startStep: function () {
      var d = D();
      if (!has(d.step)) { toast('Write today\'s step first, or just record today.'); var el = document.getElementById('step-input'); if (el) el.focus(); return; }
      stopPause(); d.step = d.step.trim(); d.ready = true; S.ui.shrink = false;
      d.startedAt = new Date().toISOString(); d.timer = null;
      restartTimer(d, 'work', defaultMins(d, 'work'));
    },
    setBox: function (arg) { var d = D(); restartTimer(d, timerOf(d).mode, Number(arg)); },
    setMode: function (arg) { var d = D(); var m = arg === 'rest' ? 'rest' : 'work'; if (timerOf(d).mode === m && leftMs(d.timer) > 0) return; restartTimer(d, m, defaultMins(d, m)); },
    startRest: function () { var d = D(); restartTimer(d, 'rest', timerOf(d).mode === 'rest' ? 5 : defaultMins(d, 'rest')); },
    startWork: function () { var d = D(); restartTimer(d, 'work', defaultMins(d, 'work')); },
    moreTime: function () { var d = D(); d.timer = { mode: 'work', start: new Date().toISOString(), mins: 10 }; S.ui.timerDone = false; render(); },
    customToggle: function () { S.ui.custom = true; render(); var el = document.getElementById('custom-min'); if (el) { el.focus(); el.select(); } },
    setCustom: function () {
      var el = document.getElementById('custom-min'), n = Math.round(Number(el && el.value));
      if (!(n >= 1 && n <= 180)) return toast('Pick between 1 and 180 minutes.');
      var d = D(); restartTimer(d, timerOf(d).mode, n);
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
    pauseOpen: function () {
      S.ui.pause = true; S.ui.pauseEnded = false; render();
      var a = getAudio(); var p = a.play(); if (p && p.catch) p.catch(function () { updatePause(); });
    },
    pauseToggle: function () {
      var a = getAudio(); S.ui.pauseEnded = false;
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
      reveal(el, function () { d.out = true; d.rest = false; go('today'); if (pastDate) toast('Saved ' + nice(pastDate) + '.'); });
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
        question: w.question, sign: w.sign, notes: notesIn(wk).map(function (n) { return { date: n.date, happened: n.happened, changes: n.changes, person: n.person, evidence: n.evidence }; }) });
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
      S.ui.note = decision === 'continue' ? 'Saved as a Growth Ring. Same question for the next week. Change anything you like.' : 'Saved as a Growth Ring. Write the question you want to test next.';
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
    var fn = screens[S.screen] || screens.today;
    app.innerHTML = fn();
    save();
    window.scrollTo(0, 0);
  }

  render();
  /* Every second while working: update the countdown, how full the shape is, and the tab title.
     At zero, redraw the timer once to offer the next move, and buzz gently where phones allow it. */
  setInterval(function () {
    var d = S.days[today()];
    var working = S.screen === 'today' && d && d.startedAt && !d.out && !S.paused;
    if (!working) { if (document.title !== 'Grove') document.title = 'Grove'; return; }
    var t = timerOf(d), left = leftMs(t);
    document.title = (left > 0 ? msLeft(left) + (t.mode === 'rest' ? ' rest' : '') : (t.mode === 'rest' ? 'Rest is over' : 'Time is up')) + ' · Grove';
    var el = document.getElementById('t-left'); if (el) el.textContent = msLeft(left);
    var b = document.getElementById('t-blob'); if (b) b.style.setProperty('--level', level(t).toFixed(3));
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

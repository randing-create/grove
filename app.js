(function () {
  'use strict';

  var KEY = 'grove-v1';
  var OLD_KEY = 'wal-studio-v1';
  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');

  var LEVELS = ['Empty', 'Low', 'Okay', 'Good', 'Full'];
  var DECISIONS = [['continue', 'Continue'], ['adjust', 'Adjust'], ['pause', 'Pause']];
  var LINES = {
    heavy: { title: 'When the day feels heavy', lines: ['I can start with the energy I have.', 'I can feel unsure and still take one small step.', 'What would make the next ten minutes more doable?'] },
    testing: { title: 'When I\'m testing an idea', lines: ['I can care about this idea and stay curious about what happens.', 'I\'m allowed to learn something I didn\'t expect.', 'One honest observation gives me something to work with.'] },
    showing: { title: 'When I\'m ready to show the work', lines: ['I can let one real person see this version.', 'I can share it simply and leave room for a response.', 'I can ask for help with one specific thing.'] },
    inviting: { title: 'When I\'m inviting or following up', lines: ['I can make a clear invitation and let the other person choose.', 'I can follow up once, warmly and plainly.', 'I can hear a no and let it teach me something.'] }
  };

  var ICON = {
    seed: '<path d="M12 3c4 4 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2-7 6-11z"/><path d="M12 13v5"/>',
    root: '<path d="M4 9h16"/><path d="M12 3v18"/><path d="M12 12c-1 4-4 5-6 7"/><path d="M12 12c1 4 4 5 6 7"/>',
    sprout: '<path d="M12 21v-9"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z"/><path d="M12 12c0-3 2.5-5 6-5 0 3-2.5 5-6 5z"/>',
    bloom: '<circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="5.5" r="2.5"/><circle cx="18.5" cy="12" r="2.5"/><circle cx="12" cy="18.5" r="2.5"/><circle cx="5.5" cy="12" r="2.5"/>',
    harvest: '<path d="M4 10h16l-1.5 9h-13z"/><path d="M8 10l4-6 4 6"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    chev: '<path d="M6 9l6 6 6-6"/>',
    back: '<path d="M15 5l-7 7 7 7"/>'
  };
  var LOGO = '<svg class="logo" aria-hidden="true" viewBox="0 0 48 48"><g fill="none" stroke="currentColor" stroke-width="2.6"><circle cx="24" cy="24" r="16.3"/><circle cx="24" cy="24" r="10.8"/><circle cx="24" cy="24" r="5.3"/></g><ellipse cx="35.3" cy="10.8" rx="8.2" ry="4.1" transform="rotate(-45 35.3 10.8)" fill="#D9E76C" stroke="currentColor" stroke-width="2.4"/></svg>';
  /* Set this to a public form link to add an "Open the feedback form" button on the feedback screen. */
  var FEEDBACK_FORM = '';
  function svg(name, size) {
    return '<svg aria-hidden="true" width="' + (size || 26) + '" height="' + (size || 26) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + '</svg>';
  }

  var MAP = [
    { key: 'seed', name: 'Seed', title: 'Choose what matters', prompts: ['vision', 'landscape'],
      when: 'You are unsure why this is worth building, or you keep switching ideas.',
      write: 'Why this matters to you, who gets stuck and when, and what you would notice if things got better for them.',
      tryIt: 'Pick the part you are least sure about and make it this week\'s question.',
      question: 'Which part of this idea am I least sure about?' },
    { key: 'root', name: 'Root', title: 'Know who it is for', prompts: ['profile', 'conversation', 'persona'],
      when: 'You are building for "everyone", or you have not talked to anyone yet.',
      write: 'One real person. Before: what is happening around them, what they tell themselves, how that feels, what they do or avoid. After: the same four lines once the problem is solved.',
      tryIt: 'Ask one person about the last time the problem happened. What did they do, what did they try, what did it cost them? Save one sentence in their words.',
      question: 'What did one real person do the last time this problem came up?' },
    { key: 'sprout', name: 'Sprout', title: 'Make the smallest offer', prompts: ['demo', 'concept'],
      when: 'You keep adding features, or you cannot say what it is in one breath.',
      write: 'Who it is for and who it is not for, what changes for them, the smallest version you could put in front of someone, and what would change your mind.',
      tryIt: 'Watch one real person use it on their own task. Say as little as you can.',
      question: 'What happens when one person tries the smallest version on their own task?' },
    { key: 'bloom', name: 'Bloom', title: 'Show the work', prompts: ['content'],
      when: 'The work exists and nobody has seen it.',
      write: 'One place and one kind of person, and the one thing you want them to do next.',
      tryIt: 'Share it once, there, with that ask. Note who actually does it.',
      question: 'Who takes the next step when I show this in one place?' },
    { key: 'harvest', name: 'Harvest', title: 'Invite and follow up', prompts: ['pitch', 'followup'],
      when: 'People say "nice" and nothing happens.',
      write: 'A concrete invitation and what saying yes involves, such as bringing a project, booking a trial, or paying a stated price.',
      tryIt: 'Ask one person directly. Follow up once. Record what they did, whether they came back, and what a no or a silence taught you.',
      question: 'Who says yes to a concrete invitation?' }
  ];

  /* The questions Grove asks before it builds a prompt. Answers are saved, so each is written once. */
  var FIELDS = {
    what: ['project.what', 'What are you working on?', 'A sentence is enough.'],
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
      ask: ['Set up a simple follow-up list I can keep in a note or a spreadsheet: the columns, one example row, and a short follow-up message I can send once.', 'The message should be warm and plain, and easy to say no to.'] }
  };

  /* ---------- state ---------- */

  function blank() {
    return {
      v: 2, screen: 'today',
      project: { what: '', who: '', before: '', after: '', offer: '' },
      weeks: {}, days: {}, rings: [], paused: false,
      review: { decision: '', reason: '' },
      feedback: { tried: '', stuck: '', change: '', include: false },
      ui: { confirm: '', viewWeek: '', note: '', theme: 'light', promptKind: '', promptFrom: 'week', lineIdx: 0 }
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
          base.ui.confirm = '';
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
    if (!S.days[t]) S.days[t] = { energy: 0, energySkipped: false, planned: '', step: '', shrunk: false, rest: false, happened: '', changes: '', person: false, evidence: false, out: false };
    var rec = S.days[t];
    var p = planFor(t).step || '';
    if (!rec.out && rec.planned !== p) {
      if (!has(rec.step) || rec.step === rec.planned) rec.step = p;
      rec.planned = p;
    }
    return rec;
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
    var keys = Object.keys(S.days).filter(function (k) { return S.days[k].person; }).sort();
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
    if (energy <= 2) return 'Low energy: pick the least effort that can still teach you something. Ten minutes is enough.';
    if (energy === 3) return 'Steady energy: about half an hour on the step that teaches you most.';
    return 'Good energy: a day for the step that teaches the most, like watching someone use it.';
  }
  function lineFor(d) {
    var step = d.step || '';
    var kind = d.energy && d.energy <= 2 ? 'heavy'
      : (/invite|follow|price|pay|offer/i.test(step) ? 'inviting'
        : (/send|show|share|ask|post|call|message|email|meet|interview/i.test(step) ? 'showing' : 'testing'));
    var list = LINES[kind].lines;
    return list[(parse(today()).getDate() + (S.ui.lineIdx || 0)) % list.length];
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
  function feedbackText() {
    var f = S.feedback; var w = W(monday(today()));
    var v = function (s) { return has(s) ? s.trim() : '(left empty)'; };
    var out = ['Grove feedback · ' + nice(today()), '', 'What I tried: ' + v(f.tried), 'Where I stopped or got stuck: ' + v(f.stuck), 'What I would change: ' + v(f.change)];
    if (f.include) {
      out.push('', 'This week\'s question: ' + v(w.question));
      notesIn(monday(today())).forEach(function (n) {
        if (has(n.happened) || has(n.changes)) out.push(shortDay(n.date) + ': ' + (n.happened || '').trim() + (has(n.changes) ? ' → ' + n.changes.trim() : ''));
      });
    }
    return out.join('\n');
  }

  /* ---------- view pieces ---------- */

  function backBtn(target) { return '<button class="icon-btn" aria-label="Back" data-act="go" data-arg="' + target + '">' + svg('back', 24) + '</button>'; }
  function tabs(active) {
    var t = [['today', 'Today'], ['week', 'This Week'], ['map', 'Growth Map']];
    return '<nav class="tabs" aria-label="Main"><span class="brand rail-brand">' + LOGO + 'Grove</span>' + t.map(function (x) {
      return '<button data-act="go" data-arg="' + x[0] + '"' + (active === x[0] ? ' class="on"' : '') + '>' + x[1] + '</button>';
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
  function rings(e) {
    var color = !e ? '' : (e <= 2 ? ' e-low' : (e === 3 ? ' e-mid' : ' e-high'));
    var sizes = { 5: 272, 4: 222, 3: 172, 2: 122, 1: 72 };
    var out = '<div class="rings' + color + '" role="group" aria-label="Energy from 1 to 5">';
    [5, 4, 3, 2, 1].forEach(function (n) {
      out += '<button class="' + (e && n <= e ? 'on' : '') + '" style="width:' + sizes[n] + 'px;height:' + sizes[n] + 'px" aria-pressed="' + (n === e) + '" aria-label="Energy ' + n + ' of 5, ' + LEVELS[n - 1] + '" data-act="energy" data-arg="' + n + '"><span class="num">' + n + '</span></button>';
    });
    return out + '</div><p class="serif" style="text-align:center">' + (e ? LEVELS[e - 1] : 'Tap a ring') + '</p>';
  }
  function promptCard(kind, from) {
    var P = PROMPTS[kind]; var n = promptFilled(kind);
    return '<div class="starter"><span class="brand">' + esc(P.title) + '</span><p class="small muted">' + esc(P.blurb) + '</p>' +
      '<div class="row between"><span class="small muted">' + n + ' of ' + P.fields.length + ' answers ready</span>' +
      '<button class="btn ghost small-btn" data-act="openPrompt" data-arg="' + kind + '|' + from + '">Open</button></div></div>';
  }
  var FOOT = '<p class="foot">Grove by WoMen AI Lab</p>';

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
      '<button class="btn ghost small-btn" data-act="go" data-arg="week">Plan this week</button></div></div>';
    var due = (!S.paused && reviewWeek() !== monday(today()))
      ? '<div class="notice stack"><p>Last week has not been reviewed yet.</p><div class="row"><button class="btn ghost small-btn" data-act="go" data-arg="review">Review last week</button></div></div>'
      : '';
    var weekLine = '<button class="stack" style="background:none;border:none;text-align:left;padding:0;gap:6px" data-act="go" data-arg="week">' +
      '<span class="label">This week\'s question</span>' +
      '<span class="serif' + (has(w.question) ? '' : ' empty') + '">' + (has(w.question) ? esc(w.question) : 'No question yet. Add one in This Week.') + '</span>' +
      '<span class="small ' + (pl.warn ? 'warn' : 'muted') + '">' + esc(pl.text) + '</span></button>';
    var body;

    if (S.paused) {
      body = '<div class="grow center"><h1 class="big">Paused.</h1><p class="muted">Nothing is lost. Pick it up when you are ready.</p>' +
        '<button class="btn" data-act="resume">Resume</button></div>';
    } else if (d.out) {
      var tomorrow = planFor(addDays(today(), 1)).step;
      body = '<div class="grow center"><span class="donemark">' + svg('check', 44) + '</span>' +
        '<h1 class="big">' + (d.rest ? 'Rest counts too.' : 'You showed up today.') + '</h1>' +
        (has(d.step) && !d.rest ? '<p><span class="struck">' + esc(d.step) + '</span></p>' : '') +
        (has(d.changes) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">What it changes</span><p>' + esc(d.changes) + '</p></div>' : '') +
        (has(tomorrow) ? '<div class="notice" style="text-align:left;align-self:stretch"><span class="label">Tomorrow</span><p>' + esc(tomorrow) + '</p></div>' : '') +
        (parse(today()).getDay() === 0 ? '<button class="btn" data-act="go" data-arg="review">Review this week</button>' : '') +
        '<button class="btn ghost" data-act="go" data-arg="week">Open This Week</button>' +
        '<button class="link" data-act="reopen">Change today\'s entry</button></div>';
    } else {
      var energy = (!d.energy && !d.energySkipped)
        ? '<div class="stack"><h1>How much energy do you have today?</h1>' + rings(0) +
          '<button class="link" style="align-self:center" data-act="skipEnergy">Skip</button></div>'
        : '<button class="link" style="align-self:flex-start" data-act="redoEnergy">' + (d.energy ? 'Energy ' + d.energy + ' of 5, ' + LEVELS[d.energy - 1].toLowerCase() + ' · change' : 'Energy skipped · check now') + '</button>';
      var planned = has(d.planned) && d.planned.trim() !== (d.step || '').trim() ? '<span class="small muted">Planned: ' + esc(d.planned) + '</span>' : '';
      var size = sizeLine(d.energy);
      var restNote = planFor(today()).rest && !has(d.step) ? '<p class="small muted">Today is marked as a rest day in your plan.</p>' : '';
      body = energy + restNote +
        '<button class="mantra" data-act="nextLine" aria-label="A line for today. Tap for another."><span class="label">A line for today · tap for another</span><span class="serif">' + esc(lineFor(d)) + '</span></button>' +
        '<div class="card"><div><label class="label" for="step-input">Today\'s step</label>' + planned +
        '<textarea id="step-input" class="plain" rows="3" data-bind="day.step" placeholder="Write one small step">' + esc(d.step) + '</textarea>' +
        (size ? '<span class="small muted">' + esc(size) + '</span>' : '') + '</div></div>' +
        '<button class="btn" data-act="didIt">I did it</button>' +
        '<div class="row wrap">' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="smaller">Make it smaller</button>' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="moveStep">Move to tomorrow</button>' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="rest">Rest today</button></div>' +
        '<button class="link" data-act="go" data-arg="checkout">Check out without a step</button>';
    }
    return '<section class="screen">' + head + intro + due + weekLine + body + FOOT + '</section>' + tabs('today');
  };

  screens.checkout = function () {
    var d = D();
    var tm = addDays(today(), 1);
    var summary = '';
    if (has(d.planned) || has(d.step)) {
      summary = '<div class="card">' +
        (has(d.planned) ? '<div><span class="label">Planned</span><span class="small">' + esc(d.planned) + '</span></div>' : '') +
        '<div><span class="label">Chose</span><span class="small' + (has(d.step) ? '' : ' empty') + '">' + (has(d.step) ? esc(d.step) + (d.shrunk ? ' (made smaller)' : '') : 'No step today') + '</span></div></div>';
    }
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('today') + '<span class="small muted">Check-out</span></header>' +
      '<h1>One thing I learned</h1>' + summary +
      field('What actually happened?', 'day.happened', d.happened, 'What you saw or heard, in plain words.', 3) +
      field('What does it change about my next step?', 'day.changes', d.changes, 'One line is enough.', 2) +
      check('Someone other than me saw or tried it today', 'day.person', d.person) +
      check('Count this note as evidence for this week\'s question', 'day.evidence', d.evidence) +
      field('Tomorrow\'s step (optional)', 'plan.' + tm, planFor(tm).step, 'Leave it empty if you do not know yet.', 2) +
      '<div style="flex:1"></div>' +
      '<button class="btn" data-act="saveCheckout">Save today</button></section>';
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
      return '<div><span class="bullet"></span><span><span class="small muted">' + esc(range(r.week)) + ' · ' + esc(r.decisionLabel) + '</span><br>' +
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
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('week') + '<span class="small muted">Feedback</span></header>' +
      '<h1>Tell Ran how it went</h1>' +
      '<p class="muted">Nothing is sent automatically. You write it here, then choose where to send it.</p>' +
      field('What did you try in Grove?', 'feedback.tried', f.tried, '', 2) +
      field('Where did you stop or get stuck?', 'feedback.stuck', f.stuck, '', 2) +
      field('What would you change?', 'feedback.change', f.change, '', 2) +
      check('Include this week\'s question and my check-out notes', 'feedback.include', f.include) +
      '<details><summary class="small">What will be shared</summary><pre id="feedback-preview">' + esc(feedbackText()) + '</pre></details>' +
      '<div style="flex:1"></div>' +
      (FEEDBACK_FORM ? '<a class="btn" style="display:flex;align-items:center;justify-content:center;text-decoration:none" href="' + FEEDBACK_FORM + '" target="_blank" rel="noopener">Open the feedback form</a>' : '') +
      '<button class="btn' + (FEEDBACK_FORM ? ' ghost' : '') + '" data-act="shareFeedback">Share it</button>' +
      '<button class="btn ghost" data-act="copyFeedback">Copy instead</button></section>';
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
    var lines = Object.keys(LINES).map(function (k) {
      return '<div class="stack" style="gap:6px"><span class="label">' + esc(LINES[k].title) + '</span>' + LINES[k].lines.map(function (l) { return '<p class="serif" style="font-size:21px;font-style:italic">' + esc(l) + '</p>'; }).join('') + '</div>';
    }).join('');
    return '<section class="screen">' +
      '<header class="top"><span class="brand">Growth Map</span><span class="small muted">Optional</span></header>' +
      '<p class="muted">Five short pages. Open one when it is useful. You do not need them to use Grove.</p>' +
      MAP.map(function (m, i) {
        return '<details class="mapstep"><summary><span class="tile t-' + m.key + '">' + svg(m.key, 28) + '</span>' +
          '<span class="stack" style="gap:2px"><span class="label">' + (i + 1) + ' · ' + m.name + '</span><span class="serif">' + m.title + '</span></span>' +
          '<span class="chev">' + svg('chev', 22) + '</span></summary>' +
          '<div class="stack" style="gap:16px">' +
          '<div><span class="label">Open it when</span><p>' + esc(m.when) + '</p></div>' +
          '<div><span class="label">Write down</span><p>' + esc(m.write) + '</p></div>' +
          '<div><span class="label">Try it</span><p>' + esc(m.tryIt) + '</p></div>' +
          '<button class="btn ghost small-btn" style="align-self:flex-start" data-act="useQuestion" data-arg="' + i + '">Use as this week\'s question</button>' +
          '<span class="label">Ask your AI for help</span>' + m.prompts.map(function (k) { return promptCard(k, 'map'); }).join('') +
          '</div></details>';
      }).join('') +
      '<div class="section"><span class="brand">Lines for the moment</span>' + lines + '</div>' +
      FOOT + '</section>' + tabs('map');
  };

  /* ---------- actions ---------- */

  function go(screen) {
    S.screen = screen; S.ui.confirm = '';
    if (screen !== 'week') { S.ui.note = ''; S.ui.viewWeek = ''; }
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
      who: 'An independent consultant who wants to turn what she knows into a small product.',
      before: 'She keeps polishing her idea and learning new tools. She tells herself it is not ready. It feels busy and stuck. Nobody else has seen it.',
      after: 'One real person has tried it each week, and she knows what to build next.',
      offer: 'A two-week try-out of Grove with one check-in call.' };
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
      copyText(buildPrompt(arg), 'Copied. Paste it into your own AI, then bring back what you want to keep.');
    },
    invite: function () {
      var url = location.origin + location.pathname;
      var text = 'I am trying Grove, a small journal for turning an idea into an offer you can test. Want to try it for a week?';
      if (navigator.share) navigator.share({ title: 'Grove', text: text, url: url }).catch(function () {});
      else copyText(text + ' ' + url, 'Invitation copied. Paste it into a message.');
    },
    shareFeedback: function () {
      var f = S.feedback;
      if (!has(f.tried) && !has(f.stuck) && !has(f.change)) return toast('Write at least one line first.');
      var text = feedbackText();
      if (navigator.share) navigator.share({ title: 'Grove feedback', text: text }).catch(function () {});
      else copyText(text, 'Copied. Paste it into a message to Ran.');
    },
    copyFeedback: function () { copyText(feedbackText(), 'Copied. Paste it into a message to Ran.'); },
    nextLine: function () { S.ui.lineIdx = (S.ui.lineIdx || 0) + 1; render(); },
    energy: function (arg) { var d = D(); d.energy = Number(arg); d.energySkipped = false; render(); },
    skipEnergy: function () { D().energySkipped = true; render(); },
    redoEnergy: function () { var d = D(); d.energy = 0; d.energySkipped = false; render(); },
    didIt: function () {
      var d = D();
      if (!has(d.step)) return toast('Write today\'s step first, or check out without one.');
      d.step = d.step.trim(); go('checkout');
    },
    smaller: function () {
      var d = D(); d.shrunk = true; save();
      toast('Cut it to the first ten minutes. Rewrite the step so it says only that.');
      var el = document.getElementById('step-input'); if (el) el.focus();
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
    reopen: function () { var d = D(); d.out = false; d.rest = false; render(); },
    saveCheckout: function (arg, el) {
      reveal(el, function () { var d = D(); d.out = true; d.rest = false; go('today'); });
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
    if (p[0] === 'day') D()[p[1]] = v;
    else if (p[0] === 'week') W(S.screen === 'prompt' ? monday(today()) : viewWeek())[p[1]] = v;
    else if (p[0] === 'plan') planFor(p[1]).step = v;
    else if (p[0] === 'project') S.project[p[1]] = v;
    else if (p[0] === 'review') S.review[p[1]] = v;
    else if (p[0] === 'feedback') S.feedback[p[1]] = v;
  }
  function refreshPreviews() {
    var a = document.getElementById('prompt-preview'); if (a) a.textContent = buildPrompt(S.ui.promptKind);
    var b = document.getElementById('feedback-preview'); if (b) b.textContent = feedbackText();
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !acts[el.dataset.act]) return;
    acts[el.dataset.act](el.dataset.arg, el);
  });
  app.addEventListener('input', function (e) {
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

  function render() {
    applyTheme();
    var fn = screens[S.screen] || screens.today;
    app.innerHTML = fn();
    save();
    window.scrollTo(0, 0);
  }

  render();

  /* Offline support only on a real https site, so local previews never serve stale files. */
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();

(function () {
  'use strict';

  var KEY = 'grove-v1';
  var OLD_KEY = 'wal-studio-v1';
  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');

  var LEVELS = ['Empty', 'Low', 'Okay', 'Good', 'Full'];
  var DECISIONS = [['continue', 'Continue'], ['adjust', 'Adjust'], ['pause', 'Pause']];
  var LINES = {
    heavy: ['I can start with the energy I have.', 'I can feel unsure and still take one small step.', 'What would make the next ten minutes more doable?'],
    testing: ['I can care about this idea and stay curious about what happens.', 'I\'m allowed to learn something I didn\'t expect.', 'One honest observation gives me something to work with.'],
    showing: ['I can let one real person see this version.', 'I can share it simply and leave room for a response.', 'I can hear a no and let it teach me something.']
  };
  var MAP = [
    { name: 'Seed', title: 'Choose what matters',
      when: 'You are unsure why this is worth building, or you keep switching ideas.',
      write: 'Why this matters to you, who gets stuck and when, and what you would notice if things got better for them.',
      tryIt: 'Pick the part you are least sure about and make it this week\'s question.',
      ai: 'Turn your own words into two sentences about the project, and look up what people already use to solve this.',
      question: 'Which part of this idea am I least sure about?' },
    { name: 'Root', title: 'Know who it is for',
      when: 'You are building for "everyone", or you have not talked to anyone yet.',
      write: 'One real person. Before: what is happening around them, what they tell themselves, how that feels, what they do or avoid. After: the same four lines once the problem is solved.',
      tryIt: 'Ask one person about the last time the problem happened. What did they do, what did they try, what did it cost them? Save one sentence in their words.',
      ai: 'Rehearse the questions with you, and check that none of them lead the answer.',
      question: 'What did one real person do the last time this problem came up?' },
    { name: 'Sprout', title: 'Make the smallest offer',
      when: 'You keep adding features, or you cannot say what it is in one breath.',
      write: 'Who it is for and who it is not for, what changes for them, the smallest version you could put in front of someone, and what would change your mind.',
      tryIt: 'Watch one real person use it on their own task. Say as little as you can.',
      ai: 'Help you build a rough demo, and explain a change so you can make it yourself.',
      question: 'What happens when one person tries the smallest version on their own task?' },
    { name: 'Bloom', title: 'Show the work',
      when: 'The work exists and nobody has seen it.',
      write: 'One place and one kind of person, and the one thing you want them to do next.',
      tryIt: 'Share it once, there, with that ask. Note who actually does it.',
      ai: 'Draft the post from a note you chose to share, and find where these people already gather.',
      question: 'Who takes the next step when I show this in one place?' },
    { name: 'Harvest', title: 'Invite and follow up',
      when: 'People say "nice" and nothing happens.',
      write: 'A concrete invitation and what saying yes involves, such as bringing a project, booking a trial, or paying a stated price.',
      tryIt: 'Ask one person directly. Follow up once. Record what they did, whether they came back, and what a no or a silence taught you.',
      ai: 'Practise the ask with you, and keep a simple list of who you asked and when.',
      question: 'Who says yes to a concrete invitation?' }
  ];

  /* ---------- state ---------- */

  function blank() {
    return {
      v: 2, screen: 'today',
      project: { what: '', who: '' },
      weeks: {}, days: {}, rings: [], paused: false,
      review: { decision: '', reason: '' },
      ui: { confirm: '', viewWeek: '', note: '' }
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
    if (old.queued) s.weeks[monday(today())].plan[today()] = { step: old.queued, rest: false };
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
          base.project = Object.assign({}, blank().project, d.project || {});
          base.review = Object.assign({}, blank().review, d.review || {});
          base.ui = Object.assign({}, blank().ui, d.ui || {}); base.ui.confirm = '';
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
    var seenThisWeek = last >= monday(today());
    var when = n === 0 ? 'today' : (n === 1 ? 'yesterday' : n + ' days ago');
    return { text: 'Someone else last saw it ' + when + '.', warn: !seenThisWeek };
  }
  function hasAnyData() {
    return has(S.project.what) || Object.keys(S.days).some(function (k) { return S.days[k].out || has(S.days[k].step) || S.days[k].energy; }) ||
      Object.keys(S.weeks).some(function (k) { var w = S.weeks[k]; return has(w.question) || has(w.sign) || Object.keys(w.plan || {}).some(function (d) { return has(w.plan[d].step); }); });
  }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }
  function sizeLine(energy) {
    if (!energy) return '';
    if (energy <= 2) return 'Low energy: pick the least effort that can still teach you something. Ten minutes is enough.';
    if (energy === 3) return 'Steady energy: about half an hour on the step that teaches you most.';
    return 'Good energy: a day for the step that teaches the most, like watching someone use it.';
  }
  function lineFor(d) {
    var kind = d.energy && d.energy <= 2 ? 'heavy' : (/send|show|share|ask|invite|post|call|message|email|meet|interview/i.test(d.step || '') ? 'showing' : 'testing');
    return LINES[kind][parse(today()).getDate() % LINES[kind].length];
  }

  /* ---------- prompt cards (copied to the person's own AI; nothing is sent from here) ---------- */

  function buildPrompt(kind) {
    var w = W(monday(today())); var d = D();
    var f = function (s) { return has(s) ? s.trim() : '(not written yet)'; };
    var ctx = [
      'I am using Grove, a journal that helps me turn an idea into an offer I can test with real people, one week at a time.',
      'What I am working on: ' + f(S.project.what),
      'Who it is for: ' + f(S.project.who),
      'This week\'s question: ' + f(w.question),
      'The sign I am looking for: ' + f(w.sign)
    ];
    if (kind === 'conversation') {
      return ctx.concat(['', 'Help me prepare one conversation with a real person this week.',
        'Give me five neutral questions about the last time this problem came up for them: what they did, what they tried, what it cost them.',
        'No leading questions and no pitching. Then write one short, friendly sentence I can use to ask for the conversation.',
        'If something above is unclear, ask me one question first instead of guessing.']).join('\n');
    }
    return ctx.concat(['Today\'s step: ' + f(d.step), 'My energy today: ' + (d.energy ? d.energy + ' of 5' : '(not checked)'), '',
      'Give me three smaller versions of today\'s step. Each should take about ten minutes and still teach me something about this week\'s question.',
      'Suggest, do not decide for me.']).join('\n');
  }
  function copyText(text) {
    var done = function () { toast('Copied. Paste it into your own AI, then bring back what you want to keep.'); };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy. Open the preview and select the text.'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
  }

  /* ---------- view pieces ---------- */

  var BACK = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l-6 6 6 6"/></svg>';
  function backBtn(target) { return '<button class="icon-btn" aria-label="Back" data-act="go" data-arg="' + target + '">' + BACK + '</button>'; }
  function tabs(active) {
    var t = [['today', 'Today'], ['week', 'This Week'], ['map', 'Growth Map']];
    return '<nav class="tabs" aria-label="Main"><span class="brand rail-brand">Grove</span>' + t.map(function (x) {
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
  function levels(e) {
    return '<div class="levels">' + LEVELS.map(function (name, i) {
      var n = i + 1;
      return '<button class="level' + (n === e ? ' on' : '') + '" aria-pressed="' + (n === e) + '" aria-label="' + name + '" data-act="energy" data-arg="' + n + '">' + n + '</button>';
    }).join('') + '</div><div class="row between small muted"><span>Empty</span><span>Full</span></div>';
  }

  /* ---------- screens ---------- */

  var screens = {};

  screens.today = function () {
    var d = D();
    var w = W(monday(today()));
    var pl = personLine();
    var head = '<header class="top"><span class="brand">Grove</span><span class="small muted">' + esc(nice(today())) + '</span></header>';
    var intro = hasAnyData() ? '' :
      '<div class="notice stack"><p class="serif">Turn an idea you care about into an offer you can test.</p>' +
      '<p class="small muted">Start with a step below. Nothing else needs filling in first.</p>' +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="example">Load the Grove example</button>' +
      '<button class="btn ghost small-btn" data-act="go" data-arg="week">Plan this week</button></div></div>';
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
      body = '<div class="grow center"><h1 class="big">' + (d.rest ? 'Rest counts too.' : 'You showed up today.') + '</h1>' +
        (has(d.changes) ? '<div class="notice" style="text-align:left"><span class="label">What it changes</span><p>' + esc(d.changes) + '</p></div>' : '') +
        (has(tomorrow) ? '<div class="notice" style="text-align:left"><span class="label">Tomorrow</span><p>' + esc(tomorrow) + '</p></div>' : '') +
        (parse(today()).getDay() === 0 ? '<button class="btn" data-act="go" data-arg="review">Review this week</button>' : '') +
        '<button class="btn ghost" data-act="go" data-arg="week">Open This Week</button>' +
        '<button class="link" data-act="reopen">Change today\'s entry</button></div>';
    } else {
      var energy = (!d.energy && !d.energySkipped)
        ? '<div class="stack"><h1>How much energy do you have today?</h1>' + levels(0) +
          '<button class="link" style="align-self:flex-start" data-act="skipEnergy">Skip</button></div>'
        : '<button class="link" style="align-self:flex-start" data-act="redoEnergy">' + (d.energy ? 'Energy ' + d.energy + ' of 5 · change' : 'Energy skipped · check now') + '</button>';
      var planned = has(d.planned) && d.planned.trim() !== (d.step || '').trim() ? '<span class="small muted">Planned: ' + esc(d.planned) + '</span>' : '';
      var size = sizeLine(d.energy);
      var restNote = planFor(today()).rest && !has(d.step) ? '<p class="small muted">Today is marked as a rest day in your plan.</p>' : '';
      body = energy + restNote +
        '<div class="card"><div><label class="label" for="step-input">Today\'s step</label>' + planned +
        '<textarea id="step-input" class="plain" rows="3" data-bind="day.step" placeholder="Write one small step">' + esc(d.step) + '</textarea>' +
        (size ? '<span class="small muted">' + esc(size) + '</span>' : '') + '</div>' +
        '<div><span class="small muted">' + esc(lineFor(d)) + '</span></div></div>' +
        '<button class="btn" data-act="didIt">I did it</button>' +
        '<div class="row wrap">' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="smaller">Make it smaller</button>' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="moveStep">Move to tomorrow</button>' +
        '<button class="btn ghost small-btn" style="flex:1" data-act="rest">Rest today</button></div>' +
        '<button class="link" data-act="go" data-arg="checkout">Check out without a step</button>';
    }
    return '<section class="screen">' + head + intro + weekLine + body + '</section>' + tabs('today');
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
      var mark = rec && rec.out ? '<span class="dot filled' + (rec.evidence ? ' evidence' : '') + '" title="Checked out"></span>' : '<span class="dot' + (k === today() ? ' today' : '') + '"></span>';
      var did = rec && rec.out && has(rec.happened) ? '<span class="small muted">' + (rec.person ? 'Seen by someone · ' : '') + esc(rec.happened) + '</span>' : '';
      return '<div class="dayrow"><div class="row" style="gap:10px">' + mark + '<label class="label" for="p-' + k + '" style="width:54px">' + esc(shortDay(k)) + '</label>' +
        '<input id="p-' + k + '" type="text" data-bind="plan.' + k + '" value="' + esc(p.step) + '" placeholder="' + (p.rest ? 'Rest' : 'One small step') + '">' +
        '<button class="btn ghost small-btn rest' + (p.rest ? ' on' : '') + '" aria-pressed="' + p.rest + '" data-act="toggleRest" data-arg="' + k + '">Rest</button></div>' + did + '</div>';
    }).join('');
    var rings = S.rings.length ? '<div class="list">' + S.rings.slice().reverse().map(function (r) {
      return '<div><span class="bullet c-gold"></span><span><span class="small muted">' + esc(range(r.week)) + ' · ' + esc(r.decisionLabel) + '</span><br>' +
        (has(r.question) ? esc(r.question) + '<br>' : '') + (has(r.reason) ? '<span class="small muted">' + esc(r.reason) + '</span>' : '') + '</span></div>';
    }).join('') + '</div>' : '<p class="muted">A finished review becomes a Growth Ring here.</p>';
    var card = function (kind, title, text) {
      return '<div class="starter"><span class="brand">' + title + '</span><p class="small muted">' + text + '</p>' +
        '<details><summary class="small">See exactly what will be copied</summary><pre>' + esc(buildPrompt(kind)) + '</pre></details>' +
        '<div class="row"><button class="btn ghost small-btn" data-act="copyPrompt" data-arg="' + kind + '">Copy for my own AI</button></div></div>';
    };

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
      (isCur ? '<button class="btn ghost" data-act="go" data-arg="review">Review this week</button>' : '') +
      '</div><div class="g g2">' +
      '<div class="section"><span class="brand">AI Tool Shed</span>' +
      '<p class="small muted">Grove has no AI built in yet. These cards copy a prompt with your notes in it, for the AI you already use.</p>' +
      card('conversation', 'Prepare a real user conversation', 'Five neutral questions about the last time the problem came up, and a sentence to ask for the talk.') +
      card('smaller', 'Make this step smaller', 'Three ten-minute versions of today\'s step that can still teach you something.') + '</div>' +
      '<div class="section"><span class="brand">Project notes</span>' +
      field('What are you working on?', 'project.what', S.project.what, 'A sentence is enough.', 2) +
      field('Who is it for? That person can be you.', 'project.who', S.project.who, '', 2) + '</div>' +
      '</div><div class="g g3">' +
      '<div class="section"><span class="brand">Growth Rings</span>' + rings + '</div>' +
      '<div class="section"><span class="brand">Your data</span>' +
      '<p class="small muted">Saved in this browser only. Nothing is sent anywhere. Export to move it to another device, then import it there.</p>' +
      confirmBox('example', 'This replaces what you have written so far. Load the example anyway?') +
      confirmBox('clear', 'This deletes everything saved in this browser. It cannot be undone.') +
      confirmBox('importData', 'Importing replaces what is saved in this browser. Continue?') +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="exportData">Export</button>' +
      '<button class="btn ghost small-btn" data-act="importData">Import</button>' +
      '<button class="btn ghost small-btn" data-act="example">Load example</button>' +
      '<button class="btn ghost small-btn" data-act="clear">Clear everything</button></div>' +
      '<input id="import-file" type="file" accept="application/json,.json" class="sr" tabindex="-1" aria-label="Import a Grove export file"></div>' +
      '</div></div></section>' + tabs('week');
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
      '<header class="top"><span class="brand">Growth Map</span><span class="small muted">Optional reading</span></header>' +
      '<p class="muted">Five short pages. Open one when it is useful. You do not need them to use Grove.</p>' +
      MAP.map(function (m, i) {
        return '<details class="mapstep"><summary><span class="label">' + (i + 1) + ' · ' + m.name + '</span><span class="serif">' + m.title + '</span></summary>' +
          '<div class="stack">' +
          '<div><span class="label">Open it when</span><p>' + esc(m.when) + '</p></div>' +
          '<div><span class="label">Write down</span><p>' + esc(m.write) + '</p></div>' +
          '<div><span class="label">Try it</span><p>' + esc(m.tryIt) + '</p></div>' +
          '<div><span class="label">AI can help</span><p>' + esc(m.ai) + '</p></div>' +
          '<button class="btn ghost small-btn" style="align-self:flex-start" data-act="useQuestion" data-arg="' + i + '">Use as this week\'s question</button>' +
          '</div></details>';
      }).join('') + '</section>' + tabs('map');
  };

  /* ---------- actions ---------- */

  function go(screen) {
    S.screen = screen; S.ui.confirm = '';
    if (screen !== 'week') { S.ui.note = ''; S.ui.viewWeek = ''; }
    render();
  }

  function loadExample() {
    var t = today(); var wk = monday(t);
    S = blank();
    S.project = { what: 'Grove: a journal that helps women turn an idea into an offer they can test.', who: 'Independent professionals who want to turn what they know into a small product. This week, me.' };
    S.weeks[wk] = {
      question: 'Does planning one small step a day change what I actually do next?',
      sign: 'A note, in my own words, of a day when the step I took was not the one I had planned.',
      who: 'One WAL builder who has something she can test this week.',
      plan: {}
    };
    S.weeks[wk].plan[t] = { step: 'Open Grove, check my energy, and write down the one step I would otherwise skip.', rest: false };
    S.weeks[wk].plan[addDays(t, 1)] = { step: 'Ask one builder to try Today on her own project while I watch.', rest: false };
  }

  var acts = {
    go: function (arg) { go(arg); },
    example: function (arg) {
      if (hasAnyData() && arg !== 'yes') { S.ui.confirm = 'example'; return render(); }
      loadExample(); render(); toast('Example loaded. Everything in it can be edited.');
    },
    clear: function (arg) {
      if (arg !== 'yes') { S.ui.confirm = 'clear'; return render(); }
      S = blank(); render(); toast('Everything cleared.');
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
    copyPrompt: function (arg) { copyText(buildPrompt(arg)); },
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
    saveCheckout: function () { var d = D(); d.out = true; d.rest = false; go('today'); },
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
    else if (p[0] === 'week') W(viewWeek())[p[1]] = v;
    else if (p[0] === 'plan') planFor(p[1]).step = v;
    else if (p[0] === 'project') S.project[p[1]] = v;
    else if (p[0] === 'review') S.review[p[1]] = v;
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !acts[el.dataset.act]) return;
    acts[el.dataset.act](el.dataset.arg, el);
  });
  app.addEventListener('input', function (e) {
    var b = e.target.dataset && e.target.dataset.bind;
    if (!b) return;
    setBind(b, e.target.value); save();
  });
  app.addEventListener('change', function (e) {
    var t = e.target;
    if (t.dataset && t.dataset.check) { setBind(t.dataset.check, t.checked); save(); return; }
    if (t.id === 'import-file' && t.files && t.files[0]) {
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var d = JSON.parse(String(reader.result));
          if (!d || d.v !== 2 || typeof d.days !== 'object' || typeof d.weeks !== 'object') throw new Error('not a Grove export');
          var base = blank();
          ['project', 'weeks', 'days', 'rings', 'paused'].forEach(function (k) { if (d[k] !== undefined) base[k] = d[k]; });
          S = base; S.screen = 'today'; render(); toast('Imported.');
        } catch (err) { toast('That file is not a Grove export.'); }
      };
      reader.readAsText(t.files[0]);
    }
  });

  function render() {
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

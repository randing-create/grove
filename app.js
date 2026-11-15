(function () {
  'use strict';

  var KEY = 'wal-studio-v1';
  var app = document.getElementById('app');
  var toastEl = document.getElementById('toast');

  var FEEL = {
    peach: ['Anxious', 'Frustrated', 'Scattered', 'Overwhelmed', 'Restless', 'Pressured'],
    gold: ['Hopeful', 'Curious', 'Excited', 'Energised', 'Inspired', 'Proud'],
    blue: ['Tired', 'Drained', 'Heavy', 'Flat', 'Discouraged', 'Lonely'],
    green: ['Calm', 'Content', 'Grateful', 'Settled', 'Relieved', 'Rested']
  };
  var QUADS = [
    ['peach', 'Stirred up', 'High energy'], ['gold', 'Lit up', 'High energy'],
    ['blue', 'Worn down', 'Low energy'], ['green', 'At ease', 'Low energy']
  ];
  var LEVELS = ['Empty', 'Low', 'Okay', 'Good', 'Full'];
  var DECISIONS = [['keep', 'Keep going'], ['adjust', 'Adjust'], ['pause', 'Pause'], ['end', 'End']];

  /* ---------- state ---------- */

  function blank() {
    return {
      v: 1, screen: 'welcome', setupDone: false,
      project: { what: '', who: '', room: '', learn: '' },
      goal: '',
      card: { learn: '', how: '', evidence: '', firstStep: '', mine: '' },
      startDate: '', firstDay: '', days: {}, queued: '', queuedFrom: '',
      custom: [], reviews: [], paused: false,
      review: { decision: '', reason: '' },
      ui: { quad: '', word: '', editStep: false, hideStarter: {}, confirm: '' }
    };
  }

  function load() {
    var base = blank();
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var d = JSON.parse(raw);
        if (d && d.v === 1) {
          Object.keys(d).forEach(function (k) { base[k] = d[k]; });
          ['project', 'card', 'review', 'ui'].forEach(function (k) {
            base[k] = Object.assign({}, blank()[k], d[k] || {});
          });
          base.ui.confirm = '';
        }
      }
    } catch (e) { /* storage unavailable: run without saving */ }
    return base;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }

  var S = load();

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
  function nice(s) { return parse(s).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function start() { return S.startDate || S.firstDay || today(); }
  function dayNum() { return Math.round((parse(today()) - parse(start())) / 86400000) + 1; }
  function dayLine() {
    var n = dayNum();
    if (n < 1) return 'Starts ' + nice(start());
    if (n > 7) return 'Day ' + n + ' · review is due';
    return 'Day ' + n + ' of 7';
  }
  function D() {
    var t = today();
    if (!S.days[t]) {
      S.days[t] = { feelings: [], energy: 0, checkin: '', step: '', done: false, rest: false, kind: 'evidence', evidence: '', learned: '', why1: '', why2: '' };
    }
    return S.days[t];
  }
  function famOf(word) {
    var found = '';
    Object.keys(FEEL).forEach(function (f) { if (FEEL[f].indexOf(word) >= 0) found = f; });
    if (!found) S.custom.forEach(function (c) { if (c[0] === word) found = c[1]; });
    return found || 'gold';
  }
  function has(s) { return !!(s && String(s).trim()); }
  function hasAnyData() {
    return S.setupDone || has(S.project.what) || has(S.goal) || has(S.card.firstStep) || Object.keys(S.days).length > 0;
  }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.hidden = true; }, 1800);
  }
  function sizeLine(energy) {
    if (!energy) return '';
    if (energy <= 2) return 'Low energy today: do only the first 10 minutes of it.';
    if (energy === 3) return 'Steady energy: give it about 30 minutes.';
    return 'Good energy: you can give it up to an hour.';
  }
  function observations() {
    return Object.keys(S.days).sort().filter(function (k) { return k >= start() && has(S.days[k].evidence); })
      .map(function (k) { return { date: k, kind: S.days[k].kind, text: S.days[k].evidence, fam: S.days[k].feelings[0] ? famOf(S.days[k].feelings[0]) : '' }; });
  }

  /* ---------- starter suggestions (rules, not a model) ---------- */

  var STARTER = {
    goal: function () { return 'One person other than me has tried it and told me, in their own words, what they would skip.'; },
    first: function () { return 'Write down the name of one person to ask, and the one question I most want answered. About 20 minutes.'; },
    learn: function () { return has(S.goal) ? 'Whether I can get to this: ' + S.goal.trim() : 'Whether one real person wants this enough to try it.'; },
    how: function () { return 'Show it to one person and watch what they do before I explain anything.'; },
    evidence: function () { return 'What they said or did, in their own words. Not my impression.'; },
    mine: function () { return 'I do the asking myself. AI can help me draft three neutral questions.'; }
  };

  function buildPrompt(kind) {
    var f = function (s) { return has(s) ? s.trim() : '(not filled in yet)'; };
    var ask = {
      goal: 'one visible result I could see by the end of the week, in one sentence',
      first: 'one first step I can do myself in about 20 minutes',
      card: 'a short test card with four lines: what I want to find out, how I will try, what counts as evidence, and a first step'
    }[kind];
    return [
      'I am using WAL Studio, a journal that turns one week into one small experiment.',
      'My project: ' + f(S.project.what),
      'Who it is for: ' + f(S.project.who),
      'Time I can make this week: ' + f(S.project.room),
      'What I want to be able to do myself: ' + f(S.project.learn),
      'By the end of the week I would like to see: ' + f(S.goal),
      'First step so far: ' + f(S.card.firstStep),
      '',
      'Please draft ' + ask + '.',
      'Keep it short, concrete and in plain words. Suggest, do not decide for me. If something is unclear, ask me one question instead of guessing.'
    ].join('\n');
  }

  function copyText(text) {
    var done = function () { toast('Prompt copied. Paste your AI\'s draft back here.'); };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { toast('Could not copy. Select the text by hand.'); }
      document.body.removeChild(ta);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else { fallback(); }
  }

  /* ---------- small view pieces ---------- */

  var BACK = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4l-6 6 6 6"/></svg>';

  function backBtn(target) {
    return '<button class="icon-btn" aria-label="Back" data-act="go" data-arg="' + target + '">' + BACK + '</button>';
  }
  function progress(n, of) {
    var out = '<div class="progress" role="img" aria-label="Step ' + n + ' of ' + of + '">';
    for (var i = 1; i <= of; i++) out += '<span' + (i <= n ? ' class="on"' : '') + '></span>';
    return out + '</div>';
  }
  function tabs(active) {
    return '<nav class="tabs" aria-label="Main"><span class="brand rail-brand">WAL Studio</span>' +
      '<button data-act="go" data-arg="today"' + (active === 'today' ? ' class="on"' : '') + '>Today</button>' +
      '<button data-act="go" data-arg="cycle"' + (active === 'cycle' ? ' class="on"' : '') + '>This cycle</button>' +
      '</nav>';
  }
  function field(label, bind, value, placeholder, rows) {
    var id = 'f-' + bind.replace(/\./g, '-');
    return '<div class="field"><label class="label" for="' + id + '">' + esc(label) + '</label>' +
      '<textarea id="' + id + '" rows="' + (rows || 2) + '" data-bind="' + bind + '" placeholder="' + esc(placeholder || '') + '">' + esc(value) + '</textarea></div>';
  }
  function confirmBox(kind, text) {
    if (S.ui.confirm !== kind) return '';
    return '<div class="notice stack"><p>' + esc(text) + '</p><div class="row">' +
      '<button class="btn small-btn" data-act="' + kind + '" data-arg="yes">Yes, do it</button>' +
      '<button class="btn ghost small-btn" data-act="cancelConfirm">Cancel</button></div></div>';
  }

  /* ---------- screens ---------- */

  var screens = {};

  screens.welcome = function () {
    return '<section class="screen pad-bottom">' +
      '<header class="top"><span class="brand">WAL Studio</span></header>' +
      '<div class="grow center"><h1 class="big">One week. One small experiment.</h1>' +
      '<p class="muted">Three short questions, then your first step. Skip any of them and fill them in later.</p></div>' +
      confirmBox('example', 'This replaces what you have filled in so far. Load the example anyway?') +
      '<div class="stack">' +
      '<button class="btn" data-act="go" data-arg="setup1">Start</button>' +
      '<button class="btn ghost" data-act="example">Load the WAL Studio example</button>' +
      '<button class="link" data-act="skipSetup">Skip setup and go to Today</button>' +
      '</div></section>';
  };

  function setupScreen(n, title, bind, value, placeholder, starterKey, promptKind) {
    var back = n === 1 ? 'welcome' : 'setup' + (n - 1);
    var starter = '';
    if (starterKey && !S.ui.hideStarter[starterKey] && !has(value)) {
      starter = '<div class="starter"><span class="tag"><span class="ring"></span>Starter suggestion</span>' +
        '<p>' + esc(STARTER[starterKey]()) + '</p>' +
        '<p class="small muted">A fixed starting point, not written by AI. Edit it after you use it.</p>' +
        '<div class="row wrap">' +
        '<button class="btn ghost small-btn" data-act="useStarter" data-arg="' + starterKey + '|' + bind + '">Use this</button>' +
        '<button class="btn ghost small-btn" data-act="hideStarter" data-arg="' + starterKey + '">Write my own</button>' +
        '</div></div>';
    }
    var ai = promptKind ? '<button class="link" data-act="copyPrompt" data-arg="' + promptKind + '">Copy a prompt for my own AI</button>' : '';
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn(back) + progress(n, 3) + '<span style="width:32px"></span></header>' +
      '<label for="setup-input"><h1>' + esc(title) + '</h1></label>' +
      '<div class="grow">' +
      '<textarea id="setup-input" class="plain" rows="4" data-bind="' + bind + '" placeholder="' + esc(placeholder) + '">' + esc(value) + '</textarea>' +
      starter + ai + '</div>' +
      '<div class="stack">' +
      '<button class="btn" data-act="setupNext" data-arg="' + n + '">' + (n === 3 ? 'Save and go to Today' : 'Continue') + '</button>' +
      '<button class="link" data-act="setupNext" data-arg="' + n + '">Skip for now</button>' +
      '</div></section>';
  }
  screens.setup1 = function () { return setupScreen(1, 'What are you working on?', 'project.what', S.project.what, 'A sentence is enough.', null, null); };
  screens.setup2 = function () { return setupScreen(2, 'What would you like to see by the end of the week?', 'goal', S.goal, 'Something you could point at.', 'goal', 'goal'); };
  screens.setup3 = function () { return setupScreen(3, 'What is the first step?', 'card.firstStep', S.card.firstStep, 'Small enough to start today.', 'first', 'first'); };

  function weekLine() {
    return '<button class="stack" style="background:none;border:none;text-align:left;padding:0;gap:6px" data-act="go" data-arg="cycle">' +
      '<span class="tag" style="color:var(--muted)"><span class="ring"></span>This week · ' + esc(dayLine()) + '</span>' +
      '<span class="serif' + (has(S.goal) ? '' : ' empty') + '">' + (has(S.goal) ? esc(S.goal) : 'No goal yet. Add one when you are ready.') + '</span>' +
      '</button>';
  }
  function stateLine(d) {
    if (d.checkin !== 'done') return '<button class="link" style="align-self:flex-start" data-act="go" data-arg="checkin1">Check in after all</button>';
    var dots = d.feelings.map(function (w) { return '<span class="c-' + famOf(w) + '"></span>'; }).join('');
    var words = d.feelings.length ? d.feelings.join(', ') : 'No feeling picked';
    var energy = d.energy ? ' · energy ' + d.energy + ' of 5' : '';
    return '<button class="row" style="background:none;border:none;padding:0;min-height:44px" data-act="go" data-arg="checkin1">' +
      '<span class="mini-dots" aria-hidden="true">' + dots + '</span><span class="small muted">' + esc(words + energy) + '</span></button>';
  }

  screens.today = function () {
    var d = D();
    var head = '<header class="top"><span class="brand">WAL Studio</span><span class="small muted">' + esc(nice(today())) + '</span></header>';
    var body;

    if (S.paused) {
      body = '<div class="grow center"><h1 class="big">Paused.</h1><p class="muted">Nothing is lost. Pick it up when you are ready.</p>' +
        '<button class="btn" data-act="resume">Resume this week</button></div>';
    } else if (d.done || d.rest) {
      body = '<div class="grow center"><h1 class="big">' + (d.rest ? 'Rest counts too.' : 'You showed up today.') + '</h1>' +
        (has(d.step) && d.done ? '<p class="muted">Done: ' + esc(d.step) + '</p>' : '') +
        (has(S.queued) ? '<div class="notice" style="text-align:left"><span class="label">Tomorrow</span><p>' + esc(S.queued) + '</p></div>' : '') +
        (dayNum() >= 7 ? '<button class="btn" data-act="go" data-arg="review">Open weekly review</button>' : '') +
        '<button class="btn ghost" data-act="go" data-arg="cycle">Open this cycle</button>' +
        '<button class="link" data-act="reopen">Change today\'s entry</button></div>';
    } else if (!d.checkin) {
      body = '<div class="grow center" style="gap:24px"><h1 class="big">How are you arriving today?</h1>' +
        '<div class="orb-wrap"><div class="orb-ring"><button class="orb" data-act="go" data-arg="checkin1">Check in</button></div></div>' +
        '<button class="link" data-act="skipCheckin">Skip check-in, go to today\'s step</button></div>' + weekLine();
    } else {
      var offer = '';
      if (!has(d.step) && has(S.queued)) {
        offer = '<div class="starter"><span class="label">' + (S.queuedFrom === 'setup' ? 'Your first step this week' : 'You wrote this for today') + '</span>' +
          '<p>' + esc(S.queued) + '</p>' +
          '<div class="row wrap"><button class="btn small-btn" data-act="adopt">Use this step</button></div></div>';
      }
      var editing = !has(d.step) || S.ui.editStep;
      var stepHtml = editing
        ? '<label class="sr" for="step-input">Today\'s step</label><textarea id="step-input" class="plain" rows="3" data-bind="day.step" placeholder="Write today\'s step">' + esc(d.step) + '</textarea>'
        : '<p class="step">' + esc(d.step) + '</p>';
      var size = sizeLine(d.energy);
      body = stateLine(d) +
        '<div class="grow" style="justify-content:center">' + offer +
        '<div class="card">' +
        '<div><span class="label">This week</span><span class="small' + (has(S.goal) ? '' : ' empty') + '">' + (has(S.goal) ? esc(S.goal) : 'Not set') + '</span></div>' +
        '<div><span class="label">Today</span>' + stepHtml + (size ? '<span class="small muted">' + esc(size) + '</span>' : '') + '</div>' +
        '<div><span class="label">Counts as evidence</span><span class="small' + (has(S.card.evidence) ? '' : ' empty') + '">' + (has(S.card.evidence) ? esc(S.card.evidence) : 'Not set') + '</span></div>' +
        '</div>' +
        '<button class="btn" data-act="didIt">I did it</button>' +
        '<div class="row">' +
        (editing ? '' : '<button class="btn ghost small-btn" style="flex:1" data-act="editStep">Edit step</button>') +
        '<button class="btn ghost small-btn" style="flex:1" data-act="rest">Not today</button></div>' +
        '</div>';
    }
    return '<section class="screen">' + head + body + '</section>' + tabs('today');
  };

  screens.checkin1 = function () {
    var d = D();
    var q = S.ui.quad;
    var quads = QUADS.map(function (x) {
      return '<button class="quad c-' + x[0] + (q === x[0] ? ' on' : '') + '" aria-pressed="' + (q === x[0]) + '" data-act="quad" data-arg="' + x[0] + '"><b>' + x[1] + '</b><span>' + x[2] + '</span></button>';
    }).join('');
    var words = '';
    if (q) {
      var list = FEEL[q].concat(S.custom.filter(function (c) { return c[1] === q; }).map(function (c) { return c[0]; }));
      words = '<div class="row wrap">' + list.map(function (w) {
        var on = d.feelings.indexOf(w) >= 0;
        return '<button class="chip c-' + q + (on ? ' on' : '') + '" aria-pressed="' + on + '" data-act="word" data-arg="' + esc(w) + '">' + esc(w) + '</button>';
      }).join('') + '</div>' +
        '<div class="row"><label class="sr" for="own-word">Your own word</label>' +
        '<input id="own-word" type="text" maxlength="24" data-bind="ui.word" value="' + esc(S.ui.word) + '" placeholder="Or type your own word" style="border-radius:999px;min-height:48px;padding:0 18px">' +
        '<button class="btn ghost small-btn" data-act="addWord">Add</button></div>';
    } else {
      words = '<p class="muted small" style="text-align:center">Tap the corner closest to you. You can pick from more than one.</p>';
    }
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('today') + progress(1, 2) + '<span style="width:32px"></span></header>' +
      '<h1>What\'s closest to how you feel?</h1>' +
      '<div class="grow">' +
      '<div class="quads label" style="text-align:center"><span>Unpleasant</span><span>Pleasant</span></div>' +
      '<div class="quads">' + quads + '</div>' + words + '</div>' +
      '<div class="stack"><p class="small muted" style="text-align:center">' + (d.feelings.length ? 'Picked: ' + esc(d.feelings.join(', ')) + ' · up to three' : 'Pick up to three.') + '</p>' +
      '<button class="btn" data-act="go" data-arg="checkin2">Continue</button>' +
      '<button class="link" data-act="skipCheckin">Skip check-in</button></div></section>';
  };

  screens.checkin2 = function () {
    var d = D();
    var e = d.energy;
    var color = !e ? 'transparent' : (e <= 2 ? 'var(--blue)' : (e === 3 ? 'var(--green)' : 'var(--gold)'));
    var sizePx = e ? 40 + e * 30 : 0;
    var levels = LEVELS.map(function (name, i) {
      var n = i + 1;
      return '<button class="level' + (n === e ? ' on' : '') + '" aria-pressed="' + (n === e) + '" aria-label="' + name + '" data-act="energy" data-arg="' + n + '">' + n + '</button>';
    }).join('');
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('checkin1') + progress(2, 2) + '<span style="width:32px"></span></header>' +
      '<h1>How much energy do you have?</h1>' +
      '<div class="grow center"><div class="energy-ring" aria-hidden="true"><div class="energy-dot" style="width:' + sizePx + 'px;height:' + sizePx + 'px;background:' + color + '"></div></div>' +
      '<p class="serif">' + (e ? LEVELS[e - 1] : 'Pick a number') + '</p></div>' +
      '<div class="stack"><div class="levels">' + levels + '</div>' +
      '<div class="row between small muted"><span>Empty</span><span>Full</span></div>' +
      '<p class="small muted" style="text-align:center">This only changes the size of today\'s step.</p>' +
      '<button class="btn" data-act="checkinDone">Continue</button></div></section>';
  };

  screens.why = function () {
    var d = D();
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('checkin2') + '<button class="link" data-act="go" data-arg="today">Skip to my step</button></header>' +
      '<h1>Low is data, not a verdict.</h1>' +
      '<div class="grow">' +
      field('What is keeping you where you are today?', 'day.why1', d.why1, 'Say it plainly.', 3) +
      field('If you were sure it would go fine, what is the smallest thing you would try?', 'day.why2', d.why2, 'This can become today\'s step.', 3) +
      '<p class="small muted">Optional. Saved in this browser only.</p></div>' +
      '<div class="stack"><button class="btn" data-act="whyDone">Show me today\'s step</button>' +
      '<button class="link" data-act="rest">Rest today instead</button></div></section>';
  };

  screens.after = function () {
    var d = D();
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('today') + '<span class="small muted">Afterwards</span></header>' +
      '<div class="grow">' +
      '<div class="seg" role="group" aria-label="Kind of note">' +
      '<button class="' + (d.kind === 'evidence' ? 'on' : '') + '" aria-pressed="' + (d.kind === 'evidence') + '" data-act="kind" data-arg="evidence">Evidence</button>' +
      '<button class="' + (d.kind === 'blocker' ? 'on' : '') + '" aria-pressed="' + (d.kind === 'blocker') + '" data-act="kind" data-arg="blocker">Blocker</button></div>' +
      field('What happened?', 'day.evidence', d.evidence, 'What you saw or heard, in plain words.', 3) +
      field('What came up? Take it as data.', 'day.learned', d.learned, 'One honest sentence is enough.', 3) +
      field('What is tomorrow\'s step?', 'queued', S.queued, 'Leave it empty if you do not know yet.', 2) +
      '</div>' +
      '<button class="btn" data-act="saveAfter">Save today</button></section>';
  };

  screens.cycle = function () {
    var s = start();
    var dots = '';
    for (var i = 0; i < 7; i++) {
      var k = addDays(s, i);
      var rec = S.days[k];
      var cls = 'dot';
      if (rec && (rec.done || rec.rest || rec.checkin)) {
        cls += ' filled' + (rec.feelings[0] ? ' c-' + famOf(rec.feelings[0]) : '');
        if (has(rec.evidence) && rec.kind === 'evidence') cls += ' evidence';
      }
      if (k === today()) cls += ' today';
      dots += '<span class="' + cls + '"></span>';
    }
    var obs = observations();
    var obsHtml = obs.length ? '<div class="list">' + obs.map(function (o) {
      return '<div><span class="bullet' + (o.fam ? ' c-' + o.fam : '') + '"></span><span><span class="small muted">' + esc(nice(o.date)) + ' · ' + (o.kind === 'blocker' ? 'Blocker' : 'Evidence') + '</span><br>' + esc(o.text) + '</span></div>';
    }).join('') + '</div>' : '<p class="muted">Nothing yet. It starts with today\'s step.</p>';

    return '<section class="screen wide">' +
      '<header class="top"><span class="brand">This cycle</span><span class="small muted">' + esc(dayLine()) + '</span></header>' +
      (S.ui.note ? '<div class="notice">' + esc(S.ui.note) + '</div>' : '') +
      '<div class="cols"><div class="g g1">' +
      field('By the end of the week I would like to see', 'goal', S.goal, 'Something you could point at.', 2) +
      '<div class="stack"><div class="dots" role="img" aria-label="Seven days of this cycle">' + dots + '</div>' +
      '<span class="small muted">Colour is how you arrived. A ring means evidence that day.</span></div>' +
      '<div class="field"><label class="label" for="start-date">Start date (optional)</label>' +
      '<input id="start-date" type="date" data-bind="startDate" value="' + esc(S.startDate) + '">' +
      '<span class="small muted">Started ' + esc(nice(s)) + ' · review on ' + esc(nice(addDays(s, 6))) + '</span></div>' +
      '<button class="btn ghost" data-act="go" data-arg="review">Weekly review · ' + esc(nice(addDays(s, 6))) + '</button>' +
      '</div><div class="g g2">' +

      '<div class="section"><span class="brand">Week one card</span>' +
      field('What I want to find out', 'card.learn', S.card.learn, '', 2) +
      field('How I will try', 'card.how', S.card.how, '', 2) +
      field('What counts as evidence', 'card.evidence', S.card.evidence, '', 2) +
      field('First step', 'card.firstStep', S.card.firstStep, '', 2) +
      field('What I do myself, and where AI helps', 'card.mine', S.card.mine, '', 2) +
      '<div class="starter"><span class="tag"><span class="ring"></span>Starter suggestions</span>' +
      '<p class="small muted">Fills only the empty lines with fixed starting points, not written by AI. Edit them afterwards.</p>' +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="fillCard">Fill the blanks</button>' +
      '<button class="btn ghost small-btn" data-act="copyPrompt" data-arg="card">Copy a prompt for my own AI</button></div></div></div>' +

      '<div class="section"><span class="brand">Your project</span>' +
      field('What are you working on?', 'project.what', S.project.what, '', 2) +
      field('Who is it for? That person can be you.', 'project.who', S.project.who, '', 2) +
      field('What can you realistically make room for this week?', 'project.room', S.project.room, '', 2) +
      field('What would you like to be able to do yourself?', 'project.learn', S.project.learn, 'Change the prototype, run a first interview, use AI for one step…', 2) +
      '</div>' +
      '</div><div class="g g3">' +

      '<div class="section"><span class="brand">What you have observed</span>' + obsHtml + '</div>' +

      '<div class="section"><span class="brand">Your data</span>' +
      '<p class="small muted">Saved in this browser only. Nothing is sent anywhere.</p>' +
      confirmBox('example', 'This replaces what you have filled in so far. Load the example anyway?') +
      confirmBox('clear', 'This deletes everything saved in this browser. It cannot be undone.') +
      '<div class="row wrap"><button class="btn ghost small-btn" data-act="exportData">Export</button>' +
      '<button class="btn ghost small-btn" data-act="example">Load example</button>' +
      '<button class="btn ghost small-btn" data-act="clear">Clear everything</button></div></div>' +
      '</div></div>' +
      '</section>' + tabs('cycle');
  };

  screens.review = function () {
    var obs = observations();
    var evidenceCount = obs.filter(function (o) { return o.kind === 'evidence'; }).length;
    var setOut = has(S.card.learn) ? S.card.learn : S.goal;
    var cant = evidenceCount < 3
      ? '<div class="notice stack"><span class="tag"><span class="ring"></span>Can\'t tell yet</span>' +
        '<p>' + evidenceCount + ' piece' + (evidenceCount === 1 ? '' : 's') + ' of evidence so far. Fewer than three is too thin to lean on. You can still decide.</p></div>'
      : '';
    var seg = DECISIONS.map(function (x) {
      var on = S.review.decision === x[0];
      return '<button class="' + (on ? 'on' : '') + '" aria-pressed="' + on + '" data-act="decision" data-arg="' + x[0] + '">' + x[1] + '</button>';
    }).join('');
    return '<section class="screen pad-bottom">' +
      '<header class="top">' + backBtn('cycle') + '<span class="small muted">Weekly review · ' + esc(nice(addDays(start(), 6))) + '</span></header>' +
      '<h1>One week in. What did you see?</h1>' +
      '<div class="two">' +
      '<div><span class="label">You set out to learn</span><span' + (has(setOut) ? '' : ' class="empty"') + '>' + (has(setOut) ? esc(setOut) : 'Not set') + '</span></div>' +
      '<div><span class="label">What you observed</span>' + (obs.length ? obs.map(function (o) {
        return '<span><span class="small muted">' + (o.kind === 'blocker' ? 'Blocker' : 'Evidence') + '</span><br>' + esc(o.text) + '</span>';
      }).join('') : '<span class="empty">Nothing written down yet</span>') + '</div></div>' +
      cant +
      '<p class="serif">What do you want to do with this? Your call.</p>' +
      '<div class="seg" style="flex-wrap:wrap" role="group" aria-label="Decision">' + seg + '</div>' +
      field('Why?', 'review.reason', S.review.reason, 'One or two sentences in your own words.', 3) +
      '<div style="flex:1"></div>' +
      '<button class="btn" data-act="saveReview">Save review</button></section>';
  };

  /* ---------- actions ---------- */

  function go(screen) { S.screen = screen; S.ui.confirm = ''; if (screen !== 'cycle') S.ui.note = ''; render(); }

  function loadExample() {
    var t = today();
    S = blank();
    S.setupDone = true; S.firstDay = t; S.screen = 'today';
    S.project = {
      what: 'WAL Studio: a founding journal that sizes each day\'s step to my energy.',
      who: 'Women solo founders. This week, me.',
      room: 'About 30 minutes a day.',
      learn: 'Change the prototype myself and run my first user interview.'
    };
    S.goal = 'One real moment, written down, where WAL Studio changed what I did next.';
    S.card = {
      learn: 'Whether a check-in plus one sized step changes what I actually do next.',
      how: 'Use WAL Studio on WAL Studio itself for seven days.',
      evidence: 'A note, in my own words, of a day when the step I took was not the one I had planned.',
      firstStep: 'Open Today, check in, and write down the one step I would otherwise have skipped.',
      mine: 'I do the daily step and the notes myself. AI can help me draft three neutral interview questions.'
    };
    S.queued = S.card.firstStep; S.queuedFrom = 'setup';
  }

  var acts = {
    go: function (arg) { go(arg); },
    skipSetup: function () { S.setupDone = true; if (!S.firstDay) S.firstDay = today(); go('today'); },
    setupNext: function (arg) {
      var n = Number(arg);
      if (n < 3) return go('setup' + (n + 1));
      S.setupDone = true; if (!S.firstDay) S.firstDay = today();
      if (has(S.card.firstStep)) { S.queued = S.card.firstStep.trim(); S.queuedFrom = 'setup'; }
      go('today');
    },
    useStarter: function (arg) {
      var parts = arg.split('|'); setPath(parts[1], STARTER[parts[0]]()); render();
      var el = document.getElementById('setup-input'); if (el) el.focus();
    },
    hideStarter: function (arg) {
      S.ui.hideStarter[arg] = true; render();
      var el = document.getElementById('setup-input'); if (el) el.focus();
    },
    copyPrompt: function (arg) { copyText(buildPrompt(arg)); },
    example: function (arg) {
      if (hasAnyData() && arg !== 'yes') { S.ui.confirm = 'example'; return render(); }
      loadExample(); render(); toast('Example loaded. Everything in it can be edited.');
    },
    clear: function (arg) {
      if (arg !== 'yes') { S.ui.confirm = 'clear'; return render(); }
      S = blank(); render(); toast('Everything cleared.');
    },
    cancelConfirm: function () { S.ui.confirm = ''; render(); },
    exportData: function () {
      var blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'wal-studio-' + today() + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    },
    skipCheckin: function () { var d = D(); if (d.checkin !== 'done') d.checkin = 'skipped'; go('today'); },
    quad: function (arg) { S.ui.quad = arg; render(); },
    word: function (arg) {
      var d = D(); var i = d.feelings.indexOf(arg);
      if (i >= 0) d.feelings.splice(i, 1); else { d.feelings.push(arg); if (d.feelings.length > 3) d.feelings.shift(); }
      render();
    },
    addWord: function () {
      var w = (S.ui.word || '').trim().slice(0, 24); var q = S.ui.quad;
      if (!w || !q) return toast('Type a word first.');
      var known = Object.keys(FEEL).some(function (f) { return FEEL[f].indexOf(w) >= 0; }) || S.custom.some(function (c) { return c[0] === w; });
      if (!known) S.custom.push([w, q]);
      var d = D();
      if (d.feelings.indexOf(w) < 0) { d.feelings.push(w); if (d.feelings.length > 3) d.feelings.shift(); }
      S.ui.word = ''; render();
    },
    energy: function (arg) { D().energy = Number(arg); render(); },
    checkinDone: function () { var d = D(); d.checkin = 'done'; go(d.energy && d.energy <= 2 ? 'why' : 'today'); },
    whyDone: function () {
      var d = D();
      if (!has(d.step) && !has(S.queued) && has(d.why2)) d.step = d.why2.trim();
      go('today');
    },
    adopt: function () { var d = D(); d.step = S.queued; S.queued = ''; S.queuedFrom = ''; S.ui.editStep = false; render(); },
    editStep: function () { S.ui.editStep = true; render(); var el = document.getElementById('step-input'); if (el) el.focus(); },
    didIt: function () {
      var d = D();
      if (!has(d.step)) return toast('Write today\'s step first.');
      d.step = d.step.trim(); S.ui.editStep = false; go('after');
    },
    rest: function () { var d = D(); d.rest = true; if (!d.checkin) d.checkin = 'skipped'; go('today'); },
    reopen: function () { var d = D(); d.done = false; d.rest = false; render(); },
    kind: function (arg) { D().kind = arg; render(); },
    saveAfter: function () {
      var d = D(); d.done = true; d.rest = false;
      S.queued = (S.queued || '').trim(); S.queuedFrom = has(S.queued) ? 'yesterday' : '';
      go('today');
    },
    fillCard: function () {
      var filled = 0;
      [['learn', 'learn'], ['how', 'how'], ['evidence', 'evidence'], ['firstStep', 'first'], ['mine', 'mine']].forEach(function (p) {
        if (!has(S.card[p[0]])) { S.card[p[0]] = STARTER[p[1]](); filled++; }
      });
      render(); toast(filled ? filled + ' line' + (filled === 1 ? '' : 's') + ' filled. Edit them to fit.' : 'Nothing was empty.');
    },
    decision: function (arg) { S.review.decision = arg; render(); },
    saveReview: function () {
      var r = S.review;
      if (!r.decision) return toast('Choose one of the four first.');
      S.reviews.push({ date: today(), decision: r.decision, reason: (r.reason || '').trim(), goal: S.goal, card: Object.assign({}, S.card), observations: observations() });
      var decision = r.decision;
      S.review = { decision: '', reason: '' };
      if (decision === 'keep') { S.startDate = today(); S.firstDay = today(); toast('A new week starts today.'); return go('today'); }
      if (decision === 'adjust') {
        S.startDate = today(); S.firstDay = today();
        S.screen = 'cycle'; S.ui.note = 'A new week starts today. Change the card below to what you want to test next.'; return render();
      }
      if (decision === 'pause') { S.paused = true; return go('today'); }
      S.goal = ''; S.card = blank().card; S.queued = ''; S.queuedFrom = ''; S.startDate = ''; S.firstDay = ''; S.setupDone = false;
      toast('This cycle is closed. Your notes are kept.'); go('welcome');
    },
    resume: function () { S.paused = false; S.startDate = today(); S.firstDay = today(); render(); }
  };

  function setPath(path, value) {
    var p = path.split('.');
    if (p.length === 1) { S[p[0]] = value; return; }
    var root = p[0] === 'day' ? D() : S[p[0]];
    root[p[1]] = value;
  }

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || !acts[el.dataset.act]) return;
    acts[el.dataset.act](el.dataset.arg, el);
  });
  function onInput(e) {
    var b = e.target.dataset && e.target.dataset.bind;
    if (!b) return;
    setPath(b, e.target.value); save();
    if (b === 'startDate' && e.type === 'change') render();
  }
  app.addEventListener('input', onInput);
  app.addEventListener('change', onInput);

  function render() {
    if (!S.setupDone && ['welcome', 'setup1', 'setup2', 'setup3'].indexOf(S.screen) < 0) S.screen = 'welcome';
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

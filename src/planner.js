/* ============================================
   netgig.online — Hourly Planner engine
   Vanilla JS. No framework, no dependencies.
   ============================================ */

(function () {
  'use strict';

  var root = document.getElementById('planner');
  if (!root) return;

  var STORAGE_KEY = 'netgig-planner-v1';
  var MIN_DURATION = 15;
  var DEFAULT_DURATION = 60;

  var CATEGORIES = {
    workout:  { title: 'Workout' },
    work:     { title: 'Work Block' },
    study:    { title: 'Study Session' },
    meeting:  { title: 'Meeting' },
    break:    { title: 'Break' },
    personal: { title: 'Personal Time' }
  };

  /* ---------- DOM refs ---------- */
  var els = {
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mobileNav: document.getElementById('mobile-nav'),

    utilityPrintBtn: document.getElementById('utility-print-btn'),
    mobilePrintBtn: document.getElementById('mobile-print-btn'),

    datePrev: document.getElementById('date-prev'),
    dateNext: document.getElementById('date-next'),
    dateLabel: document.getElementById('date-label'),
    dateCalendarBtn: document.getElementById('date-calendar-btn'),
    dateInput: document.getElementById('date-input'),

    startSelect: document.getElementById('start-select'),
    endSelect: document.getElementById('end-select'),
    intervalSelect: document.getElementById('interval-select'),
    show24Toggle: document.getElementById('show24-toggle'),

    taskInput: document.getElementById('task-input'),
    addTaskBtn: document.getElementById('add-task-btn'),
    quickAddChips: document.querySelectorAll('.chip[data-category]'),

    viewTimelineBtn: document.getElementById('view-timeline-btn'),
    viewCompactBtn: document.getElementById('view-compact-btn'),

    toolClearBtn: document.getElementById('tool-clear-btn'),
    toolTemplatesBtn: document.getElementById('tool-templates-btn'),
    toolSaveBtn: document.getElementById('tool-save-btn'),

    timeline: document.getElementById('timeline'),
    gutter: document.getElementById('timeline-gutter'),
    track: document.getElementById('timeline-track'),
    printDate: document.getElementById('print-date'),

    progressRing: document.getElementById('progress-ring'),
    progressPct: document.getElementById('progress-pct'),
    progressFraction: document.getElementById('progress-fraction'),
    statCompleted: document.getElementById('stat-completed'),
    statInProgress: document.getElementById('stat-inprogress'),
    statPending: document.getElementById('stat-pending'),
    focusStartBtn: document.getElementById('focus-start-btn'),

    focusOverlay: document.getElementById('focus-overlay'),
    focusExitBtn: document.getElementById('focus-exit-btn'),
    focusKicker: document.getElementById('focus-kicker'),
    focusTitle: document.getElementById('focus-title'),
    focusTime: document.getElementById('focus-time'),
    focusNext: document.getElementById('focus-next'),

    templateCards: document.querySelectorAll('.template-card'),

    ctaStartBtn: document.getElementById('cta-start-btn'),
    ctaPrintBtn: document.getElementById('cta-print-btn'),
    ctaPdfBtn: document.getElementById('cta-pdf-btn'),
    ctaPngBtn: document.getElementById('cta-png-btn'),

    toast: document.getElementById('toast')
  };

  /* ---------- Time helpers (no wraparound; day may extend to 24:00) ---------- */
  function parseTime(str) {
    var p = str.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function formatTime24(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function formatTime12(mins) {
    var h = Math.floor(mins / 60) % 24, m = mins % 60;
    var period = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + period;
  }

  function toISODate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function formatDateLabel(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) d = new Date();
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  function addDays(iso, delta) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) d = new Date();
    d.setDate(d.getDate() + delta);
    return toISODate(d);
  }

  function uid() {
    return 'task-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e4).toString(36);
  }

  /* ---------- State ---------- */
  function defaultState() {
    return {
      date: toISODate(new Date()),
      startTime: root.getAttribute('data-start') || '08:00',
      endTime: root.getAttribute('data-end') || '18:00',
      interval: parseInt(root.getAttribute('data-interval'), 10) || 30,
      show24: false,
      tasks: []
    };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.tasks)) return null;
      var base = defaultState();
      return {
        date: parsed.date || base.date,
        startTime: parsed.startTime || base.startTime,
        endTime: parsed.endTime || base.endTime,
        interval: parsed.interval || base.interval,
        show24: !!parsed.show24,
        tasks: parsed.tasks.map(function (t) {
          return {
            id: t.id || uid(),
            title: t.title || '',
            start: t.start || '08:00',
            duration: t.duration || DEFAULT_DURATION,
            category: t.category || 'general',
            status: t.status || 'pending',
            notes: t.notes || ''
          };
        })
      };
    } catch (e) {
      return null;
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* storage unavailable — app continues in memory */
    }
  }

  var state = loadState() || defaultState();

  /* ---------- Range helpers ---------- */
  function effectiveRange() {
    if (state.show24) return { start: 0, end: 1440 };
    return { start: parseTime(state.startTime), end: parseTime(state.endTime) };
  }

  function hourHeight() {
    var v = getComputedStyle(els.timeline).getPropertyValue('--hour-h');
    var n = parseFloat(v);
    return n > 0 ? n : 72;
  }

  /* ---------- Task placement / free gaps ---------- */
  function busyIntervals(rangeStart, rangeEnd) {
    var intervals = state.tasks
      .map(function (t) {
        var s = parseTime(t.start);
        return { start: s, end: s + t.duration };
      })
      .filter(function (iv) { return iv.end > rangeStart && iv.start < rangeEnd; })
      .sort(function (a, b) { return a.start - b.start; });

    var merged = [];
    intervals.forEach(function (iv) {
      var s = Math.max(iv.start, rangeStart), e = Math.min(iv.end, rangeEnd);
      if (merged.length && s <= merged[merged.length - 1].end) {
        merged[merged.length - 1].end = Math.max(merged[merged.length - 1].end, e);
      } else {
        merged.push({ start: s, end: e });
      }
    });
    return merged;
  }

  function freeGaps(rangeStart, rangeEnd, minSize) {
    var busy = busyIntervals(rangeStart, rangeEnd);
    var gaps = [];
    var cursor = rangeStart;
    busy.forEach(function (iv) {
      if (iv.start - cursor >= (minSize || 1)) gaps.push({ start: cursor, end: iv.start });
      cursor = Math.max(cursor, iv.end);
    });
    if (rangeEnd - cursor >= (minSize || 1)) gaps.push({ start: cursor, end: rangeEnd });
    return gaps;
  }

  function findPlacement(duration) {
    var r = effectiveRange();
    var gaps = freeGaps(r.start, r.end, duration);
    if (gaps.length) return gaps[0].start;
    return Math.max(r.start, r.end - duration);
  }

  /* ---------- Column packing for overlapping tasks ---------- */
  function layoutTasks(tasks) {
    var sorted = tasks.slice().sort(function (a, b) {
      var as = parseTime(a.start), bs = parseTime(b.start);
      return as - bs || (b.duration - a.duration);
    });

    var clusters = [], current = [], currentEnd = -1;
    sorted.forEach(function (t) {
      var s = parseTime(t.start), e = s + t.duration;
      if (current.length && s >= currentEnd) {
        clusters.push(current);
        current = [];
        currentEnd = -1;
      }
      current.push(t);
      currentEnd = Math.max(currentEnd, e);
    });
    if (current.length) clusters.push(current);

    var out = [];
    clusters.forEach(function (cluster) {
      var columns = [];
      var clusterResult = [];
      cluster.forEach(function (t) {
        var s = parseTime(t.start), e = s + t.duration;
        var colIndex = -1;
        for (var i = 0; i < columns.length; i++) {
          if (columns[i] <= s) { colIndex = i; break; }
        }
        if (colIndex === -1) { colIndex = columns.length; columns.push(e); }
        else { columns[colIndex] = e; }
        clusterResult.push({ task: t, col: colIndex });
      });
      var width = columns.length;
      clusterResult.forEach(function (r) { r.totalCols = width; });
      out = out.concat(clusterResult);
    });
    return out;
  }

  /* ---------- Task CRUD ---------- */
  function addTask(title, category, duration) {
    var start = findPlacement(duration);
    var task = {
      id: uid(),
      title: title,
      start: formatTime24(start),
      duration: duration,
      category: category,
      status: 'pending',
      notes: ''
    };
    state.tasks.push(task);
    saveState();
    render();
    return task;
  }

  function removeTask(id) {
    state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
    saveState();
    render();
  }

  function findTask(id) {
    for (var i = 0; i < state.tasks.length; i++) {
      if (state.tasks[i].id === id) return state.tasks[i];
    }
    return null;
  }

  function cycleStatus(task) {
    var order = ['pending', 'in-progress', 'completed'];
    var idx = order.indexOf(task.status);
    task.status = order[(idx + 1) % order.length];
    saveState();
    render();
  }

  /* ---------- Rendering ---------- */
  var openMenuId = null;

  function render() {
    var r = effectiveRange();
    var totalMinutes = r.end - r.start;
    var hh = hourHeight();
    var pxPerMin = hh / 60;
    var trackHeight = totalMinutes * pxPerMin;

    els.track.style.height = trackHeight + 'px';
    els.gutter.innerHTML = '';
    els.track.innerHTML = '';

    /* Hour gutter + grid lines */
    var firstHour = Math.ceil(r.start / 60);
    var lastHour = Math.floor(r.end / 60);
    for (var h = firstHour; h <= lastHour; h++) {
      var top = (h * 60 - r.start) * pxPerMin;

      var row = document.createElement('div');
      row.className = 'gutter-row';
      row.style.position = 'absolute';
      row.style.top = top + 'px';
      row.style.left = '0';
      row.style.right = '0';
      row.style.height = hh + 'px';
      row.textContent = formatTime12(h * 60).replace(':00 ', ' ');
      els.gutter.appendChild(row);

      var line = document.createElement('div');
      line.className = 'track-hour-line';
      line.style.top = top + 'px';
      els.track.appendChild(line);
    }
    els.gutter.style.position = 'relative';
    els.gutter.style.height = trackHeight + 'px';

    /* Free gaps */
    freeGaps(r.start, r.end, 10).forEach(function (gap) {
      var el = document.createElement('button');
      el.type = 'button';
      el.className = 'free-gap';
      el.style.top = ((gap.start - r.start) * pxPerMin) + 'px';
      el.style.height = ((gap.end - gap.start) * pxPerMin) + 'px';
      var mins = gap.end - gap.start;
      el.textContent = 'FREE ' + mins + ' MIN';
      el.addEventListener('click', function () {
        var duration = Math.min(mins, 240);
        var task = addTask('', 'general', duration);
        requestAnimationFrame(function () { focusTaskTitle(task.id); });
      });
      els.track.appendChild(el);
    });

    /* Tasks (visible within range only) */
    var visible = state.tasks.filter(function (t) {
      var s = parseTime(t.start), e = s + t.duration;
      return e > r.start && s < r.end;
    });
    var laid = layoutTasks(visible);

    laid.forEach(function (entry) {
      els.track.appendChild(renderTaskBlock(entry, r, pxPerMin));
    });

    /* Now line */
    updateNowLine();

    /* Insight panel */
    renderInsights(r);

    /* Print date */
    if (els.printDate) els.printDate.textContent = formatDateLabel(state.date);
  }

  function renderTaskBlock(entry, range, pxPerMin) {
    var task = entry.task;
    var s = parseTime(task.start);
    var top = (s - range.start) * pxPerMin;
    var height = task.duration * pxPerMin;
    var widthPct = 100 / entry.totalCols;
    var leftPct = entry.col * widthPct;

    var block = document.createElement('div');
    block.className = 'task-block';
    block.setAttribute('data-id', task.id);
    block.setAttribute('data-category', task.category);
    block.setAttribute('data-status', task.status);
    block.style.top = top + 'px';
    block.style.height = Math.max(height, 52) + 'px';
    block.style.left = 'calc(' + leftPct + '% + 6px)';
    block.style.width = 'calc(' + widthPct + '% - 10px)';

    var topRow = document.createElement('div');
    topRow.className = 'task-block-top';

    var statusBtn = document.createElement('button');
    statusBtn.type = 'button';
    statusBtn.className = 'task-status-btn';
    statusBtn.setAttribute('aria-label', 'Toggle status');
    statusBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12l5 5L20 6"/></svg>';

    var title = document.createElement('div');
    title.className = 'task-title';
    title.setAttribute('contenteditable', 'true');
    title.setAttribute('role', 'textbox');
    title.setAttribute('aria-label', 'Task title');
    title.textContent = task.title;

    var menuBtn = document.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'task-menu-btn';
    menuBtn.setAttribute('aria-label', 'Task options');
    menuBtn.textContent = '⋮';

    topRow.appendChild(statusBtn);
    topRow.appendChild(title);
    topRow.appendChild(menuBtn);

    var meta = document.createElement('div');
    meta.className = 'task-meta';
    meta.innerHTML = '<span>' + formatTime12(s) + '</span><span>' + task.duration + 'm</span>';

    var stepper = document.createElement('div');
    stepper.className = 'duration-stepper';
    stepper.innerHTML =
      '<button type="button" class="dur-minus" aria-label="Decrease duration">−</button>' +
      '<span class="small-ui">' + task.duration + 'm</span>' +
      '<button type="button" class="dur-plus" aria-label="Increase duration">+</button>';

    block.appendChild(topRow);
    block.appendChild(meta);
    block.appendChild(stepper);

    var handleTop = document.createElement('div');
    handleTop.className = 'resize-handle top';
    var handleBottom = document.createElement('div');
    handleBottom.className = 'resize-handle bottom';
    block.appendChild(handleTop);
    block.appendChild(handleBottom);

    if (openMenuId === task.id) block.appendChild(buildTaskMenu(task));

    return block;
  }

  function buildTaskMenu(task) {
    var menu = document.createElement('div');
    menu.className = 'task-menu';
    var del = document.createElement('button');
    del.type = 'button';
    del.textContent = 'Delete';
    del.addEventListener('click', function (e) {
      e.stopPropagation();
      openMenuId = null;
      removeTask(task.id);
    });
    menu.appendChild(del);
    return menu;
  }

  function focusTaskTitle(id) {
    var el = els.track.querySelector('.task-block[data-id="' + id + '"] .task-title');
    if (!el) return;
    el.focus();
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function updateNowLine() {
    var existing = els.track.querySelector('.now-line');
    if (existing) existing.remove();

    if (state.date !== toISODate(new Date())) return;

    var r = effectiveRange();
    var now = new Date();
    var nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < r.start || nowMin > r.end) return;

    var pxPerMin = hourHeight() / 60;
    var line = document.createElement('div');
    line.className = 'now-line';
    line.style.top = ((nowMin - r.start) * pxPerMin) + 'px';
    var label = document.createElement('span');
    label.className = 'now-label';
    label.textContent = formatTime12(nowMin);
    line.appendChild(label);
    els.track.appendChild(line);
  }

  function renderInsights(range) {
    var totalMinutes = range.end - range.start;
    var completedMinutes = 0, completed = 0, inProgress = 0, pending = 0;

    state.tasks.forEach(function (t) {
      if (t.status === 'completed') { completed++; completedMinutes += t.duration; }
      else if (t.status === 'in-progress') inProgress++;
      else pending++;
    });

    var pct = totalMinutes > 0 ? Math.min(100, Math.round((completedMinutes / totalMinutes) * 100)) : 0;
    if (els.progressRing) els.progressRing.style.setProperty('--pct', pct);
    if (els.progressPct) els.progressPct.textContent = pct + '%';
    if (els.progressFraction) {
      els.progressFraction.textContent = minutesToHm(completedMinutes) + ' / ' + minutesToHm(totalMinutes);
    }
    if (els.statCompleted) els.statCompleted.textContent = completed;
    if (els.statInProgress) els.statInProgress.textContent = inProgress;
    if (els.statPending) els.statPending.textContent = pending;
  }

  function minutesToHm(mins) {
    var h = Math.floor(mins / 60), m = Math.round(mins % 60);
    return h + 'h ' + m + 'm';
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function showToast(msg) {
    if (!els.toast) return;
    els.toast.textContent = msg;
    els.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { els.toast.classList.remove('is-visible'); }, 1800);
  }

  /* ---------- Select population ---------- */
  function populateStartSelect(selected) {
    if (!els.startSelect) return;
    els.startSelect.innerHTML = '';
    for (var h = 0; h < 24; h++) {
      var val = pad(h) + ':00';
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = formatTime12(h * 60);
      if (val === selected) opt.selected = true;
      els.startSelect.appendChild(opt);
    }
  }

  function populateEndSelect(startValue, preferred) {
    if (!els.endSelect) return;
    var startMin = parseTime(startValue);
    els.endSelect.innerHTML = '';
    var firstVal = null, found = false;
    for (var m = startMin + 60; m <= 1440; m += 60) {
      var val = formatTime24(m);
      if (firstVal === null) firstVal = val;
      var opt = document.createElement('option');
      opt.value = val;
      opt.textContent = formatTime12(m === 1440 ? 0 : m) + (m === 1440 ? ' (midnight)' : '');
      if (val === preferred) { opt.selected = true; found = true; }
      els.endSelect.appendChild(opt);
    }
    if (!found && firstVal !== null) els.endSelect.value = firstVal;
  }

  function populateIntervalSelect(selected) {
    if (!els.intervalSelect) return;
    var values = ['15', '30', '60'];
    els.intervalSelect.innerHTML = '';
    values.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v + ' min grid';
      if (v === String(selected)) opt.selected = true;
      els.intervalSelect.appendChild(opt);
    });
  }

  function syncDateUI() {
    if (els.dateLabel) els.dateLabel.textContent = formatDateLabel(state.date);
    if (els.dateInput) els.dateInput.value = state.date;
  }

  function applyRange(newStart, newEnd, newInterval) {
    var s = parseTime(newStart), e = parseTime(newEnd);
    if (e <= s) { e = s + 60; newEnd = formatTime24(e); }
    populateEndSelect(newStart, newEnd);
    newEnd = els.endSelect ? els.endSelect.value : newEnd;

    state.startTime = newStart;
    state.endTime = newEnd;
    state.interval = parseInt(newInterval, 10) || state.interval;
    saveState();
    render();
  }

  /* ---------- Templates ---------- */
  var TEMPLATES = {
    workday: {
      start: '09:00', end: '17:00',
      tasks: [
        { title: 'Deep Work Block', start: '09:00', duration: 120, category: 'work' },
        { title: 'Team Meeting', start: '11:00', duration: 60, category: 'meeting' },
        { title: 'Lunch Break', start: '12:30', duration: 60, category: 'break' },
        { title: 'Focused Tasks', start: '14:00', duration: 120, category: 'work' },
        { title: 'Wrap Up & Plan Tomorrow', start: '16:30', duration: 30, category: 'work' }
      ]
    },
    student: {
      start: '07:00', end: '21:00',
      tasks: [
        { title: 'Morning Routine', start: '07:00', duration: 60, category: 'personal' },
        { title: 'Classes', start: '09:00', duration: 180, category: 'study' },
        { title: 'Lunch', start: '12:00', duration: 60, category: 'break' },
        { title: 'Study Session', start: '14:00', duration: 120, category: 'study' },
        { title: 'Assignments', start: '18:00', duration: 90, category: 'study' }
      ]
    },
    freelancer: {
      start: '08:00', end: '20:00',
      tasks: [
        { title: 'Client Emails', start: '08:00', duration: 45, category: 'work' },
        { title: 'Project Work', start: '09:00', duration: 180, category: 'work' },
        { title: 'Lunch', start: '12:30', duration: 45, category: 'break' },
        { title: 'Client Calls', start: '14:00', duration: 90, category: 'meeting' },
        { title: 'Admin & Invoicing', start: '17:00', duration: 60, category: 'work' }
      ]
    },
    '24hour': {
      start: '00:00', end: '24:00',
      tasks: [
        { title: 'Sleep', start: '00:00', duration: 420, category: 'personal' },
        { title: 'Morning Workout', start: '07:00', duration: 60, category: 'workout' },
        { title: 'Work Block', start: '09:00', duration: 240, category: 'work' },
        { title: 'Evening Personal Time', start: '19:00', duration: 120, category: 'personal' }
      ]
    },
    shift: {
      start: '06:00', end: '18:00',
      tasks: [
        { title: 'Shift Start & Handover', start: '06:00', duration: 30, category: 'work' },
        { title: 'Morning Tasks', start: '06:30', duration: 180, category: 'work' },
        { title: 'Break', start: '10:30', duration: 30, category: 'break' },
        { title: 'Afternoon Tasks', start: '13:00', duration: 240, category: 'work' },
        { title: 'Shift End Report', start: '17:30', duration: 30, category: 'work' }
      ]
    }
  };

  function loadTemplate(key) {
    var tpl = TEMPLATES[key];
    if (!tpl) return;
    state.startTime = tpl.start;
    state.endTime = tpl.end;
    state.show24 = tpl.start === '00:00' && tpl.end === '24:00';
    state.tasks = tpl.tasks.map(function (t) {
      return {
        id: uid(),
        title: t.title,
        start: t.start,
        duration: t.duration,
        category: t.category,
        status: 'pending',
        notes: ''
      };
    });
    populateStartSelect(state.startTime);
    populateEndSelect(state.startTime, state.endTime);
    if (els.show24Toggle) els.show24Toggle.setAttribute('aria-checked', String(state.show24));
    saveState();
    render();
    showToast('Template loaded');
    var toolEl = document.getElementById('planner');
    if (toolEl) toolEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Focus mode ---------- */
  function currentOrNextTask() {
    var nowMin = new Date().getHours() * 60 + new Date().getMinutes();
    var sorted = state.tasks.slice().sort(function (a, b) { return parseTime(a.start) - parseTime(b.start); });
    var current = null, next = null;
    for (var i = 0; i < sorted.length; i++) {
      var s = parseTime(sorted[i].start), e = s + sorted[i].duration;
      if (state.date === toISODate(new Date()) && nowMin >= s && nowMin < e) { current = sorted[i]; next = sorted[i + 1] || null; break; }
      if (s >= nowMin && !current) { current = sorted[i]; next = sorted[i + 1] || null; break; }
    }
    if (!current && sorted.length) { current = sorted[0]; next = sorted[1] || null; }
    return { current: current, next: next };
  }

  function enterFocusMode() {
    var pair = currentOrNextTask();
    if (!pair.current) { showToast('Add a task first'); return; }
    var s = parseTime(pair.current.start);
    els.focusKicker.textContent = pair.current.status === 'in-progress' ? 'HAPPENING NOW' : 'UP NEXT';
    els.focusTitle.textContent = pair.current.title || 'Untitled task';
    els.focusTime.textContent = formatTime12(s) + ' · ' + pair.current.duration + ' min';
    els.focusNext.textContent = pair.next ? ('Next: ' + (pair.next.title || 'Untitled task') + ' at ' + formatTime12(parseTime(pair.next.start))) : 'Nothing scheduled after this.';
    document.body.classList.add('is-focus');
    els.focusOverlay.hidden = false;
    els.focusExitBtn.focus();
  }

  function exitFocusMode() {
    document.body.classList.remove('is-focus');
    els.focusOverlay.hidden = true;
  }

  /* ---------- PNG export (Canvas 2D, no dependencies) ---------- */
  function exportPNG() {
    var r = effectiveRange();
    var width = 900, padding = 40, rowH = 34;
    var hours = Math.ceil((r.end - r.start) / 60) + 1;
    var height = padding * 2 + 70 + hours * rowH;

    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#10253A';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText('HOURLY PLANNER', padding, padding + 10);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#5B6B78';
    ctx.fillText(formatDateLabel(state.date), padding, padding + 32);

    var top = padding + 60;
    var gutterW = 70;
    var trackX = padding + gutterW;
    var trackW = width - trackX - padding;
    var pxPerMin = (hours * rowH) / (r.end - r.start);

    ctx.strokeStyle = '#DADAD4';
    ctx.lineWidth = 1;
    var firstHour = Math.ceil(r.start / 60), lastHour = Math.floor(r.end / 60);
    ctx.font = '11px sans-serif';
    for (var h = firstHour; h <= lastHour; h++) {
      var y = top + (h * 60 - r.start) * pxPerMin;
      ctx.fillStyle = '#5B6B78';
      ctx.fillText(formatTime12(h * 60), padding, y + 4);
      ctx.beginPath();
      ctx.moveTo(trackX, y);
      ctx.lineTo(trackX + trackW, y);
      ctx.stroke();
    }

    ctx.strokeStyle = '#10253A';
    ctx.strokeRect(trackX, top, trackW, hours * rowH);

    state.tasks.forEach(function (t) {
      var s = parseTime(t.start), e = s + t.duration;
      if (e <= r.start || s >= r.end) return;
      var y1 = top + (Math.max(s, r.start) - r.start) * pxPerMin;
      var y2 = top + (Math.min(e, r.end) - r.start) * pxPerMin;
      ctx.fillStyle = '#D7F0E5';
      ctx.fillRect(trackX + 2, y1, trackW - 4, Math.max(y2 - y1, 18));
      ctx.strokeStyle = '#18A88A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(trackX + 2, y1);
      ctx.lineTo(trackX + 2, y1 + Math.max(y2 - y1, 18));
      ctx.stroke();
      ctx.fillStyle = '#10253A';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText((t.title || 'Untitled') + '  ·  ' + t.duration + 'm', trackX + 10, y1 + 14);
    });

    var link = document.createElement('a');
    link.download = 'hourly-planner-' + state.date + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  /* ---------- Drag / resize (pointer events) ---------- */
  var drag = null;

  var DRAG_THRESHOLD = 6;

  function onTrackPointerDown(e) {
    var block = e.target.closest ? e.target.closest('.task-block') : null;
    if (!block) return;
    if (e.target.closest('.task-status-btn, .task-menu-btn, .task-menu, .duration-stepper')) return;

    var handle = e.target.closest('.resize-handle');
    var id = block.getAttribute('data-id');
    var task = findTask(id);
    if (!task) return;

    drag = {
      id: id,
      mode: handle ? (handle.classList.contains('top') ? 'resize-top' : 'resize-bottom') : 'move',
      startX: e.clientX,
      startY: e.clientY,
      origStart: parseTime(task.start),
      origDuration: task.duration,
      pxPerMin: hourHeight() / 60,
      pointerId: e.pointerId,
      /* Resize handles are small explicit controls — engage immediately.
         A plain press on the block (which is mostly the editable title)
         only becomes a drag once the pointer actually moves, so a quick
         click still lets contenteditable place a text cursor normally. */
      active: !!handle
    };
    if (handle) {
      block.classList.add('is-dragging');
      if (block.setPointerCapture) block.setPointerCapture(e.pointerId);
    }
  }

  function snap(minutes) {
    var step = state.interval || 15;
    return Math.round(minutes / step) * step;
  }

  function onTrackPointerMove(e) {
    if (!drag) return;
    var task = findTask(drag.id);
    if (!task) return;

    if (!drag.active) {
      var dist = Math.abs(e.clientY - drag.startY) + Math.abs(e.clientX - drag.startX);
      if (dist < DRAG_THRESHOLD) return;
      drag.active = true;
      var startedBlock = els.track.querySelector('.task-block[data-id="' + drag.id + '"]');
      if (startedBlock) {
        startedBlock.classList.add('is-dragging');
        if (startedBlock.setPointerCapture) startedBlock.setPointerCapture(drag.pointerId);
        var titleEl = startedBlock.querySelector('.task-title');
        if (titleEl && document.activeElement === titleEl) titleEl.blur();
      }
    }

    var deltaMin = snap((e.clientY - drag.startY) / drag.pxPerMin);
    var r = effectiveRange();

    if (drag.mode === 'move') {
      var newStart = Math.max(r.start, Math.min(r.end - task.duration, drag.origStart + deltaMin));
      task.start = formatTime24(newStart);
    } else if (drag.mode === 'resize-bottom') {
      var newDur = Math.max(MIN_DURATION, Math.min(r.end - drag.origStart, drag.origDuration + deltaMin));
      task.duration = newDur;
    } else if (drag.mode === 'resize-top') {
      var proposedStart = drag.origStart + deltaMin;
      var end = drag.origStart + drag.origDuration;
      var clampedStart = Math.max(r.start, Math.min(end - MIN_DURATION, proposedStart));
      task.start = formatTime24(clampedStart);
      task.duration = end - clampedStart;
    }

    var block = els.track.querySelector('.task-block[data-id="' + drag.id + '"]');
    if (block) {
      var pxPerMin = drag.pxPerMin;
      block.style.top = ((parseTime(task.start) - r.start) * pxPerMin) + 'px';
      block.style.height = Math.max(task.duration * pxPerMin, 52) + 'px';
    }
  }

  function onTrackPointerUp() {
    if (!drag) return;
    var id = drag.id, wasActive = drag.active;
    drag = null;
    if (wasActive) {
      saveState();
      render();
    } else {
      var block = els.track.querySelector('.task-block[data-id="' + id + '"]');
      if (block) block.classList.remove('is-dragging');
    }
  }

  /* ---------- Event wiring ---------- */
  function wireEvents() {
    if (els.mobileMenuBtn) {
      els.mobileMenuBtn.addEventListener('click', function () {
        els.mobileNav.classList.toggle('is-open');
      });
    }

    [els.utilityPrintBtn, els.mobilePrintBtn, els.ctaPrintBtn].forEach(function (btn) {
      if (btn) btn.addEventListener('click', function () { window.print(); });
    });
    if (els.ctaPdfBtn) els.ctaPdfBtn.addEventListener('click', function () { window.print(); });
    if (els.ctaPngBtn) els.ctaPngBtn.addEventListener('click', exportPNG);

    if (els.datePrev) els.datePrev.addEventListener('click', function () { state.date = addDays(state.date, -1); syncDateUI(); saveState(); render(); });
    if (els.dateNext) els.dateNext.addEventListener('click', function () { state.date = addDays(state.date, 1); syncDateUI(); saveState(); render(); });
    if (els.dateCalendarBtn) els.dateCalendarBtn.addEventListener('click', function () {
      if (els.dateInput.showPicker) els.dateInput.showPicker(); else els.dateInput.focus();
    });
    if (els.dateInput) els.dateInput.addEventListener('change', function () {
      if (els.dateInput.value) { state.date = els.dateInput.value; syncDateUI(); saveState(); render(); }
    });

    if (els.startSelect) els.startSelect.addEventListener('change', function () {
      applyRange(els.startSelect.value, els.endSelect.value, els.intervalSelect.value);
    });
    if (els.endSelect) els.endSelect.addEventListener('change', function () {
      applyRange(els.startSelect.value, els.endSelect.value, els.intervalSelect.value);
    });
    if (els.intervalSelect) els.intervalSelect.addEventListener('change', function () {
      applyRange(els.startSelect.value, els.endSelect.value, els.intervalSelect.value);
    });
    if (els.show24Toggle) els.show24Toggle.addEventListener('click', function () {
      state.show24 = els.show24Toggle.getAttribute('aria-checked') !== 'true';
      els.show24Toggle.setAttribute('aria-checked', String(state.show24));
      saveState();
      render();
    });

    function submitTaskInput() {
      var val = els.taskInput.value.trim();
      if (!val) return;
      addTask(val, 'general', DEFAULT_DURATION);
      els.taskInput.value = '';
      els.taskInput.focus();
    }
    if (els.addTaskBtn) els.addTaskBtn.addEventListener('click', submitTaskInput);
    if (els.taskInput) els.taskInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitTaskInput(); }
    });

    els.quickAddChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var cat = chip.getAttribute('data-category');
        var meta = CATEGORIES[cat] || { title: chip.textContent };
        var task = addTask(meta.title, cat, DEFAULT_DURATION);
        requestAnimationFrame(function () { focusTaskTitle(task.id); });
      });
    });

    if (els.viewTimelineBtn) els.viewTimelineBtn.addEventListener('click', function () {
      els.timeline.classList.remove('is-compact');
      els.viewTimelineBtn.setAttribute('aria-pressed', 'true');
      els.viewCompactBtn.setAttribute('aria-pressed', 'false');
      render();
    });
    if (els.viewCompactBtn) els.viewCompactBtn.addEventListener('click', function () {
      els.timeline.classList.add('is-compact');
      els.viewCompactBtn.setAttribute('aria-pressed', 'true');
      els.viewTimelineBtn.setAttribute('aria-pressed', 'false');
      render();
    });

    if (els.toolClearBtn) els.toolClearBtn.addEventListener('click', function () {
      if (!state.tasks.length) return;
      if (window.confirm('Clear all tasks for this day?')) {
        state.tasks = [];
        saveState();
        render();
      }
    });
    if (els.toolTemplatesBtn) els.toolTemplatesBtn.addEventListener('click', function () {
      var el = document.getElementById('templates');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (els.toolSaveBtn) els.toolSaveBtn.addEventListener('click', function () {
      saveState();
      showToast('Saved');
    });

    els.templateCards.forEach(function (card) {
      card.addEventListener('click', function () { loadTemplate(card.getAttribute('data-template')); });
    });
    if (els.ctaStartBtn) els.ctaStartBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var el = document.getElementById('planner');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    if (els.focusStartBtn) els.focusStartBtn.addEventListener('click', enterFocusMode);
    if (els.focusExitBtn) els.focusExitBtn.addEventListener('click', exitFocusMode);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (els.focusOverlay && !els.focusOverlay.hidden) exitFocusMode();
        if (openMenuId) { openMenuId = null; render(); }
      }
    });

    /* Timeline delegated interactions */
    els.track.addEventListener('pointerdown', onTrackPointerDown);
    els.track.addEventListener('pointermove', onTrackPointerMove);
    els.track.addEventListener('pointerup', onTrackPointerUp);
    els.track.addEventListener('pointercancel', onTrackPointerUp);

    els.track.addEventListener('click', function (e) {
      var statusBtn = e.target.closest ? e.target.closest('.task-status-btn') : null;
      if (statusBtn) {
        var block = statusBtn.closest('.task-block');
        var task = findTask(block.getAttribute('data-id'));
        if (task) cycleStatus(task);
        return;
      }
      var menuBtn = e.target.closest ? e.target.closest('.task-menu-btn') : null;
      if (menuBtn) {
        var b2 = menuBtn.closest('.task-block');
        var id = b2.getAttribute('data-id');
        openMenuId = openMenuId === id ? null : id;
        render();
        return;
      }
      var durMinus = e.target.closest ? e.target.closest('.dur-minus') : null;
      var durPlus = e.target.closest ? e.target.closest('.dur-plus') : null;
      if (durMinus || durPlus) {
        var b3 = (durMinus || durPlus).closest('.task-block');
        var t3 = findTask(b3.getAttribute('data-id'));
        if (t3) {
          var step = state.interval || 15;
          t3.duration = Math.max(MIN_DURATION, t3.duration + (durPlus ? step : -step));
          saveState();
          render();
        }
        return;
      }
      if (!e.target.closest('.task-menu') && openMenuId) {
        openMenuId = null;
        render();
      }
    });

    els.track.addEventListener('focusout', function (e) {
      var title = e.target.closest ? e.target.closest('.task-title') : null;
      if (!title) return;
      var block = title.closest('.task-block');
      var task = findTask(block.getAttribute('data-id'));
      if (task) { task.title = title.textContent.trim(); saveState(); }
    });

    els.track.addEventListener('keydown', function (e) {
      var title = e.target.closest ? e.target.closest('.task-title') : null;
      if (title && e.key === 'Enter') { e.preventDefault(); title.blur(); }
    });
  }

  /* ---------- Init ---------- */
  function init() {
    populateStartSelect(state.startTime);
    populateEndSelect(state.startTime, state.endTime);
    populateIntervalSelect(state.interval);
    if (els.show24Toggle) els.show24Toggle.setAttribute('aria-checked', String(state.show24));
    syncDateUI();
    wireEvents();
    render();
    setInterval(updateNowLine, 60000);
  }

  init();
})();

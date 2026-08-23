/* ============================================
   Hourly Planner – Schedule Engine
   netgig.online

   Steps 3-7: rendering, quick-add, free-time,
   now line.
   ============================================ */

(function () {
  'use strict';

  var schedule = document.getElementById('schedule');
  if (!schedule) return;

  /* --- Read data attributes --- */
  var startAttr = schedule.getAttribute('data-start') || '08:00';
  var endAttr   = schedule.getAttribute('data-end')   || '18:00';
  var interval  = parseInt(schedule.getAttribute('data-interval'), 10) || 30;

  /* --- Helpers --- */
  function parseTime(str) {
    var parts = str.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function formatTime(totalMinutes) {
    var h = Math.floor(totalMinutes / 60) % 24;
    var m = totalMinutes % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  var startMinutes = parseTime(startAttr);
  var endMinutes   = parseTime(endAttr);

  /* --- State: one array, nothing else --- */
  var blocks = [
    { time: startAttr, text: '', type: 'slot' }
  ];

  var focusedTime  = startAttr;
  var frozen       = false;
  var frozenStamp  = '';
  var lastNowSlot  = -2; // impossible sentinel

  /* --- Block helpers --- */
  function findBlock(time) {
    for (var i = 0; i < blocks.length; i++) {
      if (blocks[i].time === time) return blocks[i];
    }
    return null;
  }

  function blocksMap() {
    var map = {};
    for (var i = 0; i < blocks.length; i++) {
      map[blocks[i].time] = blocks[i];
    }
    return map;
  }

  function nextTime(current) {
    var mins = parseTime(current) + interval;
    return mins <= endMinutes ? formatTime(mins) : null;
  }

  /* --- Display list: merge blocks + free rows --- */
  function buildDisplayList() {
    var map  = blocksMap();
    var list = [];
    for (var t = startMinutes; t <= endMinutes; t += interval) {
      var time = formatTime(t);
      if (map[time]) {
        list.push({ time: time, text: map[time].text, display: 'slot' });
      } else {
        list.push({ time: time, text: '', display: 'free' });
      }
    }
    return list;
  }

  /* --- Now line helpers --- */
  function getNowMinutes() {
    var now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function getNowStamp() {
    var now = new Date();
    var h = now.getHours();
    var m = now.getMinutes();
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function findNowSlotIndex(displayList) {
    var nowMin = getNowMinutes();
    if (nowMin < startMinutes) return 0;
    if (nowMin >= endMinutes)  return displayList.length;
    for (var i = 0; i < displayList.length; i++) {
      var slotMin = parseTime(displayList[i].time);
      var nextMin = (i + 1 < displayList.length)
        ? parseTime(displayList[i + 1].time)
        : endMinutes + interval;
      if (nowMin >= slotMin && nowMin < nextMin) return i;
    }
    return displayList.length;
  }

  function createNowLine() {
    var el = document.createElement('div');
    el.className = 'now-line';
    var label = document.createElement('span');
    label.className = 'now-label';
    label.textContent = frozen
      ? 'now \u00b7 ' + frozenStamp
      : 'now';
    el.appendChild(label);
    return el;
  }

  /* --- Save live text from DOM into blocks before clearing --- */
  function saveCurrentText() {
    var rows = schedule.querySelectorAll('.schedule-row[data-time]');
    for (var i = 0; i < rows.length; i++) {
      var time = rows[i].getAttribute('data-time');
      var cell = rows[i].querySelector('.task-cell[contenteditable]');
      if (cell) {
        var block = findBlock(time);
        if (block) block.text = cell.textContent.trim();
      }
    }
  }

  /* --- Full render cycle --- */
  function render() {
    saveCurrentText();

    var list     = buildDisplayList();
    var nowSlot  = findNowSlotIndex(list);

    schedule.innerHTML = '';

    for (var i = 0; i < list.length; i++) {
      /* Now line before this row */
      if (i === nowSlot) schedule.appendChild(createNowLine());

      var item = list[i];
      var row  = document.createElement('div');
      row.className = 'schedule-row' +
        (item.display === 'free' ? ' schedule-row--free' : '');
      row.setAttribute('data-time', item.time);

      var timeLabel       = document.createElement('div');
      timeLabel.className = 'time-label';
      timeLabel.textContent = item.time;

      var taskCell       = document.createElement('div');
      taskCell.className = 'task-cell';

      if (item.display === 'slot') {
        taskCell.setAttribute('contenteditable', 'true');
        taskCell.setAttribute('role', 'textbox');
        taskCell.setAttribute('aria-label', item.time + ' task');
        if (item.text) taskCell.textContent = item.text;
      } else {
        taskCell.classList.add('task-cell--free');
        taskCell.textContent = '\u00b7 free \u00b7';
      }

      row.appendChild(timeLabel);
      row.appendChild(taskCell);
      schedule.appendChild(row);
    }

    /* Now line after last row */
    if (nowSlot === list.length) schedule.appendChild(createNowLine());

    /* Restore focus */
    restoreFocus();
  }

  function restoreFocus() {
    if (!focusedTime) return;
    var target = schedule.querySelector(
      '.schedule-row[data-time="' + focusedTime + '"] .task-cell[contenteditable]'
    );
    if (!target) return;
    target.focus();
    /* Cursor to end */
    var range = document.createRange();
    var sel   = window.getSelection();
    range.selectNodeContents(target);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  /* ========== Step 4: Quick-add (event delegation) ========== */

  schedule.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;

    var cell = e.target;
    if (!cell.classList.contains('task-cell') ||
        !cell.hasAttribute('contenteditable')) return;

    e.preventDefault();

    var row  = cell.closest('.schedule-row');
    if (!row) return;
    var time = row.getAttribute('data-time');

    /* Commit text */
    var block = findBlock(time);
    if (block) block.text = cell.textContent.trim();

    /* Advance to next slot */
    var next = nextTime(time);
    if (next) {
      if (!findBlock(next)) {
        blocks.push({ time: next, text: '', type: 'slot' });
      }
      focusedTime = next;
    }

    render();
  });

  /* ========== Step 6: Free row click → editable ========== */

  schedule.addEventListener('click', function (e) {
    var row = e.target.closest('.schedule-row--free');
    if (!row) return;

    var time = row.getAttribute('data-time');
    if (!findBlock(time)) {
      blocks.push({ time: time, text: '', type: 'slot' });
    }
    focusedTime = time;
    render();
  });

  /* ========== Step 7: Now line ========== */

  /* Print freeze / resume */
  window.addEventListener('beforeprint', function () {
    frozen      = true;
    frozenStamp = getNowStamp();
    render();
  });

  window.addEventListener('afterprint', function () {
    frozen = false;
    render();
  });

  /* Periodic update — only re-render when slot changes */
  setInterval(function () {
    if (frozen) return;
    var list    = buildDisplayList();
    var nowSlot = findNowSlotIndex(list);
    if (nowSlot !== lastNowSlot) {
      lastNowSlot = nowSlot;
      render();
    }
  }, 60000);

  /* ========== Initial render ========== */
  var list0 = buildDisplayList();
  lastNowSlot = findNowSlotIndex(list0);
  render();

})();

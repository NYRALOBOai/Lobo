const logEl = document.getElementById('log');

export function makeLogger(namespace) {
  const key = `log:${namespace}`;
  let buffer = [];

  function push(level, tag, msg) {
    const time = new Date().toISOString().split('T')[1].slice(0,8);
    const line = { time, level, tag, msg };
    buffer.push(line);
    if (buffer.length > 500) buffer.shift();
    try { localStorage.setItem(key, JSON.stringify(buffer)); } catch {}

    if (logEl) {
      const div = document.createElement('div');
      div.className = 'log-item';
      div.textContent = `[${time}] ${tag.toUpperCase()}: ${msg}`;
      logEl.appendChild(div);
      logEl.scrollTop = logEl.scrollHeight;
    }
  }

  function restore() {
    try {
      const raw = localStorage.getItem(key);
      if (raw) buffer = JSON.parse(raw);
      if (logEl && buffer.length) {
        logEl.innerHTML = '';
        for (const l of buffer) {
          const div = document.createElement('div');
          div.className = 'log-item';
          div.textContent = `[${l.time}] ${l.tag.toUpperCase()}: ${l.msg}`;
          logEl.appendChild(div);
        }
        logEl.scrollTop = logEl.scrollHeight;
      }
    } catch {}
  }

  restore();

  return {
    info(tag, msg) { push('info', tag, msg); },
    warn(tag, msg) { push('warn', tag, msg); },
    error(tag, msg) { push('error', tag, msg); },
    clear() { buffer = []; if (logEl) logEl.innerHTML = ''; try { localStorage.removeItem(key); } catch {} },
  };
}
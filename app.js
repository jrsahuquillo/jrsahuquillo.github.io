(function () {
  'use strict';

  var term = document.getElementById('term');
  var form = document.getElementById('form');
  var inp = document.getElementById('inp');
  var caret = document.getElementById('caret');

  var sink = null;   // when an array, printLine collects into it (typed output)
  var busy = false;  // true while the terminal is generating output
  var skip = false;  // set on interaction to fast-forward the animation

  var AVATAR = 'assets/avatar.png';

  // ----- Static data (language independent) -----
  var BASE = {
    name: 'José Ramón Sahuquillo',
    company: '237 Global',
    links: [
      ['linkedin', 'https://www.linkedin.com/in/jrsahuquillo/'],
      ['github', 'https://github.com/jrsahuquillo'],
      ['x / twitter', 'https://x.com/jrsahuquillo'],
      ['web', 'https://jrsahuquillo.github.io']
    ],
    fw: ['Ruby on Rails', 'Tailwind CSS'],
    db: ['PostgreSQL']
  };

  // ----- Localized content -----
  var L = {
    en: {
      role: 'Software Engineer · Ruby on Rails',
      loc: 'Valencia, Spain · Remote',
      motto: "If I don't know how to do it, I don't know how to do it YET.",
      title: 'ruby · rails · backend · valencia',
      about: [
        'Software Engineer at 237 Global, working remotely from Valencia, Spain.',
        'Building with Ruby on Rails professionally since 2017 — backend features,',
        'database design, business logic, and the tooling that turns app designs',
        'into production-ready configurations consumed by mobile apps.',
        '',
        'I work with AI agents and assisted workflows as a daily driver —',
        'scaffolding, refactoring, generating and reviewing tests — while keeping',
        'the architecture and the final call my own. Strong fundamentals are what',
        'make that leverage reliable.',
        '',
        'I care about clean code, TDD, and getting the small details right.'
      ],
      experience: [
        ['237 Global', 'Software Engineer', '2022 — present'],
        ['DIGITAL55', 'Backend / Frontend Developer', '2020 — 2022'],
        ['The Cocktail', 'Ruby on Rails Developer', '2017 — 2020']
      ],
      skills: [
        ['Languages', ['Ruby', 'JavaScript', 'HTML5', 'CSS']],
        ['Frameworks', BASE.fw],
        ['Data', BASE.db],
        ['Tooling', ['Git', 'TDD', 'AI-assisted workflows']]
      ],
      langs: [['Spanish', 'native'], ['Valencian', '—'], ['English', 'professional']],
      helpHead: 'available commands:',
      help: [
        ['about', 'who I am'],
        ['whoami', 'the one-liner'],
        ['experience', 'where I have worked'],
        ['skills', 'my stack'],
        ['languages', 'human languages'],
        ['motto', 'words to code by'],
        ['contact', 'how to reach me'],
        ['photo', 'my mugshot'],
        ['clear', 'wipe the screen'],
        ['help', 'this list']
      ],
      hint: '<span class="dim">type</span> <span class="cmd">help</span> <span class="dim">to begin, or click a command below.</span>',
      loadingWord: 'loading',
      readyWord: 'ready',
      booting: 'SahuquilloOS 2.0  ·  booting…',
      notfound: function (k) {
        return '<span class="amber">command not found:</span> ' + k +
          ' <span class="dim">— type</span> <span class="cmd">help</span>';
      },
      sudo: '<span class="amber">Permission denied:</span> <span class="dim">you are not root (yet).</span>',
      exit: '<span class="dim">There is no exit. Only more code.</span>'
    },
    es: {
      role: 'Ingeniero de Software · Ruby on Rails',
      loc: 'Valencia, España · Remoto',
      motto: 'Si no sé cómo hacerlo, es que aún no sé cómo hacerlo.',
      title: 'ruby · rails · backend · valencia',
      about: [
        'Ingeniero de Software en 237 Global, trabajando en remoto desde Valencia.',
        'Construyo con Ruby on Rails profesionalmente desde 2017 — features de',
        'backend, diseño de base de datos, lógica de negocio y el tooling que',
        'convierte diseños de apps en configuraciones listas para producción que',
        'consumen las apps móviles.',
        '',
        'Trabajo con agentes de IA y flujos asistidos como herramienta diaria —',
        'scaffolding, refactor, generar y revisar tests — manteniendo la',
        'arquitectura y la última decisión en mi mano. Unos buenos fundamentos',
        'son lo que hace fiable esa palanca.',
        '',
        'Me importa el código limpio, el TDD y cuidar los detalles.'
      ],
      experience: [
        ['237 Global', 'Ingeniero de Software', '2022 — actualidad'],
        ['DIGITAL55', 'Desarrollador Backend / Frontend', '2020 — 2022'],
        ['The Cocktail', 'Desarrollador Ruby on Rails', '2017 — 2020']
      ],
      skills: [
        ['Lenguajes', ['Ruby', 'JavaScript', 'HTML5', 'CSS']],
        ['Frameworks', BASE.fw],
        ['Datos', BASE.db],
        ['Herramientas', ['Git', 'TDD', 'flujos con IA']]
      ],
      langs: [['Español', 'nativo'], ['Valenciano', '—'], ['Inglés', 'profesional']],
      helpHead: 'comandos disponibles:',
      help: [
        ['about', 'quién soy'],
        ['whoami', 'el resumen'],
        ['experience', 'dónde he trabajado'],
        ['skills', 'mi stack'],
        ['languages', 'idiomas'],
        ['motto', 'mi lema'],
        ['contact', 'cómo contactarme'],
        ['photo', 'mi careto'],
        ['clear', 'limpiar pantalla'],
        ['help', 'esta lista']
      ],
      hint: '<span class="dim">escribe</span> <span class="cmd">help</span> <span class="dim">para empezar, o pulsa un comando abajo.</span>',
      loadingWord: 'cargando',
      readyWord: 'listo',
      booting: 'SahuquilloOS 2.0  ·  arrancando…',
      notfound: function (k) {
        return '<span class="amber">comando no encontrado:</span> ' + k +
          ' <span class="dim">— escribe</span> <span class="cmd">help</span>';
      },
      sudo: '<span class="amber">Permiso denegado:</span> <span class="dim">aún no eres root.</span>',
      exit: '<span class="dim">No hay salida. Solo más código.</span>'
    }
  };

  // ----- Language state (defaults to English; a stored choice overrides) -----
  var lang = 'en';
  try {
    var stored = localStorage.getItem('lang');
    if (stored === 'en' || stored === 'es') { lang = stored; }
  } catch (e) {}

  function T() { return L[lang]; }

  // ----- DOM helpers -----
  function el(cls, html) {
    var d = document.createElement('div');
    if (cls) { d.className = cls; }
    if (html != null) { d.innerHTML = html; }
    return d;
  }
  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
    });
  }
  function print(node) {
    term.appendChild(node);
    term.scrollTop = term.scrollHeight;
  }
  function printLine(html, cls) {
    var full = 'line' + (cls ? ' ' + cls : '');
    if (sink) { sink.push({ html: html, cls: full }); return; }
    print(el(full, html));
  }
  function blank() { printLine('&nbsp;'); }

  function avatarNode() {
    var wrap = el('avatar');
    var img = document.createElement('img');
    img.src = AVATAR;
    img.alt = 'José Ramón Sahuquillo';
    img.loading = 'eager';
    wrap.appendChild(img);
    return wrap;
  }

  // ----- Reusable header lines -----
  function bannerLine() {
    return '<span class="bright">▓▓ jrsahuquillo</span> <span class="dim">— ' + esc(T().title) + '</span>';
  }
  function nameLine() {
    return '<span class="hi">' + esc(BASE.name) + '</span> <span class="dim">— ' + esc(T().role) + '</span>';
  }
  function coLine() {
    return esc(BASE.company) + ' · ' + esc(T().loc);
  }

  function printHelp() {
    printLine(esc(T().helpHead), 'dim');
    T().help.forEach(function (c) {
      var pad = ' '.repeat(Math.max(1, 13 - c[0].length));
      printLine('  <span class="cmd">' + c[0] + '</span>' + pad + '<span class="dim">' + esc(c[1]) + '</span>');
    });
  }

  // ----- Commands -----
  var CMD = {
    help: printHelp,
    whoami: function () {
      printLine('<span class="hi">' + esc(BASE.name) + '</span> — ' + esc(T().role) + ' @ ' + esc(BASE.company));
      printLine('<span class="dim">' + esc(T().loc) + '</span>');
    },
    about: function () {
      T().about.forEach(function (l) { printLine(l ? esc(l) : '&nbsp;'); });
    },
    experience: function () {
      T().experience.forEach(function (r) {
        printLine('<span class="bright">' + esc(r[0]) + '</span>');
        printLine('  <span class="dim">' + esc(r[1]) + '  ·  ' + esc(r[2]) + '</span>');
      });
    },
    skills: function () {
      T().skills.forEach(function (g) {
        printLine('<span class="amber">' + esc(g[0]) + '</span>  <span class="dim">' + g[1].map(esc).join(' · ') + '</span>');
      });
    },
    languages: function () {
      T().langs.forEach(function (l) {
        printLine('<span class="bright">' + esc(l[0]) + '</span> <span class="dim">— ' + esc(l[1]) + '</span>');
      });
    },
    motto: function () {
      printLine('<span class="hi">"' + esc(T().motto) + '"</span>');
    },
    contact: function () {
      BASE.links.forEach(function (l) {
        var pad = ' '.repeat(Math.max(1, 14 - l[0].length));
        printLine('<span class="dim">' + l[0] + '</span>' + pad +
          '<a href="' + l[1] + '" target="_blank" rel="noopener">' + esc(l[1]) + '</a>');
      });
    },
    photo: function () { print(avatarNode()); },
    ls: function () {
      printLine('<span class="cmd">about.txt  experience.log  skills.json  languages.txt  contact.md  motto.txt</span>');
    },
    clear: function () { term.innerHTML = ''; },
    sudo: function () { printLine(T().sudo); },
    exit: function () { printLine(T().exit); }
  };

  var ALIAS = {
    '?': 'help',
    history: 'experience',
    stack: 'skills',
    ayuda: 'help',
    acerca: 'about',
    sobre: 'about',
    experiencia: 'experience',
    habilidades: 'skills',
    idiomas: 'languages',
    lema: 'motto',
    contacto: 'contact',
    limpiar: 'clear',
    salir: 'exit',
    foto: 'photo',
    me: 'photo'
  };

  var history = [];
  var historyPos = 0;

  function run(raw) {
    if (busy) { skip = true; return; }
    var cmd = (raw || '').trim();
    print(el('line', '<span class="prompt"><b>visitor@jrsahuquillo</b>:~$</span> ' + esc(cmd)));
    if (!cmd) { return; }
    history.push(cmd);
    historyPos = history.length;
    var word = cmd.split(/\s+/)[0].toLowerCase();
    var key = ALIAS[word] || word;
    var lines = [];
    sink = lines;
    if (CMD[key]) { CMD[key](); } else { printLine(T().notfound(esc(word))); }
    sink = null;
    busy = true;
    skip = false;
    playLines(lines, 7, function () {
      blank();
      busy = false;
      focusInp();
    });
  }

  // ----- Input handling -----
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = inp.value;
    inp.value = '';
    syncCaret();
    run(value);
  });

  inp.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      if (historyPos > 0) { historyPos--; inp.value = history[historyPos] || ''; setTimeout(syncCaret); }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (historyPos < history.length) { historyPos++; inp.value = history[historyPos] || ''; setTimeout(syncCaret); }
      e.preventDefault();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      CMD.clear();
    }
  });

  inp.addEventListener('input', syncCaret);

  function interrupt() { if (busy) { skip = true; } }
  document.addEventListener('pointerdown', interrupt, true);
  document.addEventListener('keydown', interrupt, true);

  function measure(text) {
    var span = document.createElement('span');
    span.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:inherit';
    span.textContent = text;
    inp.parentNode.appendChild(span);
    var w = span.offsetWidth;
    span.remove();
    return w;
  }
  function syncCaret() {
    caret.style.left = Math.min(measure(inp.value), inp.offsetWidth - 2) + 'px';
  }
  var coarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
  function focusInp() { if (coarse) { return; } inp.focus(); }

  document.addEventListener('click', function (e) {
    if (coarse) { return; }
    if (!e.target.closest('a') && !e.target.closest('button')) {
      focusInp();
    }
  });

  // ----- Clock -----
  function tick() {
    var d = new Date();
    document.getElementById('clock').textContent =
      ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  tick();
  setInterval(tick, 15000);

  // ----- Language toggle -----
  var langBox = document.getElementById('lang');

  function paintToggle() {
    [].forEach.call(langBox.querySelectorAll('.lg'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-l') === lang);
    });
  }

  function printIntro() {
    var intro = el('intro');
    intro.appendChild(avatarNode());
    var textCol = document.createElement('div');
    textCol.className = 'introtext';
    var b = el('line ascii'); b.innerHTML = bannerLine(); textCol.appendChild(b);
    var n = el('line'); n.innerHTML = nameLine(); textCol.appendChild(n);
    var c = el('line dim'); c.innerHTML = coLine(); textCol.appendChild(c);
    intro.appendChild(textCol);
    print(intro);
    blank();
    printLine(T().hint, 'line');
    blank();
    printHelp();
    blank();
  }

  function setLang(l) {
    if (l === lang) { focusInp(); return; }
    lang = l;
    try { localStorage.setItem('lang', l); } catch (e) {}
    paintToggle();
    term.innerHTML = '';
    printIntro();
    focusInp();
  }

  langBox.addEventListener('click', function (e) {
    var b = e.target.closest('.lg');
    if (b) { setLang(b.getAttribute('data-l')); }
  });
  paintToggle();

  // ----- Reboot -----
  var rebootBtn = document.getElementById('reboot');
  if (rebootBtn) {
    rebootBtn.addEventListener('click', function () {
      term.innerHTML = '';
      playBoot();
    });
  }

  // Quick command bar — primary navigation, especially on touch
  var cmdbar = document.getElementById('cmdbar');
  ['about', 'experience', 'skills', 'languages', 'contact', 'photo', 'motto'].forEach(function (k) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = k;
    b.addEventListener('click', function () { run(k); });
    cmdbar.appendChild(b);
  });

  // ----- Boot sequence (typewriter) -----
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  function htmlToText(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || '';
  }

  // Type a line character by character, then swap in the colored markup.
  function typeNode(node, html, speed, done) {
    var text = htmlToText(html);
    if (reduce || text.replace(/\u00a0/g, '').trim() === '') {
      node.innerHTML = html;
      done();
      return;
    }
    node.classList.add('typing');
    var i = 0;
    (function step() {
      if (skip) {
        node.classList.remove('typing');
        node.innerHTML = html;
        done();
        return;
      }
      node.textContent = text.slice(0, i++);
      term.scrollTop = term.scrollHeight;
      if (i <= text.length) {
        setTimeout(step, speed);
      } else {
        node.classList.remove('typing');
        node.innerHTML = html;
        done();
      }
    })();
  }

  function playLines(items, speed, done) {
    (function step(k) {
      if (k >= items.length) { if (done) { done(); } return; }
      var it = items[k];
      var node = el(it.cls);
      print(node);
      typeNode(node, it.html, speed, function () {
        setTimeout(function () { step(k + 1); }, (reduce || skip) ? 0 : 40);
      });
    })(0);
  }

  // Modules shown by the one-line loader (and the main commands)
  var MODULES = ['about', 'whoami', 'experience', 'skills', 'languages', 'motto', 'contact', 'photo'];
  var LOAD_DT = 300; // ms per module — tweak to taste

  // Bar length adapts to the viewport (longer on wide screens)
  function barWidth() {
    return Math.max(14, Math.min(36, Math.round(window.innerWidth / 26)));
  }
  function loaderBar(pct, width) {
    var fill = Math.round(pct / 100 * width);
    return '\u2588'.repeat(fill) + '\u2591'.repeat(width - fill);
  }

  // One line that updates in place: "loading <module> [bar] NN%"
  function playLoader(node, done) {
    node.classList.add('typing');
    var width = barWidth();
    function render(label, pct) {
      var pctStr = ('   ' + pct).slice(-3); // fixed width so it never shifts
      node.innerHTML =
        '<span class="bright">[' + loaderBar(pct, width) + ']</span> ' +
        '<span class="amber">' + pctStr + '%</span>  ' +
        '<span class="dim">' + esc(label) + '</span>';
      term.scrollTop = term.scrollHeight;
    }
    var i = 0;
    (function tick() {
      if (skip) {
        render(T().readyWord, 100);
        node.classList.remove('typing');
        done();
        return;
      }
      if (i < MODULES.length) {
        render(T().loadingWord + ' ' + MODULES[i], Math.round((i + 1) / MODULES.length * 100));
        i++;
        setTimeout(tick, LOAD_DT);
      } else {
        render(T().readyWord, 100);
        node.classList.remove('typing');
        setTimeout(done, LOAD_DT);
      }
    })();
  }

  // Draw the portrait top-to-bottom, like it is being rendered line by line
  function revealAvatar(parent, done) {
    var wrap = el('avatar reveal');
    var img = document.createElement('img');
    img.src = AVATAR;
    img.alt = 'José Ramón Sahuquillo';
    wrap.appendChild(img);
    var edge = document.createElement('span');
    edge.className = 'scanedge';
    wrap.appendChild(edge);
    parent.appendChild(wrap);
    term.scrollTop = term.scrollHeight;
    var full = (window.innerWidth <= 620 ? 120 : 150);
    function finish() {
      wrap.classList.remove('reveal');
      wrap.style.height = '';
      edge.remove();
      done();
    }
    if (reduce) { finish(); return; }
    var h = 0;
    var stepPx = Math.max(4, Math.round(full / 24));
    wrap.style.height = '0px';
    (function grow() {
      if (skip) { finish(); return; }
      wrap.style.height = h + 'px';
      edge.style.top = h + 'px';
      if (h >= full) { finish(); return; }
      h = Math.min(full, h + stepPx);
      setTimeout(grow, 22);
    })();
  }

  function typeSeq(items, speed, done) {
    (function step(k) {
      if (k >= items.length) { done(); return; }
      var b = items[k];
      if (b.t === 'blank') {
        blank();
        setTimeout(function () { step(k + 1); }, skip ? 0 : 60);
        return;
      }
      var node = el(b.t);
      print(node);
      typeNode(node, b.s, speed, function () {
        setTimeout(function () { step(k + 1); }, (reduce || skip) ? 0 : 70);
      });
    })(0);
  }

  // Like typeSeq, but appends the typed lines into a given parent element.
  function typeInto(parent, items, speed, done) {
    (function step(k) {
      if (k >= items.length) { done(); return; }
      var b = items[k];
      var node = el(b.t);
      parent.appendChild(node);
      typeNode(node, b.s, speed, function () {
        term.scrollTop = term.scrollHeight;
        setTimeout(function () { step(k + 1); }, (reduce || skip) ? 0 : 70);
      });
    })(0);
  }

  function playBoot() {
    busy = true;
    skip = false;
    var row = el('line bootrow');
    var titleEl = document.createElement('span');
    titleEl.className = 'boot-title dim';
    var loadEl = document.createElement('span');
    loadEl.className = 'boot-load';
    row.appendChild(titleEl);
    row.appendChild(loadEl);
    print(row);
    typeNode(titleEl, esc(T().booting), 14, function () {
      playLoader(loadEl, function () {
        blank();
        var intro = el('intro');
        print(intro);
        var textCol = document.createElement('div');
        textCol.className = 'introtext';
        revealAvatar(intro, function () {
          intro.appendChild(textCol);
          typeInto(textCol, [
            { t: 'line ascii', s: bannerLine() },
            { t: 'line', s: nameLine() },
            { t: 'line dim', s: coLine() }
          ], 12, function () {
            blank();
            typeSeq([{ t: 'line', s: T().hint }], 12, function () {
              var helpLines = [];
              sink = helpLines;
              printHelp();
              sink = null;
              playLines(helpLines, 9, function () {
                blank();
                busy = false;
                focusInp();
              });
            });
          });
        });
      });
    });
  }

  // ----- Blinking-cursor favicon -----
  (function () {
    var link = document.getElementById('favicon');
    if (!link || !document.createElement('canvas').getContext) { return; }
    var c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    var ctx = c.getContext('2d');
    var on = true;
    function frame() {
      ctx.fillStyle = '#040a05';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#35f06b';
      ctx.font = 'bold 34px monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText('>', 6, 36);
      if (on) { ctx.fillRect(34, 16, 20, 34); }
      link.href = c.toDataURL('image/png');
      on = !on;
    }
    frame();
    setInterval(frame, 530);
  })();

  // ----- Start -----
  syncCaret();
  playBoot();
})();

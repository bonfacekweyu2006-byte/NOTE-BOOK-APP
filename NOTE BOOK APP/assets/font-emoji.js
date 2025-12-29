// Font and Emoji helper: injects controls, styles, and handlers
(function () {
  const css = `
  :root { --app-font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; }
  body { font-family: var(--app-font-family); }
  .font-emoji-controls{position:fixed;bottom:14px;right:14px;background:rgba(0,0,0,0.65);color:#fff;padding:8px;border-radius:10px;z-index:9999;display:flex;gap:8px;align-items:center;box-shadow:0 6px 18px rgba(0,0,0,.25)}
  .font-emoji-controls select,.font-emoji-controls input{font-size:13px;padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:inherit}
  .font-emoji-controls button{background:rgba(255,255,255,0.1);color:inherit;border:none;padding:6px 8px;border-radius:6px;cursor:pointer}
  #emojiPanel{position:fixed;bottom:72px;right:14px;background:#fff;color:#000;padding:8px;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,0.18);display:grid;grid-template-columns:repeat(8,28px);gap:6px;z-index:10000;max-height:50vh;overflow:auto;padding:10px}
  #emojiPanel.hidden{display:none}
  #emojiPanel button{background:transparent;border:none;cursor:pointer;font-size:18px;line-height:1;padding:4px}
  `;

  function injectStyle() {
    const s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // master emoji list used by the panel
  const emojisMaster = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','☺️','😚','😙',
    '😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌',
    '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕',
    '😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩',
    '😫','🥱','🙈','🙉','🙊','💥','💫','💢','💦','💨','🕳️','🫥','🫠','🫢','🫣','🫡','👋','🤚','🖐️','✋','🖖',
    '👌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐',
    '🤝','🙏','✍️','💅','🤳','💪','🦾','🦵','🦿','🦶','👂','👃','🧠','🫀','🫁','🦷','🦴','👀','👁️','👅','👄',
    '👶','🧒','👦','👧','🧑','👱‍♂️','👨','🧔','👩','👵','🧓','👴','👲','👳‍♀️','👳‍♂️','🧕','👮‍♀️','👮‍♂️','👷‍♀️','👷‍♂️','💂‍♀️',
    '💂‍♂️','🕵️‍♀️','🕵️‍♂️','👩‍⚕️','👨‍⚕️','👩‍🏫','👨‍🏫','👩‍🌾','👨‍🌾','👩‍🍳','👨‍🍳','👩‍🔧','👨‍🔧','👩‍💼','👨‍💼','👩‍🔬','👨‍🔬','👩‍🎨','👨‍🎨','👩‍🚀','👨‍🚀',
    '👩‍⚖️','👨‍⚖️','👰‍♀️','🤵‍♂️','👸','🤴','🥷','🧙‍♀️','🧙‍♂️','🧝‍♀️','🧝‍♂️','🧛‍♀️','🧛‍♂️','🧟‍♀️','🧟‍♂️','🧞‍♀️','🧞‍♂️','🧜‍♀️','🧜‍♂️','🧚‍♀️',
    '🧚‍♂️','👯‍♀️','👯‍♂️','🧖‍♀️','🧖‍♂️','🧗‍♀️','🧗‍♂️','🏇','🏂','🏌️‍♀️','🏌️‍♂️','🏄‍♀️','🏄‍♂️','🚣‍♀️','🚣‍♂️','🏊‍♀️','🏊‍♂️','⛹️‍♀️','⛹️‍♂️','🏋️‍♀️',
    '🏋️‍♂️','🚴‍♀️','🚴‍♂️','🚵‍♀️','🚵‍♂️','🤸‍♀️','🤸‍♂️','🤼‍♀️','🤼‍♂️','🤽‍♀️','🤽‍♂️','🤾‍♀️','🤾‍♂️','🧘‍♀️','🧘‍♂️','🛀','🛌','🏆','🎖️','🏅',
    '🎗️','🏵️','🎫','🎟️','🎪','🤹‍♀️','🤹‍♂️','🎭','🩰','🎨','🎬','🎤','🎧','🎼','🎹','🥁','🎷','🎺','🎸','🎻',
    '📯','🎮','🕹️','🎰','🎲','🧩','🧸','🪀','🛴','🚗','🚕','🚙','🚌','🚎','🏎️','🚓','🚑','🚒','🚐','🛻',
    '🚚','🚛','🚜','🛵','🏍️','🛺','🚲','🛶','⛵','🚤','🛳️','⛴️','✈️','🛩️','🚀','🛸','🚁','🛰️','🛎️','🧭',
    '⏱️','⏲️','⏰','🕰️','📱','📲','☎️','📞','📟','📠','🔋','🔌','💻','🖥️','🖨️','💽','💾','💿','📀','🧮',
    '🎥','📽️','🎞️','📺','📷','📸','📹','🔍','🔎','🕯️','💡','🔦','🏮','🧯','🪔','📔','📕','📗','📘','📙',
    '📚','📖','🔖','🧷','📎','🖇️','📐','📏','✂️','🧵','🧶','📌','📍','🧾','📥','📤','📦','📫','📪','📬',
    '📭','📮','🗳️','✉️','📧','💌','🔐','🔒','🔓','🔏','🔐','🔑','🗝️','🔨','🪓','⛏️','🪚','🔧','🪛','🔩',
    '⚙️','🧰','🪜','⚖️','🦯','🔗','🔫','💣','🪓','🔪','🗡️','⚔️','🛡️','🚬','⚰️','⚱️','🏺','🧭','⚗️','🔬',
    '🔭','📡','💉','🩸','💊','🩺','🚑','🏥','🏦','🏨','🏩','💒','⛪','🕌','🕍','🛕','🕋','⛩️','🧿','🪪',
    '🏳️','🏴','🏁','🚩','🏳️‍🌈','🏳️‍⚧️','🏴‍☠️','🇺🇳','🇺🇸','🇬🇧','🇨🇦','🇦🇺','🇩🇪','🇫🇷','🇪🇸','🇮🇳','🇯🇵','🇰🇷','🇨🇳','🇧🇷'
  ];

  function createControls() {
    const container = document.createElement('div');
    container.className = 'font-emoji-controls';

    const fontSelect = document.createElement('select');
    fontSelect.id = 'fontSelect';
    const presets = [
      {name: 'System', value: "system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"},
      {name: 'Inter', value: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"},
      {name: 'Roboto', value: "'Roboto', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"},
      {name: 'Georgia', value: "Georgia, 'Times New Roman', Times, serif"},
      {name: 'Courier New', value: "'Courier New', Courier, monospace"}
    ];
    presets.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.value;
      opt.textContent = p.name;
      fontSelect.appendChild(opt);
    });

    const customInput = document.createElement('input');
    customInput.id = 'fontUrlInput';
    customInput.placeholder = 'Add font URL (woff2)';
    customInput.style.width = '180px';

    const addBtn = document.createElement('button');
    addBtn.id = 'addFontBtn';
    addBtn.textContent = 'Add';

    const emojiBtn = document.createElement('button');
    emojiBtn.id = 'emojiBtn';
    emojiBtn.textContent = '😊';

    container.appendChild(fontSelect);
    container.appendChild(customInput);
    container.appendChild(addBtn);
    container.appendChild(emojiBtn);

    document.body.appendChild(container);

    return { fontSelect, customInput, addBtn, emojiBtn };
  }

  function classifyEmoji(ch) {
    if (!ch) return 'other';
    const cp = ch.codePointAt(0);
    if (!cp) return 'other';
    if (cp >= 0x1F600 && cp <= 0x1F64F) return 'smileys'; // Emoticons
    if ((cp >= 0x1F300 && cp <= 0x1F5FF) || (cp >= 0x1F980 && cp <= 0x1F9E0)) return 'nature';
    if (cp >= 0x1F680 && cp <= 0x1F6FF) return 'travel';
    if (cp >= 0x1F700 && cp <= 0x1F77F) return 'symbols';
    if (cp >= 0x1F1E6 && cp <= 0x1F1FF) return 'flags';
    if (cp >= 0x1F32D && cp <= 0x1F37F) return 'food';
    if (cp >= 0x1F3A0 && cp <= 0x1F3FF) return 'activities';
    if (cp >= 0x1F4A0 && cp <= 0x1F4FF) return 'objects';
    // gestures, people and body
    if ((cp >= 0x1F466 && cp <= 0x1F6B5) || (cp >= 0x1F9B0 && cp <= 0x1F9FF)) return 'people';
    return 'other';
  }

  function createEmojiPanel() {
    const panel = document.createElement('div');
    panel.id = 'emojiPanel';
    panel.classList.add('hidden');
    panel.style.display = 'grid';

    // search box
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Search emojis (type or paste)';
    search.style.gridColumn = '1 / -1';
    search.style.padding = '6px';
    search.style.borderRadius = '6px';
    search.style.border = '1px solid #ddd';
    search.style.marginBottom = '6px';
    panel.appendChild(search);

    // category bar
    const cats = ['all','smileys','people','nature','food','activities','travel','objects','symbols','flags','other'];
    const catRow = document.createElement('div');
    catRow.style.gridColumn = '1 / -1';
    catRow.style.display = 'flex';
    catRow.style.gap = '6px';
    catRow.style.flexWrap = 'wrap';
    cats.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = c === 'all' ? 'All' : c[0].toUpperCase() + c.slice(1);
      b.dataset.cat = c;
      b.style.padding = '4px 8px';
      b.style.fontSize = '12px';
      b.addEventListener('click', () => {
        // highlight
        Array.from(catRow.children).forEach(ch => ch.style.opacity = '0.6');
        b.style.opacity = '1';
        renderEmojis(filterEmojis(emojisMaster, c, search.value.trim()));
      });
      catRow.appendChild(b);
    });
    panel.appendChild(catRow);

    // emoji container (grid items will flow)
    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(8,28px)';
    grid.style.gap = '6px';
    grid.style.alignContent = 'start';
    grid.style.overflow = 'auto';
    grid.style.maxHeight = '42vh';
    grid.style.gridColumn = '1 / -1';
    panel.appendChild(grid);

    // populate
    function renderEmojis(list) {
      grid.innerHTML = '';
      list.forEach(e => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = e;
        b.addEventListener('click', () => insertEmoji(e));
        grid.appendChild(b);
      });
    }

    function filterEmojis(list, category, query) {
      let out = list;
      if (category && category !== 'all') {
        out = out.filter(ch => classifyEmoji(ch) === category);
      }
      if (query) {
        // if user pasted an emoji character, filter by contains
        out = out.filter(ch => ch.includes(query));
      }
      return out;
    }

    // search handler
    search.addEventListener('input', () => {
      // find selected category
      const active = Array.from(catRow.children).find(c => c.style.opacity === '1');
      const cat = active ? active.dataset.cat : 'all';
      renderEmojis(filterEmojis(emojisMaster, cat, search.value.trim()));
    });

    document.body.appendChild(panel);
    // default render
    renderEmojis(emojisMaster);
    // highlight All
    if (catRow.firstChild) catRow.firstChild.style.opacity = '1';
    return panel;
  }

  let savedRange = null;
  function saveSelection() {
    const sel = window.getSelection();
    if (!sel) return;
    if (sel.rangeCount > 0) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (savedRange) sel.addRange(savedRange);
  }

  function insertEmoji(emoji) {
    const content = document.getElementById('content');
    if (!content) return;
    // restore previous caret and insert
    restoreSelection();
    const sel = window.getSelection();
    if (!sel) return;
    if (sel.rangeCount === 0) {
      // append at end
      content.focus();
      const text = document.createTextNode(emoji);
      content.appendChild(text);
      // move caret after emoji
      const r = document.createRange();
      r.setStartAfter(text);
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
      saveSelection();
      return;
    }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(emoji);
    range.insertNode(node);
    // move caret after inserted node
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    saveSelection();
    // trigger input event so app can detect change
    content.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }

  function applyFont(fontValue) {
    document.documentElement.style.setProperty('--app-font-family', fontValue);
    document.body.style.fontFamily = fontValue;
    localStorage.setItem('appFont', fontValue);
  }

  function addFontFromUrl(url) {
    const name = 'UserFont' + Date.now();
    try {
      const f = new FontFace(name, `url(${url})`);
      f.load().then(loaded => {
        document.fonts.add(loaded);
        const select = document.getElementById('fontSelect');
        const opt = document.createElement('option');
        opt.value = `'${name}', ${select.options[0].value}`;
        opt.textContent = name;
        select.appendChild(opt);
        select.value = opt.value;
        applyFont(opt.value);
      }).catch(err => {
        console.warn('Font load failed', err);
        alert('Failed to load font from URL');
      });
    } catch (e) {
      console.warn('FontFace API error', e);
      alert('Failed to add font');
    }
  }

  function init() {
    injectStyle();
    const { fontSelect, customInput, addBtn, emojiBtn } = createControls();
    const panel = createEmojiPanel();

    // load saved font
    const saved = localStorage.getItem('appFont');
    if (saved) {
      // if option exists select it, else add
      let found = false;
      for (let i = 0; i < fontSelect.options.length; i++) {
        if (fontSelect.options[i].value === saved) { fontSelect.selectedIndex = i; found = true; break; }
      }
      if (!found) {
        const opt = document.createElement('option'); opt.value = saved; opt.textContent = 'Custom'; fontSelect.appendChild(opt); fontSelect.value = saved;
      }
      applyFont(saved);
    }

    fontSelect.addEventListener('change', e => applyFont(e.target.value));
    addBtn.addEventListener('click', () => {
      const url = customInput.value.trim();
      if (!url) return alert('Enter a font file URL');
      addFontFromUrl(url);
      customInput.value = '';
    });

    emojiBtn.addEventListener('click', () => {
      panel.classList.toggle('hidden');
    });

    // keep track of caret inside content editor
    const content = document.getElementById('content');
    if (content) {
      ['keyup','mouseup','focus','input','click'].forEach(ev => content.addEventListener(ev, saveSelection));
    }

    // close emoji panel when clicking outside
    document.addEventListener('click', (ev) => {
      const p = document.getElementById('emojiPanel');
      const controls = document.querySelector('.font-emoji-controls');
      if (!p || p.classList.contains('hidden')) return;
      if (ev.target.closest('#emojiPanel') || ev.target.closest('.font-emoji-controls')) return;
      p.classList.add('hidden');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();

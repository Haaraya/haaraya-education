/* Gemmanti — interactive worksheet player (child) + shared item renderers (teacher review reuses them). */
const WSX = window.HLWS;
const wsCls = (...a) => a.filter(Boolean).join(" ");
function WsMark({
  u
}) {
  if (!u) return null;
  const t = u.ok === null ? "Teacher judgement" : u.ok ? "Right" : "Not yet";
  return /*#__PURE__*/React.createElement("span", {
    className: "ws-mk " + (u.ok === null ? "open" : u.ok ? "ok" : "no"),
    title: t,
    "aria-label": t
  }, u.ok === null ? "?" : /*#__PURE__*/React.createElement(Icon, {
    n: u.ok ? "check" : "x",
    s: 13,
    w: 3
  }));
}
/* Which worksheet is on screen, so a picture can find its drawing. */
const WsCodeCtx = React.createContext(null);
function wsPicId(code, label) {
  return code && window.HLWS_PICS && (window.HLWS_PICS[code] || {})[label] || null;
}
function WsArt({
  id,
  code
}) {
  const [broken, setBroken] = React.useState(false);
  if (!id || broken) return /*#__PURE__*/React.createElement("span", {
    className: "ws-pic-art",
    "aria-hidden": "true"
  });
  return /*#__PURE__*/React.createElement("span", {
    className: "ws-pic-art has-img",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("img", {
    src: WSX.picUrl(code, id),
    alt: "",
    loading: "lazy",
    onError: () => setBroken(true)
  }));
}
function Pic({
  label,
  on,
  good,
  bad,
  onClick,
  ro,
  small
}) {
  const code = React.useContext(WsCodeCtx);
  const tap = onClick && !ro;
  const El = tap ? "button" : "div";
  return /*#__PURE__*/React.createElement(El, {
    className: wsCls("ws-pic", on && "on", good && "good", bad && "bad", small && "sm"),
    onClick: tap ? onClick : undefined,
    "aria-pressed": tap ? !!on : undefined
  }, /*#__PURE__*/React.createElement(WsArt, {
    id: wsPicId(code, label),
    code: code
  }), /*#__PURE__*/React.createElement("span", {
    className: "ws-pic-l"
  }, label));
}
/* One drawing shown above a line, for questions where the child compares things in the same picture. */
function WsRef({
  id
}) {
  const code = React.useContext(WsCodeCtx);
  const [broken, setBroken] = React.useState(false);
  if (broken) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-ref"
  }, /*#__PURE__*/React.createElement("img", {
    src: WSX.picUrl(code, id),
    alt: "",
    loading: "lazy",
    onError: () => setBroken(true)
  }));
}
function WordChip({
  label,
  on,
  good,
  bad,
  onClick,
  ro
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: wsCls("ws-word", on && "on", good && "good", bad && "bad"),
    onClick: ro ? undefined : onClick,
    disabled: ro && !on && !good,
    "aria-pressed": !!on
  }, label);
}
const BookTag = ({
  i
}) => /*#__PURE__*/React.createElement("span", {
  className: "ws-tag" + (i === 0 ? " frombook" : "")
}, i === 0 ? "From our book" : "New");
function ItemPick({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || it.lines.map(() => []);
  const tap = (li, oi) => {
    const n = it.lines.map((_, k) => (val[k] || []).slice());
    const cur = n[li];
    n[li] = it.single ? [oi] : cur.includes(oi) ? cur.filter(x => x !== oi) : [...cur, oi];
    set(n);
  };
  const P = it.pic ? Pic : WordChip;
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-lines"
  }, it.lines.map((L, li) => /*#__PURE__*/React.createElement("div", {
    className: "ws-line",
    key: li
  }, /*#__PURE__*/React.createElement(BookTag, {
    i: li
  }), /*#__PURE__*/React.createElement("div", {
    className: L.ref ? "ws-refline" : undefined
  }, L.ref && /*#__PURE__*/React.createElement(WsRef, {
    id: L.ref
  }), /*#__PURE__*/React.createElement("div", {
    className: it.pic ? "ws-pics" : "ws-words"
  }, L.o.map((o, oi) => {
    const on = (val[li] || []).includes(oi);
    const good = L.a.includes(oi);
    return /*#__PURE__*/React.createElement(P, {
      key: oi,
      label: o,
      on: on,
      good: fb && good,
      bad: fb && on && !good,
      onClick: () => tap(li, oi),
      ro: ro
    });
  }))), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[li]
  }))));
}
function ItemMatch({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || [];
  const P = it.picR ? Pic : WordChip;
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-lines"
  }, it.lead && /*#__PURE__*/React.createElement("p", {
    className: "ws-lead"
  }, it.lead), it.left.map((l, i) => /*#__PURE__*/React.createElement("div", {
    className: "ws-line",
    key: i
  }, (!it.book || it.book.length) && /*#__PURE__*/React.createElement(BookTag, {
    i: i
  }), /*#__PURE__*/React.createElement("div", {
    className: "ws-mrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-mleft"
  }, it.picL ? /*#__PURE__*/React.createElement(Pic, {
    label: l,
    small: true
  }) : /*#__PURE__*/React.createElement("b", {
    className: "ws-read"
  }, l)), /*#__PURE__*/React.createElement("span", {
    className: "ws-arrow",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 20,
    w: 3
  })), /*#__PURE__*/React.createElement("div", {
    className: it.picR ? "ws-pics" : "ws-words"
  }, it.right.map((r, ri) => {
    const on = val[i] === ri;
    return /*#__PURE__*/React.createElement(P, {
      key: ri,
      label: r,
      small: true,
      on: on,
      good: fb && it.a[i] === ri,
      bad: fb && on && it.a[i] !== ri,
      ro: ro,
      onClick: () => {
        const n = val.slice();
        n[i] = on ? null : ri;
        set(n);
      }
    });
  }))), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[i]
  }))));
}
function ItemFill({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || it.blanks.map(() => "");
  const [sel, setSel] = React.useState(null);
  const put = w => {
    const j = sel != null ? sel : it.blanks.findIndex((b, k) => !b.fixed && !val[k]);
    if (j < 0) return;
    const n = it.blanks.map((_, k) => val[k] || "");
    n[j] = w;
    set(n);
    setSel(null);
  };
  const slotTap = i => {
    if (val[i]) {
      const n = it.blanks.map((_, k) => val[k] || "");
      n[i] = "";
      set(n);
      setSel(i);
    } else setSel(sel === i ? null : i);
  };
  let u = -1;
  return /*#__PURE__*/React.createElement("div", null, it.lead && /*#__PURE__*/React.createElement("p", {
    className: "ws-lead"
  }, it.lead), it.bank && !ro && /*#__PURE__*/React.createElement("div", {
    className: "ws-bank"
  }, /*#__PURE__*/React.createElement("span", null, "Word bank"), it.bank.map(w => /*#__PURE__*/React.createElement("button", {
    key: w,
    className: "ws-word",
    onClick: () => put(w)
  }, w))), /*#__PURE__*/React.createElement("div", {
    className: wsCls("ws-blanks", it.blanks.some(b => b.pic) && "pics", it.bubble && "bubbles")
  }, it.blanks.map((b, i) => {
    if (!b.fixed) u++;
    const unit = fb && !b.fixed ? fb.units[u] : null;
    return /*#__PURE__*/React.createElement("div", {
      className: "ws-blank",
      key: i
    }, b.pic && /*#__PURE__*/React.createElement(Pic, {
      label: b.pic,
      small: true
    }), /*#__PURE__*/React.createElement("div", {
      className: "ws-sent"
    }, b.pre && /*#__PURE__*/React.createElement("span", null, b.pre), b.fixed ? /*#__PURE__*/React.createElement("span", {
      className: "ws-slot fixed"
    }, b.fixed) : it.bank ? /*#__PURE__*/React.createElement("button", {
      className: wsCls("ws-slot", sel === i && "sel", !val[i] && "empty"),
      disabled: ro,
      onClick: () => slotTap(i),
      "aria-label": val[i] ? `Gap: ${val[i]}. Tap to clear` : "Empty gap"
    }, val[i] || "\u00A0") : /*#__PURE__*/React.createElement("input", {
      className: "ws-in",
      value: val[i] || "",
      readOnly: ro,
      onChange: e => {
        const n = it.blanks.map((_, k) => val[k] || "");
        n[i] = e.target.value;
        set(n);
      },
      "aria-label": b.pre || b.pic || "Answer"
    }), b.post && /*#__PURE__*/React.createElement("span", null, b.post), unit && /*#__PURE__*/React.createElement(WsMark, {
      u: unit
    })));
  })), it.bank && !ro && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "Tap a word to put it in the next gap. Tap a gap to empty it."));
}
function ItemSort({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || [];
  const has = (i, b) => it.multi ? (val[i] || []).includes(String(b)) : val[i] === String(b);
  const tog = (i, b) => {
    const n = it.words.map((_, k) => val[k] == null ? it.multi ? [] : "" : val[k]);
    const s = String(b);
    if (it.multi) {
      const cur = Array.isArray(n[i]) ? n[i] : [];
      n[i] = (cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]).sort();
    } else n[i] = n[i] === s ? "" : s;
    set(n);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-sort",
    style: {
      "--bins": it.bins.length
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-sort-r h"
  }, /*#__PURE__*/React.createElement("span", null), it.bins.map(b => /*#__PURE__*/React.createElement("b", {
    key: b
  }, b)), /*#__PURE__*/React.createElement("span", null)), it.words.map((w, i) => /*#__PURE__*/React.createElement("div", {
    className: "ws-sort-r",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "ws-read"
  }, w), it.bins.map((b, bi) => /*#__PURE__*/React.createElement("button", {
    key: bi,
    disabled: ro,
    className: wsCls("ws-binbtn", has(i, bi) && "on"),
    onClick: () => tog(i, bi),
    "aria-label": `${w}: ${b}`,
    "aria-pressed": has(i, bi)
  }, has(i, bi) && /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 18,
    w: 3
  }))), /*#__PURE__*/React.createElement("span", null, fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[i]
  })))));
}
function ItemOrder({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || [];
  const tap = i => set(val.includes(i) ? val.filter(x => x !== i) : [...val, i]);
  const P = it.pic ? Pic : WordChip;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, it.from ? `Tap them in order: 1 is the ${it.from}, ${it.items.length} is the ${it.to}.` : "Tap them in order, starting with 1."), /*#__PURE__*/React.createElement("div", {
    className: it.pic ? "ws-pics" : "ws-words"
  }, it.items.map((x, i) => {
    const n = val.indexOf(i);
    return /*#__PURE__*/React.createElement("div", {
      className: "ws-ord",
      key: i
    }, /*#__PURE__*/React.createElement(P, {
      label: x,
      on: n >= 0,
      onClick: () => tap(i),
      ro: ro
    }), n >= 0 && /*#__PURE__*/React.createElement("span", {
      className: "ws-num"
    }, n + 1));
  })), /*#__PURE__*/React.createElement("div", {
    className: "ws-row"
  }, !ro && val.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet sm",
    onClick: () => set([])
  }, "Start again"), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[0]
  })));
}
function ItemYesNo({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-lines"
  }, it.lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    className: "ws-line",
    key: i
  }, /*#__PURE__*/React.createElement(BookTag, {
    i: i
  }), /*#__PURE__*/React.createElement("div", {
    className: "ws-yn"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ws-read"
  }, l), /*#__PURE__*/React.createElement("div", {
    className: "ws-yn-b"
  }, [true, false].map(b => /*#__PURE__*/React.createElement("button", {
    key: String(b),
    disabled: ro,
    className: wsCls("ws-word", val[i] === b && "on", fb && val[i] === b && (it.a[i] === b ? "good" : "bad")),
    onClick: () => {
      const n = it.lines.map((_, k) => val[k]);
      n[i] = val[i] === b ? null : b;
      set(n);
    }
  }, b ? "Yes" : "No")))), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[i]
  }))));
}
function ItemChoose({
  it,
  v,
  set,
  ro,
  fb
}) {
  const P = it.pic ? Pic : WordChip;
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: it.pic ? "ws-pics" : "ws-words"
  }, it.o.map((o, i) => /*#__PURE__*/React.createElement(P, {
    key: i,
    label: o,
    on: v === i,
    good: fb && it.a === i,
    bad: fb && v === i && it.a !== i,
    ro: ro,
    onClick: () => set(v === i ? null : i)
  }))), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[0]
  }));
}
function ItemWrite({
  it,
  v,
  set,
  ro,
  fb
}) {
  return /*#__PURE__*/React.createElement("div", null, it.lead && /*#__PURE__*/React.createElement("p", {
    className: "ws-lead"
  }, it.lead), /*#__PURE__*/React.createElement("div", {
    className: "ws-row top"
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "ws-ta",
    rows: it.rows || 1,
    value: v || "",
    readOnly: ro,
    onChange: e => set(e.target.value),
    "aria-label": it.q,
    placeholder: ro ? "" : "Write here"
  }), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[0]
  })));
}
function ItemFields({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || [];
  const ch = (i, x) => {
    const n = it.fields.map((_, k) => val[k] || "");
    n[i] = x;
    set(n);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: wsCls(it.postcard && "ws-postcard", it.label && "ws-label")
  }, it.lead && /*#__PURE__*/React.createElement("p", {
    className: "ws-lead"
  }, it.lead), /*#__PURE__*/React.createElement("div", {
    className: wsCls("ws-fields", it.row && "row", it.flow && "flow")
  }, it.fields.map((f, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, it.flow && i > 1 && /*#__PURE__*/React.createElement("span", {
    className: "ws-arrow",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 20,
    w: 3
  })), /*#__PURE__*/React.createElement("label", {
    className: wsCls("ws-field", f.gap && "gap", it.flow && i === 0 && "full")
  }, f.l && /*#__PURE__*/React.createElement("span", null, f.l), f.rows ? /*#__PURE__*/React.createElement("textarea", {
    className: "ws-ta",
    rows: f.rows,
    value: val[i] || "",
    readOnly: ro,
    onChange: e => ch(i, e.target.value)
  }) : /*#__PURE__*/React.createElement("input", {
    className: "ws-in",
    value: val[i] || "",
    readOnly: ro,
    onChange: e => ch(i, e.target.value)
  }), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[i]
  }))))), it.tail && /*#__PURE__*/React.createElement("p", {
    className: "ws-lead",
    style: {
      textAlign: "right"
    }
  }, it.tail));
}
function ItemTable({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || [];
  let u = -1;
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "ws-tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, it.cols.map(c => /*#__PURE__*/React.createElement("th", {
    key: c
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, it.rows.map((row, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri,
    className: ri === 0 ? "given" : ""
  }, row.map((c, ci) => {
    if (typeof c === "string") return /*#__PURE__*/React.createElement("td", {
      key: ci
    }, c);
    u++;
    const unit = fb && fb.units[u];
    return /*#__PURE__*/React.createElement("td", {
      key: ci
    }, /*#__PURE__*/React.createElement("div", {
      className: "ws-row"
    }, /*#__PURE__*/React.createElement("input", {
      className: "ws-in",
      value: (val[ri] || [])[ci] || "",
      readOnly: ro,
      "aria-label": `${it.cols[ci]}, row ${ri + 1}`,
      onChange: e => {
        const n = it.rows.map((r, k) => (val[k] || []).slice());
        n[ri][ci] = e.target.value;
        set(n);
      }
    }), unit && /*#__PURE__*/React.createElement(WsMark, {
      u: unit
    })));
  }))))));
}
function DrawPad({
  value,
  onChange,
  ro
}) {
  const ref = React.useRef();
  const on = React.useRef(false);
  React.useEffect(() => {
    if (ro) return;
    const c = ref.current,
      x = c.getContext("2d");
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    if (value) {
      const im = new Image();
      im.onload = () => x.drawImage(im, 0, 0, c.width, c.height);
      im.src = value;
    }
  }, []);
  if (ro) return value ? /*#__PURE__*/React.createElement("img", {
    className: "ws-drawn",
    src: value,
    alt: "Child's drawing"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "ws-drawn empty"
  }, "No drawing");
  const pos = e => {
    const r = ref.current.getBoundingClientRect();
    return [(e.clientX - r.left) * ref.current.width / r.width, (e.clientY - r.top) * ref.current.height / r.height];
  };
  const ctx = () => {
    const x = ref.current.getContext("2d");
    x.lineWidth = 6;
    x.lineCap = "round";
    x.lineJoin = "round";
    x.strokeStyle = "#1A2A1A";
    return x;
  };
  const down = e => {
    on.current = true;
    ref.current.setPointerCapture(e.pointerId);
    const x = ctx();
    const [a, b] = pos(e);
    x.beginPath();
    x.moveTo(a, b);
    x.lineTo(a + .1, b + .1);
    x.stroke();
  };
  const move = e => {
    if (!on.current) return;
    const x = ctx();
    const [a, b] = pos(e);
    x.lineTo(a, b);
    x.stroke();
  };
  const up = () => {
    if (!on.current) return;
    on.current = false;
    onChange(ref.current.toDataURL("image/jpeg", .6));
  };
  const clear = () => {
    const c = ref.current,
      x = c.getContext("2d");
    x.fillStyle = "#fff";
    x.fillRect(0, 0, c.width, c.height);
    onChange(null);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-draw"
  }, /*#__PURE__*/React.createElement("canvas", {
    ref: ref,
    width: 600,
    height: 340,
    onPointerDown: down,
    onPointerMove: move,
    onPointerUp: up,
    onPointerCancel: up,
    "aria-label": "Drawing box: draw with your finger or mouse"
  }), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet sm",
    onClick: clear
  }, "Clear my drawing"));
}
function ItemDraw({
  it,
  v,
  set,
  ro,
  fb
}) {
  const val = v || {};
  return /*#__PURE__*/React.createElement("div", null, it.lead && /*#__PURE__*/React.createElement("p", {
    className: "ws-lead"
  }, it.lead), /*#__PURE__*/React.createElement(DrawPad, {
    value: val.img,
    ro: ro,
    onChange: img => set({
      ...val,
      img
    })
  }), /*#__PURE__*/React.createElement("label", {
    className: "ws-field",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement("span", null, it.labelPre || "Label"), /*#__PURE__*/React.createElement("input", {
    className: "ws-in",
    value: val.label || "",
    readOnly: ro,
    onChange: e => set({
      ...val,
      label: e.target.value
    })
  }), fb && /*#__PURE__*/React.createElement(WsMark, {
    u: fb.units[1] || fb.units[0]
  })));
}
function ItemText({
  it
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-rc"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-h"
  }, "Read and Compare"), /*#__PURE__*/React.createElement("h4", null, it.title), it.paras.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i
  }, p)));
}
const WS_RENDER = {
  pick: ItemPick,
  match: ItemMatch,
  fill: ItemFill,
  sort: ItemSort,
  order: ItemOrder,
  yesno: ItemYesNo,
  choose: ItemChoose,
  write: ItemWrite,
  fields: ItemFields,
  table: ItemTable,
  draw: ItemDraw,
  text: ItemText
};
function WsKey({
  it
}) {
  return it.key ? /*#__PURE__*/React.createElement("div", {
    className: "ws-key"
  }, /*#__PURE__*/React.createElement("b", null, "Answer"), /*#__PURE__*/React.createElement("span", null, it.key), it.at && /*#__PURE__*/React.createElement("em", null, it.at)) : null;
}
function WsItem({
  it,
  n,
  v,
  set,
  ro,
  fb,
  teacher,
  showKey
}) {
  const R = WS_RENDER[it.t];
  return /*#__PURE__*/React.createElement("div", {
    className: wsCls("ws-item", it.challenge && "ch", it.t === "text" && "txt")
  }, it.challenge && /*#__PURE__*/React.createElement("div", {
    className: "ws-ch-tag"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "star",
    s: 16
  }), "Challenge", teacher ? " · optional, the source of Beyond" : " · if you want to"), it.h && it.t !== "text" && /*#__PURE__*/React.createElement("div", {
    className: "ws-h"
  }, it.h), it.t !== "text" && /*#__PURE__*/React.createElement("p", {
    className: "ws-q"
  }, n != null && /*#__PURE__*/React.createElement("span", {
    className: "ws-qn"
  }, n), /*#__PURE__*/React.createElement("span", null, it.q)), /*#__PURE__*/React.createElement(R, {
    it: it,
    v: v,
    set: set || (() => {}),
    ro: ro,
    fb: fb
  }), it.say && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "Tell your teacher why."), showKey && /*#__PURE__*/React.createElement(WsKey, {
    it: it
  }));
}

/* Read It Again: passage, optional pause/stress marks (L11–12), recordings for the teacher. */
function RecBtn({
  k,
  n,
  done,
  onDone,
  ro
}) {
  const [st, setSt] = React.useState("idle");
  const mr = React.useRef(null);
  const url = window.HL_AUDIO[k];
  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      const r = new MediaRecorder(s);
      const ch = [];
      r.ondataavailable = e => ch.push(e.data);
      r.onstop = () => {
        s.getTracks().forEach(t => t.stop());
        window.HL_AUDIO[k] = URL.createObjectURL(new Blob(ch, {
          type: r.mimeType
        }));
        setSt("idle");
        onDone(true);
      };
      r.start();
      mr.current = r;
      setSt("rec");
    } catch (e) {
      setSt("nomic");
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: wsCls("ws-rec", done && "done")
  }, /*#__PURE__*/React.createElement("b", null, "Read ", n), done ? /*#__PURE__*/React.createElement("span", {
    className: "ws-rec-ok"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 16,
    w: 3
  }), "Done") : /*#__PURE__*/React.createElement("span", {
    className: "ws-rec-st"
  }, st === "rec" ? "Recording…" : "Not yet"), url && /*#__PURE__*/React.createElement("audio", {
    controls: true,
    src: url
  }), !ro && /*#__PURE__*/React.createElement("div", {
    className: "ws-row"
  }, st === "rec" ? /*#__PURE__*/React.createElement("button", {
    className: "hl-btn warn sm",
    onClick: () => mr.current && mr.current.stop()
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "stop",
    s: 14
  }), "Stop") : /*#__PURE__*/React.createElement("button", {
    className: "hl-btn sm",
    onClick: start
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "mic",
    s: 16
  }), url ? "Record again" : "Record my reading"), !done && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet sm",
    onClick: () => onDone(true)
  }, "I read it to my teacher")), st === "nomic" && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "No microphone here. Read it to your teacher, then tap \u201CI read it to my teacher\u201D."));
}
function ReadAgain({
  w,
  L,
  rec,
  ro,
  setResp,
  onReads,
  teacher
}) {
  const R = w.ra;
  const marks = R.marks;
  const m = rec.resp && rec.resp.ra || {
    s: [],
    p: []
  };
  const [tool, setTool] = React.useState("s");
  const tapWord = key => {
    if (ro || !marks) return;
    const lst = m[tool].includes(key) ? m[tool].filter(x => x !== key) : [...m[tool], key];
    setResp("ra", {
      ...m,
      [tool]: lst
    });
  };
  const reads = rec.reads || [];
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-ra-h"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ws-h"
  }, R.page), /*#__PURE__*/React.createElement("span", null, R.reads === 2 ? "Read this twice to your teacher." : "Read this to your teacher.")), marks && /*#__PURE__*/React.createElement("div", {
    className: "ws-marks"
  }, /*#__PURE__*/React.createElement("p", {
    className: "ws-q"
  }, /*#__PURE__*/React.createElement("span", null, "Before you read, mark ", marks.pause === 2 ? "two places" : "one place", " where you will pause and one word you will stress.")), !ro && /*#__PURE__*/React.createElement("div", {
    className: "hl-seg-sm",
    role: "group",
    "aria-label": "Marking tool"
  }, [["s", "Stress a word"], ["p", "Pause after a word"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: tool === k ? "on" : "",
    onClick: () => setTool(k)
  }, l))), /*#__PURE__*/React.createElement("span", {
    className: "ws-hint"
  }, "Stress ", m.s.length, "/", marks.stress, " \xB7 Pause ", m.p.length, "/", marks.pause)), /*#__PURE__*/React.createElement("div", {
    className: "ws-passage"
  }, R.lines.map((ln, li) => /*#__PURE__*/React.createElement("p", {
    key: li
  }, ln.split(" ").map((wd, wi) => {
    const key = li + ":" + wi;
    const s = m.s.includes(key),
      p = m.p.includes(key);
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: wi
    }, marks ? /*#__PURE__*/React.createElement("button", {
      className: wsCls("ws-pw", s && "st"),
      onClick: () => tapWord(key),
      disabled: ro
    }, wd) : /*#__PURE__*/React.createElement("span", null, wd), p && /*#__PURE__*/React.createElement("span", {
      className: "ws-pause",
      "aria-label": "pause"
    }, "|"), " ");
  })))), /*#__PURE__*/React.createElement("p", {
    className: "ws-purpose"
  }, R.purpose), /*#__PURE__*/React.createElement("div", {
    className: "ws-recs"
  }, Array.from({
    length: R.reads
  }, (_, i) => /*#__PURE__*/React.createElement(RecBtn, {
    key: i,
    k: `${L.id}|${w.code}|${i}`,
    n: i + 1,
    done: !!reads[i],
    ro: ro,
    onDone: d => {
      const n = Array.from({
        length: R.reads
      }, (_, k) => !!reads[k]);
      n[i] = d;
      onReads(n);
    }
  }))), !teacher && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "Your teacher listens to you on your own. Recordings stay on this device."));
}
function wsAnswered(w, k, rec) {
  if (k === "ra") return (rec.reads || []).some(Boolean);
  return WSX.secItems(w, k).filter(it => !it.challenge && it.t !== "text").some(it => WSX.check(it, rec.resp[it.id]).answered);
}
function WorksheetSection({
  w,
  k,
  L,
  rec,
  ro,
  setResp,
  onReads,
  teacher,
  showFb,
  showKey
}) {
  if (k === "ra") return /*#__PURE__*/React.createElement(ReadAgain, {
    w: w,
    L: L,
    rec: rec,
    ro: ro,
    setResp: setResp,
    onReads: onReads,
    teacher: teacher
  });
  let qn = 0;
  return /*#__PURE__*/React.createElement(WsCodeCtx.Provider, {
    value: w.code
  }, WSX.secItems(w, k).map(it => {
    if (k === "ta" && it.t !== "text") qn++;
    return /*#__PURE__*/React.createElement(WsItem, {
      key: it.id,
      it: it,
      n: k === "ta" && it.t !== "text" ? qn : null,
      v: rec.resp[it.id],
      set: x => setResp(it.id, x),
      ro: ro,
      teacher: teacher,
      showKey: showKey,
      fb: showFb && it.t !== "text" ? WSX.check(it, rec.resp[it.id]) : null
    });
  }));
}
function WorksheetPlayer({
  L,
  code
}) {
  const {
    state,
    go,
    wsResp,
    wsReads,
    wsHandIn,
    wsSeen
  } = useHL();
  const w = WSX.get(code);
  const b = hlBook(code);
  const rec = hlWsRec(L, code);
  const [sec, setSec] = React.useState(0);
  const [review, setReview] = React.useState(false);
  const [confirm, setConfirm] = React.useState(false);
  const done = rec.status === "handed_in" || rec.status === "reviewed";
  React.useEffect(() => {
    if (rec.status === "reviewed" && !rec.seen) wsSeen(L.id, code);
  }, []);
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [sec]);
  if (!w) return null;
  const S = WSX.SECS[sec];
  const ro = done;
  const teacherName = (state.teachers.find(t => (t.classes || []).includes(L.classId)) || {
    name: "your teacher"
  }).name;
  const withTeacher = k => w.twoPart && (k === "ra" || k === "ta");
  const empty = WSX.SECS.filter(s => s.k !== "ra" && !wsAnswered(w, s.k, rec)).map(s => s.n);
  const first = L.name.split(" ")[0];
  const head = /*#__PURE__*/React.createElement("div", {
    className: "ws-head"
  }, /*#__PURE__*/React.createElement("button", {
    className: "back",
    onClick: () => go("home")
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back"
  }), "Home"), /*#__PURE__*/React.createElement("div", {
    className: "ws-title"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-cover"
  }, /*#__PURE__*/React.createElement(Cover, {
    book: b
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Level ", w.level, " \xB7 ", w.strand, " \xB7 ", w.code), /*#__PURE__*/React.createElement("h1", null, w.title), /*#__PURE__*/React.createElement("p", null, w.blurb))));
  if (done && !review) return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap ws"
  }, head, /*#__PURE__*/React.createElement("div", {
    className: "ws-done"
  }, /*#__PURE__*/React.createElement("img", {
    src: `assets/stamp-l${Math.min(12, w.level)}.png`,
    alt: ""
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, rec.status === "reviewed" ? `${teacherName} has looked at your worksheet` : `Well done, ${first}! Your worksheet is with ${teacherName}.`), rec.status === "reviewed" && rec.note ? /*#__PURE__*/React.createElement("div", {
    className: "ws-note"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "From your teacher"), /*#__PURE__*/React.createElement("p", null, rec.note)) : /*#__PURE__*/React.createElement("p", null, rec.status === "reviewed" ? "Keep reading — your next book is waiting." : "Your teacher will listen to your reading and look at your answers."), /*#__PURE__*/React.createElement("div", {
    className: "ws-row"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => setReview(true)
  }, "Look at my worksheet"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => go("book", {
      id: code
    })
  }, "Back to the book")))));
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap ws"
  }, head, done && /*#__PURE__*/React.createElement("div", {
    className: "ws-banner"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 16,
    w: 3
  }), "Handed in. You can look, but not change it.", /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet sm",
    onClick: () => setReview(false)
  }, "Close")), /*#__PURE__*/React.createElement("nav", {
    className: "ws-steps",
    "aria-label": "Worksheet parts"
  }, WSX.SECS.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s.k,
    className: wsCls(i === sec && "on", wsAnswered(w, s.k, rec) && "done"),
    onClick: () => setSec(i),
    "aria-current": i === sec ? "step" : undefined
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, wsAnswered(w, s.k, rec) && i !== sec ? /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 14,
    w: 3
  }) : s.i), /*#__PURE__*/React.createElement("span", {
    className: "l"
  }, s.n)))), /*#__PURE__*/React.createElement("section", {
    className: "ws-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, S.i, ". ", S.n), withTeacher(S.k) && /*#__PURE__*/React.createElement("span", {
    className: "ws-with"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "users",
    s: 16
  }), "Do this with your teacher")), S.k === "wf" && /*#__PURE__*/React.createElement("p", {
    className: "ws-intro"
  }, "The first line of each task comes from our book. The next lines are new. Can you still do them?"), /*#__PURE__*/React.createElement(WorksheetSection, {
    w: w,
    k: S.k,
    L: L,
    rec: rec,
    ro: ro,
    setResp: (id, x) => wsResp(L.id, code, id, x),
    onReads: r => wsReads(L.id, code, r)
  })), /*#__PURE__*/React.createElement("div", {
    className: "ws-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost big",
    disabled: sec === 0,
    onClick: () => setSec(sec - 1)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 18
  }), "Back"), /*#__PURE__*/React.createElement("span", {
    className: "ws-saved"
  }, ro ? "" : "Your answers save as you go"), sec < 3 ? /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big",
    onClick: () => setSec(sec + 1)
  }, "Next", /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 18
  })) : !ro && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn yellow big",
    onClick: () => empty.length ? setConfirm(true) : wsHandIn(L.id, code)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "send",
    s: 18
  }), "Hand in to my teacher")), confirm && /*#__PURE__*/React.createElement(Modal, {
    title: "Hand in now?",
    onClose: () => setConfirm(false),
    foot: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "hl-btn ghost",
      onClick: () => setConfirm(false)
    }, "Keep working"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn",
      onClick: () => {
        setConfirm(false);
        wsHandIn(L.id, code);
      }
    }, "Hand in"))
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 700
    }
  }, "Nothing is filled in yet for: ", empty.join(", "), "."), /*#__PURE__*/React.createElement("p", {
    className: "note",
    style: {
      marginTop: 10
    }
  }, "That is fine if your teacher said to leave it.")));
}
Object.assign(window, {
  WorksheetPlayer,
  WorksheetSection,
  WsItem,
  WsKey,
  WsMark,
  ReadAgain,
  wsAnswered,
  Pic
});
/* Gemmanti — teacher worksheet records: class grid, per-child review, teacher guide. */
const WT = window.HLWS;
const RATE_ORDER = ["NY", "D", "S", "B"];
function RateChip({
  r,
  sm
}) {
  if (!r) return /*#__PURE__*/React.createElement("span", {
    className: "rate blank",
    title: "Not yet recorded"
  }, "\xA0");
  return /*#__PURE__*/React.createElement("span", {
    className: "rate r-" + (r === "-" ? "x" : r) + (sm ? " sm" : ""),
    title: WT.RATINGS[r]
  }, r);
}
function HelpChip({
  h
}) {
  return h ? /*#__PURE__*/React.createElement("span", {
    className: "rate help",
    title: WT.HELP[h]
  }, h) : /*#__PURE__*/React.createElement("span", {
    className: "rate blank"
  }, "\xA0");
}
const WS_STATUS = {
  not_started: ["not_started", "Not started"],
  in_progress: ["in_progress", "Working on it"],
  handed_in: ["handed", "Handed in"],
  reviewed: ["complete", "Recorded"]
};
function WsStatus({
  s
}) {
  const [c, l] = WS_STATUS[s] || WS_STATUS.not_started;
  return /*#__PURE__*/React.createElement("span", {
    className: "hl-status " + c
  }, l);
}
function TWorksheets({
  cls,
  learners,
  openAssign,
  showScores
}) {
  const {
    state
  } = useHL();
  const asg = state.assignments.filter(a => a.classId === cls.id && a.type === "worksheet");
  const toRecord = ref => learners.filter(l => hlWsRec(l, ref).status === "handed_in").length;
  const firstDue = asg.find(x => toRecord(x.ref) > 0);
  const [code, setCode] = React.useState(firstDue ? firstDue.ref : asg[0] ? asg[0].ref : WT.list()[0].code);
  const [open, setOpen] = React.useState(null);
  const [guide, setGuide] = React.useState(false);
  const [f, setF] = React.useState("all");
  const w = WT.get(code);
  const a = asg.find(x => x.ref === code);
  const tgt = learners.filter(l => !a || a.to === "all" || a.to.includes(l.id)).sort((x, y) => x.name.localeCompare(y.name));
  const recs = tgt.map(l => [l, hlWsRec(l, code)]);
  const cnt = s => recs.filter(([, r]) => r.status === s).length;
  const [q, setQ] = React.useState("");
  // Open on "To record" whenever there is marking waiting for this worksheet.
  React.useEffect(() => {
    setF(recs.some(([, r]) => r.status === "handed_in") ? "handed_in" : "all");
  }, [code]);
  const rows = recs.filter(([l, r]) => (f === "all" || r.status === f) && (!q.trim() || l.name.toLowerCase().includes(q.trim().toLowerCase())));
  const dist = k => RATE_ORDER.map(r => [r, recs.filter(([, x]) => x.ratings && x.ratings[k] === r).length]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Worksheets"), /*#__PURE__*/React.createElement("p", null, cls.name, " \xB7 ratings follow the Haaraya teacher guide")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("a", {
    className: "hl-btn ghost",
    href: "../Haaraya%20Print.html?book=" + encodeURIComponent(code),
    target: "_blank",
    rel: "noopener"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "dl",
    s: 16
  }), "Print book"), /*#__PURE__*/React.createElement(MaterialDownload, {
    code: code,
    kind: "worksheet"
  }), /*#__PURE__*/React.createElement(MaterialDownload, {
    code: code,
    kind: "guide"
  }), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => setGuide(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "book",
    s: 16
  }), "Teacher guide"), openAssign && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => openAssign({
      type: "worksheet"
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    s: 16
  }), "Assign a worksheet"))), /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement(WsPicker, {
    code: code,
    setCode: setCode,
    asg: asg,
    toRecord: toRecord
  }), /*#__PURE__*/React.createElement("input", {
    className: "hl-input s",
    placeholder: "Search pupils",
    value: q,
    onChange: e => setQ(e.target.value),
    "aria-label": "Search pupils"
  }), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, [["all", "All", tgt.length], ["handed_in", "To record", cnt("handed_in")], ["reviewed", "Recorded", cnt("reviewed")], ["in_progress", "Working", cnt("in_progress")], ["not_started", "Not started", tgt.length - cnt("handed_in") - cnt("reviewed") - cnt("in_progress")]].map(([k, l, n]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: f === k ? "on" : "",
    onClick: () => setF(k)
  }, l, " \xB7 ", n)))), /*#__PURE__*/React.createElement("div", {
    className: "card ws-sum"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-sum-b"
  }, /*#__PURE__*/React.createElement("div", {
    className: "th"
  }, /*#__PURE__*/React.createElement(Cover, {
    book: hlBook(code)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Level ", w.level, " \xB7 ", w.strand, " \xB7 ", w.code), /*#__PURE__*/React.createElement("h3", null, w.title), /*#__PURE__*/React.createElement("p", null, w.blurb), a ? /*#__PURE__*/React.createElement("p", {
    className: "meta"
  }, "Due ", new Date(a.due).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  }), " \xB7 ", a.to === "all" ? "whole class" : a.to.length === 1 && state.learners[a.to[0]] ? state.learners[a.to[0]].name : a.to.length + " learners") : !window.HL_LIVE_ON && /*#__PURE__*/React.createElement("p", {
    className: "meta"
  }, "Not assigned to this class"))), /*#__PURE__*/React.createElement("div", {
    className: "ws-dist"
  }, WT.SECS.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.k
  }, /*#__PURE__*/React.createElement("span", null, s.n), /*#__PURE__*/React.createElement("div", {
    className: "ws-dist-r"
  }, dist(s.k).map(([r, n]) => /*#__PURE__*/React.createElement("span", {
    key: r,
    className: "ws-dist-c r-" + r,
    title: `${WT.RATINGS[r]}: ${n}`
  }, /*#__PURE__*/React.createElement("b", null, r), n))))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl ws-grid"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Learner"), /*#__PURE__*/React.createElement("th", null, "Status"), WT.SECS.map(s => /*#__PURE__*/React.createElement("th", {
    key: s.k,
    className: "c",
    title: s.n
  }, s.n.split(" ").map(x => x[0]).join(""))), /*#__PURE__*/React.createElement("th", {
    className: "c",
    title: "Overall help"
  }, "Help"), showScores && /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "Score"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, rows.map(([l, r]) => /*#__PURE__*/React.createElement("tr", {
    key: l.id,
    className: r.status === "handed_in" ? "live" : ""
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "who linkish",
    onClick: () => setOpen(l.id)
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: l.name,
    size: "sm"
  }), l.name)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(WsStatus, {
    s: r.status
  })), WT.SECS.map(s => /*#__PURE__*/React.createElement("td", {
    key: s.k,
    className: "c"
  }, /*#__PURE__*/React.createElement(RateChip, {
    r: r.ratings && r.ratings[s.k]
  }))), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, /*#__PURE__*/React.createElement(HelpChip, {
    h: r.help
  })), showScores && /*#__PURE__*/React.createElement("td", {
    className: "c num"
  }, hlScoreText(hlWsScore(r, code))), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn sm " + (r.status === "handed_in" ? "" : "ghost"),
    onClick: () => setOpen(l.id)
  }, r.status === "handed_in" ? "Record" : r.status === "reviewed" ? "Open" : "Record")))), !rows.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: showScores ? 9 : 8
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty",
    style: {
      border: 0
    }
  }, "No learners here.")))))), /*#__PURE__*/React.createElement("p", {
    className: "ws-legend"
  }, "WF Word Focus \xB7 RIA Read It Again \xB7 TAI Think About It \xB7 SWYK Show What You Know \xB7 NY Not Yet \xB7 D Developing \xB7 S Secure \xB7 B Beyond \xB7 \u2013 not observed \xB7 A absent \xB7 blank not yet recorded \xB7 Help: M Modelled, P Prompted, I Independent")), open && /*#__PURE__*/React.createElement(WsReview, {
    L: state.learners[open],
    code: code,
    onClose: () => setOpen(null)
  }), guide && /*#__PURE__*/React.createElement(WsGuide, {
    w: w,
    onClose: () => setGuide(false)
  }));
}

/* Worksheet picker: type to find, grouped into "Set for this class" and by level. */
function WsPicker({
  code,
  setCode,
  asg,
  toRecord
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!open) return;
    const off = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const esc = e => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", off);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const w = WT.get(code);
  const t = q.trim().toLowerCase();
  const hit = x => !t || x.title.toLowerCase().includes(t) || x.code.toLowerCase().includes(t);
  const set = [...new Set(asg.map(a => a.ref))].map(c => WT.get(c)).filter(Boolean).filter(hit);
  const byLevel = {};
  WT.list().filter(hit).forEach(x => {
    (byLevel[x.level] = byLevel[x.level] || []).push(x);
  });
  const pick = c => {
    setCode(c);
    setOpen(false);
    setQ("");
  };
  const item = x => /*#__PURE__*/React.createElement("button", {
    key: x.code,
    className: "wsp-i" + (x.code === code ? " on" : ""),
    onClick: () => pick(x.code)
  }, /*#__PURE__*/React.createElement("span", null, "L", x.level, " \xB7 ", x.title), /*#__PURE__*/React.createElement("span", {
    className: "wsp-c"
  }, x.code), toRecord(x.code) > 0 && /*#__PURE__*/React.createElement("span", {
    className: "wsp-n"
  }, toRecord(x.code), " to record"));
  return /*#__PURE__*/React.createElement("div", {
    className: "wsp",
    ref: ref
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-select wsp-b",
    onClick: () => setOpen(o => !o),
    "aria-expanded": open,
    "aria-label": "Choose a worksheet"
  }, "L", w.level, " \xB7 ", w.title, toRecord(code) ? ` · ${toRecord(code)} to record` : ""), open && /*#__PURE__*/React.createElement("div", {
    className: "wsp-pop"
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input s",
    autoFocus: true,
    placeholder: "Search worksheets",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "wsp-list"
  }, set.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "wsp-g"
  }, "Set for this class"), set.map(item)), Object.keys(byLevel).sort((a, b) => a - b).map(lv => /*#__PURE__*/React.createElement(React.Fragment, {
    key: lv
  }, /*#__PURE__*/React.createElement("div", {
    className: "wsp-g"
  }, "Level ", lv), byLevel[lv].map(item))), !set.length && !Object.keys(byLevel).length && /*#__PURE__*/React.createElement("div", {
    className: "wsp-g"
  }, "No worksheets match."))));
}
function RubricPick({
  w,
  k,
  val,
  set,
  disabled,
  challenge
}) {
  const desc = w.r[k];
  const opts = [["NY", desc[0]], ["D", desc[1]], ["S", desc[2]]];
  if (k === "sw") opts.push(["B", "Challenge: " + w.r.b]);
  return /*#__PURE__*/React.createElement("div", {
    className: "rub" + (disabled ? " off" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "rub-g",
    style: {
      gridTemplateColumns: `repeat(${opts.length},minmax(0,1fr))`
    }
  }, opts.map(([r, d]) => /*#__PURE__*/React.createElement("button", {
    key: r,
    disabled: disabled,
    className: "rub-c r-" + r + (val === r ? " on" : ""),
    onClick: () => set(val === r ? null : r),
    "aria-pressed": val === r
  }, /*#__PURE__*/React.createElement("span", {
    className: "rub-t"
  }, /*#__PURE__*/React.createElement(RateChip, {
    r: r,
    sm: true
  }), WT.RATINGS[r]), /*#__PURE__*/React.createElement("span", {
    className: "rub-d"
  }, d), r === "B" && !challenge && /*#__PURE__*/React.createElement("span", {
    className: "rub-n"
  }, "Challenge not attempted")))), /*#__PURE__*/React.createElement("div", {
    className: "rub-x"
  }, ["-", "A"].map(r => /*#__PURE__*/React.createElement("button", {
    key: r,
    disabled: disabled,
    className: "chip" + (val === r ? " on" : ""),
    onClick: () => set(val === r ? null : r)
  }, r, " ", WT.RATINGS[r])), k !== "sw" && /*#__PURE__*/React.createElement("span", {
    className: "ws-hint"
  }, "Beyond is not possible for this section.")));
}
function WsReview({
  L,
  code,
  onClose
}) {
  const {
    wsReview
  } = useHL();
  const w = WT.get(code);
  const rec = hlWsRec(L, code);
  const [rt, setRt] = React.useState(Object.assign({}, rec.ratings || {}));
  const [help, setHelp] = React.useState(rec.help || null);
  const [note, setNote] = React.useState(rec.note || "");
  const [heard, setHeard] = React.useState(!!(rec.ratings && rec.ratings.ra && rec.ratings.ra !== "-"));
  const [keys, setKeys] = React.useState(true);
  const set = (k, v) => setRt(Object.assign({}, rt, {
    [k]: v
  }));
  const recorded = Object.keys(window.HL_AUDIO).some(k => k.startsWith(`${L.id}|${code}|`));
  const marks = rt.marks || {};
  const markCtx = {
    marks,
    edit: true,
    setMark: (key, v) => {
      const m = {
        ...marks
      };
      if (v == null) delete m[key];else m[key] = v;
      setRt(Object.assign({}, rt, {
        marks: m
      }));
    }
  };
  const sc = hlWsScore({
    ...rec,
    ratings: rt,
    status: rec.status === "not_started" ? "in_progress" : rec.status
  }, code);
  return /*#__PURE__*/React.createElement(Drawer, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement(WsMarkCtx.Provider, {
    value: markCtx
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-rev"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-rev-h"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: L.name,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", null, L.name), /*#__PURE__*/React.createElement("p", null, w.title, " \xB7 L", w.level, " \xB7 ", /*#__PURE__*/React.createElement(WsStatus, {
    s: rec.status
  }), rec.handedAt || rec.at ? ` · ${rec.status === "reviewed" ? "recorded " + (rec.reviewedAt || "") : "handed in " + (rec.handedAt || rec.at)}` : "")), /*#__PURE__*/React.createElement("button", {
    className: "x-btn",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "x"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "note"
  }, "Record only what you observed. Rate from the sheet, except Read It Again, which you rate only after hearing this child read alone. An answer given together by a group is not evidence for any one child. Ticks and crosses are a first check of the closed items \u2014 your judgement decides."), /*#__PURE__*/React.createElement("div", {
    className: "ws-score-bar"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Score"), /*#__PURE__*/React.createElement("b", null, sc && sc.max ? `${hlHalf(sc.pts)} / ${sc.max}` : "—"), sc && sc.max ? /*#__PURE__*/React.createElement("em", null, sc.pct, "%") : null), /*#__PURE__*/React.createElement("p", null, sc && sc.toMark ? `${sc.toMark} written ${sc.toMark === 1 ? "answer" : "answers"} still to mark. Use Right, Partly or Not yet beside each one.` : "Every answer is marked. Right counts 1, Partly ½, Not yet 0.")), /*#__PURE__*/React.createElement("label", {
    className: "ws-tog"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: keys,
    onChange: e => setKeys(e.target.checked)
  }), "Show answers from the guide"), rec.status === "not_started" && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, L.name.split(" ")[0], " has not opened this worksheet. You can still record what you observed in a guided session."), WT.SECS.map(s => {
    const sg = WT.suggest(w, s.k, rec.resp || {}, marks);
    return /*#__PURE__*/React.createElement("section", {
      className: "ws-rev-s",
      key: s.k
    }, /*#__PURE__*/React.createElement("div", {
      className: "ws-rev-sh"
    }, /*#__PURE__*/React.createElement("h3", null, s.i, ". ", s.n), /*#__PURE__*/React.createElement("span", {
      className: "ws-crit"
    }, "Success criterion: ", w.g.crit[s.k])), /*#__PURE__*/React.createElement("div", {
      className: "ws-rev-work"
    }, s.k === "ra" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(ReadAgain, {
      w: w,
      L: L,
      rec: rec,
      ro: true,
      teacher: true,
      setResp: () => {},
      onReads: () => {}
    }), /*#__PURE__*/React.createElement("div", {
      className: "ws-key"
    }, /*#__PURE__*/React.createElement("b", null, "Listen for"), /*#__PURE__*/React.createElement("span", null, w.g.listen))) : /*#__PURE__*/React.createElement(WorksheetSection, {
      w: w,
      k: s.k,
      L: L,
      rec: {
        resp: rec.resp || {}
      },
      ro: true,
      teacher: true,
      showFb: true,
      showKey: keys
    })), /*#__PURE__*/React.createElement("div", {
      className: "ws-rate"
    }, s.k === "ra" ? /*#__PURE__*/React.createElement("label", {
      className: "ws-tog strong"
    }, /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: heard,
      onChange: e => setHeard(e.target.checked)
    }), "I heard ", L.name.split(" ")[0], " read this alone", recorded ? " (or listened to the recording)" : "") : sg.r ? /*#__PURE__*/React.createElement("div", {
      className: "ws-sugg"
    }, /*#__PURE__*/React.createElement("span", null, "Suggested from the marks: ", /*#__PURE__*/React.createElement(RateChip, {
      r: sg.r,
      sm: true
    }), " ", /*#__PURE__*/React.createElement("b", null, WT.RATINGS[sg.r]), " \u2014 ", sg.note), rt[s.k] !== sg.r && /*#__PURE__*/React.createElement("button", {
      className: "hl-btn quiet sm",
      onClick: () => set(s.k, sg.r)
    }, "Use")) : /*#__PURE__*/React.createElement("div", {
      className: "ws-sugg"
    }, /*#__PURE__*/React.createElement("span", null, sg.note)), /*#__PURE__*/React.createElement(RubricPick, {
      w: w,
      k: s.k,
      val: rt[s.k],
      set: v => set(s.k, v),
      disabled: s.k === "ra" && !heard,
      challenge: !!sg.challenge
    }), (rt[s.k] === "NY" || rt[s.k] === "D") && /*#__PURE__*/React.createElement("div", {
      className: "ws-next"
    }, /*#__PURE__*/React.createElement("b", null, "If a child struggles"), /*#__PURE__*/React.createElement("span", null, w.g.next[s.k]))));
  }), /*#__PURE__*/React.createElement("section", {
    className: "ws-rev-s"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-rev-sh"
  }, /*#__PURE__*/React.createElement("h3", null, "Overall help"), /*#__PURE__*/React.createElement("span", {
    className: "ws-crit"
  }, "The most help you actually gave across the worksheet. Help is never an ability level.")), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, Object.entries(WT.HELP).map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: help === k ? "on" : "",
    onClick: () => setHelp(help === k ? null : k)
  }, k, " \xB7 ", l))), w.level <= 2 && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint",
    style: {
      marginTop: 8
    }
  }, "At this level, Independent means you gave the spoken instruction and the child responded without further help.")), /*#__PURE__*/React.createElement("section", {
    className: "ws-rev-s"
  }, window.HL_LIVE_ON ? /*#__PURE__*/React.createElement("div", {
    className: "ws-rev-sh"
  }, /*#__PURE__*/React.createElement("h3", null, "Teacher\u2019s note"), /*#__PURE__*/React.createElement("span", {
    className: "ws-crit"
  }, "Staff only. Describe the work, never the child.")) : /*#__PURE__*/React.createElement("div", {
    className: "ws-rev-sh"
  }, /*#__PURE__*/React.createElement("h3", null, "A note for ", L.name.split(" ")[0]), /*#__PURE__*/React.createElement("span", {
    className: "ws-crit"
  }, "Shown to the child and their family. Describe the work, never the child.")), /*#__PURE__*/React.createElement("textarea", {
    className: "hl-input",
    rows: 3,
    value: note,
    onChange: e => setNote(e.target.value),
    placeholder: window.HL_LIVE_ON ? "e.g. Sorted every sun and rain word. Needed a prompt to let her voice drop when it goes dark." : "e.g. You sorted every sun and rain word. Next time, let your voice drop when it goes dark."
  })), /*#__PURE__*/React.createElement("div", {
    className: "ws-rev-f"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: onClose
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => {
      const clean = {};
      Object.keys(rt).forEach(k => {
        if (rt[k]) clean[k] = rt[k];
      });
      if (sc) clean.score = {
        got: sc.pts,
        total: sc.max,
        toMark: sc.toMark || 0
      };
      wsReview(L.id, code, {
        ratings: clean,
        help,
        note
      });
      onClose();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 16
  }), "Save record")))));
}
function WsGuide({
  w,
  onClose
}) {
  const items = WT.SECS.filter(s => s.k !== "ra").flatMap(s => WT.secItems(w, s.k).filter(it => it.t !== "text").map((it, i) => [s, it]));
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Teacher guide · ${w.title}`,
    onClose: onClose,
    wide: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "guide"
  }, /*#__PURE__*/React.createElement("p", {
    className: "eyebrow"
  }, "Level ", w.level, " \xB7 ", w.tafiya, " \xB7 ", w.band, " band \xB7 ", w.strand, " \xB7 ", w.focus), /*#__PURE__*/React.createElement("div", {
    className: "guide-g"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Preparation"), /*#__PURE__*/React.createElement("p", null, w.g.prep)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Delivering the worksheet"), /*#__PURE__*/React.createElement("p", null, w.g.deliv)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Support"), /*#__PURE__*/React.createElement("p", null, w.g.support)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", null, "Read It Again: what to listen for"), /*#__PURE__*/React.createElement("p", null, w.g.listen))), /*#__PURE__*/React.createElement("h4", null, "Answers"), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Item"), /*#__PURE__*/React.createElement("th", null, "Answer"), /*#__PURE__*/React.createElement("th", null, "Answer type"))), /*#__PURE__*/React.createElement("tbody", null, items.map(([s, it]) => /*#__PURE__*/React.createElement("tr", {
    key: it.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, it.challenge ? "Challenge" : s.n), /*#__PURE__*/React.createElement("div", {
    className: "ws-hint"
  }, it.q)), /*#__PURE__*/React.createElement("td", null, it.key), /*#__PURE__*/React.createElement("td", {
    style: {
      whiteSpace: "nowrap"
    }
  }, it.at)))))), /*#__PURE__*/React.createElement("h4", null, "What each rating looks like"), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Section"), /*#__PURE__*/React.createElement("th", null, "Not Yet"), /*#__PURE__*/React.createElement("th", null, "Developing"), /*#__PURE__*/React.createElement("th", null, "Secure"), /*#__PURE__*/React.createElement("th", null, "Beyond"))), /*#__PURE__*/React.createElement("tbody", null, WT.SECS.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.k
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, s.n)), w.r[s.k].map((d, i) => /*#__PURE__*/React.createElement("td", {
    key: i
  }, d)), /*#__PURE__*/React.createElement("td", null, s.k === "sw" ? "Through the Challenge: " + w.r.b : "Not possible")))))), /*#__PURE__*/React.createElement("h4", null, "Linking to the lesson"), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Section"), /*#__PURE__*/React.createElement("th", null, "Lesson success criterion"), /*#__PURE__*/React.createElement("th", null, "If a child struggles"))), /*#__PURE__*/React.createElement("tbody", null, WT.SECS.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.k
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, s.n)), /*#__PURE__*/React.createElement("td", null, w.g.crit[s.k]), /*#__PURE__*/React.createElement("td", null, w.g.next[s.k])))))), /*#__PURE__*/React.createElement("div", {
    className: "note",
    style: {
      marginTop: 14
    }
  }, "Judge accuracy, fluency and help separately. Hesitation lowers only the Read It Again rating. Never tell a child a decodable word: What sounds do you see? Blend them.")));
}

/* Compact list of a learner's worksheet records (teacher drawer, parent view). */
function WsRecordList({
  L,
  family
}) {
  const codes = Object.keys(L.worksheets || {}).filter(c => WT.get(c));
  if (!codes.length) return /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "var(--ink-soft)"
    }
  }, "No worksheets yet.");
  return /*#__PURE__*/React.createElement("div", {
    className: "ws-reclist"
  }, codes.map(c => {
    const w = WT.get(c),
      r = L.worksheets[c];
    return /*#__PURE__*/React.createElement("div", {
      key: c,
      className: "ws-recrow"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, w.title), /*#__PURE__*/React.createElement("span", null, "L", w.level, " \xB7 ", /*#__PURE__*/React.createElement(WsStatus, {
      s: r.status
    }))), /*#__PURE__*/React.createElement("div", {
      className: "ws-recchips"
    }, WT.SECS.map(s => /*#__PURE__*/React.createElement("span", {
      key: s.k,
      title: s.n,
      className: "ws-recchip"
    }, family ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("small", null, s.n), /*#__PURE__*/React.createElement("b", null, r.ratings && r.ratings[s.k] ? WT.RATINGS[r.ratings[s.k]] : "—")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("small", null, s.n.split(" ").map(x => x[0]).join("")), /*#__PURE__*/React.createElement(RateChip, {
      r: r.ratings && r.ratings[s.k],
      sm: true
    }))))), family && r.note && !window.HL_LIVE_ON && /*#__PURE__*/React.createElement("p", {
      className: "ws-famnote"
    }, "\u201C", r.note, "\u201D"));
  }));
}
Object.assign(window, {
  TWorksheets,
  WsReview,
  WsGuide,
  RateChip,
  WsRecordList,
  WsStatus
});
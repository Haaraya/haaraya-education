/* ============================================================
   Haaraya — Avatar builder + passport renderer (v1 artwork)
   ------------------------------------------------------------
   Adapted from the shipped package: no bundler here, so this is a
   Babel script that publishes to window instead of exporting, and
   it must load AFTER reg-avatar.jsx so it replaces the old SVG
   PassportAvatar everywhere the site already calls it.

   PassportAvatar keeps the OLD signature — {config, size, shape,
   className, style} — because it is called from a dozen places at
   sizes 30 to 224. Same props, new artwork, no call sites to hunt.
   ============================================================ */
const { useMemo: useMemoAv, useState: useStateAv } = React;
const AV = () => window.HaarayaAvatar;

const AV_TABS = [
  { id: "character", label: "Boy / Girl" },
  { id: "skin", label: "Skin" },
  { id: "hair", label: "Hair" },
  { id: "glasses", label: "Glasses" },
  { id: "clothes", label: "Clothes" },
];

function AvLayer({ png, className }) {
  if (!png) return null;
  return <picture className={className} aria-hidden="true"><img src={png} alt="" draggable="false" /></picture>;
}

/* The four layers, in order: clothes behind, then the body, then
   hair, then glasses on top. */
function AvStack({ value, layerClass }) {
  const a = AV().getAvatarAssets(value);
  return (
    <React.Fragment>
      <AvLayer png={a.clothingPng} className={layerClass} />
      <AvLayer png={a.basePng} className={layerClass} />
      <AvLayer png={a.hairPng} className={layerClass} />
      <AvLayer png={a.glassesPng} className={layerClass} />
    </React.Fragment>
  );
}

function AvMini({ value }) {
  return <span className="hab-mini-stage" aria-hidden="true"><AvStack value={value} layerClass="hab-mini-layer" /></span>;
}

/* ── PASSPORT RENDERER ──────────────────────────────────────
   Replaces the SVG version. The artwork is square; a "passport"
   frame is taller than it is wide, so the stack is anchored to the
   top of the frame — cropping the feet rather than the face. */
function PassportAvatar({ config, size = 140, shape = "passport", className = "", style = {} }) {
  const value = AV().normalizeAvatar(config || {});
  const circle = shape === "circle";
  const h = circle ? size : Math.round(size * 1.2);
  return (
    <span
      className={"pp-avatar pp-avatar--v1 " + (circle ? "is-circle " : "is-passport ") + className}
      style={{ width: size, height: h, ...style }}
      role="img"
      aria-label="Reader's passport picture"
    >
      <span className="pp-avatar-stage"><AvStack value={value} layerClass="pp-avatar-layer" /></span>
    </span>
  );
}

function AvatarBuilder({ value, onChange, name }) {
  const cfg = AV();
  const current = useMemoAv(() => cfg.normalizeAvatar(value || cfg.DEFAULT_AVATAR), [value]);
  const [tab, setTab] = useStateAv("character");

  const commit = (patch) => {
    let next = cfg.normalizeAvatar({ ...current, ...patch, face: "default" });
    // Hair sets differ per character, so switching resets to that set's first style.
    if (patch.character && patch.character !== current.character) {
      next = cfg.normalizeAvatar({ ...next, hair: cfg.HAIR_OPTIONS[next.character][0].id });
    }
    onChange && onChange(next);
  };

  const option = (key, label, selected, visual, fn) => (
    <button key={key} type="button" className={"hab-option" + (selected ? " is-selected" : "")} aria-pressed={selected} onClick={fn}>
      {visual}<span className="hab-option-label">{label}</span>
    </button>
  );

  return (
    <section className="hab" aria-label={name ? `Create ${name}'s avatar` : "Create your avatar"}>
      <div className="hab-preview-card">
        <div className="hab-stage" role="img" aria-label={`${current.character} avatar`}>
          <AvStack value={current} layerClass="hab-layer" />
        </div>
      </div>
      <div className="hab-tabs" role="tablist">
        {AV_TABS.map((t) => (
          <button key={t.id} type="button" className={"hab-tab" + (tab === t.id ? " is-active" : "")}
            role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      <div className="hab-panel" role="tabpanel">
        {tab === "character" && (
          <div className="hab-grid hab-grid-2">
            {["girl", "boy"].map((c) => {
              const v = cfg.normalizeAvatar({ ...current, character: c, hair: cfg.HAIR_OPTIONS[c][0].id });
              return option(c, c === "girl" ? "Girl" : "Boy", current.character === c, <AvMini value={v} />, () => commit({ character: c }));
            })}
          </div>
        )}
        {tab === "skin" && (
          <div className="hab-grid hab-grid-5">
            {cfg.SKIN_OPTIONS.map((o) => option(o.id, o.label, current.skin === o.id, <AvMini value={{ ...current, skin: o.id }} />, () => commit({ skin: o.id })))}
          </div>
        )}
        {tab === "hair" && (
          <div className="hab-grid hab-grid-4">
            {cfg.HAIR_OPTIONS[current.character].map((o) => option(o.id, o.label, current.hair === o.id, <AvMini value={{ ...current, hair: o.id }} />, () => commit({ hair: o.id })))}
          </div>
        )}
        {tab === "glasses" && (
          <div className="hab-grid hab-grid-3">
            {cfg.GLASSES_OPTIONS.map((o) => option(o.id, o.label, current.glasses === o.id, <AvMini value={{ ...current, glasses: o.id }} />, () => commit({ glasses: o.id })))}
          </div>
        )}
        {tab === "clothes" && (
          <div className="hab-grid hab-grid-4">
            {cfg.CLOTHES_OPTIONS.map((o) => option(o.id, o.label, current.clothes === o.id, <span className="hab-swatch" style={{ background: o.swatch }} />, () => commit({ clothes: o.id })))}
          </div>
        )}
      </div>
    </section>
  );
}

// Overrides the SVG builder/renderer loaded earlier by reg-avatar*.jsx.
Object.assign(window, {
  AvatarBuilder,
  PassportAvatar,
  randomAvatar: () => window.HaarayaAvatar.randomAvatar(),
  DEFAULT_AVATAR: window.HaarayaAvatar.DEFAULT_AVATAR,
});

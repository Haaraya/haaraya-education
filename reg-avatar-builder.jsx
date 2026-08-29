/* ============================================================
   Haaraya — Passport Avatar Builder
   Live preview + tap-to-select controls. Lightweight, fast.
   Depends on window.PassportAvatar + AV_* palettes (reg-avatar.jsx).
   ============================================================ */
const { useState: useStateAB } = React;

/* swatch row — color circles */
function AvSwatchRow({ options, value, onChange, colorKey = "v" }) {
  return (
    <div className="av-swatches">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={"av-swatch" + (value === o.id ? " on" : "")}
          style={{ "--sw": o[colorKey] }}
          onClick={() => onChange(o.id)}
          aria-label={o.label}
          title={o.label}
        >
          <span className="dot" />
        </button>
      ))}
    </div>
  );
}

/* chip row — labelled pills */
function AvChipRow({ options, value, onChange }) {
  return (
    <div className="av-chips">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={"av-chip" + (value === o.id ? " on" : "")}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* visual choices — children see the change before selecting it */
function AvPictureRow({ options, value, onChange, config, field }) {
  return (
    <div className="av-picture-grid">
      {options.map((o) => (
        <button key={o.id} type="button"
          className={"av-picture-choice" + (value === o.id ? " on" : "")}
          onClick={() => onChange(o.id)} aria-pressed={value === o.id}>
          <span className="av-choice-portrait">
            <PassportAvatar config={{...config, [field]: o.id}} size={58} shape="circle" />
          </span>
          <span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function AvGroup({ label, children }) {
  return (
    <div className="av-group">
      <div className="av-group-label">{label}</div>
      {children}
    </div>
  );
}

/* dice icon */
const DICE = (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

function AvatarBuilder({ value, onChange, name }) {
  const cfg = { ...DEFAULT_AVATAR, ...(value || {}) };
  const set = (k) => (v) => onChange({ ...cfg, [k]: v });
  const display = (name || "").trim();

  return (
    <div className="av-builder">
      {/* live preview */}
      <div className="av-stage">
        <div className="av-stage-frame">
          <PassportAvatar config={cfg} size={224} />
        </div>
        <div className="av-stage-cap">
          <div className="lbl">My reader avatar</div>
          <div className="nm">{display || "Your reader"}</div>
        </div>
        <button type="button" className="av-surprise" onClick={() => onChange({ ...randomAvatar() })}>
          {DICE} Surprise me
        </button>
      </div>

      {/* controls */}
      <div className="av-controls">
        <AvGroup label="Skin tone">
          <AvSwatchRow options={AV_SKIN} value={cfg.skinTone} onChange={set("skinTone")} colorKey="base" />
        </AvGroup>

        <AvGroup label="Face shape">
          <AvPictureRow options={AV_FACE} value={cfg.faceShape} onChange={set("faceShape")} config={cfg} field="faceShape" />
        </AvGroup>

        <AvGroup label="Hairstyle">
          <AvPictureRow options={AV_HAIR_STYLE} value={cfg.hairStyle} onChange={set("hairStyle")} config={cfg} field="hairStyle" />
        </AvGroup>

        {cfg.hairStyle !== "headwrap" && (
          <AvGroup label="Hair colour">
            <AvSwatchRow options={AV_HAIR_COLOR} value={cfg.hairColor} onChange={set("hairColor")} />
          </AvGroup>
        )}

        <AvGroup label="Eyes">
          <AvPictureRow options={AV_EYES} value={cfg.eyeStyle} onChange={set("eyeStyle")} config={cfg} field="eyeStyle" />
        </AvGroup>

        <AvGroup label="Expression">
          <AvChipRow options={AV_EXPR} value={cfg.expression} onChange={set("expression")} />
        </AvGroup>

        <AvGroup label="Outfit">
          <AvPictureRow options={AV_OUTFIT_STYLE} value={cfg.outfitStyle} onChange={set("outfitStyle")} config={cfg} field="outfitStyle" />
        </AvGroup>

        <AvGroup label="Outfit colour">
          <AvSwatchRow options={AV_OUTFIT_COLOR} value={cfg.outfitColor} onChange={set("outfitColor")} />
        </AvGroup>

        <AvGroup label="Accessory">
          <AvPictureRow options={AV_ACCESSORY} value={cfg.accessory} onChange={set("accessory")} config={cfg} field="accessory" />
        </AvGroup>

        <AvGroup label="Passport frame">
          <AvSwatchRow options={AV_BG} value={cfg.background} onChange={set("background")} colorKey="ring" />
        </AvGroup>
      </div>
    </div>
  );
}

Object.assign(window, { AvatarBuilder });

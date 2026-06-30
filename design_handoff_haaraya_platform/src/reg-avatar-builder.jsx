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
          <PassportAvatar config={cfg} size={208} />
        </div>
        <div className="av-stage-cap">
          <div className="lbl">Passport picture</div>
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

        <AvGroup label="Hairstyle">
          <AvChipRow options={AV_HAIR_STYLE} value={cfg.hairStyle} onChange={set("hairStyle")} />
        </AvGroup>

        {cfg.hairStyle !== "headwrap" && (
          <AvGroup label="Hair colour">
            <AvSwatchRow options={AV_HAIR_COLOR} value={cfg.hairColor} onChange={set("hairColor")} />
          </AvGroup>
        )}

        <AvGroup label="Eyes">
          <AvChipRow options={AV_EYES} value={cfg.eyeStyle} onChange={set("eyeStyle")} />
        </AvGroup>

        <AvGroup label="Glasses">
          <div className="av-seg">
            <button type="button" className={!cfg.glasses ? "on" : ""} onClick={() => set("glasses")(false)}>No</button>
            <button type="button" className={cfg.glasses ? "on" : ""} onClick={() => set("glasses")(true)}>Yes</button>
          </div>
        </AvGroup>

        <AvGroup label="Expression">
          <AvChipRow options={AV_EXPR} value={cfg.expression} onChange={set("expression")} />
        </AvGroup>

        <AvGroup label="Outfit">
          <AvChipRow options={AV_OUTFIT_STYLE} value={cfg.outfitStyle} onChange={set("outfitStyle")} />
        </AvGroup>

        <AvGroup label="Outfit colour">
          <AvSwatchRow options={AV_OUTFIT_COLOR} value={cfg.outfitColor} onChange={set("outfitColor")} />
        </AvGroup>

        <AvGroup label="Accessory">
          <AvChipRow options={AV_ACCESSORY} value={cfg.accessory} onChange={set("accessory")} />
        </AvGroup>

        <AvGroup label="Passport frame">
          <AvSwatchRow options={AV_BG} value={cfg.background} onChange={set("background")} colorKey="ring" />
        </AvGroup>
      </div>
    </div>
  );
}

Object.assign(window, { AvatarBuilder });

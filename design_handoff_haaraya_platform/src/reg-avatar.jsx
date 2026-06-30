/* ============================================================
   Haaraya — Passport Avatar
   Lightweight, config-driven illustrated portrait (SVG).
   No photo upload. Renders consistently from a small config.
   Exported to window for flows + app.
   ============================================================ */
const { useState: useStateAv, useId: useIdAv } = React;

/* ---------- Option palettes (limited but expressive) ---------- */
const AV_SKIN = [
  { id: "deep",    label: "Deep",    base: "#5B3620", shade: "#4A2A17" },
  { id: "umber",   label: "Umber",   base: "#774326", shade: "#62361D" },
  { id: "sienna",  label: "Sienna",  base: "#965A33", shade: "#7C4828" },
  { id: "caramel", label: "Caramel", base: "#B27943", shade: "#956335" },
  { id: "honey",   label: "Honey",   base: "#CF9A63", shade: "#B27F4D" },
  { id: "almond",  label: "Almond",  base: "#E0B488", shade: "#C79B6F" },
];

const AV_HAIR_STYLE = [
  { id: "afro",     label: "Afro" },
  { id: "fade",     label: "Short fade" },
  { id: "cornrows", label: "Cornrows" },
  { id: "braids",   label: "Braids" },
  { id: "twists",   label: "Twist-out" },
  { id: "puffs",    label: "Puffs" },
  { id: "locs",     label: "Locs" },
  { id: "headwrap", label: "Headwrap" },
];

const AV_HAIR_COLOR = [
  { id: "black",    label: "Black",    v: "#1C1A19" },
  { id: "espresso", label: "Espresso", v: "#3A271B" },
  { id: "chestnut", label: "Chestnut", v: "#5B3A22" },
  { id: "auburn",   label: "Auburn",   v: "#7A3A1E" },
  { id: "honeyhair",label: "Honey",    v: "#9A6B38" },
];

const AV_EYES = [
  { id: "round",  label: "Round" },
  { id: "happy",  label: "Happy" },
  { id: "wide",   label: "Bright" },
  { id: "calm",   label: "Calm" },
];

const AV_EXPR = [
  { id: "smile",   label: "Smile" },
  { id: "grin",    label: "Big grin" },
  { id: "calm",    label: "Gentle" },
  { id: "neutral", label: "Steady" },
];

const AV_OUTFIT_STYLE = [
  { id: "round",       label: "Round neck" },
  { id: "collar",      label: "Collar" },
  { id: "vneck",       label: "V-neck" },
  { id: "traditional", label: "Traditional" },
];

const AV_OUTFIT_COLOR = [
  { id: "forest",     label: "Forest",     v: "#1F7A3D" },
  { id: "gold",       label: "Gold",       v: "#E0A91E" },
  { id: "terracotta", label: "Terracotta", v: "#C75B39" },
  { id: "sky",        label: "Sky",        v: "#2D6CB5" },
  { id: "violet",     label: "Violet",     v: "#7A4DA6" },
  { id: "teal",       label: "Teal",       v: "#1E8C8C" },
];

const AV_BG = [
  { id: "green",  label: "Green",  fill: "#DCEFD8", ring: "#3E9A52" },
  { id: "gold",   label: "Gold",   fill: "#F6E7B8", ring: "#D6A21E" },
  { id: "sky",    label: "Sky",    fill: "#D7E8F6", ring: "#3E86C0" },
  { id: "rose",   label: "Rose",   fill: "#F6DDD9", ring: "#CE6B5A" },
  { id: "sand",   label: "Sand",   fill: "#EFE6D2", ring: "#C2A56B" },
  { id: "violet", label: "Violet", fill: "#E7DAF2", ring: "#8C66BE" },
];

const AV_ACCESSORY = [
  { id: "none",     label: "None" },
  { id: "earrings", label: "Earrings" },
  { id: "bow",      label: "Bow" },
  { id: "flower",   label: "Flower" },
];

const DEFAULT_AVATAR = {
  stylePack: "haaraya-v1",
  skinTone: "sienna",
  hairStyle: "afro",
  hairColor: "black",
  eyeStyle: "round",
  glasses: false,
  expression: "smile",
  outfitStyle: "round",
  outfitColor: "forest",
  accessory: "none",
  background: "green",
};

const _pick = (arr) => arr[Math.floor(Math.random() * arr.length)].id;
function randomAvatar() {
  return {
    stylePack: "haaraya-v1",
    skinTone: _pick(AV_SKIN),
    hairStyle: _pick(AV_HAIR_STYLE),
    hairColor: _pick(AV_HAIR_COLOR),
    eyeStyle: _pick(AV_EYES),
    glasses: Math.random() < 0.22,
    expression: _pick(AV_EXPR),
    outfitStyle: _pick(AV_OUTFIT_STYLE),
    outfitColor: _pick(AV_OUTFIT_COLOR),
    accessory: Math.random() < 0.55 ? "none" : _pick(AV_ACCESSORY.slice(1)),
    background: _pick(AV_BG),
  };
}

/* ============================================================
   Renderer
   viewBox 0 0 100 120 — passport-portrait proportion.
   Layered: bg → back-hair → shoulders → neck → head → ears
            → front-hair → brows → eyes → glasses → nose
            → mouth → accessory.
   ============================================================ */
const HAIR_CAP = "M26,49 C26,29 38,22 50,22 C62,22 74,29 74,49 C66,39 59,36 50,36 C41,36 33,39 26,49 Z";

function _hairBack(style, color) {
  switch (style) {
    case "afro":
      return <ellipse cx="50" cy="40" rx="34" ry="32" fill={color} />;
    case "twists":
      return <ellipse cx="50" cy="41" rx="31" ry="29" fill={color} />;
    case "puffs":
      return (
        <g fill={color}>
          <circle cx="29" cy="27" r="13" />
          <circle cx="71" cy="27" r="13" />
        </g>
      );
    case "braids":
      return (
        <g fill={color}>
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={"l" + i} cx={22} cy={50 + i * 9} rx="4.4" ry="5.2" />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <ellipse key={"r" + i} cx={78} cy={50 + i * 9} rx="4.4" ry="5.2" />
          ))}
        </g>
      );
    case "locs":
      return (
        <g fill={color}>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={"ll" + i} x={18 + (i % 2) * 3} y={46 + i * 7} width="5.5" height="9" rx="2.7" />
          ))}
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={"lr" + i} x={76 - (i % 2) * 3} y={46 + i * 7} width="5.5" height="9" rx="2.7" />
          ))}
        </g>
      );
    default:
      return null;
  }
}

function _hairFront(style, color) {
  const dark = "rgba(0,0,0,.22)";
  switch (style) {
    case "headwrap":
      return null; // drawn separately on top of the head
    case "fade":
      return (
        <path
          d="M27,47 C27,30 38,23 50,23 C62,23 73,30 73,47 C66,40 59,38 50,38 C41,38 34,40 27,47 Z"
          fill={color}
        />
      );
    case "cornrows":
      return (
        <g>
          <path d={HAIR_CAP} fill={color} />
          <g stroke={dark} strokeWidth="1.4" strokeLinecap="round">
            {[-15, -7.5, 0, 7.5, 15].map((dx, i) => (
              <path key={i} d={`M${50 + dx * 0.9},37 C${50 + dx},33 ${50 + dx},28 ${50 + dx * 1.05},24`} fill="none" />
            ))}
          </g>
        </g>
      );
    case "twists":
      return (
        <g>
          <path d={HAIR_CAP} fill={color} />
          <g fill="rgba(0,0,0,.18)">
            {[30, 38, 46, 54, 62, 70].map((x, i) => (
              <circle key={i} cx={x} cy={i % 2 ? 27 : 31} r="3.1" />
            ))}
          </g>
        </g>
      );
    case "puffs":
    case "afro":
    case "braids":
    case "locs":
    case "round":
    default:
      return <path d={HAIR_CAP} fill={color} />;
  }
}

function _headwrap(fabric) {
  return (
    <g>
      <path
        d="M24,47 C24,25 37,16 50,16 C63,16 76,25 76,47 C68,39 60,37 50,37 C40,37 32,39 24,47 Z"
        fill={fabric}
      />
      <path d="M26,42 C36,37 64,37 74,42" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2" strokeLinecap="round" />
      <path d="M27,33 C38,27 62,27 73,33" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth="2.2" strokeLinecap="round" />
      {/* side knot */}
      <g transform="rotate(18 72 30)">
        <ellipse cx="72" cy="30" rx="7" ry="9" fill={fabric} />
        <ellipse cx="72" cy="30" rx="7" ry="9" fill="none" stroke="rgba(0,0,0,.14)" strokeWidth="1.4" />
      </g>
    </g>
  );
}

function _eye(cx, style) {
  const dark = "#2A2420";
  switch (style) {
    case "happy":
      return <path d={`M${cx - 4},53 Q${cx},48.5 ${cx + 4},53`} fill="none" stroke={dark} strokeWidth="2.1" strokeLinecap="round" />;
    case "calm":
      return (
        <g>
          <path d={`M${cx - 4},52 Q${cx},54.5 ${cx + 4},52`} fill="none" stroke={dark} strokeWidth="2.1" strokeLinecap="round" />
        </g>
      );
    case "wide":
      return (
        <g>
          <ellipse cx={cx} cy="52.5" rx="3.5" ry="4.2" fill="#fff" stroke={dark} strokeWidth="1.1" />
          <circle cx={cx} cy="53" r="2.4" fill={dark} />
          <circle cx={cx + 1} cy="51.6" r="0.9" fill="#fff" />
        </g>
      );
    case "round":
    default:
      return (
        <g>
          <circle cx={cx} cy="52.5" r="3" fill={dark} />
          <circle cx={cx + 1} cy="51.4" r="0.85" fill="#fff" />
        </g>
      );
  }
}

function _mouth(expr) {
  const lip = "#8A3B2E";
  switch (expr) {
    case "grin":
      return (
        <g>
          <path d="M42,64 Q50,73 58,64 Z" fill={lip} />
          <path d="M44.5,65 Q50,67.5 55.5,65 Z" fill="#fff" />
        </g>
      );
    case "calm":
      return <path d="M44,66 Q50,69 56,66" fill="none" stroke={lip} strokeWidth="2.1" strokeLinecap="round" />;
    case "neutral":
      return <path d="M45,66.5 L55,66.5" fill="none" stroke={lip} strokeWidth="2.1" strokeLinecap="round" />;
    case "smile":
    default:
      return <path d="M43.5,65 Q50,71.5 56.5,65" fill="none" stroke={lip} strokeWidth="2.2" strokeLinecap="round" />;
  }
}

function _neckline(style, outfit, skin) {
  const dk = "rgba(0,0,0,.16)";
  switch (style) {
    case "vneck":
      return (
        <g>
          <path d="M42,87 L50,96 L58,87 Z" fill={skin.base} />
          <path d="M41,86 L50,97 L59,86" fill="none" stroke={dk} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "collar":
      return (
        <g>
          <path d="M41,87 L48,92 L41,96 Z" fill={outfit} stroke={dk} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M59,87 L52,92 L59,96 Z" fill={outfit} stroke={dk} strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M50,90 L50,99" stroke={dk} strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case "traditional":
      return (
        <g>
          <path d="M39,86 Q50,91 61,86 L61,90.5 Q50,95.5 39,90.5 Z" fill="#E0AF00" />
          <path d="M39,86 Q50,91 61,86" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.2" />
          <g fill="rgba(0,0,0,.18)">
            <circle cx="44" cy="89" r="0.9" />
            <circle cx="50" cy="90.2" r="0.9" />
            <circle cx="56" cy="89" r="0.9" />
          </g>
        </g>
      );
    case "round":
    default:
      return <path d="M40,87 Q50,94.5 60,87" fill="none" stroke={dk} strokeWidth="2" strokeLinecap="round" />;
  }
}

function _accessory(kind) {
  switch (kind) {
    case "earrings":
      return (
        <g fill="#E6B43C" stroke="rgba(0,0,0,.18)" strokeWidth="0.6">
          <circle cx="26.5" cy="60" r="2.3" />
          <circle cx="73.5" cy="60" r="2.3" />
        </g>
      );
    case "bow":
      return (
        <g transform="translate(31 25) rotate(-12)">
          <path d="M0,0 L-7,-5 L-7,5 Z" fill="#E8638A" />
          <path d="M0,0 L7,-5 L7,5 Z" fill="#E8638A" />
          <circle cx="0" cy="0" r="2.4" fill="#C9456E" />
        </g>
      );
    case "flower":
      return (
        <g transform="translate(31 28)">
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={4 * Math.cos((a * Math.PI) / 180)} cy={4 * Math.sin((a * Math.PI) / 180)} r="2.6" fill="#F2A8BF" />
          ))}
          <circle cx="0" cy="0" r="2.3" fill="#E0AF00" />
        </g>
      );
    default:
      return null;
  }
}

function PassportAvatar({ config, size = 140, shape = "passport", className = "", style = {} }) {
  const c = { ...DEFAULT_AVATAR, ...(config || {}) };
  const skin = AV_SKIN.find((s) => s.id === c.skinTone) || AV_SKIN[2];
  const hair = (AV_HAIR_COLOR.find((h) => h.id === c.hairColor) || AV_HAIR_COLOR[0]).v;
  const outfit = (AV_OUTFIT_COLOR.find((o) => o.id === c.outfitColor) || AV_OUTFIT_COLOR[0]).v;
  const bg = AV_BG.find((b) => b.id === c.background) || AV_BG[0];
  const isWrap = c.hairStyle === "headwrap";
  const wrapFabric = outfit;
  const uid = useIdAv().replace(/:/g, "");
  const clip = "avclip-" + uid;
  const circle = shape === "circle";
  const vb = circle ? "4 6 92 92" : "0 0 100 120";
  const w = size;
  const h = circle ? size : Math.round((size * 120) / 100);

  return (
    <svg viewBox={vb} width={w} height={h} className={"pp-avatar " + className} style={style} role="img" aria-label="Passport avatar">
      <defs>
        <clipPath id={clip}>
          {circle ? <circle cx="50" cy="52" r="46" /> : <rect x="0" y="0" width="100" height="120" rx="13" />}
        </clipPath>
      </defs>

      <g clipPath={`url(#${clip})`}>
        {/* background */}
        <rect x="0" y="0" width="100" height="120" fill={bg.fill} />
        <circle cx="50" cy="44" r="40" fill="#fff" opacity="0.32" />

        {/* back hair */}
        {!isWrap && _hairBack(c.hairStyle, hair)}

        {/* shoulders / outfit */}
        <path d="M11,120 V107 C11,93.5 27,87 50,87 C73,87 89,93.5 89,107 V120 Z" fill={outfit} />
        <path d="M11,120 V107 C11,99 18,94 26,91 C20,96 18,102 18,109 V120 Z" fill="rgba(0,0,0,.12)" />
        <path d="M50,87 C61,87 71,88.5 78,92 C71,90 60,89.5 50,89.5 Z" fill="rgba(255,255,255,.16)" />

        {/* neck */}
        <path d="M43,76 h14 v9 q-7,4.5 -14,0 Z" fill={skin.shade} />

        {/* head */}
        <ellipse cx="50" cy="52" rx="23" ry="26" fill={skin.base} />
        {/* ears */}
        <circle cx="27" cy="55" r="4.4" fill={skin.base} />
        <circle cx="73" cy="55" r="4.4" fill={skin.base} />
        <circle cx="27.5" cy="55.5" r="2" fill={skin.shade} />
        <circle cx="72.5" cy="55.5" r="2" fill={skin.shade} />

        {/* cheeks */}
        <ellipse cx="35" cy="61" rx="4.2" ry="2.8" fill="#D9694E" opacity="0.28" />
        <ellipse cx="65" cy="61" rx="4.2" ry="2.8" fill="#D9694E" opacity="0.28" />

        {/* front hair / headwrap */}
        {isWrap ? _headwrap(wrapFabric) : _hairFront(c.hairStyle, hair)}

        {/* brows */}
        <path d="M35,46 Q39.5,43.6 44,46" fill="none" stroke={isWrap ? "#3A271B" : hair} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M56,46 Q60.5,43.6 65,46" fill="none" stroke={isWrap ? "#3A271B" : hair} strokeWidth="1.8" strokeLinecap="round" />

        {/* eyes */}
        {_eye(39.5, c.eyeStyle)}
        {_eye(60.5, c.eyeStyle)}

        {/* glasses */}
        {c.glasses && (
          <g stroke="#2E2A26" strokeWidth="1.8" fill="rgba(255,255,255,.16)">
            <rect x="32.5" y="48" width="13" height="9" rx="4.5" />
            <rect x="54.5" y="48" width="13" height="9" rx="4.5" />
            <path d="M45.5,52 L54.5,52" fill="none" />
            <path d="M32.5,51 L28,49.5" fill="none" />
            <path d="M67.5,51 L72,49.5" fill="none" />
          </g>
        )}

        {/* nose */}
        <path d="M50,55 Q47.6,60 50.6,60.4" fill="none" stroke={skin.shade} strokeWidth="1.6" strokeLinecap="round" />

        {/* mouth */}
        {_mouth(c.expression)}

        {/* accessory */}
        {_accessory(c.accessory)}
      </g>

      {/* passport frame ring */}
      {!circle && (
        <g fill="none">
          <rect x="0.8" y="0.8" width="98.4" height="118.4" rx="12.5" stroke={bg.ring} strokeWidth="1.6" opacity="0.55" />
          <rect x="4.5" y="4.5" width="91" height="111" rx="9" stroke={bg.ring} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
        </g>
      )}
      {circle && <circle cx="50" cy="52" r="45" fill="none" stroke={bg.ring} strokeWidth="2" opacity="0.5" />}
    </svg>
  );
}

Object.assign(window, {
  PassportAvatar, DEFAULT_AVATAR, randomAvatar,
  AV_SKIN, AV_HAIR_STYLE, AV_HAIR_COLOR, AV_EYES, AV_EXPR,
  AV_OUTFIT_STYLE, AV_OUTFIT_COLOR, AV_BG, AV_ACCESSORY,
});

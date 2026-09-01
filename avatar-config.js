/* ============================================================
   Haaraya — Avatar config (v1 layered artwork)
   ------------------------------------------------------------
   Adapted from the shipped package for this site: no bundler, so
   ES import/export becomes a window global, and AVATAR_ASSET_ROOT
   is RELATIVE. The package's "/avatar-builder" would resolve to
   the domain root and 404 under /haaraya-education/.

   Exposes window.HaarayaAvatar.
   ============================================================ */
(function () {
  "use strict";

  var AVATAR_ASSET_ROOT = "assets/avatar-builder";

  var SKIN_OPTIONS = [
    { id: "very-light", label: "Very Light" }, { id: "light", label: "Light" },
    { id: "warm", label: "Warm" }, { id: "brown", label: "Brown" }, { id: "deep", label: "Deep" }
  ];
  var CLOTHES_OPTIONS = [
    { id: "teal", label: "Teal", swatch: "#20D3D0" },
    { id: "sunshine", label: "Sunshine", swatch: "#F4C542" },
    { id: "coral", label: "Coral", swatch: "#F47D6B" },
    { id: "indigo", label: "Indigo", swatch: "#5968C9" }
  ];
  var HAIR_OPTIONS = {
    girl: [{ id: "bun", label: "Bun" }, { id: "braids", label: "Plaited" }, { id: "hijab", label: "Hijab" }, { id: "short", label: "Short Natural" }],
    boy: [{ id: "ultra-short", label: "Ultra Short" }, { id: "short", label: "Short Natural" }, { id: "low-fade", label: "Low Fade" }, { id: "afro", label: "Rounded Afro" }]
  };
  var GLASSES_OPTIONS = [
    { id: "none", label: "None" },
    { id: "round", label: "Round" },
    { id: "rectangle", label: "Rectangle" }
  ];

  var DEFAULT_AVATAR = Object.freeze({
    character: "girl", skin: "warm", hair: "bun", glasses: "none", face: "default", clothes: "teal"
  });

  function valid(xs, id) { for (var i = 0; i < xs.length; i++) if (xs[i].id === id) return true; return false; }

  function normalizeAvatar(value) {
    var v = migrateAvatar(value || {});
    var character = v.character === "boy" ? "boy" : "girl";
    var skin = valid(SKIN_OPTIONS, v.skin) ? v.skin : "warm";
    var clothes = valid(CLOTHES_OPTIONS, v.clothes) ? v.clothes : "teal";
    var hairs = HAIR_OPTIONS[character];
    var hair = valid(hairs, v.hair) ? v.hair : hairs[0].id;
    var glasses = valid(GLASSES_OPTIONS, v.glasses) ? v.glasses : "none";
    return { character: character, skin: skin, hair: hair, glasses: glasses, face: "default", clothes: clothes };
  }

  /* ── LEGACY MIGRATION ──────────────────────────────────────
     Avatars saved before this build use a different vocabulary
     entirely (skinTone/hairStyle/hairColor/outfitColor/accessory
     + face, eyes, expression). Without a translation every
     existing child would render as the default warm/braids/teal
     girl, so we map what has an equivalent and accept the loss of
     what doesn't: hair colour, face shape, eye style and
     expression simply do not exist in the new artwork.

     Character is the honest gap — the old builder never asked, so
     there is nothing to read. Everyone lands on "girl" unless the
     old choice implies otherwise (a headwrap or puff buns).
     Parents can change it in one tap; guessing from a name would
     be worse.
     ──────────────────────────────────────────────────────── */
  var SKIN_MAP = {
    ebony: "deep", deep: "deep", umber: "brown", sienna: "brown",
    caramel: "warm", honey: "light", almond: "very-light"
  };
  /* The girl set has no afro layer (the export never lined up), so old
     afro-family choices land on the closest thing that exists: loose
     natural hair for an afro, the bun for gathered styles. */
  var HAIR_MAP_GIRL = {
    afro: "short", puffs: "bun", bantu: "bun",
    cornrows: "braids", braids: "braids", twists: "braids", locs: "braids",
    fade: "short", headwrap: "hijab"
  };
  var HAIR_MAP_BOY = {
    afro: "afro", puffs: "afro", bantu: "afro",
    fade: "low-fade", cornrows: "ultra-short", locs: "short",
    braids: "short", twists: "short", headwrap: "ultra-short"
  };
  var CLOTHES_MAP = {
    forest: "teal", teal: "teal", sun: "sunshine", coral: "coral",
    pink: "coral", sky: "indigo", violet: "indigo"
  };
  var GLASSES_MAP = { roundglasses: "round", squareglasses: "rectangle" };
  // Only these two old styles are gendered enough to infer from.
  var IMPLIES_GIRL = { headwrap: true, puffs: true };

  function isLegacy(v) {
    return !!v && (v.skinTone || v.hairStyle || v.outfitColor || v.stylePack) && !v.skin;
  }

  function migrateAvatar(v) {
    if (!isLegacy(v)) return v;
    var character = v.character === "boy" ? "boy" : (IMPLIES_GIRL[v.hairStyle] ? "girl" : "girl");
    var hairMap = character === "boy" ? HAIR_MAP_BOY : HAIR_MAP_GIRL;
    var glasses = GLASSES_MAP[v.accessory] || (v.glasses === true ? "round" : "none");
    return {
      character: character,
      skin: SKIN_MAP[v.skinTone] || "warm",
      hair: hairMap[v.hairStyle] || (character === "boy" ? "short" : "bun"),
      glasses: glasses,
      face: "default",
      clothes: CLOTHES_MAP[v.outfitColor] || "teal"
    };
  }

  function getAvatarAssets(value) {
    var v = normalizeAvatar(value), g = v.character === "boy" ? "boys" : "girls";
    return {
      clothingPng: AVATAR_ASSET_ROOT + "/clothes/" + v.clothes + ".webp",
      basePng: AVATAR_ASSET_ROOT + "/" + g + "/skin/" + v.skin + ".webp",
      hairPng: AVATAR_ASSET_ROOT + "/" + g + "/hair/" + v.hair + ".webp",
      glassesPng: v.glasses === "none" ? null : AVATAR_ASSET_ROOT + "/shared/glasses/" + v.glasses + ".webp"
    };
  }

  function pick(xs) { return xs[Math.floor(Math.random() * xs.length)].id; }
  function randomAvatar() {
    var character = Math.random() < 0.5 ? "girl" : "boy";
    return normalizeAvatar({
      character: character,
      skin: pick(SKIN_OPTIONS),
      hair: pick(HAIR_OPTIONS[character]),
      // Most children don't wear glasses; keep them the exception.
      glasses: Math.random() < 0.22 ? pick(GLASSES_OPTIONS.slice(1)) : "none",
      clothes: pick(CLOTHES_OPTIONS)
    });
  }

  window.HaarayaAvatar = {
    ASSET_ROOT: AVATAR_ASSET_ROOT,
    SKIN_OPTIONS: SKIN_OPTIONS,
    CLOTHES_OPTIONS: CLOTHES_OPTIONS,
    HAIR_OPTIONS: HAIR_OPTIONS,
    GLASSES_OPTIONS: GLASSES_OPTIONS,
    DEFAULT_AVATAR: DEFAULT_AVATAR,
    normalizeAvatar: normalizeAvatar,
    migrateAvatar: migrateAvatar,
    isLegacy: isLegacy,
    getAvatarAssets: getAvatarAssets,
    randomAvatar: randomAvatar
  };
})();

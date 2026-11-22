/* Gemmanti — which line drawing goes with each worksheet picture.
   Keys are the picture labels used in worksheets-a.js; values are image IDs from
   HAARAYA_WORKSHEET_LINEART_SHOWCASE_v1.csv (file names are never changed).
   Screen copies live in Supabase: book-assets/worksheets/<book code>/<image ID>.webp
   A label with no entry keeps the striped placeholder. */
window.HLWS_PICS = {
  "S-01-06": {
    "pan": "WS-S-01-06-01", "Nana": "WS-S-01-06-02", "tin": "WS-S-01-06-03", "sun": "WS-S-01-06-04",
    "nose": "WS-S-01-06-05", "van": "WS-S-01-06-06", "nap": "WS-S-01-06-07", "pin": "WS-S-01-06-08",
    "cup": "WS-S-01-06-09", "spoon": "WS-S-01-06-10", "pan on the cooker": "WS-S-01-06-11"
  },
  "H-02-02": {
    "Gani and the sack": "WS-H-02-02-01", "door": "WS-H-02-02-02", "goat on a rope": "WS-H-02-02-03",
    "ball": "WS-H-02-02-04", "up the step": "WS-H-02-02-05", "into a car": "WS-H-02-02-06",
    "down a hole": "WS-H-02-02-07", "sack at the bottom of the step": "WS-H-02-02-08",
    "cup on a table": "WS-H-02-02-11", "rope": "WS-H-02-02-12",
    "Gani alone, stuck": "BOOK-H-02-02_P4", "Gani and Isa, sack inside": "BOOK-H-02-02_P12"
  },
  "TF-03-02": {
    "peppers": "WS-TF-03-02-01", "pepper": "WS-TF-03-02-02", "banana": "WS-TF-03-02-03",
    "bananas": "WS-TF-03-02-04", "keys": "WS-TF-03-02-05", "key": "WS-TF-03-02-06",
    "fish": "WS-TF-03-02-07", "milk": "WS-TF-03-02-08", "yam": "WS-TF-03-02-09",
    "okra": "WS-TF-03-02-10", "melon": "WS-TF-03-02-11", "lemons": "WS-TF-03-02-12",
    "puzzled face": "WS-TF-03-02-13", "sleepy face": "WS-TF-03-02-14", "laughing face": "WS-TF-03-02-15"
  },
  "TP-04-01": {
    "cat on a wet wall": "WS-TP-04-01-03", "cat in a box": "WS-TP-04-01-04", "baby in a wrap": "WS-TP-04-01-05",
    "baby with no blanket": "WS-TP-04-01-06", "race": "WS-TP-04-01-07", "sleep": "WS-TP-04-01-08",
    "swim": "WS-TP-04-01-09", "go to bed": "WS-TP-04-01-10", "race out again": "WS-TP-04-01-11",
    "hide inside": "WS-TP-04-01-12",
    "kids inside": "BOOK-TP-04-01_P7", "kids hide inside": "BOOK-TP-04-01_P7",
    "kids in the rain": "BOOK-TP-04-01_P5", "dark sky, rain": "BOOK-TP-04-01_P5",
    "sun up": "BOOK-TP-04-01_P1", "sun back": "BOOK-TP-04-01_P8"
  },
  "TFT-05-01": {
    "vine and stick": "WS-TFT-05-01-01", "ball under a bed": "WS-TFT-05-01-02", "mango up high": "WS-TFT-05-01-03",
    "bucket in a well": "WS-TFT-05-01-04", "rope": "WS-TFT-05-01-05", "broom": "WS-TFT-05-01-06",
    "long pole": "WS-TFT-05-01-07", "treat in a tree": "BOOK-TFT-05-01_P2", "Goat": "WS-TFT-05-01-11", "Tortoise": "WS-TFT-05-01-12", "Dog": "WS-TFT-05-01-13",
    "sleepy": "WS-TFT-05-01-14", "bored": "WS-TFT-05-01-15", "surprised": "WS-TFT-05-01-16"
  },
  "TD-06-01": {
    "the demons": "WS-TD-06-01-01", "one boy keeps the ball": "WS-TD-06-01-02", "a team lifts a cup": "WS-TD-06-01-03",
    "neighbours fix a roof": "WS-TD-06-01-04", "a man sits alone": "WS-TD-06-01-05", "the four friends": "BOOK-TD-06-01_P13"
  }
};

/* Small drawings shown beside a whole question (worksheet icons from the same line-art sheet). */
window.HLWS_ART = {
  "SN-07-01": { "sw0": "WS-SN-07-01-01" },
  "SP-08-01": { "sw0": "WS-SP-08-01-01", "ch": "WS-SP-08-01-02" },
  "SF-09-01": { "sw0": "WS-SF-09-01-01" },
  "TN-10-02": { "sw0": "WS-TN-10-02-01" }
};

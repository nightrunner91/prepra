const RU_VOWEL = /[аеиоуыэюя]/;

function findRVStart(word: string): number {
  for (let i = 0; i < word.length; i++) {
    if (RU_VOWEL.test(word[i])) return i + 1;
  }
  return -1;
}

function regionStart(word: string, from: number): number {
  let i = from;
  while (i < word.length && !RU_VOWEL.test(word[i])) i++;
  i++;
  while (i < word.length && RU_VOWEL.test(word[i])) i++;
  return i;
}

const RU_PERFECTIVE = [
  "ившись", "ивши", "ывшись", "ывши", "ив", "ыв",
];
const RU_PERFECTIVE_AND = ["вшись", "вши", "в"];
const RU_REFLEXIVE = ["ся", "сь"];
const RU_ADJECTIVE = [
  "ими", "ыми", "его", "ого", "ему", "ому", "их", "ых", "ую", "юю",
  "ая", "яя", "ою", "ею", "ее", "ие", "ые", "ое", "ей", "ий", "ый", "ой",
  "ем", "им", "ым", "ом",
];
const RU_PARTICIPLE = ["ивш", "ывш", "ующ"];
const RU_PARTICIPLE_AND = ["ем", "нн", "вш", "ющ", "щ"];
const RU_VERB = [
  "ившись", "ывшись", "ейте", "уйте", "ила", "ыла", "ена", "ите", "или",
  "ыли", "ило", "ыло", "ено", "ишь", "ует", "уют", "ены", "ить", "ыть",
  "ей", "уй", "ил", "ыл", "им", "ым", "ен", "ят", "ит", "ыт", "ую", "ю",
];
const RU_VERB_AND = [
  "ейте", "йте", "нно", "ете", "ла", "на", "ли", "ло", "но", "ет", "ют",
  "ны", "ть", "ешь", "й", "л", "н",
];
const RU_NOUN = [
  "иями", "ями", "ами", "ией", "иям", "ям", "ием", "иях", "ях", "ию",
  "ью", "ия", "ья", "ев", "ов", "ие", "ье", "еи", "ии", "ей", "ой",
  "ий", "ием", "ем", "ам", "ом", "ах", "ию", "ью", "ю", "а", "е", "и",
  "й", "о", "у", "ы", "ь", "я",
];

function hasEnding(word: string, endings: string[], rvStart: number): string | null {
  for (const e of endings) {
    if (word.endsWith(e) && word.length - e.length >= rvStart) {
      return e;
    }
  }
  return null;
}

function hasEndingAfter(word: string, endings: string[], rvStart: number): string | null {
  for (const e of endings) {
    if (word.endsWith(e)) {
      const pos = word.length - e.length;
      if (pos >= rvStart && pos - 1 >= 0 && RU_VOWEL.test(word[pos - 1])) {
        return e;
      }
    }
  }
  return null;
}

export function stemRu(word: string): string {
  if (word.length <= 2) return word;

  const rvStart = findRVStart(word);
  if (rvStart < 0) return word;
  const r2Start = regionStart(word, regionStart(word, 0));

  let w = word;

  const perfective = hasEnding(w, RU_PERFECTIVE, rvStart) ?? hasEndingAfter(w, RU_PERFECTIVE_AND, rvStart);
  if (perfective) w = w.slice(0, -perfective.length);

  const reflexive = hasEnding(w, RU_REFLEXIVE, rvStart);
  if (reflexive) w = w.slice(0, -reflexive.length);

  const adjective = hasEnding(w, RU_ADJECTIVE, rvStart);
  if (adjective) {
    w = w.slice(0, -adjective.length);
    const participle = hasEnding(w, RU_PARTICIPLE, rvStart) ?? hasEndingAfter(w, RU_PARTICIPLE_AND, rvStart);
    if (participle) {
      w = w.slice(0, -participle.length);
      if (w.endsWith("и")) w = w.slice(0, -1);
    }
  }

  if (!adjective) {
    const verb = hasEnding(w, RU_VERB, rvStart) ?? hasEndingAfter(w, RU_VERB_AND, rvStart);
    if (verb) w = w.slice(0, -verb.length);
  }

  const noun = hasEnding(w, RU_NOUN, rvStart);
  if (noun) w = w.slice(0, -noun.length);

  if (w.endsWith("и")) w = w.slice(0, -1);

  if (w.length - 2 >= r2Start) {
    if (w.endsWith("ость")) w = w.slice(0, -4);
    else if (w.endsWith("ост")) w = w.slice(0, -3);
  }

  if (w.length - 4 >= r2Start) {
    if (w.endsWith("ейше")) w = w.slice(0, -4);
    else if (w.endsWith("ейш")) w = w.slice(0, -3);
  }

  return w;
}

const EN_C = "[^aeiou]";
const EN_V = "[aeiouy]";
const EN_CONS = EN_C + "[^aeiouy]*";
const EN_VOW = EN_V + "[aeiou]*";
const EN_MGR0 = "^(" + EN_CONS + ")?" + EN_VOW + EN_C;
const EN_MEQ1 = "^(" + EN_CONS + ")?" + EN_VOW + EN_C + "(" + EN_VOW + ")?$";
const EN_MGR1 = "^(" + EN_CONS + ")?" + EN_VOW + EN_C + EN_VOW + EN_C;
const EN_SV = "^(" + EN_CONS + ")?" + EN_V;

const EN_STEP2: Record<string, string> = {
  ational: "ate",
  tional: "tion",
  enci: "ence",
  anci: "ance",
  izer: "ize",
  bli: "ble",
  alli: "al",
  entli: "ent",
  eli: "e",
  ousli: "ous",
  ization: "ize",
  ation: "ate",
  ator: "ate",
  alism: "al",
  iveness: "ive",
  fulness: "ful",
  ousness: "ous",
  aliti: "al",
  iviti: "ive",
  biliti: "ble",
  logi: "log",
};

const EN_STEP3: Record<string, string> = {
  icate: "ic",
  ative: "",
  alize: "al",
  iciti: "ic",
  ical: "ic",
  ful: "",
  ness: "",
};

export function stemEn(word: string): string {
  if (word.length < 3) return word;
  let w = word;
  const first = w[0];
  if (first === "y") w = "Y" + w.slice(1);

  const step1a = /^(.+?)(ss|i)es$/.exec(w) ?? /^(.+?)([^s])s$/.exec(w);
  if (step1a) w = step1a[1] + step1a[2];

  let step1b: RegExpExecArray | null = /^(.+?)eed$/.exec(w);
  if (step1b) {
    if (new RegExp(EN_MGR0).test(step1b[1])) {
      w = w.slice(0, -1);
    }
  } else {
    step1b = /^(.+?)(ed|ing)$/.exec(w);
    if (step1b && new RegExp(EN_SV).test(step1b[1])) {
      w = step1b[1];
      if (/(at|bl|iz)$/.test(w)) {
        w += "e";
      } else if (/([^aeiouylsz])\1$/.test(w)) {
        w = w.slice(0, -1);
      } else if (new RegExp("^" + EN_C + EN_V + "[^aeiouwxy]$").test(w)) {
        w += "e";
      }
    }
  }

  const step1c = /^(.+?)y$/.exec(w);
  if (step1c && new RegExp(EN_SV).test(step1c[1])) {
    w = step1c[1] + "i";
  }

  const step2 = /^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|biliti|logi)$/.exec(w);
  if (step2 && new RegExp(EN_MGR0).test(step2[1])) {
    w = step2[1] + EN_STEP2[step2[2]];
  }

  const step3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/.exec(w);
  if (step3 && new RegExp(EN_MGR0).test(step3[1])) {
    w = step3[1] + EN_STEP3[step3[2]];
  }

  const step4a = /^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|iti|ous|ive|ize)$/.exec(w);
  if (step4a && new RegExp(EN_MGR1).test(step4a[1])) {
    w = step4a[1];
  } else {
    const step4b = /^(.+?)(s|t)(ion)$/.exec(w);
    if (step4b && new RegExp(EN_MGR1).test(step4b[1] + step4b[2])) {
      w = step4b[1] + step4b[2];
    }
  }

  const step5a = /^(.+?)e$/.exec(w);
  if (step5a) {
    const stem = step5a[1];
    if (new RegExp(EN_MGR1).test(stem) || (new RegExp(EN_MEQ1).test(stem) && !new RegExp("^" + EN_C + EN_V + "[^aeiouwxy]$").test(stem))) {
      w = stem;
    }
  }

  if (/ll$/.test(w) && new RegExp(EN_MGR1).test(w)) {
    w = w.slice(0, -1);
  }

  if (first === "y") w = "y" + w.slice(1);
  return w;
}

export function normalizeTerm(term: string): string {
  return term.normalize("NFKC").toLowerCase().trim();
}

export function processTerm(term: string): string | null {
  const normalized = normalizeTerm(term);
  if (!normalized) return null;
  return /[а-яё]/.test(normalized) ? stemRu(normalized) : stemEn(normalized);
}
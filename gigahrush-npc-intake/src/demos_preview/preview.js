import { displayNpcName } from '../form/schema.js';

const FACTION_LABELS = {
  citizen: 'граждане',
  liquidator: 'ликвидаторы',
  cultist: 'культисты',
  scientist: 'учёные',
  wild: 'дикие',
  player: 'игрок',
};

const OCCUPATION_LABELS = {
  housewife: 'быт',
  locksmith: 'слесарь',
  secretary: 'секретарь',
  electrician: 'электрик',
  cook: 'повар',
  doctor: 'врач',
  turner: 'токарь',
  mechanic: 'механик',
  storekeeper: 'кладовщик',
  alcoholic: 'курилка',
  scientist: 'учёный',
  child: 'поручения',
  director: 'директор',
  traveler: 'путник',
  pilgrim: 'паломник',
  hunter: 'охотник',
  priest: 'батюшка',
};

const FACTION_NUMERIC_LABELS = ['граждане', 'ликвидаторы', 'культисты', 'учёные', 'дикие', 'игрок'];
const OCCUPATION_NUMERIC_LABELS = [
  'быт', 'слесарь', 'секретарь', 'электрик', 'повар', 'врач', 'токарь', 'механик',
  'кладовщик', 'курилка', 'учёный', 'поручения', 'директор', 'путник', 'паломник',
  'охотник', 'батюшка',
];

export function relationBand(score) {
  if (score <= -64) return { label: 'враг', color: '#ff715c' };
  if (score < -16) return { label: 'холодно', color: '#d8a05f' };
  if (score < 32) return { label: 'нейтрально', color: '#d8d0a0' };
  if (score < 64) return { label: 'приятель', color: '#8fd47a' };
  return { label: 'свой', color: '#77e6a4' };
}

export function capitalLabel(pack) {
  const cash = pack.wealth?.cashRubles ?? 0;
  const account = pack.wealth?.accountRubles ?? 0;
  const debt = pack.wealth?.debtRubles ?? 0;
  return `${cash + account - debt} руб.`;
}

export function deterministicDemosPost(pack) {
  const name = displayNpcName(pack.identity);
  const place = pack.placement?.homeFloorKey ?? 'living';
  const occupation = pack.affiliation?.occupation;
  const work = pack.bio?.work || OCCUPATION_LABELS[occupation] || OCCUPATION_NUMERIC_LABELS[occupation] || 'смена';
  const hint = pack.speech?.demosPostHints?.[0] || pack.speech?.catchphrases?.[0];
  if (hint) return `${name}: ${hint}`;
  if (pack.wealth?.debtRubles > 0) return `${name}: долг не исчезает от молчания. Кто видел старшего по ${place}, отметьтесь.`;
  if (pack.social?.karma < -32) return `${name}: опять списали на меня чужую смену. Бумагу несите, крики у гермы не принимаю.`;
  return `${name}: ${work}. Если зовёте в ${place}, пишите дело, цену и где ждать.`;
}

export function ambientTalkLine(pack) {
  return pack.speech?.talkLines?.[0]
    || pack.speech?.catchphrases?.[0]
    || 'Не стой в проходе. Тут люди с водой идут.';
}

export function renderDemosPreview(container, { pack, portraitUrl, validation }) {
  const relation = relationBand(pack.social?.playerRelation ?? 0);
  const sex = pack.demographics?.sex === 'female' ? 'жен.' : 'муж.';
  const faction = pack.affiliation?.faction;
  const occupation = pack.affiliation?.occupation;
  const visualId = pack.visual?.npcVisualId;
  const links = pack.social?.links ?? [];

  container.replaceChildren();

  const head = document.createElement('div');
  head.className = 'demos-head';

  if (portraitUrl) {
    const img = document.createElement('img');
    img.className = 'portrait';
    img.src = portraitUrl;
    img.alt = '';
    head.append(img);
  } else if (visualId) {
    const div = document.createElement('div');
    div.className = 'portrait preset-portrait';
    const span = document.createElement('span');
    span.textContent = 'game visual';
    const strong = document.createElement('strong');
    strong.textContent = visualId;
    div.append(span, strong);
    head.append(div);
  } else {
    const div = document.createElement('div');
    div.className = 'portrait';
    head.append(div);
  }

  const headInfo = document.createElement('div');
  const nameDiv = document.createElement('div');
  nameDiv.className = 'demos-name';
  nameDiv.textContent = displayNpcName(pack.identity);

  const metaDiv = document.createElement('div');
  metaDiv.className = 'demos-meta';
  const factionLabel = FACTION_LABELS[faction] ?? FACTION_NUMERIC_LABELS[faction] ?? faction;
  const occLabel = OCCUPATION_LABELS[occupation] ?? OCCUPATION_NUMERIC_LABELS[occupation] ?? occupation;
  metaDiv.textContent = `${pack.demographics?.age} / ${sex} / ${factionLabel} / ${occLabel}`;

  const lineDiv = document.createElement('div');
  lineDiv.className = 'demos-line';
  lineDiv.textContent = pack.bio?.publicLine || 'Публичная строка не заполнена.';

  headInfo.append(nameDiv, metaDiv, lineDiv);
  head.append(headInfo);

  const stats = document.createElement('div');
  stats.className = 'demos-stats';

  const addStat = (label, value, color) => {
    const div = document.createElement('div');
    div.className = 'stat';
    div.append(label);
    const strong = document.createElement('strong');
    if (color) strong.style.color = color;
    strong.textContent = value;
    div.append(strong);
    stats.append(div);
  };

  addStat('floor', pack.placement?.homeFloorKey);
  addStat('capital', capitalLabel(pack));
  addStat('karma', pack.social?.karma ?? 0);
  addStat('relation', relation.label, relation.color);

  container.append(head, stats);

  if (visualId) {
    const visDiv = document.createElement('div');
    visDiv.className = 'demos-post';
    const strong = document.createElement('strong');
    strong.textContent = 'visual';
    visDiv.append(strong, document.createElement('br'), visualId);
    container.append(visDiv);
  }

  const socialList = document.createElement('div');
  socialList.className = 'social-list';
  const socialTitle = document.createElement('strong');
  socialTitle.textContent = '10-link panel';
  const ul = document.createElement('ul');

  const addLink = (target, rest) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = target;
    li.append(strong, rest);
    ul.append(li);
  };

  addLink('player', ` - ${pack.social?.playerRelation ?? 0} / ${relation.label}`);
  for (const link of links) {
    addLink(link.targetNpcId, ` - ${link.relation} / ${link.role}`);
  }

  socialList.append(socialTitle, ul);
  container.append(socialList);

  const addPost = (title, text) => {
    const div = document.createElement('div');
    div.className = 'demos-post';
    const strong = document.createElement('strong');
    strong.textContent = title;
    div.append(strong, document.createElement('br'), text);
    container.append(div);
  };

  addPost('post', deterministicDemosPost(pack));
  addPost('talk', ambientTalkLine(pack));

  const errP = document.createElement('p');
  if (validation.errors.length) {
    errP.className = 'error';
    errP.textContent = `${validation.errors.length} error(s), export blocked`;
  } else {
    errP.className = 'ok';
    errP.textContent = 'package validates';
  }
  container.append(errP);
}

export async function renderPreviewPng(pack, portraitBlob) {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 540;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#10120e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#5f6757';
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.fillStyle = '#d7c06a';
  ctx.font = '24px monospace';
  ctx.fillText('ИНФОСЕТЬ ДЕМОС / NPC PREVIEW', 48, 64);
  if (portraitBlob) {
    const url = URL.createObjectURL(portraitBlob);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 48, 92, 128, 128);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  ctx.fillStyle = '#e6ead9';
  ctx.font = '22px monospace';
  ctx.fillText(displayNpcName(pack.identity).slice(0, 44), 200, 116);
  ctx.font = '16px monospace';
  const relation = relationBand(pack.social?.playerRelation ?? 0);
  const lines = [
    `${pack.demographics?.age} / ${pack.demographics?.sex} / ${pack.affiliation?.faction} / ${pack.affiliation?.occupation}`,
    `floor: ${pack.placement?.homeFloorKey}   capital: ${capitalLabel(pack)}   karma: ${pack.social?.karma ?? 0}`,
    `player relation: ${pack.social?.playerRelation ?? 0} (${relation.label})`,
    pack.bio?.publicLine ?? '',
    `post: ${deterministicDemosPost(pack)}`,
    `talk: ${ambientTalkLine(pack)}`,
  ];
  let y = 148;
  for (const line of lines) {
    ctx.fillStyle = line.startsWith('post:') || line.startsWith('talk:') ? '#aeb7a0' : '#e6ead9';
    ctx.fillText(String(line).slice(0, 96), 200, y);
    y += 34;
  }
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), 'image/png'));
}

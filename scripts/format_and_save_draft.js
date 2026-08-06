import fs from 'fs';
import { execSync } from 'child_process';

const screensDir = '/Users/jirnyak/Mirror/screens';

const img1 = fs.readFileSync(`${screensDir}/1.png`).toString('base64');
const img2 = fs.readFileSync(`${screensDir}/2.png`).toString('base64');
const img3 = fs.readFileSync(`${screensDir}/3.png`).toString('base64');
const img4 = fs.readFileSync(`${screensDir}/4.png`).toString('base64');
const img5 = fs.readFileSync(`${screensDir}/5.png`).toString('base64');
const img6 = fs.readFileSync(`${screensDir}/6.png`).toString('base64');
const img7 = fs.readFileSync(`${screensDir}/7.png`).toString('base64');

const title = "Мы делаем ГИГАХРУЩ: браузерный survival horror без движка, ассетов и спокойной жизни";
const cap1 = "Обложка: Бетонный лабиринт ГИГАХРУЩА";
const cap2 = "Инвентарь и подготовка к вылазке (еда, вода, патроны)";
const cap3 = "Структура блока и миникарта сектора";
const cap4 = "Бой в узостях коридоров";
const cap5 = "Социальная система A-Life и общение с обитателями";
const cap6 = "Самосбор и задраенный гермозатвор";
const cap7 = "ГИГАХРУЩ: Браузерный survival horror";

const encodedTitle = encodeURIComponent(title);
const encodedCap1 = encodeURIComponent(cap1);
const encodedCap2 = encodeURIComponent(cap2);
const encodedCap3 = encodeURIComponent(cap3);
const encodedCap4 = encodeURIComponent(cap4);
const encodedCap5 = encodeURIComponent(cap5);
const encodedCap6 = encodeURIComponent(cap6);
const encodedCap7 = encodeURIComponent(cap7);

const jsCode = `
(function() {
  const title = decodeURIComponent("${encodedTitle}");
  const cap1 = decodeURIComponent("${encodedCap1}");
  const cap2 = decodeURIComponent("${encodedCap2}");
  const cap3 = decodeURIComponent("${encodedCap3}");
  const cap4 = decodeURIComponent("${encodedCap4}");
  const cap5 = decodeURIComponent("${encodedCap5}");
  const cap6 = decodeURIComponent("${encodedCap6}");
  const cap7 = decodeURIComponent("${encodedCap7}");

  const img1 = "${img1}";
  const img2 = "${img2}";
  const img3 = "${img3}";
  const img4 = "${img4}";
  const img5 = "${img5}";
  const img6 = "${img6}";
  const img7 = "${img7}";

  // Title
  const titleEl = document.querySelector('.editorPage__header_title .editor') || document.querySelector('h1');
  if (titleEl) {
    titleEl.innerText = title;
    titleEl.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function makeFig(b64, caption) {
    return '<div class="editor m_line m_figure" style="margin:24px 0; text-align:center;"><figure style="margin:0;"><img src="data:image/png;base64,' + b64 + '" style="max-width:100%; height:auto; border-radius:8px; display:block; margin:0 auto;" /><figcaption style="font-size:14px; opacity:0.75; margin-top:8px; display:block; text-align:center;">' + caption + '</figcaption></figure></div>';
  }

  function formatInline(str) {
    return str
      .replace(/\\*\\*(.*?)\\*\\*/g, '<b>$1</b>')
      .replace(/\\*(.*?)\\*/g, '<i>$1</i>')
      .replace(/\\[(.*?)\\]\\((.*?)\\)/g, '<a href="$2" target="_blank">$1</a>');
  }

  const bodyEl = document.querySelector('.editorPage__text');
  if (!bodyEl) return 'NO_BODY';

  // Build clean Teletype HTML
  let html = '';
  html += '<div class="editor m_line">Привет! Мы делаем <b>ГИГАХРУЩ</b> — браузерный survival horror / ARPG shooter про вылазки внутри безграничной 1024x1024 бетонной структуры.</div>';
  html += '<div class="editor m_line m_quote"><b>Канал проекта:</b> <a href="https://t.me/gigah_rush" target="_blank">@gigah_rush</a> | <b>Формат:</b> Статья Teletype / Обзор проекта</div>';
  html += '<div class="editor m_line">Звучит как питч из папки <i>«после этого нас точно забанят»</i>, поэтому сразу перейдём к технической части. Это <b>не</b> Unity WebGL, <b>не</b> Phaser, <b>не</b> Godot export, <b>не</b> React-обвязка вокруг canvas и <b>не</b> набор купленных ассетов с Unity Asset Store.</div>';
  html += '<div class="editor m_line">Игра собрана как один чистый браузерный билд на <b>TypeScript/Vite</b>, <b>WebGL/canvas</b>, с процедурными текстурами, процедурными спрайтами, процедурным звуком и плоскими структурами данных. Zero runtime dependencies.</div>';

  // IMG 1
  html += makeFig(img1, cap1);

  // Section 1
  html += '<div class="editor m_line m_h2"><b>Игровой цикл: Зачем всё это?</b></div>';
  html += '<div class="editor m_line">Идея была простая и неприятная: сделать не красивую демку на три комнаты, а <b>живой survival loop</b>:</div>';
  html += '<div class="editor m_line">1. Игрок готовится в жилой зоне (еда, вода, патроны, медицина, пропуска и документы).</div>';
  html += '<div class="editor m_line">2. Выходит в вылазку на опасные и процедурные этажи.</div>';
  html += '<div class="editor m_line">3. Встречает NPC, монстров, фракции, торговлю, квесты и <b>САМОСБОР</b>.</div>';
  html += '<div class="editor m_line">4. Возвращается не в абстрактный хаб, а в мир, который помнит все последствия его поступков.</div>';
  html += '<div class="editor m_line">Это статья о том, как маленькая браузерная игра постепенно превратилась в инженерный мешок с WebGL-рейкастером, A-Life, процедурной генерацией, локальными сохранениями, самодельным HUD и тысячами проверок и правок.</div>';

  // Section 2
  html += '<div class="editor m_line m_h2"><b>Почему именно браузер?</b></div>';
  html += '<div class="editor m_line">Потому что необходимость установки убивает импульс. Человек увидел странную гифку или пост про САМОСБОР, нажал ссылку в Telegram, за секунду загрузил страницу — и уже через 10 секунд умер от твари в темном коридоре. <b>Идеальный сценарий.</b></div>';

  // IMG 2
  html += makeFig(img2, cap2);

  html += '<div class="editor m_line">Но браузер сразу ставит жесткие рамки:</div>';
  html += '<div class="editor m_line">❌ Нельзя рассчитывать на тяжелый движковый runtime.</div>';
  html += '<div class="editor m_line">❌ Нельзя прятать долгую загрузку за лаунчером.</div>';
  html += '<div class="editor m_line">❌ Нельзя раздать 500 МБ ассетов и надеяться, что игрок терпелив.</div>';
  html += '<div class="editor m_line">❌ Нельзя забыть про Pointer Lock, Fullscreen, мобильные экраны и localStorage.</div>';
  html += '<div class="editor m_line">Базовое правило проекта: <b>0 сторонних runtime-библиотек, 1 браузерный билд, максимум данных и поведения из кода.</b></div>';

  // Section 3
  html += '<div class="editor m_line m_h2"><b>Мир как данные, а не сцена</b></div>';
  html += '<div class="editor m_line">Главная ошибка, которую хотелось не повторять — делать уровень как коллекцию "красивых 3D-объектов". Для линейного хоррора это приятно, но для системного выживача быстро превращается в мертвый декор.</div>';
  html += '<div class="editor m_line">В ГИГАХРУЩЕ мир описывается как клеточная поверхность (тороидальная матрица 1024x1024) с комнатами, коридорами, дверями, текстурами, контейнерами, сущностями и событиями.</div>';

  // IMG 3
  html += makeFig(img3, cap3);

  html += '<div class="editor m_line m_h3"><b>Архитектурные слои:</b></div>';
  html += '<div class="editor m_line">• <code>core</code> — хранит примитивные формы, математику тора и World.</div>';
  html += '<div class="editor m_line">• <code>data</code> — реестры предметов, оружия, фракций, квестов, монстров.</div>';
  html += '<div class="editor m_line">• <code>gen</code> — генераторы этажей, POI, комнат и расстановка содержимого.</div>';
  html += '<div class="editor m_line">• <code>systems</code> — логика AI, боя, квестов, экономики, Самосбора и сохранений.</div>';
  html += '<div class="editor m_line">• <code>render</code> — <b>только рисует</b> (не принимает никаких геймплейных решений).</div>';

  // Section 4
  html += '<div class="editor m_line m_h2"><b>WebGL-Рейкастинг вместо тяжелого 3D</b></div>';
  html += '<div class="editor m_line">Честный 3D-движок был бы красивее, но тяжелее и медленнее. Для ГИГАХРУЩА важнее не количество полигонов, а <b>быстрота и четкость игрового решения</b>:</div>';
  html += '<div class="editor m_line">• Вижу ли я угрозу в коридоре?</div>';
  html += '<div class="editor m_line">• Понимаю ли я, где укрытие?</div>';
  html += '<div class="editor m_line">• Успеваю ли заблокировать гермодверь до входа тумана?</div>';

  // IMG 4
  html += makeFig(img4, cap4);

  html += '<div class="editor m_line">Наш псевдо-3D рендер на WebGL с процедурными текстурами и спрайтами справляется с главным: передает атмосферу бесконечного бетонного лабиринта, дистанцию, туман, вспышки и опасность.</div>';

  // Section 5
  html += '<div class="editor m_line m_h2"><b>A-Life: Живой мир без "театра одного игрока"</b></div>';
  html += '<div class="editor m_line">Мы не хотели делать мир, где NPC спавнятся из воздуха за спиной игрока и исчезают, когда он отворачивается.</div>';
  html += '<div class="editor m_line">В ГИГАХРУЩЕ работает слой <b>A-Life</b>:</div>';
  html += '<div class="editor m_line">• При старте генерируется пул персонажей с именами, характерами и фракциями.</div>';
  html += '<div class="editor m_line">• На активном этаже материализуются живые NPC: их инвентарь, торговцы, ликвидаторы, отношения к игроку.</div>';
  html += '<div class="editor m_line">• <b>Смерть NPC перманентна.</b> Если торговца задрала тварь во время Самосбора — его больше нет, а его труп останется лежать в том же коридоре.</div>';
  html += '<div class="editor m_line">• Игрок подчиняется тем же правилам и социальной математике (карма, статус, отношения фракций), что и NPC.</div>';

  // IMG 5
  html += makeFig(img5, cap5);

  // Section 6
  html += '<div class="editor m_line m_h2"><b>САМОСБОР — мутация пространства, а не просто "красный экран"</b></div>';
  html += '<div class="editor m_line">Самосбор — главная стихийная угроза ГИГАХРУЩА. Мы не стали делать его простой заставкой с красным фильтром.</div>';
  html += '<div class="editor m_line">При наступлении Самосбора происходит <b>реальная мутация этажа</b>:</div>';
  html += '<div class="editor m_line">1. Звучит сирена, включается система оповещения.</div>';
  html += '<div class="editor m_line">2. Игроку и NPC нужно успеть в герметичные блоки и задраить гермодвери.</div>';
  html += '<div class="editor m_line">3. Происходит давление тумана, спавн аномальных сущностей.</div>';
  html += '<div class="editor m_line">4. После окончания — мир перестраивается: меняются некоторые проходы, выбиваются двери, а не успевшие укрыться NPC погибают.</div>';

  // IMG 6
  html += makeFig(img6, cap6);

  // Section 7
  html += '<div class="editor m_line m_h2"><b>Что уже есть в игре и что дальше?</b></div>';
  html += '<div class="editor m_line">В текущей версии уже доступно:</div>';
  html += '<div class="editor m_line">🛠️ Полная система подготовка/выживания (голод, жажда, патроны, аптечки, документы).</div>';
  html += '<div class="editor m_line">🔫 Разнообразное оружие, аномальные PSI-способности и монстры.</div>';
  html += '<div class="editor m_line">🏢 Процедурные этажи + авторские сюжетные зоны.</div>';
  html += '<div class="editor m_line">🤝 Фракции, торговля, экономика и караваны.</div>';
  html += '<div class="editor m_line">☣️ Полноценный Самосбор с укрытиями и перестройкой пространства.</div>';
  html += '<div class="editor m_line">💾 Локальные сохранения в localStorage.</div>';

  // IMG 7
  html += makeFig(img7, cap7);

  html += '<div class="editor m_line">👥 <b>Присоединяйтесь к разработке и следите за обновлениями:</b></div>';
  html += '<div class="editor m_line">• <b>Telegram-канал:</b> <a href="https://t.me/gigah_rush" target="_blank">@gigah_rush</a> — новости, чейнджлоги и гифки разработки.</div>';
  html += '<div class="editor m_line">• <b>Играть в браузере:</b> <a href="https://myindie.ru/games/game/gigahrush" target="_blank">myindie.ru/games/game/gigahrush</a></div>';

  bodyEl.innerHTML = html;

  bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
  bodyEl.dispatchEvent(new Event('change', { bubbles: true }));

  return 'FORMATTED_AND_SAVED_DRAFT_SUCCESS';
})();
`;

fs.writeFileSync('/tmp/format_save.js', jsCode);

const applescriptCode = `
set jsCode to read POSIX file "/tmp/format_save.js" as «class utf8»
tell application "Google Chrome"
  execute tab 16 of window 1 javascript jsCode
end tell
`;

fs.writeFileSync('/tmp/format_save.scpt', applescriptCode);
const res = execSync('osascript /tmp/format_save.scpt').toString();
console.log('Result:', res.trim());

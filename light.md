# light.md - план улучшения освещения

> Роль: рабочий план для улучшения света в текущем WebGL raycaster без
> переписывания движка, без новых runtime-зависимостей и без переноса нагрузки
> на CPU. Это не shipped-факт; после реализации факты нужно перенести в
> `graphics.md` / `README.md`.

## Короткий Ответ

Да, сделать можно. Лучшее решение для проекта - не настоящий RTX/path tracing, а
**raycaster-native GPU lighting**:

1. Улучшить material lighting прямо в текущем fragment shader raycaster.
2. Добавить маленький screen-space emissive/bloom pass между FBO и финальным
   blit.
3. Подсветить sprites и mesh тем же визуальным светом, чтобы NPC, монстры,
   предметы, лампы, снаряды и декоративная геометрия жили в одной картинке.
4. Оставить capped shader ray probes только как high/experimental graphics
   mode, а не baseline.

Это даст красивый "шейдерный рейтрейсинговый" эффект почти полностью на GPU,
но сохранит текущую архитектуру: `World.light` остается gameplay lightmap,
renderer добавляет render-only красоту поверх него.

## Почему Не Полный Ray Tracing

Текущая сцена - не mesh-based 3D renderer. Это WebGL2 DDA raycaster по
`1024x1024` grid:

- `src/render/webgl.ts` уже делает один DDA-луч на каждый пиксель `320x200`.
- Shader уже читает `cells`, `wallTex`, `floorTex`, `features`, `light`, `fog`
  и `doorStates`.
- `world.light` уже печется из `Feature.LAMP` / `Feature.CANDLE` в
  `src/core/world.ts` и загружается в GPU texture только при `lightVersion`.
- Некоторые systems могут считать `world.light` gameplay-фактом. GPU-only
  свет не должен заменять эту правду.

Полный path tracing, multi-bounce GI, второй полный shadow DDA на каждый пиксель
или per-frame flood lightmap по всему `1024x1024` полю дадут плохое отношение
цены к картинке. На baseline нельзя удваивать стоимость raycaster.

Правильная формула: **один gameplay lightmap + шейдерные фейки материала,
направления, свечения, тумана и редкие короткие probe-лучи**.

## Цели Вкуса

Свет должен улучшать:

- бетон, линолеум, плитку, металл, воду, мясо, пустоту и бумагу;
- читаемость силуэтов, выхода, снаряда, цели и укрытия;
- локальные события: лампа, свеча, экран, выстрел, УФ-луч, самосборный туман;
- нижние этажи через материал и форму, а не через always-on красную грязь;
- darkness/void floors без поломки намеренной темноты.

Свет не должен:

- скрывать слабую картинку зерном, scanline, dither, blur, chromatic dirt или
  постоянной vignette;
- делать геймплейные решения в renderer;
- добавлять DOM/UI-framework/render-engine;
- требовать новых asset pipelines;
- делать мир темным настолько, что игрок не видит решение.

## Архитектурное Разделение

### Gameplay Light

`world.light` остается CPU-baked gameplay field:

- источники: существующие `Feature.LAMP`, `Feature.CANDLE` и будущие
  gameplay-источники;
- обновление: только через существующие dirty/version paths;
- хранение: текущий `Float32Array`, GPU upload по `lightVersion`;
- смысл: systems могут на него опираться.

### Render Beauty Light

Новый визуальный слой:

- живет в `render/`;
- не сериализуется;
- не влияет на AI, stealth, factions, save/load или floor memory;
- получает данные из уже загруженных GPU textures и маленьких uniform/cap
  buffers;
- отключается через graphics mode.

## Предлагаемый Порядок Работ

### P0: Shader Material Lighting Pack

Самый дешевый и правильный первый шаг.

Файлы:

- `src/render/webgl.ts`
- возможно `src/systems/ui_orchestrator.ts`
- возможно `src/render/ui_settings_ui.ts`

Что сделать:

- добавить `lighting_quality = off|low|medium|high` в browser-local graphics
  settings, вне save payload;
- добавить GLSL `materialProps(texId)`:
  `roughness`, `specular`, `wetness`, `emissive`, `bump`;
- добавить аналитические pseudo-normals по `texId`, `texX/texY`, wall side,
  seam/grid/noise;
- усилить lightmap gradient:
  семплить `sampleLight(cell)`, `sampleLight(cell +/- x/y)` и получать
  направление света без нового CPU solve;
- дать материалам разные ответы:
  - бетон: пыль, слабые ребра, плоский холодный свет;
  - плитка/металл/трубы: холодный specular;
  - вода: низкий wet glint;
  - мясо/кишка: мягкий красный wet pulse;
  - void/dark: редкий зеленый proof edge;
- усилить floor/wall contact AO у стен, дверей, углов и нижней части стены;
- не увеличивать `world.light` upload cadence.

Бюджет:

- baseline `low`: только ALU + 4-6 extra light texture samples на hit;
- `medium/high`: больше material math, но без дополнительных DDA loops.

Критерий успеха:

- даже без bloom стены и пол становятся материальнее;
- darkness floors остаются темными;
- `SMOKE_LIGHTING_MODE=off` визуально возвращает старый путь.

### P1: Screen-Space Emissive / Bloom Pass

Лучший GPU-only "красивый" шаг после P0.

Файлы:

- `src/render/webgl.ts`
- опционально небольшой `src/render/lighting_pass.ts`, если `webgl.ts` станет
  слишком шумным

Что сделать:

- добавить low-res emissive extraction из текущего `rayColorTex`;
- сделать 2-pass separable blur на 160x100 или 80x50 texture;
- смешать результат в final blit;
- источники bright pixels:
  лампы, свечи, экраны, projectile glow, tool beam, UV beam, dynamic sky holes,
  mesh emissive colors;
- не делать bloom always-on кислотным фильтром: он должен быть физически
  привязан к ярким объектам.

Бюджет:

- `low`: bloom off;
- `medium`: half/quarter-res bloom, 3-5 taps;
- `high`: чуть шире blur, still fixed taps;
- никаких CPU scans для bright map.

Критерий успеха:

- лампы и свечи дают halo;
- экраны и снаряды читаются в тумане;
- картинка не становится мыльной.

### P2: Sprite Lighting

Сейчас sprites depth-tested/fogged, но им нужен общий свет сцены.

Файлы:

- `src/render/webgl.ts`
- sprite vertex/fragment shader block

Что сделать:

- передать sprite world position или уже имеющиеся world deltas в sprite shader;
- bound `uLight` / `uFog` к sprite program;
- семплить `world.light` у основания/центра sprite;
- применить ambient + lightmap + flashlight/tool beam response;
- оставить projectile/flame glow stronger-than-fog, но bounded;
- не менять gameplay entity data.

Критерий успеха:

- NPC/монстры в темном коридоре действительно темнее;
- у лампы и в луче они читаются лучше;
- projectile silhouettes не теряются.

### P3: Mesh Light Consistency

Render-only mesh pass уже имеет normals, но освещается отдельным простым
directional light.

Файлы:

- `src/render/mesh/shaders.ts`
- `src/render/mesh/pass.ts`
- возможно mesh context types

Что сделать:

- либо оставить mesh под общим screen-space bloom;
- либо привязать `lightTex` к mesh shader и семплить `world.light` по world
  position;
- добавить flashlight/tool beam response;
- использовать `MeshMaterialDef.emissive` для glow source.

Критерий успеха:

- трубы, потолочные панели, кабели и voxel detail не выглядят приклеенными к
  другой световой системе.

### P4: Capped Shader Ray Probes

Это единственный этап, который можно называть "shader raytracing", но он должен
быть ограниченным.

Файлы:

- `src/render/webgl.ts`
- `src/systems/ui_orchestrator.ts`
- возможный маленький render-only collector для nearest visual lights

Что сделать:

- только для `high` / `experimental`;
- максимум `4-8` render-only dynamic light sources near camera;
- source types сначала:
  player flashlight/tool beam, projectiles, fire/flame, active screen/portal,
  selected strong lamps;
- CPU не считает освещение, только передает маленький uniform array;
- shader делает short DDA/probe radius `6-12` cells с fixed step cap;
- если cap превышен, источники выбираются ближайшие/самые яркие через стабильный
  bounded selection, без full-world scan каждый кадр.

Жесткий запрет:

- не запускать второй полный `MAX_DRAW` DDA для каждого пикселя baseline;
- не делать loops по всем лампам;
- не добавлять GPU-generated gameplay lightmap.

Критерий успеха:

- high mode получает заметные локальные тени/occlusion у дверей и углов;
- low/medium остаются быстрыми и стабильными.

### P5: Volumetric Fakes

Уже есть distance fog, local fog, light dust и tool beam. Их можно усилить без
дорогой физики.

Что сделать:

- cone dust для flashlight/tool beam;
- самосборные fog shafts по `world.fog`;
- flicker для свечей и ламп через `uTime` + cell hash;
- wet haze у water/meat floors;
- dynamic sky tint в потолочных/открытых участках.

Бюджет:

- fixed 4-8 samples максимум и только для `medium/high`;
- для `low` оставить текущую cheap fog модель.

## Graphics Modes

Предложение:

| Mode | Поведение |
| --- | --- |
| `off` | старый путь, без новых визуальных расходов |
| `low` | P0 material lighting, без bloom/probes |
| `medium` | P0 + cheap bloom + sprite lighting |
| `high` | medium + mesh consistency + stronger volumetric fakes |
| `experimental` | high + capped shader ray probes |

Default:

- desktop: `medium`, если perf smoke и ручной браузерный осмотр нормальные;
- mobile: `low`;
- stress/smoke fallback: `off` / `low`.

Настройка должна жить в browser-local UI settings, как render-only geometry
mode. Не добавлять в game save.

## Debug And Tests

Нужны не brittle screenshots, а метрики.

Добавить:

- `SMOKE_LIGHTING_MODE=off|low|medium|high|experimental`;
- `lighting_debug_overlay` в FPS/debug HUD:
  mode, pass ms, bloom size, sample count, probe count, skipped lights;
- `lighting_lab_scene` debug hook:
  лампа, свеча, темный коридор, дверь/окклюдер, fog cell, projectile/tool beam;
- optional `lighting_heatmap` только debug mode.

Тесты:

- unit tests для profile normalization/caps;
- unit tests для falloff finite/in `[0..1]`;
- render stats tests по образцу mesh stats;
- smoke luminance metrics:
  - canvas не пустой;
  - dark corridor остается темным;
  - flashlight cone светлее side/back samples;
  - high mode не ломает p95/max frame time.

Проверки будущей реализации:

```bash
npm run check
npm run check:browser
SMOKE_LIGHTING_MODE=off npm run smoke
SMOKE_LIGHTING_MODE=high SMOKE_PERF_FRAMES=300 npm run smoke
SMOKE_MOBILE=1 SMOKE_LIGHTING_MODE=low npm run smoke
SMOKE_STRESS=1 SMOKE_LIGHTING_MODE=low SMOKE_PERF_FRAMES=300 npm run smoke
SMOKE_VISUAL_GEOMETRY_MODE=high SMOKE_LIGHTING_MODE=high SMOKE_PERF_FRAMES=300 npm run smoke
```

Важно: headless smoke может идти через browser/software GPU path. Он ловит
совместимость, пустой canvas и грубые perf-регрессии, но финальный свет нужно
смотреть вручную в Chrome/Android на настоящей GPU.

## Риски

- Слишком темная картинка сломает читаемость боя.
- Bloom может превратиться в мыло, если смешивать весь bright image без порога.
- Full secondary rays быстро съедят бюджет raycaster.
- Render-only свет нельзя использовать как gameplay stealth/light truth.
- Sprite lighting может сделать врагов невидимыми, если не оставить минимальный
  silhouette floor.
- Darkness/void route floors требуют ручной проверки: там ambient и bloom не
  должны отменять авторскую темноту.

## Итоговая Рекомендация

Идти так:

1. Сначала `P0 Shader Material Lighting Pack`.
2. Потом `P1 Screen-Space Emissive/Bloom`.
3. Потом `P2 Sprite Lighting`.
4. Потом `P3 Mesh Light Consistency`.
5. Только после этого пробовать `P4 Capped Shader Ray Probes` как high/experimental.

Это даст самый большой визуальный прирост за минимальный архитектурный риск:
почти вся новая стоимость будет на GPU, CPU останется на текущем baked
`world.light` и маленьких bounded uploads/uniforms, а gameplay truth не
переедет в renderer.

/* ── Maintenance content manifest ───────────────────────────────
 * Additive rooms/NPCs live behind this seam to keep index.ts stable.
 */

import { type Entity } from '../../core/types';
import { World } from '../../core/world';
import { syncNextEntityId } from '../content_manifest_utils';
import { generateForpost } from './forpost';
import { generateMancobusRoom } from './mancobus_room';
import { spawnMakhno } from './makhno';
import { spawnIvanych } from './sant_ivanych';
import { spawnRadistGleb } from './radist_gleb';
import { spawnDiverKot } from './diver_kot';
import { spawnGordonFreeman } from './gordon';
import { generateFloodedLab } from './flooded_lab';
import { generatePressureStation } from './pressure_station';
import { generateSteamValves } from './steam_valves';
import { generateDiverCache } from './diver_cache';
import { generateWatermeterPost } from './watermeter_post';
import { generateOverflowSluice } from './overflow_sluice';
import { generateHeatlineZero } from './heatline_zero';
import { generateMetroErrorLine } from './metro_error_line';
import { generateConcentratePress } from './concentrate_press';
import { generatePressovik } from './pressovik';
import { generateWaterBridge } from './water_bridge';
import { generateNasosnayaMatka } from './nasosnaya_matka';
import { generateLiftRepairShaft } from './lift_repair_shaft';
import { generateRemontnikBezSmeny } from './remontnik_bez_smeny';
import { generateChargeCage } from './charge_cage';
import { generateAutomationCage } from './automation_cage';
import { generateHladonets } from './hladonets';
import { generateKabelnik } from './kabelnik';
import { generateCollectorsPressureReroute } from './collectors_pressure_reroute';
import { generateDefectorLiquidator } from './defector_liquidator';
import { generateParitelSteamBridge } from './paritel_steam_bridge';
import { generateCultHeldWorkshop } from './cult_held_workshop';
import { generateSlimeSamplePost } from './slime_sample_post';
import { generateBlueGlowSample } from './blue_glow_sample';
import { generateGreenAcidRoom } from './green_acid_room';
import { generateBrownSlimeCleanup } from './brown_slime_cleanup';
import { generateSlimeDeactivationFurnace } from './slime_deactivation_furnace';
import { generateSlimeSingingVents } from './slime_singing_vents';
import { generateVentshun } from './ventshun';
import { generateRedAdhesiveTrap } from './red_adhesive_trap';
import { generateBlackSlimeEyes } from './black_slime_eyes';
import { generateChernayaLichinka } from './chernaya_lichinka';
import { generateSeroburmalineNoLook } from './seroburmaline_no_look';
import { generatePneumomailStation } from './pneumomail_station';
import { generateBetonoedShortcut } from './betonoed_shortcut';
import { generateKostorezLocker } from './kostorez_locker';
import { generateOstavshiysyaLikvidator } from './ostavshiysya_likvidator';
import { generateFiltronos } from './filtronos';

export function runMaintenanceContent(
  world: World,
  entities: Entity[],
  nextId: number,
  spawnX: number,
  spawnY: number,
): number {
  generateForpost(world, world.rooms.length, entities, { v: nextId }, spawnX, spawnY);
  nextId = syncNextEntityId(entities, nextId);

  generateMancobusRoom(world, world.rooms.length, entities, { v: nextId }, spawnX, spawnY);
  nextId = syncNextEntityId(entities, nextId);

  spawnMakhno(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  generateFloodedLab(world, world.rooms.length, entities, { v: nextId }, spawnX, spawnY);
  nextId = syncNextEntityId(entities, nextId);

  spawnIvanych(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  spawnRadistGleb(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  spawnDiverKot(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  spawnGordonFreeman(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  generatePressureStation({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateSteamValves({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateDiverCache({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateWatermeterPost({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateOverflowSluice({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateWaterBridge({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateNasosnayaMatka({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateParitelSteamBridge({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateHeatlineZero({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateMetroErrorLine({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateConcentratePress({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generatePressovik({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateLiftRepairShaft({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateRemontnikBezSmeny({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateChargeCage({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateBlueGlowSample({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateHladonets({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateAutomationCage({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateKabelnik({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateCollectorsPressureReroute({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateDefectorLiquidator({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateOstavshiysyaLikvidator({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateSlimeSamplePost({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateSlimeSingingVents({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateVentshun({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateBrownSlimeCleanup({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateGreenAcidRoom({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateSlimeDeactivationFurnace({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateRedAdhesiveTrap({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateCultHeldWorkshop({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateSeroburmalineNoLook({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generatePneumomailStation({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateBlackSlimeEyes({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateChernayaLichinka({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateBetonoedShortcut({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateKostorezLocker({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  nextId = syncNextEntityId(entities, nextId);

  generateFiltronos({ world, entities, nextId: { v: nextId }, spawnX, spawnY });
  return syncNextEntityId(entities, nextId);
}

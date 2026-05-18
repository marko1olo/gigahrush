/* ── Ministry content manifest ──────────────────────────────────
 * Administrative POIs and floor NPC packs are isolated here.
 */

import { type Entity } from '../../core/types';
import { World } from '../../core/world';
import { syncNextEntityId } from '../content_manifest_utils';
import { spawnMinistryNpcs } from './npcs';
import { generateSecretSmokingRoom } from './secret_smoking';
import { generatePermitOffice } from './permit_office';
import { generateStampRoom } from './stamp_room';
import { generateWeaponPermitBureau } from './weapon_permit_bureau';
import { generateInterrogationCloset } from './interrogation';
import { generateQueueHall } from './queue_hall';
import { generateInspectionArchive } from './inspection_archive';
import { generateLiquidatorArchive } from './liquidator_archive';
import { generateRaionsovetArchive } from './raionsovet_archive';
import { generateRefusalClauseOffice } from './refusal_clause';
import { generateDocumentGate } from './document_gate';
import { generateNiiContrabandAudit } from './nii_contraband_audit';
import { generateKartotechnikArchive } from './kartotechnik';
import { generateMatkaDokumentovRoom } from './matka_dokumentov';
import { runMinistryDesignFloorContent } from '../design_floors/ministry';

export function runMinistryContent(
  world: World,
  entities: Entity[],
  nextRoomId: number,
  nextId: number,
  spawnX: number,
  spawnY: number,
): { nextRoomId: number; nextId: number } {
  const smoking = generateSecretSmokingRoom(world, nextRoomId, entities, { v: nextId }, spawnX, spawnY);
  nextRoomId = smoking.nextRoomId;
  nextId = syncNextEntityId(entities, nextId);

  const idRef = { v: nextId };
  for (const generate of [
    generatePermitOffice,
    generateStampRoom,
    generateWeaponPermitBureau,
    generateInterrogationCloset,
    generateQueueHall,
    generateInspectionArchive,
    generateLiquidatorArchive,
    generateRaionsovetArchive,
    generateRefusalClauseOffice,
    generateDocumentGate,
    generateNiiContrabandAudit,
    generateKartotechnikArchive,
    generateMatkaDokumentovRoom,
  ]) {
    const r = generate(world, nextRoomId, entities, idRef, spawnX, spawnY);
    nextRoomId = r.nextRoomId;
  }

  const designFloor = runMinistryDesignFloorContent(world, entities, nextRoomId, idRef, spawnX, spawnY);
  nextRoomId = designFloor.nextRoomId;

  nextId = idRef.v;
  world.bakeLights();

  spawnMinistryNpcs(world, entities, { v: nextId });
  nextId = syncNextEntityId(entities, nextId);

  return { nextRoomId, nextId };
}

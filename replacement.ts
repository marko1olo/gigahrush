function enforceProjectileSoftLimit(entityIndex: ReturnType<typeof rebuildEntityIndexForSimulation>) {
  const projectileLimit = entitySoftLimit(EntityType.PROJECTILE);
  if (projectileLimit !== undefined && entityIndex.projectiles.length > projectileLimit) {
    let overflow = entityIndex.projectiles.length - projectileLimit;
    for (const p of entityIndex.projectiles) {
      if (overflow <= 0) break;
      if (p.alive) {
        p.alive = false;
        overflow--;
      }
    }
  }
}

function updateProjectileZPhysics(p: Entity, dt: number, pt: ProjType): { prevSpriteZ: number; nextSpriteZ: number; floorHitT: number } {
  const prevSpriteZ = p.spriteZ ?? 0.5;
  const vz = p.vz ?? 0;
  const gravity = pt === ProjType.FLAME ? 1.8 : pt === ProjType.GRENADE ? 2.5 : pt === ProjType.BFG ? 0.3 : 1.2;
  p.vz = vz - gravity * dt;
  let nextSpriteZ = prevSpriteZ + p.vz * dt;
  p.spriteZ = nextSpriteZ;
  let floorHitT = Number.POSITIVE_INFINITY;
  if (nextSpriteZ <= 0 && prevSpriteZ > nextSpriteZ) {
    floorHitT = Math.max(0, Math.min(1, prevSpriteZ / (prevSpriteZ - nextSpriteZ)));
  }
  // Ceiling impact (spriteZ ≥ 1)
  if (nextSpriteZ >= 1.0) {
    p.spriteZ = 1.0;
    nextSpriteZ = 1.0;
    floorHitT = Number.POSITIVE_INFINITY;
    p.vz = 0;
    if (pt === ProjType.BFG) {
      triggerExplosion(p, pt);
      p.alive = false;
    } else {
      // Bounce off ceiling — reverse vz with damping
      p.vz = -Math.abs(vz) * 0.3;
    }
  }
  return { prevSpriteZ, nextSpriteZ, floorHitT };
}

function handleFlameFloorBurnMarks(p: Entity, pt: ProjType) {
  if (pt === ProjType.FLAME && (p.spriteZ ?? 0.5) < 0.2) {
    const fx = Math.floor(p.x), fy = Math.floor(p.y);
    if (!world.solid(fx, fy)) {
      resolveFlameCleanup(p, p.x, p.y, 0.9);
      stampMark(world, fx, fy, (p.x % 1 + 1) % 1, (p.y % 1 + 1) % 1,
        0.25, MarkType.BURN, randSeed(), 8, 5, 2, 160);
    }
  }
}

function handleProjectileEntityCollisions(
  p: Entity,
  pt: ProjType,
  prevX: number,
  prevY: number,
  wx: number,
  wy: number,
  prevSpriteZ: number,
  nextSpriteZ: number,
  blockingT: number,
  entityIndex: ReturnType<typeof rebuildEntityIndexForSimulation>
) {
  const baseDmg = p.projDmg ?? 0;
  const hitRadius = pt === ProjType.FLAME ? 0.8 : 0.6;
  entityIndex.queryPathRadius(prevX, prevY, wx, wy, hitRadius, projectileHitQuery, ENTITY_MASK_ACTOR, pt === ProjType.FLAME ? FLAME_HIT_QUERY_CAP : PROJECTILE_HIT_QUERY_CAP);
  let nearestHit: Entity | undefined;
  let nearestHitT = Infinity;
  if (pt !== ProjType.FLAME) {
    for (const e of projectileHitQuery) {
      if (!e.alive || e.id === p.ownerId) continue;
      if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC) continue;
      const hitT = projectilePathHitT(prevX, prevY, wx, wy, e, hitRadius);
      if (hitT <= blockingT + 0.000001 && hitT < nearestHitT) {
        nearestHit = e;
        nearestHitT = hitT;
      }
    }
  }
  for (const e of projectileHitQuery) {
    if (!e.alive || e.id === p.ownerId) continue;
    if (e.type !== EntityType.MONSTER && e.type !== EntityType.NPC) continue;
    if (pt !== ProjType.FLAME && e !== nearestHit) continue;
    const hitT = pt === ProjType.FLAME ? projectilePathHitT(prevX, prevY, wx, wy, e, hitRadius) : nearestHitT;
    if (hitT <= blockingT + 0.000001) {
      const hitX = projectilePathPoint(prevX, wx, hitT);
      const hitY = projectilePathPoint(prevY, wy, hitT);
      const hitZ = prevSpriteZ + (nextSpriteZ - prevSpriteZ) * hitT;
      if (pt === ProjType.WEB) {
        applyPaupsinaWeb(e, state.time, state.msgs, state, projectileActor(p));
        spawnProjectileBodyImpact(world, hitX, hitY, p.sprite, pt, hitZ);
        playProjectileBodyHitCue(p, e.x, e.y, isPlayerEntity(e));
        p.alive = false;
        break;
      }
      if (pt === ProjType.FLAME) reducePaupsinaWeb(e, state.time, state.msgs, state, projectileActor(p), 'fire');
      if (e.hp !== undefined) {
        const counterplayDmg = adjustMonsterProjectileDamage(e, p, baseDmg);
        const armor = applyMonsterArmorHit(world, state, e, {
          damage: counterplayDmg,
          attacker: projectileActor(p),
          weaponId: p.weapon,
          projectileType: pt,
        });
        const dmg = armor.damage;
        const debugImmortalPlayerHit = isPlayerEntity(e) && isDebugOnePunchManEnabled();
        if (debugImmortalPlayerHit) {
          keepDebugOnePunchManAlive(e);
        } else {
          e.hp -= dmg;
          tryMonsterProjectileStagger(world, state, e, p, player.id);
          if (e.type === EntityType.NPC && isPlayerOwnedProjectile(p)) {
            applyDamageRelationPenalty(player.faction, e.faction, dmg, e, player, state);
            recordFactionClashPlayerHit(state, world, player, e, dmg);
          }
          notifyActorDamaged(world, e, projectileActor(p), dmg, 'projectile', state.time, state);
          const hitAngle = Math.atan2(p.vy ?? 0, p.vx ?? 0);
          spawnBloodHit(world, hitX, hitY, hitAngle, dmg, e.type === EntityType.MONSTER, p.vx ?? 0, p.vy ?? 0, hitZ);
          spawnProjectileBodyImpact(world, hitX, hitY, p.sprite, pt, hitZ);
        }
        const playerHit = isPlayerEntity(e);
        if (playerHit && !debugImmortalPlayerHit) reportPlayerProjectileHit(p, dmg);
        playProjectileBodyHitCue(p, e.x, e.y, playerHit);
        if (!debugImmortalPlayerHit && e.hp <= 0) {
          e.alive = false;
          e.hp = 0;
          handleKill(e, isPlayerOwnedProjectile(p), p.vx ?? 0, p.vy ?? 0, p.projGore ?? 1);
          recordMonsterProjectileDeath(
            world,
            state,
            e,
            p,
            projectileActor(p),
            (target, vx, vy, gore) => handleKill(target, isPlayerOwnedProjectile(p), vx, vy, gore),
            entities,
          );
        }
      }
      if (pt === ProjType.BFG) {
        p.x = hitX;
        p.y = hitY;
        p.spriteZ = hitZ;
        triggerExplosion(p, pt);
      } else if (pt === ProjType.GRENADE) {
        p.vx = -(p.vx ?? 0) * 0.4;
        p.vy = -(p.vy ?? 0) * 0.4;
        p.vz = (p.vz ?? 0) * 0.4;
      } else if (p.aoeRadius) {
        p.x = hitX;
        p.y = hitY;
        p.spriteZ = hitZ;
        psiAoeExplosion(p, entities, world, state.msgs, state.time, (e2) => handleKill(e2, isPlayerOwnedProjectile(p)));
      }
      // Flame projectiles pierce through (don't die on hit)
      if (pt !== ProjType.FLAME && pt !== ProjType.GRENADE) {
        p.alive = false;
        break;
      } else if (pt === ProjType.GRENADE) {
        break;
      }
    }
  }
}

function handleProjectileWallHit(
  p: Entity,
  pt: ProjType,
  wallHit: NonNullable<ReturnType<typeof traceFirstSolidCell>>,
  prevSpriteZ: number,
  nextSpriteZ: number
) {
  const impactZ = Math.max(0, Math.min(1, prevSpriteZ + (nextSpriteZ - prevSpriteZ) * wallHit.t));
  const impactV = Math.max(0.001, Math.min(0.999, 1.0 - impactZ));
  p.x = wallHit.x;
  p.y = wallHit.y;
  p.spriteZ = impactZ;
  if (pt === ProjType.BFG) {
    triggerExplosion(p, pt);
  } else if (pt === ProjType.GRENADE) {
    p.vx = wallHit.axis === 'x' ? -(p.vx ?? 0) * 0.5 : (p.vx ?? 0) * 0.8;
    p.vy = wallHit.axis === 'y' ? -(p.vy ?? 0) * 0.5 : (p.vy ?? 0) * 0.8;
    p.x = wrapWorld(wallHit.x + (wallHit.axis === 'x' ? -wallHit.stepX * 0.02 : 0));
    p.y = wrapWorld(wallHit.y + (wallHit.axis === 'y' ? -wallHit.stepY * 0.02 : 0));
    playProjectileImpactCue(p, wallHit.x, wallHit.y);
    return;
  } else {
    if (pt === ProjType.FLAME) resolveFlameCleanup(p, wallHit.x, wallHit.y, 1.0);
    spawnProjectileWallImpact(world, wallHit.cellX, wallHit.cellY, wallHit.u, impactV, p.sprite, pt, wallHit.x, wallHit.y);
    playProjectileImpactCue(p, wallHit.x, wallHit.y);
  }
  if (p.aoeRadius && pt !== ProjType.BFG)
    psiAoeExplosion(p, entities, world, state.msgs, state.time, (e) => handleKill(e, isPlayerOwnedProjectile(p)));
  p.alive = false;
}

function handleProjectileFloorHit(
  p: Entity,
  pt: ProjType,
  prevX: number,
  prevY: number,
  moveX: number,
  moveY: number,
  floorHitT: number
) {
  const floorX = wrapWorld(prevX + moveX * floorHitT);
  const floorY = wrapWorld(prevY + moveY * floorHitT);
  p.x = floorX;
  p.y = floorY;
  p.spriteZ = 0;
  if (pt === ProjType.BFG) {
    triggerExplosion(p, pt);
  } else if (pt === ProjType.GRENADE) {
    p.vz = -(p.vz ?? 0) * 0.6;
    p.vx = (p.vx ?? 0) * 0.8;
    p.vy = (p.vy ?? 0) * 0.8;
    p.spriteZ = 0.02;
    if (p.vz > 0.5) playProjectileImpactCue(p, floorX, floorY);
    return;
  } else {
    if (pt === ProjType.FLAME) resolveFlameCleanup(p, floorX, floorY, 1.0);
    spawnProjectileFloorImpact(world, floorX, floorY, p.sprite, pt);
    playProjectileImpactCue(p, floorX, floorY);
  }
  if (p.aoeRadius)
    psiAoeExplosion(p, entities, world, state.msgs, state.time, (e) => handleKill(e, isPlayerOwnedProjectile(p)));
  p.alive = false;
}

/* ── Projectile update: move, collide walls + entities ────────── */
function updateProjectiles(dt: number): void {
  const entityIndex = rebuildEntityIndexForSimulation(entities, entityIndexFrame);
  enforceProjectileSoftLimit(entityIndex);

  for (const p of entityIndex.projectiles) {
    if (p.type !== EntityType.PROJECTILE || !p.alive) continue;
    p.projLife = (p.projLife ?? 0) - dt;
    const pt = p.projType ?? ProjType.NORMAL;

    // Grenade explodes on timer expiry
    if (p.projLife! <= 0) {
      if (pt === ProjType.GRENADE || pt === ProjType.BFG) {
        triggerExplosion(p, pt);
      }
      p.alive = false;
      continue;
    }

    const { prevSpriteZ, nextSpriteZ, floorHitT } = updateProjectileZPhysics(p, dt, pt);
    if (!p.alive) continue;

    handleFlameFloorBurnMarks(p, pt);

    const prevX = p.x;
    const prevY = p.y;
    const moveX = (p.vx ?? 0) * dt;
    const moveY = (p.vy ?? 0) * dt;
    const wx = wrapWorld(prevX + moveX);
    const wy = wrapWorld(prevY + moveY);
    const wallHit = traceFirstSolidCell(world, prevX, prevY, moveX, moveY);
    const wallHitT = wallHit?.t ?? Number.POSITIVE_INFINITY;
    const blockingT = Math.min(wallHitT, floorHitT, 1);

    handleProjectileEntityCollisions(p, pt, prevX, prevY, wx, wy, prevSpriteZ, nextSpriteZ, blockingT, entityIndex);
    if (!p.alive) continue;

    if (wallHit && wallHit.t <= floorHitT + 0.000001) {
      handleProjectileWallHit(p, pt, wallHit, prevSpriteZ, nextSpriteZ);
      continue;
    }

    if (floorHitT <= 1) {
      handleProjectileFloorHit(p, pt, prevX, prevY, moveX, moveY, floorHitT);
      continue;
    }

    p.x = wx;
    p.y = wy;
  }
}

function gameLoop(now: number): void {
  // Two-phase deferred loading:
  // Phase 1: pendingLoad exists but not drawn yet → draw loading screen, yield to browser
  // Phase 2: pendingLoad exists and was drawn → execute heavy generation
  if (pendingLoad) {
    if (!pendingLoadDrawn) {
      // Phase 1: paint "ЗАГРУЗКА..." and yield so the browser can composite it
      drawLoading();
      pendingLoadDrawn = true;
      requestAnimationFrame(gameLoop);
      return;
    }
    if (pageHiddenPause || platformPause) {
      clearExternalPauseInputsOnce();
      if (typeof state !== 'undefined') {
        state.sleeping = false;
        syncPauseState();
      }
      lastTime = now;
      requestAnimationFrame(gameLoop);
      return;
    }
    // Phase 2: loading screen is visible, now do the heavy work
    const fn = pendingLoad;
    pendingLoad = null;
    pendingLoadDrawn = false;
    fn();
    rebuildEntityIndex(entities, 'load');
    lastTime = performance.now(); // reset dt so we don't get a huge spike
    requestAnimationFrame(gameLoop);
    return;
  }

  // ── Gamepad / universal input frame ───────────────────────
  // Polled before the title-screen early return so the title menu and
  // pause/inventory menus alike see fresh per-frame intent. Keyboard and
  // mouse stay the default; the resolver only writes when the adapter
  // reports actual input. `writeMenuEdgesFromActions` is gated on
  // `started` so the title bridge owns its own accept/close mapping.
  beginInputFrame(inputFrame);
  gamepadAdapter.poll(inputFrame);
  resolveInputFrameToInputState(inputFrame, input, {
    writeMenuEdgesFromActions: started,
  });

  if (!started) {
    handleTitleGamepadInput(inputFrame);
  }

  if (pageHiddenPause || platformPause) {
    clearExternalPauseInputsOnce();
    state.sleeping = false;
    syncPauseState();
    lastTime = now;
    requestAnimationFrame(gameLoop);
    return;
  }

  syncPointerCaptureRequirement();

  const rawDt = (now - lastTime) / 1000;
  lastTime = now;
  const frameDt = Math.min(rawDt, 0.05); // cap delta
  uiTime += frameDt;
  let dt = frameDt;
  tickNetSphere(state, player);

  // ── Sleep: hold Z to sleep (time acceleration ×10) ───────
  const SLEEP_TIME_MULT = 10;
  // Restore rate: 100 sleep in 5 game-hours (300 game-min = 300 real-sec at 1x)
  // → 100/300 ≈ 0.333 per real-sec at 1x, but with 10x accel → ~30 real-sec full restore
  const SLEEP_RESTORE_RATE = 100 / 300; // per simulated second
  const wantSleep = input.sleep && !state.paused && !state.gameOver
    && player.alive && player.needs !== undefined;
  state.sleeping = wantSleep && (player.needs?.sleep ?? 100) < 100;
  if (state.sleeping) dt *= SLEEP_TIME_MULT;

  // Menu input always processed (even when paused)
  handleMenuInput();
  // If menu triggered new game / load, bail out to show loading screen
  if (pendingLoad) { requestAnimationFrame(gameLoop); return; }

  if (!state.paused) {
    entityIndexFrame = (entityIndexFrame + 1) & 0x3fffffff;
  }

  // ── Update ───────────────────────────────────────────────
  // Decay damage flash
  if (state.dmgFlash > 0) state.dmgFlash = Math.max(0, state.dmgFlash - dt * 1.2);
  // Decay beam visual
  if (state.beamFx > 0) state.beamFx = Math.max(0, state.beamFx - dt * 2.5);
  if (state.uvBeamFx > 0) state.uvBeamFx = Math.max(0, state.uvBeamFx - dt);

  // Runtime camera modes are visual-only; player death is the rolling-head mode.
  if (state.gameOver && runtimeCamera.mode === 'death') {
    state.deathTimer += dt;
    updateRuntimeCamera(runtimeCamera, world, dt);
  }

  if (!state.paused && !state.gameOver) {
    const simStart = performance.now();
    lastNeedsUpdateMs = 0;
    lastContentHookMs = 0;
    lastHazardUpdateMs = 0;
    lastSamosborUpdateMs = 0;
    lastFactionUpdateMs = 0;
    lastBloodUpdateMs = 0;
    lastCleanupUpdateMs = 0;
    state.time += dt;
    state.tick++;

    // Update game clock (1 real second = 1 game minute)
    state.clock.totalMinutes += dt;
    const totalMins = Math.floor(state.clock.totalMinutes);
    state.clock.hour = (8 + Math.floor(totalMins / 60)) % 24;  // start at 8:00
    state.clock.minute = totalMins % 60;
    setMsgClock(state.clock);
    tickRoomMemory(state.time, dt);
    updateZhelemishSkinStatus(player, state, dt);
    updateInventoryConditions(player, state);

    // ── Sleep restoration while holding Z ──
    if (state.sleeping && player.needs) {
      player.needs.sleep = Math.min(100, player.needs.sleep + SLEEP_RESTORE_RATE * dt);
      if (player.needs.sleep >= 100) {
        state.msgs.push(msg('Вы выспались.', state.time, '#a8f'));
      }
    }

    movePlayer(dt);
    rebuildEntityIndexForSimulation(entities, entityIndexFrame).beginTelemetryFrame();
    playerActions(dt);
    syncPlayerActorSwitchBaseline();
    // If switchFloor was triggered, pendingLoad is set — skip the rest of this frame
    if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
    updateLiftArachnaEncounter(world, entities, player, state, dt, nextEntityId);
    updatePseudolifts(world, entities, player, state);
    updateEquippedTool(dt, player);
    // Player urination (P key)
    if (input.pee && player.alive && player.needs && player.needs.pee > 5) {
      const traced = stampUrineTrace(world, player, {
        seed: Math.floor(state.time * 1000),
        pressure: player.needs.pee / 100,
        streamLength: 1.65,
        streamSteps: player.needs.pee > 60 ? 26 : 20,
        width: 0.055,
        dropCount: 1,
      });
      if (traced) {
        // Faction penalty for urinating outside bathroom
        applyUrinationPenalty(dt);
        player.needs.pee = Math.max(0, player.needs.pee - 12 * dt);
        if (player.needs.pee <= 5) {
          state.msgs.push(msg('Полегчало.', state.time, '#da4'));
        }
      }
    } else {
      // Reset urination penalty tracking when not peeing
      _urinePenaltyStarted = false;
      _urinePenaltyAccum = 0;
    }
    updateProjectiles(dt);
    updateDoors(dt);
    updateWrongDoorRemaps(world, state);
    updateHladonColdPocket(world, player, state, dt);
    needsTickAccum += dt;
    needsRealTickAccum += frameDt;
    if (needsTickAccum >= 0.25) {
      const needsDt = needsTickAccum;
      const needsRealDt = needsRealTickAccum;
      needsTickAccum = 0;
      needsRealTickAccum = 0;
      const needsStart = performance.now();
      updateNeeds(entities, needsDt, state.time, state.msgs, player.id, nextEntityId, state, world, needsDt > 0 ? needsRealDt / needsDt : 1);
      lastNeedsUpdateMs += performance.now() - needsStart;
    }
    let contentStart = performance.now();
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'pre_ai', gameOver: false })) updateWorldData(world);
    lastContentHookMs += performance.now() - contentStart;
    const listener = player;
    setListenerPos(listener.x, listener.y, world);
    updateRouteCues(world, listener, state);
    updateMapExploration(world, listener, state);
    const aiStart = performance.now();
    updateAI(world, entities, dt, state.time, state.msgs, listener.id, state.clock, state.samosborActive, nextEntityId, state.currentFloor, state);
    lastAiUpdateMs = performance.now() - aiStart;
    updateRailTrains(world, entities, player, state, dt);
    contentStart = performance.now();
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'post_ai', gameOver: false })) updateWorldData(world);
    lastContentHookMs += performance.now() - contentStart;
    updateCarnivorousFungus(world, entities, player, state, dt, nextEntityId);
    const hazardStart = performance.now();
    tickCellHazards(world, entities, state, dt, player, input.fwd || input.back || input.strafeL || input.strafeR || input.touch.moveX !== 0 || input.touch.moveY !== 0);
    lastHazardUpdateMs = performance.now() - hazardStart;
    updateBlockCrushDamage(world, entities, state, dt);
    updateProceduralAnomalies(world, player, state, dt);
    const samosborStart = performance.now();
    const samosborRebuild = updateSamosbor(world, entities, state, dt, nextEntityId, currentLocalSamosborPatchGeneration, scheduleLocalSamosborPatch);
    lastSamosborUpdateMs = performance.now() - samosborStart;
    if (samosborRebuild) {
      closeCraftMenu();
      reportNetSphereProgressEvents();
      scheduleLoading(() => {
        restorePlayerBeforeWorldBoundary();
        captureCurrentAlifeFloor();
        clearWrongDoorRemaps(world, state, 'world_rebuild');
        clearPseudoliftActive(state, entities);
        const replacement = currentRouteRebuildGeneration();
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentFloor, replacement);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentFloor);
        ensureProductionRooms(state, world);
        prepareEditableFloor();
        resetMapExploration(world);
        updateMapExploration(world, player, state);
        ensureProceduralSpriteSeeds(entities);
        clearLiftArachnaActive(state);
        restoreVoidReturnPortalForCurrentWorld();
        applyStoryRouteGates(world, player, state);
        finishLoadedFloorVisuals(replacement);
      });
      requestAnimationFrame(gameLoop);
      return;
    }
    if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
    syncMapExplorationAfterSamosborWave(world, state);
    // Faction cell capture
    const factionStart = performance.now();
    updateFactionCapture(world, entities, dt, state);
    updateFactionActivity(world, entities, player, state, nextEntityId, dt, currentFloorAllowsNpcPopulation());
    lastFactionUpdateMs = performance.now() - factionStart;
    contentStart = performance.now();
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'floor_activity', gameOver: false })) updateWorldData(world);
    lastContentHookMs += performance.now() - contentStart;
    const activeAlifeFloorKey = currentFloorMemoryKey();
    tickAlifeMigration(state, dt, { activeFloorKey: activeAlifeFloorKey });
    const alifeArrivals = processAlifePendingArrivals(state, world, entities, nextEntityId, { activeFloorKey: activeAlifeFloorKey });
    const alifeDepartures = updateActiveAlifeDepartures(state, world, entities, dt);
    if (alifeArrivals > 0 || alifeDepartures > 0) {
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }
    if (updateKillQuestPressure(world, entities, state, state.msgs, nextEntityId)) {
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }
    // PSI does NOT auto-regenerate — only restored via items (pills, antidepressant)
    // Update ongoing PSI spell effects (phase shift, madness, control)
    makeCurrentPlayer(updatePsiEffects(entities, dt, player, state.msgs, state.time).player);
    updateSeroburmalineExposure(world, player, state, dt);

    // Blood trails from wounded entities + particle physics
    bloodTrailAccum += dt;
    const bloodStart = performance.now();
    if (bloodTrailAccum >= 0.3) {
      const bloodDt = bloodTrailAccum;
      bloodTrailAccum = 0;
      updateBloodTrails(world, entities, bloodDt);
    }
    updateParticles(world, dt);
    updateDangerField(world, dt);
    lastBloodUpdateMs = performance.now() - bloodStart;

    // Cycle slide textures every 5 seconds — left tile=even, right tile=odd
    if (world.slideCells.length >= 2) {
      const pair = Math.floor(state.time / 5) % 4;
      const slideA = world.slideCells[0];
      const slideB = world.slideCells[1];
      if (pair !== lastSlidePair || slideA !== lastSlideCellA || slideB !== lastSlideCellB) {
        world.wallTex[slideA] = Tex.SLIDE_1 + pair * 2;     // left
        world.wallTex[slideB] = Tex.SLIDE_1 + pair * 2 + 1; // right
        world.markWallTexDirty();
        lastSlidePair = pair;
        lastSlideCellA = slideA;
        lastSlideCellB = slideB;
      }
    }
    if (updateProceduralScreens(world, state.time)) {
      world.markWallTexDirty();
    }
    // Check quest completion
    if (state.tick % 30 === 0) {
      checkQuests(player, world, entities, state, state.msgs, nextEntityId);
      if (updateScriptedArrivals(world, entities, player, state, nextEntityId)) {
        rebuildEntityIndexAfterSpawnCleanup(entities);
      }
    }

    // Return portal in Void — only the Creator-opened portal can end the run.
    if (state.currentFloor === FloorLevel.VOID && state.tick % 10 === 0) {
      const pci = world.idx(Math.floor(player.x), Math.floor(player.y));
      if (tryUseVoidReturnPortal(pci)) {
        syncMsgLog();
        requestAnimationFrame(gameLoop);
        return;
      }
    }

    // Auto-pickup when walking
    if (autoPickupEnabled() && state.tick % 15 === 0) {
      pickupNearby(world, entities, player, state.msgs, state.time, state, (drop: Entity, pickedItems: readonly Item[] = []) => {
        claimNetTerminalGenFleshDrop(state, drop, player, world);
        recordFactionEventLootTaken(state, world, player, drop);
        applyPickedStoryItemOutcomes(pickedItems, player, entities, state, state.msgs);
      });
    }
    if (state.tick % 60 === 0) {
      tickContainerAudits(state, world, player, entities);
      tickProduction(state, world, false, player);
      tickBankingInterest(state);
      tickStockMarket(state);
    }

    keepDebugOnePunchManAlive(player);

    // Detect player damage for vignette flash
    const damageActor = syncPlayerActorSwitchBaseline();
    let curHp = damageActor.hp ?? 100;
    if (curHp < prevPlayerActorHp) {
      absorbPsiShieldDamage(damageActor, prevPlayerActorHp, state.msgs, state.time);
      curHp = damageActor.hp ?? curHp;
    }
    if (curHp < prevPlayerActorHp) {
      const lost = prevPlayerActorHp - curHp;
      const maxHp = damageActor.maxHp ?? 100;
      state.dmgFlash = Math.min(1, 0.3 + (lost / maxHp) * 1.5);
      state.dmgSeed = Math.random() * 10000;
      recordUnattributedPlayerDamage(lost);
      playFleshHit();
    }
    prevPlayerActorId = damageActor.id;
    prevPlayerActorHp = curHp;
    updatePlayerBarAudioFeedback();

    // Check player death
    const deathActor = player;
    if (!deathActor.alive && !state.gameOver) {
      handlePlayerDeath(deathActor);
    } else if (!player.alive && !state.gameOver) {
      handlePlayerDeath(player);
    }
    reportNetSphereProgressEvents();

    const cleanupStart = performance.now();
    const removedDead = cleanupDeadEntities(dt);
    lastCleanupUpdateMs = performance.now() - cleanupStart;
    if (removedDead > 0) {
      // Exception to the one planned rebuild: splice cleanup changes the flat array after spawns/deaths.
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }

    // Sync new messages to persistent log, then trim
    syncMsgLog();
    while (state.msgs.length > 50) state.msgs.shift();
    _prevMsgCount = state.msgs.length;
    lastSimUpdateMs = performance.now() - simStart;
  }

  // ── World simulation continues after death (NPC, monsters, samosbor keep running) ──
  if (!state.paused && state.gameOver) {
    state.time += dt;
    state.tick++;
    state.clock.totalMinutes += dt;
    const totalMins = Math.floor(state.clock.totalMinutes);
    state.clock.hour = (8 + Math.floor(totalMins / 60)) % 24;
    state.clock.minute = totalMins % 60;
    tickRoomMemory(state.time, dt);
    updateProjectiles(dt);
    updateDoors(dt);
    updateWrongDoorRemaps(world, state);
    needsTickAccum += dt;
    needsRealTickAccum += frameDt;
    if (needsTickAccum >= 0.25) {
      const needsDt = needsTickAccum;
      const needsRealDt = needsRealTickAccum;
      needsTickAccum = 0;
      needsRealTickAccum = 0;
      updateNeeds(entities, needsDt, state.time, state.msgs, player.id, nextEntityId, state, world, needsDt > 0 ? needsRealDt / needsDt : 1);
    }
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'pre_ai', gameOver: true })) updateWorldData(world);
    const listener = player;
    setListenerPos(listener.x, listener.y, world);
    updateMapExploration(world, listener, state);
    updatePseudolifts(world, entities, player, state);
    const aiStart = performance.now();
    updateAI(world, entities, dt, state.time, state.msgs, listener.id, state.clock, state.samosborActive, nextEntityId, state.currentFloor, state);
    lastAiUpdateMs = performance.now() - aiStart;
    tickCellHazards(world, entities, state, dt, player, false);
    if (updateSamosbor(world, entities, state, dt, nextEntityId, currentLocalSamosborPatchGeneration, scheduleLocalSamosborPatch)) {
      closeCraftMenu();
      reportNetSphereProgressEvents();
      scheduleLoading(() => {
        restorePlayerBeforeWorldBoundary();
        captureCurrentAlifeFloor();
        clearWrongDoorRemaps(world, state, 'world_rebuild');
        clearPseudoliftActive(state, entities);
        const replacement = currentRouteRebuildGeneration();
        rebuildWorld(world, entities, nextEntityId, state.samosborCount, state.currentFloor, replacement);
        initFactionControl(world);
        materializeCurrentAlifeFloor();
        ensureProceduralSpriteSeeds(entities);
        ensureRoomContainers(world, state.currentFloor);
        ensureProductionRooms(state, world);
        prepareEditableFloor();
        resetMapExploration(world);
        updateMapExploration(world, player, state);
        ensureProceduralSpriteSeeds(entities);
        clearLiftArachnaActive(state);
        finishLoadedFloorVisuals(replacement);
      });
      requestAnimationFrame(gameLoop);
      return;
    }
    if (pendingLoad) { requestAnimationFrame(gameLoop); return; }
    syncMapExplorationAfterSamosborWave(world, state);
    updateFactionCapture(world, entities, dt, state);
    updateFactionActivity(world, entities, player, state, nextEntityId, dt, currentFloorAllowsNpcPopulation());
    if (updateContentRuntimeHooks({ world, entities, player, state, nextEntityId, dt, phase: 'floor_activity', gameOver: true })) updateWorldData(world);
    bloodTrailAccum += dt;
    if (bloodTrailAccum >= 0.3) {
      const bloodDt = bloodTrailAccum;
      bloodTrailAccum = 0;
      updateBloodTrails(world, entities, bloodDt);
    }
    updateParticles(world, dt);
    updateDangerField(world, dt);
    if (cleanupDeadEntities(dt) > 0) {
      // Exception to the one planned rebuild: splice cleanup changes the flat array after spawns/deaths.
      rebuildEntityIndexAfterSpawnCleanup(entities);
    }
    syncMsgLog();
    while (state.msgs.length > 50) state.msgs.shift();
    _prevMsgCount = state.msgs.length;
  }

  if (pendingLoad) { requestAnimationFrame(gameLoop); return; }

  if (!state.gameOver) {
    if (state.trailerMode) {
      if (runtimeCamera.mode !== 'trailer') {
        startTrailerCamera(runtimeCamera, player.x, player.y);
      }
      updateTrailerCamera(runtimeCamera, world, dt);
    } else {
      updateRuntimeCamera(runtimeCamera, world, dt, player);
    }
  }
  checkRestart();
  updateMobileContext();
  const currentFps = updateFpsMeter(now, rawDt * 1000);

  // ── Render ───────────────────────────────────────────────
  // Fog density varies by floor level
  let baseFog = 0.065;
  if (state.currentFloor === FloorLevel.MAINTENANCE) baseFog = 0.08;
  if (state.currentFloor === FloorLevel.HELL) baseFog = 0.05; // less fog, more horror visibility
  const smogFogBonus = !state.gameOver ? proceduralSmogFogDensityBonus(world, player, state) : 0;
  const samosborVariant = state.samosborActive ? getActiveSamosborVariant() : null;
  const samosborVisual = samosborVariant?.visual;
  const samosborGlitchPulse = 0.85 + ((Math.sin(uiTime * 5) + 1) * 0.5) * 0.15;
  const fogDensity = baseFog + smogFogBonus + (state.samosborActive ? (samosborVisual?.fogDensityBonus ?? 0.02) : 0);
  const interferenceMode = screenInterferenceMode();
  const neuroScreenFx = uiElementEnabled('screen_fx');
  const criticalInterference = state.samosborActive || state.gameOver;
  const screenInterference = interferenceMode === 'off' || !neuroScreenFx
    ? 0
    : interferenceMode === 'full'
      ? 1
      : criticalInterference
        ? 0.65
        : 0.32;
  const glitch = screenInterference <= 0
    ? 0
    : state.samosborActive
      ? (samosborVisual?.glitchIntensity ?? 0.06) * samosborGlitchPulse
      : interferenceMode === 'full'
        ? Math.min(0.18, smogFogBonus * 4)
        : 0;

  const renderActor = player;
  const cameraView = runtimeCameraView(runtimeCamera, renderActor, cameraFovRadians());
  const camX = cameraView.x;
  const camY = cameraView.y;
  const passiveFlashlight = state.gameOver
    ? 0
    : passiveToolLightRenderIntensity(renderActor.tool, getEquippedToolDurability(renderActor));
  const activeToolLight = state.gameOver || !(input.use || input.mouseUse)
    ? 0
    : activeToolLightRenderIntensity(renderActor.tool, getEquippedToolDurability(renderActor));
  const flashlight = state.gameOver
    ? 0
    : Math.max(passiveFlashlight, activeToolLight);
  const toolBeam = state.gameOver ? 0 : uvSpotlightRenderIntensity(state.uvBeamFx);

  // Update dynamic world data (fog, door states, wallTex for slides)
  updateGeneratedDynamicSky(dt);
  updateDynamicData(world, camX, camY);

  // WebGL raycaster + sprites
  const floorRunEntry = currentFloorRunEntry(state);
  const ambientLight = designFloorAmbientLight(floorRunEntry.designFloorId, 0.12);
  const visualDetailProfile = currentVisualDetailProfile(floorRunEntry);
  const visualGeometryProfile = currentVisualGeometryProfile(floorRunEntry);
  const visualSurfaceProfile = currentVisualSurfaceProfile(floorRunEntry);
  const renderSceneStart = performance.now();
  renderSceneGL(world, textures, sprites, entities,
    cameraView,
    fogDensity, glitch, flashlight, uiTime, particles, state.samosborActive, ambientLight, toolBeam, state.uvBeamLen, screenInterference, visualDetailProfile, visualGeometryProfile, visualSurfaceProfile, lightingQualityIndex());
  lastRenderSceneMs = performance.now() - renderSceneStart;

  // Draw HUD on 2D overlay canvas
  const textGlitchHp = typeof renderActor.hp === 'number' ? renderActor.hp : 100;
  const textGlitchMaxHp = typeof renderActor.maxHp === 'number' && renderActor.maxHp > 0 ? renderActor.maxHp : 100;
  setCanvasTextGlitchPressure({
    healthRatio: textGlitchHp / textGlitchMaxHp,
    samosborActive: state.samosborActive,
  });
  ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height);
  const hudDrawStart = performance.now();
  if (!state.trailerMode) {
    drawHUD(ctx, hudCanvas.width / SCR_W, hudCanvas.height / SCR_H, renderActor, state, world, entities, uiTime, {
      fps: currentFps,
      perf: uiElementEnabled('fps_counter') ? hudPerfDebugSnapshot(currentFps) : undefined,
      pointerLockHint: !mobileControls?.isEnabled() && !input.mouse.locked && !pointerCaptureGateVisible(),
      pointerCaptureGate: pointerCaptureGateVisible(),
    });
  }
  if (!started) {
    showTitle();
  }
  lastHudDrawMs = performance.now() - hudDrawStart;

  requestAnimationFrame(gameLoop);
}

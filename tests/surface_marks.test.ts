import { test } from 'node:test';
import * as assert from 'node:assert/strict';

import { World } from '../src/core/world';
import { Cell } from '../src/core/types';
import { stampBlackHandMark, getBlackHandMarkCells, stampSurfaceSplat } from '../src/systems/surface_marks';

test('getBlackHandMarkCells returns empty array for new world', () => {
  const world = new World();
  const cells = getBlackHandMarkCells(world);
  assert.equal(cells.length, 0);
});

test('stampBlackHandMark creates a mark on valid cells', () => {
  const world = new World();
  const x = 10;
  const y = 10;

  world.cells[world.idx(x, y)] = Cell.FLOOR;

  const stamped = stampBlackHandMark(world, x, y, 12345);

  assert.equal(stamped, true);

  const cells = getBlackHandMarkCells(world);
  assert.equal(cells.length, 1);
  assert.equal(cells[0].x, x);
  assert.equal(cells[0].y, y);
});

test('stampSurfaceSplat stamps a splat on valid cells', () => {
  const world = new World();
  const cx = 5;
  const cy = 5;
  const fx = 0.5;
  const fy = 0.5;

  const ci = world.idx(cx, cy);
  world.cells[ci] = Cell.FLOOR;

  stampSurfaceSplat(world, cx, cy, fx, fy, 0.5, 200, 42, 255, 0, 0);

  const cellData = world.surfaceMap.get(ci);
  assert.ok(cellData);

  // Verify that some pixels were written to (non-zero alpha)
  let hasWrittenPixels = false;
  for (let i = 3; i < cellData.length; i += 4) {
    if (cellData[i] > 0) {
      hasWrittenPixels = true;
      break;
    }
  }
  assert.ok(hasWrittenPixels);
});

test('stampSurfaceSplat does not stamp on walls when wallOk is false', () => {
  const world = new World();
  const cx = 5;
  const cy = 5;
  const fx = 0.5;
  const fy = 0.5;

  const ci = world.idx(cx, cy);
  world.cells[ci] = Cell.WALL;

  // By default wallOk is false
  stampSurfaceSplat(world, cx, cy, fx, fy, 0.5, 200, 42, 255, 0, 0);

  // surfaceMap entry might be created or not, but if created, it should have no pixels written
  const cellData = world.surfaceMap.get(ci);
  if (cellData) {
    let hasWrittenPixels = false;
    for (let i = 3; i < cellData.length; i += 4) {
      if (cellData[i] > 0) {
        hasWrittenPixels = true;
        break;
      }
    }
    assert.equal(hasWrittenPixels, false);
  } else {
    assert.equal(cellData, undefined);
  }
});

test('stampSurfaceSplat stamps on walls when wallOk is true', () => {
  const world = new World();
  const cx = 5;
  const cy = 5;
  const fx = 0.5;
  const fy = 0.5;

  const ci = world.idx(cx, cy);
  world.cells[ci] = Cell.WALL;

  stampSurfaceSplat(world, cx, cy, fx, fy, 0.5, 200, 42, 255, 0, 0, true);

  const cellData = world.surfaceMap.get(ci);
  assert.ok(cellData);

  let hasWrittenPixels = false;
  for (let i = 3; i < cellData.length; i += 4) {
    if (cellData[i] > 0) {
      hasWrittenPixels = true;
      break;
    }
  }
  assert.ok(hasWrittenPixels);
});

test('stampBlackHandMark handles wrap around coordinates', () => {
  const world = new World();
  const x = 256 + 10;
  const y = -10;

  const wx = world.wrap(x);
  const wy = world.wrap(y);

  world.cells[world.idx(wx, wy)] = Cell.FLOOR;

  const stamped = stampBlackHandMark(world, x, y, 12345);

  assert.equal(stamped, true);

  const cells = getBlackHandMarkCells(world);
  assert.equal(cells.length, 1);
  assert.equal(cells[0].x, wx);
  assert.equal(cells[0].y, wy);
});

test('stampBlackHandMark fails on invalid cells like ABYSS', () => {
  const world = new World();
  const x = 15;
  const y = 15;

  world.cells[world.idx(x, y)] = Cell.ABYSS;

  const stamped = stampBlackHandMark(world, x, y, 12345);
  assert.equal(stamped, false);
});

test('stampBlackHandMark limits to BLACK_HAND_MARK_CELL_CAP capacity', () => {
  const world = new World();

  // BLACK_HAND_MARK_CELL_CAP is 48
  let stampedCount = 0;
  for (let i = 0; i < 60; i++) {
    world.cells[world.idx(i, 0)] = Cell.FLOOR;
    if (stampBlackHandMark(world, i, 0, 12345)) {
      stampedCount++;
    }
  }

  assert.equal(stampedCount, 48);
  const cells = getBlackHandMarkCells(world);
  assert.equal(cells.length, 48);

  // Checking that further stamps fail
  const overCapStamped = stampBlackHandMark(world, 61, 0, 12345);
  assert.equal(overCapStamped, false);
});

test('stampBlackHandMark ignores duplicate stamps on same cell', () => {
  const world = new World();
  const x = 20;
  const y = 20;

  world.cells[world.idx(x, y)] = Cell.FLOOR;

  // First stamp
  const stamped1 = stampBlackHandMark(world, x, y, 12345);
  assert.equal(stamped1, true);

  // Second stamp on same cell
  const stamped2 = stampBlackHandMark(world, x, y, 12346);
  assert.equal(stamped2, true); // recordBlackHandCell returns true early, but does not push another mark

  const cells = getBlackHandMarkCells(world);
  assert.equal(cells.length, 1);
  assert.equal(cells[0].x, x);
  assert.equal(cells[0].y, y);
});

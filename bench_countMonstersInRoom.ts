import { performance } from 'perf_hooks';

// Dummy data
const rooms: any[] = [];
for (let i = 0; i < 10000; i++) {
  rooms.push({ id: i, name: i % 10 === 0 ? "TargetRoom" : "OtherRoom" });
}

function approach1() {
  return new Set(rooms.filter(room => room.name === "TargetRoom").map(room => room.id));
}

function approach2() {
  const roomIds = new Set<number>();
  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];
    if (room.name === "TargetRoom") {
      roomIds.add(room.id);
    }
  }
  return roomIds;
}

function runBench() {
  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    approach1();
  }
  const t1 = performance.now();
  console.log("Filter + Map:", t1 - t0, "ms");

  const t2 = performance.now();
  for (let i = 0; i < 1000; i++) {
    approach2();
  }
  const t3 = performance.now();
  console.log("For loop:", t3 - t2, "ms");
}

runBench();

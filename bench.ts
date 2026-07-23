const rooms = [];
for (let i = 0; i < 10000; i++) {
  rooms.push({ id: i, name: i % 10 === 0 ? "targetName" : "otherName" });
}

const roomName = "targetName";

function approach1() {
  const roomIds = new Set(rooms.filter(room => room.name === roomName).map(room => room.id));
  return roomIds.size;
}

function approach2() {
  const roomIds = new Set();
  for (let i = 0; i < rooms.length; i++) {
    if (rooms[i].name === roomName) {
      roomIds.add(rooms[i].id);
    }
  }
  return roomIds.size;
}

const N = 1000;

let start = performance.now();
for (let i = 0; i < N; i++) approach1();
console.log("baseline:", performance.now() - start, "ms");

start = performance.now();
for (let i = 0; i < N; i++) approach2();
console.log("optimized:", performance.now() - start, "ms");

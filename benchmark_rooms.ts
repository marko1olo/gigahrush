import { performance } from 'perf_hooks';

enum RoomType {
  KITCHEN = 1,
  COMMON = 2,
  SMOKING = 3,
  OTHER = 4
}

interface Room {
  id: number;
  name: string;
  type: RoomType;
}

// Generate rooms
const rooms: Room[] = [];
for (let i = 0; i < 10000; i++) {
  rooms.push({
    id: i,
    name: 'Комната ' + i,
    type: RoomType.OTHER
  });
}
rooms.push({ id: 10000, name: 'Свидетельский карман', type: RoomType.COMMON });

const spec = { majorityId: 'citizens' };

function originalFind(rooms: Room[]) {
  const kitchenRoom = rooms.find(room => room.name.startsWith('Общая кухня') || room.name.startsWith('Пайковая кухня'))
    ?? rooms.find(room => room.type === RoomType.KITCHEN)
    ?? rooms[0];
  const shelterRoom = rooms.find(room => room.name.startsWith('Гражданское укрытие') || room.name.startsWith('Тихая ниша укрытия'))
    ?? rooms.find(room => room.type === RoomType.COMMON)
    ?? kitchenRoom;
  const witnessRoom = rooms.find(room =>
    room.id !== shelterRoom?.id &&
    (room.name.startsWith('Свидетельский карман') || room.name.startsWith('Общий зал свидетелей')))
    ?? rooms.find(room => room.id !== shelterRoom?.id && (room.type === RoomType.COMMON || room.type === RoomType.SMOKING))
    ?? rooms.find(room => room.id !== shelterRoom?.id && room.id !== 0)
    ?? kitchenRoom;
  return { kitchenRoom, shelterRoom, witnessRoom };
}

function optimizedSinglePassBreak(rooms: Room[]) {
  let kitchenBest: Room | undefined;
  let kitchenGood: Room | undefined;

  let shelterBest: Room | undefined;
  let shelterGood: Room | undefined;

  let witnessBest: Room | undefined;
  let witnessBestAlt: Room | undefined;
  let witnessGood: Room | undefined;
  let witnessGoodAlt: Room | undefined;
  let witnessAny: Room | undefined;
  let witnessAnyAlt: Room | undefined;

  for (let i = 0; i < rooms.length; i++) {
    const room = rooms[i];

    if (!kitchenBest && (room.name.startsWith('Общая кухня') || room.name.startsWith('Пайковая кухня'))) {
      kitchenBest = room;
    } else if (!kitchenGood && room.type === RoomType.KITCHEN) {
      kitchenGood = room;
    }

    if (!shelterBest && (room.name.startsWith('Гражданское укрытие') || room.name.startsWith('Тихая ниша укрытия'))) {
      shelterBest = room;
    } else if (!shelterGood && room.type === RoomType.COMMON) {
      shelterGood = room;
    }

    if (room.name.startsWith('Свидетельский карман') || room.name.startsWith('Общий зал свидетелей')) {
      if (!witnessBest) witnessBest = room;
      else if (!witnessBestAlt) witnessBestAlt = room;
    } else if (room.type === RoomType.COMMON || room.type === RoomType.SMOKING) {
      if (!witnessGood) witnessGood = room;
      else if (!witnessGoodAlt) witnessGoodAlt = room;
    }

    if (room.id !== 0) {
      if (!witnessAny) witnessAny = room;
      else if (!witnessAnyAlt) witnessAnyAlt = room;
    }

    // Break early if we have all candidates
    if (kitchenBest && shelterBest && witnessBest && witnessBestAlt && witnessGood && witnessGoodAlt && witnessAny && witnessAnyAlt) {
        break;
    }
  }

  const kitchenRoom = kitchenBest ?? kitchenGood ?? rooms[0];
  const shelterRoom = shelterBest ?? shelterGood ?? kitchenRoom;
  const sId = shelterRoom?.id;

  const witnessRoom =
    (witnessBest && witnessBest.id !== sId ? witnessBest : witnessBestAlt && witnessBestAlt.id !== sId ? witnessBestAlt : undefined) ??
    (witnessGood && witnessGood.id !== sId ? witnessGood : witnessGoodAlt && witnessGoodAlt.id !== sId ? witnessGoodAlt : undefined) ??
    (witnessAny && witnessAny.id !== sId ? witnessAny : witnessAnyAlt && witnessAnyAlt.id !== sId ? witnessAnyAlt : undefined) ??
    kitchenRoom;

  return { kitchenRoom, shelterRoom, witnessRoom };
}

function runBenchmark() {
  const iterations = 1000;

  const startOriginal = performance.now();
  for (let i = 0; i < iterations; i++) {
    originalFind(rooms);
  }
  const endOriginal = performance.now();

  const startSinglePass = performance.now();
  for (let i = 0; i < iterations; i++) {
    optimizedSinglePassBreak(rooms);
  }
  const endSinglePass = performance.now();

  console.log(`Original: ${(endOriginal - startOriginal).toFixed(2)}ms`);
  console.log(`Single Pass Break: ${(endSinglePass - startSinglePass).toFixed(2)}ms`);

  const originalRes = originalFind(rooms);
  const singlePassRes = optimizedSinglePassBreak(rooms);

  console.log("Correctness check:");
  console.log(originalRes.kitchenRoom === singlePassRes.kitchenRoom);
  console.log(originalRes.shelterRoom === singlePassRes.shelterRoom);
  console.log(originalRes.witnessRoom === singlePassRes.witnessRoom);
}

runBenchmark();

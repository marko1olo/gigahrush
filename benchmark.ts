import { CRAFT_RECIPES, CRAFT_RECIPE_LIST } from './src/data/craft_recipes';

const iterations = 100000;

console.time('Object.values');
let count1 = 0;
for (let i = 0; i < iterations; i++) {
  for (const r of Object.values(CRAFT_RECIPES)) {
    count1++;
  }
}
console.timeEnd('Object.values');

console.time('CRAFT_RECIPE_LIST');
let count2 = 0;
for (let i = 0; i < iterations; i++) {
  for (const r of CRAFT_RECIPE_LIST) {
    count2++;
  }
}
console.timeEnd('CRAFT_RECIPE_LIST');

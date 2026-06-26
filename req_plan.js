const fs = require('fs');
const plan = fs.readFileSync('plan.md', 'utf8');
console.log(plan);

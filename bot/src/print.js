const db = require('../events.json');

const ids = Object.keys(db);
const posted = ids.filter(id => db[id].posted).length;

console.log(`Posted: ${posted}`);
console.log(`Current Total: ${ids.length}`);

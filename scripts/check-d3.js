const d3 = require('d3');
console.log('D3 Version:', d3.version);
console.log('d3.selection:', !!d3.selection);
if (d3.selection) {
    console.log('d3.selection.prototype.transition:', !!d3.selection.prototype.transition);
}
const sel = d3.select(null);
console.log('Selection prototype transition:', !!Object.getPrototypeOf(sel).transition);

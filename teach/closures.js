function makeAccumulator(start) {
	let count = start;
	return () => start + count;
}

const a = makeAccumulator(5);
const b = makeAccumulator(3);

console.log(a());
console.log(b());

// function makeCounter(start) {
// 	let count = start;
// 	return () => count++;
// }
// const c = makeCounter(5);
// console.log(c(), c(), c());
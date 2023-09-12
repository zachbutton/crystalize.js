import { Crystalizer } from './index';
import * as Immutable from 'seamless-immutable';

const timed = (name, cb) => {
	console.time(name);
	cb();
	console.timeEnd(name);
};

let crystalizer = new Crystalizer<
	{ total: number },
	{ value: number; ts: number }
>({
	initial: { total: 0 },
	reducer: (acc, shard) => ({ total: acc.total + shard.value }),
});

const stuff = Array(10000)
	.fill(0)
	.map((_, i) => ({ value: i, ts: i }));

timed('\ntotal', () => {
	timed('initial modify', () => {
		crystalizer = crystalizer.modify((ed) => {
			stuff.forEach((v) => (ed = ed.with(v)));
			return ed;
		});
	});

	timed('harden', () => {
		crystalizer = crystalizer.harden();
		console.log('len', crystalizer.partialShards.length);
	});

	timed('asCrystal', () => {
		console.log(crystalizer.asCrystal());
	});

	timed('\nchange mode', () => {
		crystalizer = crystalizer.modify((ed) => ed.leaveCount(5000));
	});

	timed('harden', () => {
		crystalizer = crystalizer.harden();
		console.log('len', crystalizer.partialShards.length);
	});

	timed('asCrystal', () => {
		console.log(crystalizer.asCrystal());
	});

	timed('\nback 300', () => {
		crystalizer = crystalizer.modify((ed) => {
			console.log('mod');
			return ed.headInc(-4999);
		});
	});

	timed('harden', () => {
		crystalizer = crystalizer.harden();
		console.log('len', crystalizer.partialShards.length);
	});

	timed('asCrystal', () => {
		console.log(crystalizer.asCrystal());
		console.log(crystalizer.partialCrystal);
	});
});

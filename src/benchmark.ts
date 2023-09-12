import { Crystalizer } from './index';

const t = (name: string, cb: () => any) => {
	console.time(name);
	cb();
	console.timeEnd(name);
};

const d = (label: string, crystalizer: any) => {
	console.log('\n\n========', label, '========');
	console.log('PARTIAL CRYSTAL', crystalizer.partialCrystal);
	console.log('PARTIAL SHARDS', crystalizer.partialShards);
	console.log('FULL CRYSTAL', crystalizer.asCrystal());
};

let crystalizer = new Crystalizer<
	{ total: number },
	{ value: number; ts: number }
>({
	initial: { total: 0 },
	reducer: (acc, shard) => ({ total: acc.total + shard.value }),
	mode: {
		type: 'keepN',
		count: 8,
	},
});

let c = (s: number, n: number) =>
	Array(n)
		.fill(0)
		.map((_, i) => ({ value: 1, ts: s + i }));

const vals = c(0, 10);

console.log('INIT', vals);

crystalizer = crystalizer.modify((m) => m.with(vals)).harden();
d('first', crystalizer);

crystalizer = crystalizer.modify((m) => m.with(c(20, 3))).harden();
d('new - 3', crystalizer);

crystalizer = crystalizer.withHeadAt(-8).harden();
d('head - 8', crystalizer);

crystalizer = crystalizer.withHeadAt(-2).harden();
d('head - 2', crystalizer);

crystalizer = crystalizer.modify((m) => m.with(c(30, 3))).harden();
d('new - 2', crystalizer);

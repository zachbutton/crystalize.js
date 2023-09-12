import { Crystalizer } from './index';

const t = (name: string, cb: () => any) => {
	console.time(name);
	cb();
	console.timeEnd(name);
};

const d = (label: string, crystalizer: any) => {
	console.log('\n\n========', label, '========');
	console.log('PARTIAL CRYSTAL', crystalizer.harden().partialCrystal);
	console.log('PARTIAL SHARDS', crystalizer.harden().partialShards);
	console.log('FULL CRYSTAL', crystalizer.harden().asCrystal());
};

let c = new Crystalizer<{ total: number }, { value: number; ts: number }>({
	initial: { total: 0 },
	reducer: (acc, shard) => ({ total: acc.total + shard.value }),
	mode: {
		type: 'keepCount',
		count: 6,
	},
});

const add = (
	crystalizer: Crystalizer<any>,
	qty: number,
	startingId: number = 0,
) => {
	const newShards = Array(qty)
		.fill(0)
		.map((_, i) => ({ value: 2, id: startingId + i }));

	return crystalizer.modify((m) => m.with(newShards));
};

c = add(c, 10);
d('first', c);

c = c.harden();
c = add(c, 10, 10);
d('new 10', c);

c = c.harden();

c = c.withHeadAt(-1);
d('head - 1', c);

c = c.withHeadAt(-2);
d('head - 2', c);

c = c.withHeadAt(-4);
d('head - 4', c);

c = c.withHeadAt(-5);
d('head - 5', c);

c = c.withHeadAt(-6);
d('head - 6', c);

c = c.withHeadAt(-7);
d('head - 7', c);

c = c.withHeadAt(-8);
d('head - 8', c);

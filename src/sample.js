let crystalizer = makeCrystalizer({
	initial: { total: 0 },
	reduce: (acc, shard) => ({ total: acc.total + shard.value }),
	mode: { type: 'all' },
});

crystalizer = crystalizer.modify((editor) => {
	return editor.with({ value: 2 });
});

let state = crystalizer.harden().asCrystal();

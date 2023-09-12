let crystalizer = makeCrystalizer({
	initial: { total: 0 },
	reduce: (acc, shard) => ({ total: acc.total + shard.value }),
});

crystalizer = crystalizer.modify((editor) => {
	return editor.with({ value: 2 }).leaveCount(5);
});

let state = crystalizer.harden().asCrystal();

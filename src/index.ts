type CrystalizerCrystal = Map<any, any>;
type CrystalizerShard = Map<any, any>;

type CrystalizerModeLeaveAll = {
	type: 'all';
};

type CrystalizerModeLeaveNone = {
	type: 'none';
};

type CrystalizerModeLeaveCount = {
	type: 'count';
	count: number;
};

type CrystalizerModeLeaveUntil = {
	type: 'until';
	until: CrystalizerTimeSelector;
};

type CrystalizerShardSelector = (shard: CrystalizerShard) => boolean;
type CrystalizerTimeSelector = (ts?: number) => number;

type CrystalizerModeLeaveSelected = {
	type: 'selected';
	selector: CrystalizerShardSelector;
};

type CrystalizerMode =
	| CrystalizerModeLeaveAll
	| CrystalizerModeLeaveNone
	| CrystalizerModeLeaveCount
	| CrystalizerModeLeaveUntil
	| CrystalizerModeLeaveSelected;

type CrystalizerOptsRequired = {
	initial: CrystalizerCrystal;
	reducer: (
		acc: CrystalizerCrystal,
		shard: CrystalizerShard,
	) => CrystalizerCrystal;
};

type CrystalizerOptsOptional = {
	shards?: Array<CrystalizerShard>;
	tsKey?: string;
	mode?: CrystalizerMode;
	ptrFromEnd?: number;
	throwPtrBounds?: boolean;
};

type CrystalizerGenerated = {
	crystal: CrystalizerCrystal;
	finalCrystal: CrystalizerCrystal;
	shards: Array<CrystalizerShard>;
};

interface CrystalizerOpts
	extends CrystalizerOptsRequired,
		CrystalizerOptsOptional {}

const defaultOptions: CrystalizerOptsOptional = {
	tsKey: 'ts',
	mode: { type: 'all' },
	shards: [],
	ptrFromEnd: 0,
	throwPtrBounds: false,
};

export default class Crystalizer {
	private opts: CrystalizerOpts;
	private _generated: CrystalizerGenerated;

	constructor(opts: CrystalizerOpts) {
		this.opts = { ...defaultOptions, ...opts };

		if (this.opts.throwPtrBounds) {
			if (
				this.opts.ptrFromEnd < 0 ||
				this.opts.ptrFromEnd >= this.opts.shards.length
			) {
				throw new RangeError('Crystalizer pointer out of bounds');
			}
		} else {
			this.opts.ptrFromEnd = Math.max(
				0,
				Math.min(this.opts.ptrFromEnd, this.opts.shards.length - 1),
			);
		}
	}

	with(shards: CrystalizerShard | Array<CrystalizerShard>): Crystalizer {
		shards = shards instanceof Array ? shards : [shards];
		shards = shards.map((shard) => {
			/* explicitly allows override of timestamp */
			return { [this.opts.tsKey]: +new Date(), ...shard };
		});

		// TODO: Potential optimization: Pass this.generated.[shards|crystal] here
		return new Crystalizer({
			...this.opts,
			shards: [...this.opts.shards, ...shards],
		});
	}

	without(selector: CrystalizerShardSelector) {
		const shards = this.opts.shards.filter((shard) => !selector(shard));

		return new Crystalizer({ ...this.opts, shards });
	}

	headInc(inc: number) {
		/* inc is inverted because the internal pointer counts from the end of the
		 * shard array. This is more intuitive to the end-user, because this way,
		 * negative values move into the past, and positive values, the future */
		return new Crystalizer({
			...this.opts,
			ptrFromEnd: this.opts.ptrFromEnd + inc * -1,
		});
	}

	headFind(seek: (shard: CrystalizerShard) => boolean) {
		const index = this.opts.shards.findIndex((shard) => seek(shard));

		return new Crystalizer({
			...this.opts,
			ptrFromEnd: this.opts.shards.length - index,
		});
	}

	headLast() {
		return new Crystalizer({ ...this.opts, ptrFromEnd: 0 });
	}

	private reduceInto(
		shards: Array<CrystalizerShard>,
		crystal: CrystalizerCrystal,
	): CrystalizerCrystal {
		return shards.reduce(this.opts.reducer, crystal);
	}

	private generate(): CrystalizerGenerated {
		let shards = [...this.opts.shards].sort((a, b) => {
			return a[this.opts.tsKey] - b[this.opts.tsKey];
		});

		shards = shards.slice(0, shards.length - this.opts.ptrFromEnd);

		const splitIndex = (() => {
			switch (this.opts.mode.type) {
				case 'all':
					return 0;
				case 'none':
					return shards.length;
				case 'count':
					return this.opts.mode.count - 1;
				case 'until':
					const until = this.opts.mode.until(+new Date());
					return shards.findIndex((shard: CrystalizerShard) => {
						return shard[this.opts.tsKey] >= until;
					});
				case 'selected':
					const select = this.opts.mode.selector.bind(this.opts.mode);
					return shards.findIndex((shard) => select(shard));
			}
		})();

		const crystalizedShards = shards.slice(0, splitIndex);
		shards = shards.slice(splitIndex);

		const crystal = this.reduceInto(crystalizedShards, this.opts.initial);
		const finalCrystal = this.reduceInto(shards, crystal);

		return { crystal, shards, finalCrystal };
	}

	private get generated(): CrystalizerGenerated {
		if (!this._generated) {
			this._generated = this.generate();
		}
		return this._generated;
	}

	asCrystal(): CrystalizerCrystal {
		return structuredClone(this.generated.finalCrystal);
	}

	get partialShards(): Array<CrystalizerShard> {
		return structuredClone(this.generated.shards);
	}

	get partialCrystal(): CrystalizerCrystal {
		return structuredClone(this.generated.crystal);
	}

	private makeWithMode(mode: CrystalizerMode) {
		return new Crystalizer({ ...this.opts, mode });
	}

	leaveAll(): Crystalizer {
		return this.makeWithMode({ type: 'all' });
	}

	leaveNone(): Crystalizer {
		return this.makeWithMode({ type: 'none' });
	}

	leaveCount(count: number): Crystalizer {
		return this.makeWithMode({ type: 'count', count });
	}

	leaveUntil(until: CrystalizerTimeSelector): Crystalizer {
		return this.makeWithMode({ type: 'until', until });
	}

	leaveSelected(selector: CrystalizerShardSelector): Crystalizer {
		return this.makeWithMode({ type: 'selected', selector });
	}
}

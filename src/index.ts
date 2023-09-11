type ModeLeaveAll = {
	type: 'all';
};

type ModeLeaveNone = {
	type: 'none';
};

type ModeLeaveCount = {
	type: 'count';
	count: number;
};

type ModeLeaveUntil = {
	type: 'until';
	until: TimeSelector;
};

type ShardSelector<Shard> = (shard: Shard) => boolean;
type TimeSelector = (ts?: number) => number;

type ModeLeaveSelected<Shard> = {
	type: 'selected';
	selector: ShardSelector<Shard>;
};

type Mode<Shard> =
	| ModeLeaveAll
	| ModeLeaveNone
	| ModeLeaveCount
	| ModeLeaveUntil
	| ModeLeaveSelected<Shard>;

type OptsRequired<Crystal, Shard> = {
	initial: Crystal;
	reducer: (acc: Crystal, shard: Shard) => Crystal;
};

type OptsOptional<Shard> = {
	shards?: Array<Shard>;
	tsKey?: string;
	mode?: Mode<Shard>;
	ptrFromEnd?: number;
	throwPtrBounds?: boolean;
};

interface Opts<Crystal, Shard>
	extends OptsRequired<Crystal, Shard>,
		OptsOptional<Shard> {}

type Generated<Crystal, Shard> = {
	crystal: Crystal;
	finalCrystal: Crystal;
	shards: Array<Shard>;
};

type Primitive = string | number | boolean | null | undefined;
type PlainObject = {
	[key: string]: Primitive | Primitive[] | PlainObject;
};

/* For now, let's restrict this to PlainObject. Later on, we can support
 * other types like Maps */
export default class Crystalizer<
	Crystal extends PlainObject = PlainObject,
	Shard extends PlainObject = Crystal,
> {
	private opts: Opts<Crystal, Shard>;
	private _generated: Generated<Crystal, Shard>;

	constructor(opts: Opts<Crystal, Shard>) {
		const defaultOptions: OptsOptional<Shard> = {
			tsKey: 'ts',
			mode: { type: 'all' },
			shards: [],
			ptrFromEnd: 0,
			throwPtrBounds: false,
		};

		this.opts = { ...defaultOptions, ...opts };

		if (
			this.opts.shards.some(
				(shard) => typeof shard[this.opts.tsKey] != 'number',
			)
		) {
			throw new Error(
				`Every shard must have the key "${this.opts.tsKey}" as a number`,
			);
		}

		if (this.opts.throwPtrBounds) {
			if (
				this.opts.ptrFromEnd < 0 ||
				this.opts.ptrFromEnd >= this.opts.shards.length
			) {
				throw new RangeError(
					`Crystalizer pointer out of bounds. Expected between 0 and ${
						this.opts.shards.length - 1
					}, got ${this.opts.ptrFromEnd}`,
				);
			}
		} else {
			this.opts.ptrFromEnd = Math.max(
				0,
				Math.min(this.opts.ptrFromEnd, this.opts.shards.length - 1),
			);
		}
	}

	with(shards: Shard | Array<Shard>): Crystalizer<Crystal, Shard> {
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

	without(selector: ShardSelector<Shard>) {
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

	headFind(seek: (shard: Shard) => boolean) {
		const index = this.opts.shards.findIndex((shard) => seek(shard));

		return new Crystalizer({
			...this.opts,
			ptrFromEnd: this.opts.shards.length - index,
		});
	}

	headLast() {
		return new Crystalizer({ ...this.opts, ptrFromEnd: 0 });
	}

	private reduceInto(shards: Array<Shard>, crystal: Crystal): Crystal {
		return shards.reduce(this.opts.reducer, crystal);
	}

	private generate(): Generated<Crystal, Shard> {
		let shards = [...this.opts.shards].sort((a, b) => {
			return (a[this.opts.tsKey] as number) - (b[this.opts.tsKey] as number);
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
					return shards.findIndex((shard: Shard) => {
						return (shard[this.opts.tsKey] as number) >= until;
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

	private get generated(): Generated<Crystal, Shard> {
		if (!this._generated) {
			this._generated = this.generate();
		}
		return this._generated;
	}

	asCrystal(): Crystal {
		return structuredClone(this.generated.finalCrystal);
	}

	get partialShards(): Array<Shard> {
		return structuredClone(this.generated.shards);
	}

	get partialCrystal(): Crystal {
		return structuredClone(this.generated.crystal);
	}

	private makeWithMode(mode: Mode<Shard>) {
		return new Crystalizer({ ...this.opts, mode });
	}

	leaveAll(): Crystalizer<Crystal, Shard> {
		return this.makeWithMode({ type: 'all' });
	}

	leaveNone(): Crystalizer<Crystal, Shard> {
		return this.makeWithMode({ type: 'none' });
	}

	leaveCount(count: number): Crystalizer<Crystal, Shard> {
		return this.makeWithMode({ type: 'count', count });
	}

	leaveUntil(until: TimeSelector): Crystalizer<Crystal, Shard> {
		return this.makeWithMode({ type: 'until', until });
	}

	leaveSelected(selector: ShardSelector<Shard>): Crystalizer<Crystal, Shard> {
		return this.makeWithMode({ type: 'selected', selector });
	}
}

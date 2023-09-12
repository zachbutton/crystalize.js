import * as Immutable from 'seamless-immutable';

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
type TimeSelector = (ts: number) => number;

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
	makeImmutable?: (obj: object) => object;
	harden?: boolean;
};

interface Opts<Crystal, Shard>
	extends OptsRequired<Crystal, Shard>,
		OptsOptional<Shard> {}

type Generated<Crystal, Shard> = {
	crystal: Crystal;
	shards: Array<Shard>;
};

type EditorOp = { type: string; value: any };

type Primitive = string | number | boolean | null | undefined;
type PlainObject = {
	[key: string]: Primitive | Primitive[] | PlainObject;
};

class Editor<
	Crystal extends PlainObject = PlainObject,
	Shard extends PlainObject = Crystal,
> {
	private _opList: Array<EditorOp> = [];

	private push(type: string, value?: any) {
		this._opList.push({ type, value });
		return this;
	}

	getModifiedOpts(opts: Opts<Crystal, Shard>) {
		// in case the user made a lot of separate editor.with(...).with(...) calls,
		// merge them for equivalent performance
		const opListCombinedWithCalls = this._opList.reduce((opList, op) => {
			if (op.type == 'with') {
				if (opList[0]?.type != 'with') {
					opList.unshift({ type: 'with', value: [] });
				}
				op.value.forEach((shard: Shard) => {
					opList[0].value.push(shard);
				});
			} else {
				opList.push(op);
			}
			return opList;
		}, []);

		return opListCombinedWithCalls.reduce((opts, op) => {
			return {
				...opts,
				...(this.getSingleOpt(opts, op) as Opts<Crystal, Shard>),
			};
		}, opts);
	}

	getSingleOpt(opts: Opts<Crystal, Shard>, op: EditorOp) {
		switch (op.type) {
			case 'headInc':
				return { ptrFromEnd: opts.ptrFromEnd + op.value * -1 };
			case 'headFind':
				const index = opts.shards.findIndex((shard) => op.value(shard));
				if (index == -1) {
					return {};
				}
				return { ptrFromEnd: opts.shards.length - index - 1 };
			case 'with':
				return { shards: [...opts.shards, ...op.value] };
			case 'without':
				return { shards: opts.shards.filter((shard) => !op.value(shard)) };
			case 'leaveAll':
				return { mode: { type: 'all' } };
			case 'leaveNone':
				return { mode: { type: 'none' } };
			case 'leaveCount':
				return { mode: { type: 'count', count: op.value } };
			case 'leaveUntil':
				return { mode: { type: 'until', until: op.value } };
			case 'leaveSelected':
				return { mode: { type: 'selected', until: op.value } };
		}
	}

	headInc(inc: number) {
		return this.push('headInc', inc);
	}

	headFind(seek: (shard: Shard) => boolean) {
		return this.push('headFind', seek);
	}

	headLast() {
		return this.push('headLast');
	}

	with(shards: Shard | Array<Shard>) {
		shards = shards instanceof Array ? shards : [shards];
		return this.push('with', shards);
	}

	without(seek: ShardSelector<Shard>) {
		return this.push('without', seek);
	}

	leaveAll() {
		return this.push('leaveAll');
	}

	leaveNone() {
		return this.push('leaveNone');
	}

	leaveCount(count: number) {
		return this.push('leaveCount', count);
	}

	leaveUntil(until: TimeSelector) {
		return this.push('leaveUntil', until);
	}

	leaveSelected(selector: ShardSelector<Shard>) {
		return this.push('leaveSelected', selector);
	}
}

const defaultOptions = {
	tsKey: 'ts',
	mode: { type: 'all' },
	shards: [],
	ptrFromEnd: 0,
	makeImmutable: (obj: object) => Immutable(obj),
};
/* For now, let's restrict this to PlainObject. Later on, we can support
 * other types like Maps */
export class Crystalizer<
	Crystal extends PlainObject = PlainObject,
	Shard extends PlainObject = Crystal,
> {
	private opts: Opts<Crystal, Shard>;
	private _generated: Generated<Crystal, Shard>;

	constructor(opts: Opts<Crystal, Shard>) {
		this.opts = { ...(defaultOptions as Opts<Crystal, Shard>), ...opts };

		if (this.opts.harden) {
			this._harden();
			this.opts.harden = false;
		}
	}

	modify(
		modifyFn: (fn: Editor<Crystal, Shard>) => Editor<Crystal, Shard> | void,
	) {
		let editor = new Editor<Crystal, Shard>();
		modifyFn(editor);

		const preModifiedOpts = this.hardened()
			? {
					...this.opts,
					initial: this.generated.crystal,
					shards: this.generated.shards,
			  }
			: this.opts;
		const opts = editor.getModifiedOpts(preModifiedOpts);

		return new Crystalizer<Crystal, Shard>(opts);
	}

	private reduceInto(shards: Array<Shard>, crystal: Crystal): Crystal {
		return shards.reduce(this.opts.reducer, crystal);
	}

	private _harden() {
		let shards = [...this.opts.shards].sort((a, b) => {
			return (a[this.opts.tsKey] as number) - (b[this.opts.tsKey] as number);
		});

		let splitIndex = (() => {
			switch (this.opts.mode.type) {
				case 'all':
					return 0;
				case 'none':
					return shards.length;
				case 'count':
					return shards.length - this.opts.mode.count;
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

		console.log(
			splitIndex,
			shards.length,
			this.opts.ptrFromEnd,
			Math.min(splitIndex, shards.length - this.opts.ptrFromEnd),
		);

		splitIndex = Math.min(splitIndex, shards.length - this.opts.ptrFromEnd);

		const crystalizedShards = shards.slice(0, splitIndex);
		shards = shards.slice(splitIndex);

		const crystal = this.reduceInto(crystalizedShards, this.opts.initial);

		this._generated = this.opts.makeImmutable({
			crystal,
			shards,
		}) as Generated<Crystal, Shard>;
	}

	harden() {
		if (this.hardened()) {
			return this;
		}

		return new Crystalizer({ ...this.opts, harden: true });
	}

	hardened() {
		return !!this._generated;
	}

	private get generated() {
		if (!this.hardened()) {
			throw new Error('Cannot get hardened values on non-hardened Crystalizer');
		}

		return this._generated;
	}

	asCrystal() {
		return this.reduceInto(this.partialShards, this.partialCrystal);
	}

	get partialCrystal() {
		return this.generated.crystal;
	}

	get partialShards() {
		return this.generated.shards.slice(
			0,
			this.generated.shards.length - this.opts.ptrFromEnd,
		);
	}
}

// const defaultOptions = {
// 	tsKey: 'ts',
// 	mode: { type: 'all' },
// 	shards: [],
// 	ptrFromEnd: 0,
// 	throwPtrBounds: false,
// 	makeImmutable: (obj: object) => Immutable(obj),
// };
// /* For now, let's restrict this to PlainObject. Later on, we can support
//  * other types like Maps */
// export class Crystalizer<
// 	Crystal extends PlainObject = PlainObject,
// 	Shard extends PlainObject = Crystal,
// > {
// 	private opts: Opts<Crystal, Shard>;
//
// 	constructor(opts: Opts<Crystal, Shard>) {
// 		opts = { ...(defaultOptions as Opts<Crystal, Shard>), ...opts };
//
// 		this.opts = opts;
// 	}
//
// 	with(shards: Shard | Array<Shard>): Crystalizer<Crystal, Shard> {
// 		shards = shards instanceof Array ? shards : [shards];
// 		shards = shards.map((shard) => {
// 			/* explicitly allows override of timestamp */
// 			return { [this.opts.tsKey]: +new Date(), ...shard };
// 		});
//
// 		// TODO: Potential optimization: Pass this.generated.[shards|crystal] here
// 		return new Crystalizer({
// 			...this.opts,
// 			shards: [...this.shards, ...shards],
// 		});
// 	}
//
// 	without(selector: ShardSelector<Shard>) {
// 		const shards = this.shards.filter((shard) => !selector(shard));
//
// 		return new Crystalizer({ ...this.opts, shards });
// 	}
//
// 	headInc(inc: number) {
// 		/* inc is inverted because the internal pointer counts from the end of the
// 		 * shard array. This is more intuitive to the end-user, because this way,
// 		 * negative values move into the past, and positive values, the future */
// 		return new Crystalizer({
// 			...this.opts,
// 			ptrFromEnd: this.opts.ptrFromEnd + inc * -1,
// 		});
// 	}
//
// 	headFind(seek: (shard: Shard) => boolean) {
// 		const index = this.shards.findIndex((shard) => seek(shard));
//
// 		if (index === -1) {
// 			return this;
// 		}
//
// 		return new Crystalizer({
// 			...this.opts,
// 			ptrFromEnd: this.shards.length - index - 1,
// 		});
// 	}
//
// 	headLast() {
// 		return new Crystalizer({ ...this.opts, ptrFromEnd: 0 });
// 	}
//
// 	private reduceInto(shards: Array<Shard>, crystal: Crystal): Crystal {
// 		return shards.reduce(this.opts.reducer, crystal);
// 	}
//
// 	private generate(): Generated<Crystal, Shard> {
// 		let shards = [...this.shards].sort((a, b) => {
// 			return (a[this.opts.tsKey] as number) - (b[this.opts.tsKey] as number);
// 		});
//
// 		shards = shards.slice(0, shards.length - this.opts.ptrFromEnd);
//
// 		const splitIndex = (() => {
// 			switch (this.opts.mode.type) {
// 				case 'all':
// 					return 0;
// 				case 'none':
// 					return shards.length;
// 				case 'count':
// 					return this.opts.mode.count - 1;
// 				case 'until':
// 					const until = this.opts.mode.until(+new Date());
// 					return shards.findIndex((shard: Shard) => {
// 						return (shard[this.opts.tsKey] as number) >= until;
// 					});
// 				case 'selected':
// 					const select = this.opts.mode.selector.bind(this.opts.mode);
// 					return shards.findIndex((shard) => select(shard));
// 			}
// 		})();
//
// 		const crystalizedShards = shards.slice(0, splitIndex);
// 		shards = shards.slice(splitIndex);
//
// 		const crystal = this.reduceInto(crystalizedShards, this.crystal);
// 		const finalCrystal = this.reduceInto(shards, crystal);
//
// 		return this.opts.makeImmutable({
// 			crystal,
// 			shards,
// 			finalCrystal,
// 		}) as Generated<Crystal, Shard>;
// 	}
//
// 	private get generated(): Generated<Crystal, Shard> {
// 		if (!this._generated) {
// 			this._generated = this.generate();
// 		}
// 		return this._generated;
// 	}
//
// 	asCrystal(): Crystal {
// 		return this.generated.finalCrystal as Crystal;
// 	}
//
// 	get partialShards(): Array<Shard> {
// 		return this.generated.shards as Array<Shard>;
// 	}
//
// 	get partialCrystal(): Crystal {
// 		return this.generated.crystal as Crystal;
// 	}
//
// 	private makeWithMode(mode: Mode<Shard>) {
// 		return new Crystalizer({ ...this.opts, mode });
// 	}
//
// 	leaveAll(): Crystalizer<Crystal, Shard> {
// 		return this.makeWithMode({ type: 'all' });
// 	}
//
// 	leaveNone(): Crystalizer<Crystal, Shard> {
// 		return this.makeWithMode({ type: 'none' });
// 	}
//
// 	leaveCount(count: number): Crystalizer<Crystal, Shard> {
// 		return this.makeWithMode({ type: 'count', count });
// 	}
//
// 	leaveUntil(until: TimeSelector): Crystalizer<Crystal, Shard> {
// 		return this.makeWithMode({ type: 'until', until });
// 	}
//
// 	leaveSelected(selector: ShardSelector<Shard>): Crystalizer<Crystal, Shard> {
// 		return this.makeWithMode({ type: 'selected', selector });
// 	}
// }

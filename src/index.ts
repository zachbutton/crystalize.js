import deepCopy from './utils/deepCopy';

export type Primitive = string | number | boolean | null | undefined;
export type PlainObject = {
    [key: string]: Primitive | Primitive[] | PlainObject;
};

export type ShardSeekFn<Shard> = (shard: Readonly<Shard>) => boolean;

export type Keep<Shard> =
    | ['all']
    | ['none']
    | ['count', number]
    | ['first', ShardSeekFn<Shard>]
    | ['since', number]
    | ['min', Keep<Shard>[]]
    | ['max', Keep<Shard>[]];

export type CrystalizerReducer<Crystal, ExtShard, TsKey extends string> = (
    crystal: Readonly<Crystal>,
    shard: Readonly<FullShard<ExtShard, TsKey>>,
) => Crystal;

export type SingleSort<Shard> = ['asc' | 'desc', string | ShardSeekFn<Shard>];

export type FullShard<ExtShard, TsKey extends string> = 
	ExtShard & Record<TsKey, number>;

export type UserOpts<Crystal, Shard, ExtShard, TsKey extends string> = {
    initial: Crystal;
    reduce: CrystalizerReducer<Crystal, ExtShard, TsKey>;
    map?: (shard: Readonly<Shard>) => FullShard<ExtShard, TsKey>;
    keep?: Keep<FullShard<ExtShard, TsKey>>;
    sort?: SingleSort<Shard> | SingleSort<Shard>[];
    tsKey?: string;
};


type InternalOpts<ExtShard, TsKey extends string> = {
    __newShards?: FullShard<ExtShard, TsKey>[];
    __ptr?: number;
    __focus?: ShardSeekFn<FullShard<ExtShard, TsKey>>;
    __getTime?: () => number;
};

interface Opts<Crystal, Shard, ExtShard, TsKey extends string>
    extends UserOpts<Crystal, Shard, ExtShard, TsKey>,
        InternalOpts<ExtShard, TsKey> {}

export default class Crystalizer<
    Crystal extends PlainObject = PlainObject,
    Shard extends PlainObject = Crystal,
    ExtShard extends PlainObject = Shard,
	TsKey extends string = 'ts',
> {
    private opts: Readonly<Opts<Crystal, Shard, ExtShard, TsKey>>;

    private state?: {
        crystal: Crystal;
        shards: FullShard<ExtShard, TsKey>[];
    };

    private takeCache: {
        [count: number]: { crystal: Crystal; shards: FullShard<ExtShard, TsKey>[] };
    } = {};

    private sorts: SingleSort<FullShard<ExtShard, TsKey>>[];

    constructor(_opts: UserOpts<Crystal, Shard, ExtShard, TsKey> | Opts<Crystal, Shard, ExtShard, TsKey>) {
        let opts: Opts<Crystal, Shard, ExtShard, TsKey> = {
            keep: ['all'],
            map: (v) => v as unknown as FullShard<ExtShard, TsKey>,
            __newShards: [],
            __ptr: 0,
            __getTime: () => Date.now(),
            ..._opts,
        };

        this.state = {
            shards: deepCopy(opts.__newShards),
            crystal: deepCopy(opts.initial),
        };

        if (opts.sort) {
            const isMultisort = opts.sort[0] instanceof Array;

            this.sorts = (
                isMultisort ? opts.sort : [opts.sort]
            ) as SingleSort<FullShard<ExtShard, TsKey>>[];
        } else {
            this.sorts = [];
        }

        if (opts.tsKey) {
            this.sorts.unshift(['asc', opts.tsKey]);
        }

        opts.__ptr = Math.max(0, opts.__ptr);

        this.opts = opts;
    }

    public static Builder<
        Crystal extends PlainObject = PlainObject,
        Shard extends PlainObject = Crystal,
		ExtShard extends PlainObject = Shard,
		TsKey extends string = 'ts',
    >(opts: UserOpts<Crystal, Shard, ExtShard, TsKey>) {
        function make(custom: Partial<UserOpts<Crystal, Shard, ExtShard, TsKey>> = {}) {
            return new Crystalizer<Crystal, Shard, ExtShard, TsKey>({ ...opts, ...custom });
        }

        make.toJSON = () => {};

        return make;

        // return {
        //     make: () => new Crystalizer<Crystal, Shard>(opts),
        //     // fromJSON(json: string) {
        //     //     let state: { crystal: Crystal; shards: Shard[] };
        //     //
        //     //     try {
        //     //         state = JSON.parse(json);
        //     //
        //     //         if (!(state.crystal instanceof Object)) {
        //     //             throw new Error(
        //     //                 'JSON missing `crystal` or of wrong type',
        //     //             );
        //     //         }
        //     //         if (!(state.shards instanceof Array)) {
        //     //             throw new Error(
        //     //                 'JSON missing `shards` or of wrong type',
        //     //             );
        //     //         }
        //     //     } catch (e) {
        //     //         throw new Error(
        //     //             'Crystalizer.toJSON expected JSON of form { crystal: {}, shards: [] }. ' +
        //     //                 'Got: `' +
        //     //                 json +
        //     //                 '`. Error: ' +
        //     //                 e,
        //     //         );
        //     //     }
        //     //
        //     //     const c = new Crystalizer<Crystal, Shard>({
        //     //         ...opts,
        //     //         initial: state.crystal,
        //     //     });
        //     //
        //     //     return c.with(state.shards);
        //     // },
        // };
    }
    //
    // toJSON() {
    //     return JSON.stringify({
    //         crystal: this.partialCrystal,
    //         shards: this.partialShards,
    //     });
    // }

    leave(count: number | ((n: number) => number)) {
        count = count instanceof Function ? count(this.opts.__ptr) : count;
        return this.buildNew({ __ptr: count, __focus: null });
    }

    focus(seek: ShardSeekFn<FullShard<ExtShard, TsKey>>) {
        return this.buildNew({ __focus: seek, __ptr: 0 });
    }

    with(shards: Shard | Shard[]) {
        const _shards = 
			deepCopy(shards instanceof Array ? shards : [shards]) as 
			unknown as FullShard<ExtShard, TsKey>[];

        if (this.opts.map || this.opts.tsKey) {
            for (let i = 0; i < _shards.length; i++) {
                if (this.opts.map) {
                    _shards[i] = this.opts.map(shards[i]);
                }
                if (this.opts.tsKey) {
                    _shards[i] = {
                        [this.opts.tsKey]: this.opts.__getTime(),
                        ..._shards[i],
                    };
                }
            }
        }

        const limit = this.opts.__ptr == 0 ? Infinity : -this.opts.__ptr;

        const newShards = this.state.shards.slice(0, limit).concat(_shards);
        this.sortMutate(newShards);

        return this.buildNew({
            __ptr: 0,
            __newShards: newShards,
        });
    }

    without(seek: ShardSeekFn<FullShard<ExtShard, TsKey>>) {
        const limit = this.opts.__ptr == 0 ? Infinity : -this.opts.__ptr;

        return this.buildNew({
            __ptr: 0,
            __newShards: this.state.shards
                .filter((s) => !seek(s))
                .slice(0, limit),
        });
    }

    take(count: number = Infinity) {
        const keepCount = this.getKeepCount(count);

        const { crystal: old, shards } = this.consume(keepCount);

        // TODO: We could reduce `shards` into `old' to get the final crystal
        // This should be handled inside `.consume()` by always using the
        // next-least keepCount to reduce the rest
        const { crystal: final } = this.consume(0);

        return [final, shards, old];
    }

    private buildNew(opts: Partial<Opts<Crystal, Shard, ExtShard, TsKey>>) {
        const newOpts: Opts<Crystal, Shard, ExtShard, TsKey> = {
            ...this.opts,
            initial: this.state.crystal,
            __newShards: this.state.shards,
            ...opts,
        };
        return new Crystalizer<Crystal, Shard, ExtShard, TsKey>(newOpts);
    }

    private getPtrIndex(shards: FullShard<ExtShard, TsKey>[]) {
        if (this.opts.__focus) {
            const index = shards.findIndex(this.opts.__focus);
            return index == -1 ? 0 : shards.length - index - 1;
        }

        return this.opts.__ptr;
    }

    private reduceInto(crystal: Crystal, shards: FullShard<ExtShard, TsKey>[]): Crystal {
        return shards.reduce(
            (crystal, shard) => this.opts.reduce(crystal, shard),
            crystal,
        );
    }

    private getKeepCount(
        wanted: number,
        maxKeepRules: Keep<FullShard<ExtShard, TsKey>> = this.opts.keep,
    ): number {
        if (wanted == 0) {
            return 0;
        }

        const shards = this.state.shards;

        const [type, param] = maxKeepRules;

        const max = (() => {
            switch (type) {
                case 'all':
                    return shards.length;
                case 'none':
                    return 0;
                case 'count': {
                    return param;
                }
                case 'first':
                    return (
                        shards.length -
                        shards.findIndex((shard) => param(shard))
                    );
                case 'since': {
                    if (!this.opts.tsKey) {
                        throw new Error(
                            'Crystalizer instantiated in keepSince keep must have a tsKey',
                        );
                    }

                    const pastDistance = param;
                    const ts = this.opts.__getTime() - pastDistance;

                    const index = shards.findIndex(
                        (shard) => (shard[this.opts.tsKey] as number) >= ts,
                    );

                    return index == -1 ? 0 : shards.length - index;
                }
                case 'min': {
                    const keepCounts = param.map((m) =>
                        this.getKeepCount(wanted, m),
                    );
                    return Math.min(...keepCounts);
                }
                case 'max': {
                    const keepCounts = param.map((m) =>
                        this.getKeepCount(wanted, m),
                    );
                    return Math.max(...keepCounts);
                }
            }
        })();

        return Math.min(wanted, max);
    }

    private sortMutate(shards: FullShard<ExtShard, TsKey>[]): void {
        if (!this.sorts.length) {
            return;
        }

        const getSortVal = (
            shard: FullShard<ExtShard, TsKey>,
            key: string | ((s: FullShard<ExtShard, TsKey>) => unknown),
        ) => {
            if (key instanceof Function) {
                return key(shard);
            }

            return shard[key];
        };

        shards.sort((a: FullShard<ExtShard, TsKey>, b: FullShard<ExtShard, TsKey>) => {
            for (let i = 0; i < this.sorts.length; i++) {
                const [dir, key] = this.sorts[i];
                const l = dir == 'asc' ? a : b;
                const r = dir == 'asc' ? b : a;

                const lVal = getSortVal(l, key),
                    rVal = getSortVal(r, key);
                if (lVal === rVal) {
                    continue;
                } else if (typeof lVal == 'number' && typeof rVal == 'number') {
                    return lVal - rVal;
                } else if (lVal < rVal) {
                    return -1;
                } else if (lVal > rVal) {
                    return 1;
                }
            }

            return 0;
        });
    }

    private consume(keepCount: number) {
        keepCount = this.getKeepCount(keepCount);

        if (!this.takeCache[keepCount]) {
            let { crystal, shards } = deepCopy(this.state);

            const ptr = this.getPtrIndex(shards);

            if (ptr != 0) {
                shards = shards.slice(0, -ptr);
            }

            const shardsToCrystalizeRangeFromEnd = keepCount - ptr;

            const shardsToCrystalize = shards.splice(
                0,
                shards.length - shardsToCrystalizeRangeFromEnd,
            );

            crystal = this.reduceInto(crystal, shardsToCrystalize);

            this.takeCache[keepCount] = { crystal, shards };
        }

        return this.takeCache[keepCount];
    }
}

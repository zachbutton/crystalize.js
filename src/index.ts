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

export type CrystalizerReducer<Crystal, Shard> = (
    crystal: Readonly<Crystal>,
    shard: Readonly<Shard>,
) => Crystal;

export type SingleSort<Shard> = ['asc' | 'desc', string | ShardSeekFn<Shard>];

export type UserOpts<Crystal, Shard> = {
    initial: Crystal;
    reduce: CrystalizerReducer<Crystal, Shard>;
    map?: (shard: Readonly<Shard>) => Shard;
    keep?: Keep<Shard>;
    sort?: SingleSort<Shard> | SingleSort<Shard>[];
    tsKey?: string;
};

type InternalOpts<Shard> = {
    __newShards?: Shard[];
    __ptr?: number;
    __focus?: ShardSeekFn<Shard>;
    __getTime?: () => number;
};

interface Opts<Crystal, Shard>
    extends UserOpts<Crystal, Shard>,
        InternalOpts<Shard> {}

export default class Crystalizer<
    Crystal extends PlainObject = PlainObject,
    Shard extends PlainObject = Crystal,
> {
    private opts: Readonly<Opts<Crystal, Shard>>;

    private state?: {
        crystal: Crystal;
        shards: Shard[];
    };

    private takeCache: {
        [count: number]: { crystal: Crystal; shards: Shard[] };
    } = {};

    private sorts: SingleSort<Shard>[];

    constructor(_opts: UserOpts<Crystal, Shard> | Opts<Crystal, Shard>) {
        let opts: Opts<Crystal, Shard> = {
            keep: ['all'],
            map: (v) => v,
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
            ) as SingleSort<Shard>[];
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
    >(opts: UserOpts<Crystal, Shard>) {
        function make(custom: Partial<UserOpts<Crystal, Shard>> = {}) {
            return new Crystalizer<Crystal, Shard>({ ...opts, ...custom });
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

    focus(seek: ShardSeekFn<Shard>) {
        return this.buildNew({ __focus: seek, __ptr: 0 });
    }

    with(shards: Shard | Shard[]) {
        shards = deepCopy(shards instanceof Array ? shards : [shards]);

        if (this.opts.map || this.opts.tsKey) {
            for (let i = 0; i < shards.length; i++) {
                if (this.opts.map) {
                    shards[i] = this.opts.map(shards[i]);
                }
                if (this.opts.tsKey) {
                    shards[i] = {
                        [this.opts.tsKey]: this.opts.__getTime(),
                        ...shards[i],
                    };
                }
            }
        }

        const limit = this.opts.__ptr == 0 ? Infinity : -this.opts.__ptr;

        const newShards = this.state.shards.slice(0, limit).concat(shards);
        this.sortMutate(newShards);

        return this.buildNew({
            __ptr: 0,
            __newShards: newShards,
        });
    }

    without(seek: ShardSeekFn<Shard>) {
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

    private buildNew(opts: Partial<Opts<Crystal, Shard>>) {
        const newOpts = {
            ...this.opts,
            initial: this.state.crystal,
            __newShards: this.state.shards,
            ...opts,
        };
        return new Crystalizer<Crystal, Shard>(newOpts);
    }

    private getPtrIndex(shards: Shard[]) {
        if (this.opts.__focus) {
            const index = shards.findIndex(this.opts.__focus);
            return index == -1 ? 0 : shards.length - index - 1;
        }

        return this.opts.__ptr;
    }

    private getShardsLimitedByPtr(shards: Shard[]) {
        const ptr = this.getPtrIndex(shards);
        if (ptr == 0) {
            return shards;
        }

        return shards.slice(0, -ptr);
    }

    private reduceInto(crystal: Crystal, shards: Shard[]): Crystal {
        return shards.reduce(
            (crystal, shard) => this.opts.reduce(crystal, shard),
            crystal,
        );
    }

    private getKeepCount(
        wanted: number,
        maxKeepRules: Keep<Shard> = this.opts.keep,
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

    private sortMutate(shards: Shard[]): void {
        if (!this.sorts.length) {
            return;
        }

        const getSortVal = (
            shard: Shard,
            key: string | ((s: Shard) => unknown),
        ) => {
            if (key instanceof Function) {
                return key(shard);
            }

            return shard[key];
        };

        shards.sort((a: Shard, b: Shard) => {
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

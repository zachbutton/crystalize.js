import deepCopy from './utils/deepCopy';

type Primitive = string | number | boolean | null | undefined;
type PlainObject = {
    [key: string]: Primitive | Primitive[] | PlainObject;
};

export type ShardSeekFn<Shard> = (shard: Readonly<Shard>) => boolean;
export type ShardSortFn<Shard> = (
    a: Readonly<Shard>,
    b: Readonly<Shard>,
) => number;

type ModeKeepAll = { type: 'keepAll' };
type ModeKeepNone = { type: 'keepNone' };
type ModeKeepCount = { type: 'keepCount'; count: number };
// TODO: Come up with a better name for keepAfter
type ModeKeepUntil<Shard> = { type: 'keepAfter'; seek: ShardSeekFn<Shard> };
type ModeKeepSince = { type: 'keepSince'; since: (now: number) => number };
type ModeKeepMin<Shard> = { type: 'keepMin'; modes: Mode<Shard>[] };
type ModeKeepMax<Shard> = { type: 'keepMax'; modes: Mode<Shard>[] };

type Mode<Shard> =
    | ModeKeepAll
    | ModeKeepNone
    | ModeKeepCount
    | ModeKeepUntil<Shard>
    | ModeKeepSince
    | ModeKeepMin<Shard>
    | ModeKeepMax<Shard>;

type PtrFinderAbsolute = { type: 'absolute'; ptr: number };
type PtrFinderSeek<Shard> = { type: 'seek'; seek: ShardSeekFn<Shard> };
type PtrFinder<Shard> = PtrFinderAbsolute | PtrFinderSeek<Shard>;

type CrystalizerReducer<Crystal, Shard> = (
    crystal: Readonly<Crystal>,
    shard: Readonly<Shard>,
) => Crystal;

type Opts<Crystal, Shard> = {
    initial: Crystal;
    reducer: CrystalizerReducer<Crystal, Shard>;
    copy?: <T>(obj: T) => T;
    mode?: Mode<Shard>;
    sort?: ShardSortFn<Shard>;
    tsKey?: string;
    __newShards?: Shard[];
    __harden?: boolean;
    __ptrFinder?: PtrFinder<Shard>;
    __getTime?: () => number;
};

export default class Crystalizer<
    Crystal extends PlainObject = PlainObject,
    Shard extends PlainObject = Crystal,
> {
    private opts: Opts<Crystal, Shard>;

    private _generated?: {
        crystal: Crystal;
        shards: Shard[];
        finalCrystal?: Crystal;
    };

    constructor(opts: Opts<Crystal, Shard>) {
        opts = {
            mode: { type: 'keepAll' },
            copy: deepCopy,
            __newShards: [],
            __ptrFinder: { type: 'absolute', ptr: 0 },
            __getTime: () => +new Date(),
            ...opts,
        };

        if (opts.tsKey && opts.sort) {
            throw new Error(
                `Cannot construct Crystalizer with tsKey and sort simultaneously.`,
            );
        }

        opts.initial = opts.copy(opts.initial);

        this.opts = opts;

        if (this.opts.__harden) {
            this._harden();
            this.opts.__harden = false;
        }
    }

    withHeadAt(ptr: number) {
        // We invert 'inc' here because, internally, ptr indicates the distance from
        // the end of the shard array (most recent). But in the exposed interface,
        // for sake of intuitiveness, negative values move the pointer into the
        // past, while positive values move the pointer into the future.
        return this.buildNew({
            __ptrFinder: { type: 'absolute', ptr: -ptr },
        });
    }

    withHeadTop() {
        // TODO: For some reason, a test fails if we pass 0 here, because then
        // withHeadAt inverts it to -0. So, I'm passing in -0 here so that it
        // can be inverted to normal 0 which the test can correctly check for.
        // The todo here is to figure out why 0 != -0
        // It can probably be solved by doing `ptr * -1` instead of `-ptr`
        // inside of withHeadAt, but this problem is weird and amusing, so I
        // will keep it here until I can figure out what's happening.
        return this.withHeadAt(-0);
    }

    withHeadInc(inc: number) {
        if (this.opts.__ptrFinder.type != 'absolute') {
            throw new Error(
                "Can only increment head when it's set to an absolute value. Call headTop or headSet first.",
            );
        }

        return this.withHeadAt(-this.opts.__ptrFinder.ptr + inc);
    }

    withHeadSeek(seek: ShardSeekFn<Shard>) {
        return this.buildNew({
            __ptrFinder: { type: 'seek', seek },
        });
    }

    with(shards: Shard | Shard[]) {
        shards = this.opts.copy(shards instanceof Array ? shards : [shards]);

        if (this.opts.tsKey) {
            const now = this.opts.__getTime();
            shards = shards.map((s) => ({ [this.opts.tsKey]: now, ...s }));
        }

        const ptrReset: PtrFinder<Shard> =
            this.opts.__ptrFinder.type == 'absolute'
                ? { type: 'absolute', ptr: 0 }
                : this.opts.__ptrFinder;

        return this.buildNew({
            __ptrFinder: ptrReset,
            __newShards: this.pendingShards.concat(shards),
        });
    }

    without(seek: ShardSeekFn<Shard>) {
        const ptrReset: PtrFinder<Shard> =
            this.opts.__ptrFinder.type == 'absolute'
                ? { type: 'absolute', ptr: 0 }
                : this.opts.__ptrFinder;

        return this.buildNew({
            __ptrFinder: ptrReset,
            __newShards: this.pendingShards.filter((s) => !seek(s)),
        });
    }

    harden() {
        if (this.hardened) {
            return this;
        }

        return this.buildNew({
            __harden: true,
        });
    }

    get last(): Shard {
        const shards = this.partialShards;

        return this.opts.copy(shards[shards.length - 1]);
    }

    get partialCrystal(): Crystal {
        const crystal: Crystal = this.generated.crystal;
        return this.opts.copy(crystal);
    }

    get partialShards(): Shard[] {
        const shards: Shard[] = this.getShardsLimitedByPtr(
            this.generated.shards,
        );
        return this.opts.copy(shards);
    }

    asCrystal(): Crystal {
        if (!this.generated.finalCrystal) {
            this.generated.finalCrystal = this.reduceInto(
                this.generated.crystal,
                this.getShardsLimitedByPtr(this.generated.shards),
            );
        }

        return this.opts.copy(this.generated.finalCrystal);
    }

    private get pendingShards() {
        return this.hardened ? this.generated.shards : this.opts.__newShards;
    }

    private get pendingCrystal() {
        return this.hardened ? this.generated.crystal : this.opts.initial;
    }

    private buildNew(opts: Partial<Opts<Crystal, Shard>>) {
        const newOpts = {
            ...this.opts,
            initial: this.pendingCrystal,
            __newShards: this.pendingShards,
            ...opts,
        };
        return new Crystalizer<Crystal, Shard>(newOpts);
    }

    private getPtrIndex(shards: Shard[]) {
        switch (this.opts.__ptrFinder.type) {
            case 'absolute':
                return this.opts.__ptrFinder.ptr;
            case 'seek':
                const index = shards.findIndex(this.opts.__ptrFinder.seek);
                return index == -1 ? 0 : shards.length - index - 1;
        }
    }

    private getShardsLimitedByPtr(shards: Shard[]) {
        const ptr = this.getPtrIndex(shards);
        if (ptr == 0) {
            return shards;
        }

        return shards.slice(0, -ptr);
    }

    private get generated() {
        if (!this.hardened) {
            throw new Error(
                'Attempt to get hardened values on un-hardened Crystalizer instance.',
            );
        }

        return this._generated;
    }

    private reduceInto(crystal: Crystal, shards: Shard[]): Crystal {
        return shards.reduce(
            (crystal, shard) => this.opts.reducer(crystal, shard),
            crystal,
        );
    }

    private get hardened() {
        return !!this._generated;
    }

    private _harden() {
        let crystal = this.opts.initial;
        let shards = this.opts.copy(this.pendingShards || []);

        if (this.opts.sort) {
            shards.sort(this.opts.sort);
        }

        if (this.opts.tsKey) {
            const k = this.opts.tsKey;
            shards.sort((a, b) => (a[k] as number) - (b[k] as number));
        }

        const getKeepCount = (mode: Mode<Shard>) => {
            switch (mode.type) {
                case 'keepAll':
                    return shards.length;
                case 'keepNone':
                    return 0;
                case 'keepCount':
                    return mode.count;
                case 'keepAfter':
                    const seek = mode.seek;
                    return (
                        shards.length - shards.findIndex((shard) => seek(shard))
                    );
                case 'keepSince':
                    if (!this.opts.tsKey) {
                        throw new Error(
                            'Crystalizer instantiated in keepSince mode must have a tsKey',
                        );
                    }

                    const ts = mode.since(this.opts.__getTime());

                    const index = shards.findIndex(
                        (shard) => (shard[this.opts.tsKey] as number) >= ts,
                    );
                    return index == -1 ? 0 : shards.length - index;
                case 'keepMin': {
                    const keepCounts = mode.modes.map(getKeepCount);
                    return Math.min(...keepCounts);
                }
                case 'keepMax': {
                    const keepCounts = mode.modes.map(getKeepCount);
                    return Math.max(...keepCounts);
                }
            }
        };

        const amountKept = getKeepCount(this.opts.mode);

        const ptr = this.getPtrIndex(shards);

        const shardsToCrystalizeRangeFromEnd = amountKept + ptr;

        if (shardsToCrystalizeRangeFromEnd <= shards.length) {
            const shardsToCrystalize =
                shardsToCrystalizeRangeFromEnd == 0
                    ? shards
                    : shards.slice(0, -shardsToCrystalizeRangeFromEnd);

            shards = shards.slice(shardsToCrystalize.length);
            crystal = this.reduceInto(crystal, shardsToCrystalize);
        }

        this._generated = { crystal, shards };

        this.opts.__newShards = [];
        Object.freeze(this.opts.__newShards);
        // it's not important to reset __newShards, because it wont be used
        // by this instance anymore. But let's clear and freeze it just to
        // ensure it's not being passed along to future instances accidentally
        // (see this.pendingShards)
    }
}

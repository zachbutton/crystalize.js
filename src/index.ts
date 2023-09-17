import deepCopy from './utils/deepCopy';

type Primitive = string | number | boolean | null | undefined;
type PlainObject = {
    [key: string]: Primitive | Primitive[] | PlainObject;
};

type ShardSeekFn<Shard> = (shard: Readonly<Shard>) => boolean;
type ShardSortFn<Shard> = (a: Readonly<Shard>, b: Readonly<Shard>) => number;

type ModeKeepAll = { type: 'keepAll' };
type ModeKeepNone = { type: 'keepNone' };
type ModeKeepCount = { type: 'keepCount'; count: number };
type ModeKeepUntil<Shard> = { type: 'keepAfter'; seek: ShardSeekFn<Shard> };

type Mode<Shard> =
    | ModeKeepAll
    | ModeKeepNone
    | ModeKeepCount
    | ModeKeepUntil<Shard>;

type PtrFinderAbsolute = { type: 'absolute'; ptr: number };
type PtrFinderSeek<Shard> = { type: 'seek'; seek: ShardSeekFn<Shard> };
type PtrFinder<Shard> = PtrFinderAbsolute | PtrFinderSeek<Shard>;

type Opts<Crystal, Shard> = {
    initial: Readonly<Crystal>;
    reducer: (crystal: Crystal, shard: Shard) => Crystal;
    copy?: (obj: unknown) => unknown;
    mode?: Mode<Shard>;
    sort?: ShardSortFn<Shard>;
    tsKey?: string;
    __newShards?: Readonly<Shard[]>;
    __harden?: boolean;
    __ptrFinder?: PtrFinder<Shard>;
    __getTime?: () => number;
};

export class Crystalizer<
    Crystal extends PlainObject = PlainObject,
    Shard extends PlainObject = Crystal,
> {
    private opts: Opts<Crystal, Shard>;

    private _generated?: {
        crystal: Readonly<Crystal>;
        shards: Readonly<Shard[]>;
        finalCrystal?: Readonly<Crystal>;
    };

    constructor(opts: Opts<Crystal, Shard>) {
        opts = {
            mode: { type: 'keepAll' },
            copy: deepCopy,
            ...opts,
        };

        if (opts.tsKey && opts.sort) {
            throw new Error(
                `Cannot construct Crystalizer with tsKey and sort simultaneously.`,
            );
        }

        opts.initial = opts.copy(opts.initial) as Crystal;
        opts.__newShards = opts.__newShards || [];
        opts.__ptrFinder = opts.__ptrFinder || { type: 'absolute', ptr: 0 };
        opts.__getTime = opts.__getTime || (() => +new Date());

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
            ...this.opts,
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

    withHeadSeek() {
        throw new Error('Not yet implemented');
    }

    with(shards: Shard | Shard[]) {
        shards = this.opts.copy(
            shards instanceof Array ? shards : [shards],
        ) as Shard[];

        if (this.opts.tsKey) {
            const now = this.opts.__getTime();
            shards = shards.map((s) => ({ [this.opts.tsKey]: now, ...s }));
        }

        return this.buildNew({
            ...this.opts,
            __newShards: this.pendingShards.concat(shards),
        });
    }

    without(seek: ShardSeekFn<Shard>) {
        return this.buildNew({
            ...this.opts,
            __newShards: this.pendingShards.filter((s) => !seek(s)),
        });
    }

    private get pendingShards() {
        return this.hardened ? this.generated.shards : this.opts.__newShards;
    }

    private get pendingCrystal() {
        return this.hardened ? this.generated.crystal : this.opts.initial;
    }

    private buildNew(opts: Opts<Crystal, Shard>) {
        const newOpts = {
            initial: this.pendingCrystal,
            __newShards: this.pendingShards,
            ...opts,
        };
        return new Crystalizer<Crystal, Shard>(newOpts);
    }

    private getPtrIndex(shards: Readonly<Shard[]>) {
        switch (this.opts.__ptrFinder.type) {
            case 'absolute':
                return this.opts.__ptrFinder.ptr;
            case 'seek':
                return (
                    shards.length - shards.findIndex(this.opts.__ptrFinder.seek)
                );
        }
    }

    private getShardsLimitedByPtr(shards: Readonly<Shard[]>) {
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

    private reduceInto(crystal: Crystal, shards: Readonly<Shard[]>): Crystal {
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
        let shards: Shard[] = this.opts.copy(
            this.pendingShards || [],
        ) as Shard[];

        if (this.opts.sort) {
            shards.sort(this.opts.sort);
        }

        const amountKept = (() => {
            switch (this.opts.mode.type) {
                case 'keepAll':
                    return shards.length;
                case 'keepNone':
                    return 0;
                case 'keepCount':
                    return this.opts.mode.count;
                case 'keepAfter':
                    const seek = this.opts.mode.seek;
                    return (
                        shards.length - shards.findIndex((shard) => seek(shard))
                    );
            }
        })();

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
    }

    harden() {
        if (this.hardened) {
            return this;
        }

        return this.buildNew({
            ...this.opts,
            __harden: true,
        });
    }

    get last() {
        const shards = this.partialShards;

        return this.opts.copy(shards[shards.length - 1]) as Shard;
    }

    get partialCrystal() {
        const crystal: Crystal = this.generated.crystal;
        return this.opts.copy(crystal) as Crystal;
    }

    get partialShards() {
        const shards: Readonly<Shard[]> = this.getShardsLimitedByPtr(
            this.generated.shards,
        );
        return this.opts.copy(shards) as Shard[];
    }

    asCrystal() {
        if (!this.generated.finalCrystal) {
            this.generated.finalCrystal = this.reduceInto(
                this.generated.crystal,
                this.getShardsLimitedByPtr(this.generated.shards),
            );
        }

        return this.opts.copy(this.generated.finalCrystal) as Crystal;
    }
}

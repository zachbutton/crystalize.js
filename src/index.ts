import * as Immutable from 'seamless-immutable';

type Primitive = string | number | boolean | null | undefined;
type PlainObject = {
    [key: string]: Primitive | Primitive[] | PlainObject;
};

type Immutizer = <T>(obj: T) => Readonly<T>;

type ShardSeekFn<Shard> = (shard: Shard) => boolean;

type ModeKeepAll = { type: 'keepAll' };
type ModeKeepNone = { type: 'keepNone' };
type ModeKeepCount = { type: 'keepCount'; count: number };
type ModeKeepUntil<Shard> = { type: 'keepSeekFirst'; seek: ShardSeekFn<Shard> };

type Mode<Shard> =
    | ModeKeepAll
    | ModeKeepNone
    | ModeKeepCount
    | ModeKeepUntil<Shard>;

type ModificationWith<Shard> = {
    type: 'with';
    shards: Array<Shard>;
};

type ModificationWithout<Shard> = {
    type: 'without';
    seek: ShardSeekFn<Shard>;
};

type Modification<Shard> = ModificationWith<Shard> | ModificationWithout<Shard>;

type ModifierInterface<Shard> = {
    with: (shards: Shard | Array<Shard>) => ModifierInterface<Shard>;
    without: (seek: ShardSeekFn<Shard>) => ModifierInterface<Shard>;
    getModifications: () => Array<Modification<Shard>>;
};

type ModifierFn<Shard> = (modifier: ModifierInterface<Shard>) => any;

type PtrFinderAbsolute = { type: 'absolute'; ptr: number };
type PtrFinderSeek<Shard> = { type: 'seek'; seek: ShardSeekFn<Shard> };
type PtrFinder<Shard> = PtrFinderAbsolute | PtrFinderSeek<Shard>;

type Opts<Crystal, Shard> = {
    initial: Crystal;
    reducer: (crystal: Crystal, shard: Shard) => Crystal;
    makeImmutable?: Immutizer;
    mode?: Mode<Shard>;
    __shards?: Readonly<Shard[]>;
    __harden?: boolean;
    __ptrFinder?: PtrFinder<Shard>;
};

const useSeamlessImmutable: Immutizer = <T>(obj: T) => {
    return Immutable(obj) as T;
};

class Modifier<Shard> {
    private modifications: Array<Modification<Shard>> = [];

    with(shards: Shard | Array<Shard>) {
        shards = shards instanceof Array ? shards : [shards];
        this.modifications.push({ type: 'with', shards });
        return this;
    }

    without(seek: ShardSeekFn<Shard>) {
        this.modifications.push({ type: 'without', seek });
        return this;
    }

    getModifications() {
        return this.modifications;
    }
}

export class Crystalizer<
    Crystal extends PlainObject = PlainObject,
    Shard extends PlainObject = Crystal,
> {
    private opts: Opts<Crystal, Shard>;

    private _generated?: { crystal: Crystal; shards: Array<Shard> };
    private finalCrystal?: Crystal;

    constructor(opts: Opts<Crystal, Shard>) {
        opts.mode = opts.mode || { type: 'keepAll' };
        opts.makeImmutable = opts.makeImmutable || useSeamlessImmutable;

        opts.initial = opts.makeImmutable(opts.initial);
        opts.__shards = opts.makeImmutable(opts.__shards || []);
        opts.__ptrFinder = opts.__ptrFinder || { type: 'absolute', ptr: 0 };

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
        return new Crystalizer({
            ...this.opts,
            __ptrFinder: { type: 'absolute', ptr: -ptr },
        });
    }

    withHeadTop() {
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

    private overloadOptsWithModifications(mods: Array<Modification<Shard>>) {
        const [crystal, shards] = this.hardened
            ? [this.generated.crystal, this.generated.shards]
            : [this.opts.initial, this.opts.__shards];

        const startingOpts: Opts<Crystal, Shard> = {
            ...this.opts,
            // during modification, remove all dead shards that are beyond the
            // pointer and clear the pointer
            __shards: this.getShardsLimitedByPtr(shards),
            __ptrFinder: { type: 'absolute', ptr: 0 },
            initial: crystal,
        };

        return mods.reduce(
            (opts: Opts<Crystal, Shard>, mod: Modification<Shard>) => {
                switch (mod.type) {
                    case 'with':
                        return {
                            ...opts,
                            __shards: [...opts.__shards, ...mod.shards],
                        };
                    case 'without':
                        return {
                            ...opts,
                            __shards: shards.filter((s) => !mod.seek(s)),
                        };
                }
            },
            startingOpts,
        );
    }

    modify(fn: ModifierFn<Shard>) {
        const modifier: ModifierInterface<Shard> = new Modifier<Shard>();

        fn(modifier);

        const modifications = modifier.getModifications();

        const newOpts = this.overloadOptsWithModifications(modifications);

        return new Crystalizer<Crystal, Shard>(newOpts);
    }

    private get generated() {
        if (!this.hardened) {
            throw new Error(
                'Attempt to get hardened values on un-hardened Crystalizer instance.',
            );
        }

        return this._generated;
    }

    private reduceInto(
        crystal: Crystal,
        shards: Readonly<Array<Shard>>,
    ): Crystal {
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
        let shards = [...(this.opts.__shards || [])];
        // TODO: Add ability to construct with sort function, and implement here

        const amountKept = (() => {
            switch (this.opts.mode.type) {
                case 'keepAll':
                    return shards.length;
                case 'keepNone':
                    return 0;
                case 'keepCount':
                    return this.opts.mode.count;
                case 'keepSeekFirst':
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

        this._generated = this.opts.makeImmutable({ crystal, shards });
    }

    harden() {
        if (this.hardened) {
            return this;
        }

        return new Crystalizer<Crystal, Shard>({
            ...this.opts,
            __harden: true,
        });
    }

    get partialCrystal() {
        return this.generated.crystal;
    }

    get partialShards() {
        return this.getShardsLimitedByPtr(this.generated.shards);
    }

    asCrystal() {
        if (!this.finalCrystal) {
            this.finalCrystal = this.opts.makeImmutable(
                this.reduceInto(
                    this.generated.crystal,
                    this.getShardsLimitedByPtr(this.generated.shards),
                ),
            );
        }

        return this.finalCrystal;
    }
}

import Crystalizer, { ShardSeekFn, UserOpts, Keep } from '../src/index';

interface Opts<Crystal, Shard> extends UserOpts<Crystal, Shard> {
    [any: string]: any;
}

type Crystal = { total: number };
type Shard = { id: number; value: number };

const TS_KEY = 'ts';

const makeShards = (count, firstId = 0): Shard[] =>
    Array(count)
        .fill(null)
        .map((_, i) => ({
            value: 2,
            id: i + firstId + 1,
        }));

const makeIncer = () => {
    let i = 0;
    return () => i++;
};

const withRecordedCrst = (
    opts: Partial<Opts<Crystal, Shard>>,
    onCall: (
        crystalizer: Crystalizer<Crystal, Shard>,
        nth: number,
        name: string,
        ...args: any
    ) => void,
) => {
    let nth = 0;
    let crst = new Crystalizer<Crystal, Shard>({
        initial: { total: 0 },
        reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
        __getTime: makeIncer(),
        ...opts,
    });

    const recordFn = (name: string) => {
        const fn = crst[name];
        crst[name] = (...args: unknown[]) => {
            crst = fn.call(crst, ...args);
            applyRecorders(crst);
            onCall(crst, nth++, name, args);
            return crst;
        };
    };

    const applyRecorders = (crst: Crystalizer<Crystal, Shard>) => {
        recordFn('with');
        recordFn('without');
        recordFn('leave');
        recordFn('focus');
    };

    applyRecorders(crst);

    return () => crst;
};

const simulateCall = (state, opts, fn, args) => {
    let [p1] = args;
    switch (fn) {
        case 'with': {
            if (opts.tsKey) {
                p1 = p1.map((s) => ({
                    [opts.tsKey]: state.now(),
                    ...s,
                }));
            }
            if (opts.map) {
                p1 = p1.map(opts.map);
            }
            const limit = state.ptr === 0 ? Infinity : -state.ptr;
            let newShards = state.shards.slice(0, limit).concat(p1);

            let sorts = opts.sort;
            if (sorts) {
                sorts = sorts[0] instanceof Array ? sorts : [sorts];
            } else {
                sorts = [];
            }

            if (opts.tsKey) {
                sorts.unshift(['asc', opts.tsKey]);
            }

            newShards.sort((a, b) => {
                for (let i = 0; i < sorts.length; i++) {
                    const [dir, key] = sorts[i];
                    let [l, r]: any[] = dir == 'asc' ? [a, b] : [b, a];

                    l = key instanceof Function ? key(l) : l[key];
                    r = key instanceof Function ? key(r) : r[key];

                    if (l === r) {
                        continue;
                    } else if (l < r) {
                        return -1;
                    } else if (l > r) {
                        return 1;
                    }
                }
                return 0;
            });

            return {
                ...state,
                shards: newShards,
                ptr: 0,
            };
        }
        case 'without': {
            const limit = state.ptr === 0 ? Infinity : -state.ptr;
            return {
                ...state,
                shards: state.shards.slice(0, limit).filter((s) => !p1(s)),
                ptr: 0,
            };
        }
        case 'leave': {
            return {
                ...state,
                ptr: Math.max(0, p1 instanceof Function ? p1(state.ptr) : p1),
                focus: null,
            };
        }
        case 'focus': {
            return {
                ...state,
                focus: p1,
                ptr: 0,
            };
        }
    }
};

const getOptsKeep = (
    state: any,
    opts: Opts<Crystal, Shard>,
    _keep?: Keep<Shard>,
) => {
    const shards = state.shards as Shard[];
    const keep = _keep || opts.keep;
    if (!keep) {
        return Infinity;
    }

    const [type, param] = keep;

    switch (type) {
        case 'count': {
            return param;
        }
        case 'none': {
            return 0;
        }
        case 'first': {
            const index = shards.findIndex(param);
            return shards.length - index;
        }
        case 'since': {
            const ts = state.now() - param;
            const index = shards.findIndex((s) => {
                return s[TS_KEY] >= ts;
            });
            return shards.length - index;
        }
        case 'min': {
            return Math.min(
                ...param.map((keep) => getOptsKeep(state, opts, keep)),
            );
        }
        case 'max': {
            return Math.max(
                ...param.map((keep) => getOptsKeep(state, opts, keep)),
            );
        }
    }

    return Infinity;
};

const generateResult = (state, opts, takeCount?: number) => {
    let shards = state.shards.slice();

    takeCount = takeCount === undefined ? Infinity : takeCount;
    takeCount = Math.min(takeCount, getOptsKeep(state, opts));

    let ptr: number;

    if (state.focus) {
        const index = shards.findIndex(state.focus);
        ptr = index == -1 ? state.ptr : state.shards.length - index - 1;
    } else {
        ptr = state.ptr;
    }

    if (ptr > 0) {
        shards = shards.slice(0, -ptr);
    }

    const endDist = takeCount - ptr;

    const toCrystal = shards.splice(0, shards.length - endDist);

    const old = toCrystal.reduce(opts.reduce, opts.initial);
    const crystal = shards.reduce(opts.reduce, old);

    return [crystal, shards, old];
};

const testScenario = (
    name: string,
    _opts: Partial<Opts<Crystal, Shard>>,
    fn: (c: Crystalizer<Crystal, Shard>) => void,
) => {
    describe(name, () => {
        const getCrst = withRecordedCrst(_opts, (crst, nth, fn, args) => {
            state = simulateCall(state, getOpts(), fn, args);

            const actual = crst.take();
            const expected = generateResult(state, getOpts());

            it('output check of call #' + nth, () => {
                expect(actual).toEqual(expected);
            });
        });

        const getOpts = () => (getCrst() as any).opts;

        let state = {
            crystal: getOpts().initial,
            shards: [],
            ptr: 0,
            focus: null,
            takeCount: undefined,
            now: _opts.__getTime ? _opts.__getTime : makeIncer(),
        };

        fn(getCrst());
    });
};

describe('Crystalizer', () => {
    const testChainMethods = (
        name: string,
        opts: Partial<Opts<Crystal, Shard>>,
        extraScenario?: (c: Crystalizer<Crystal, Shard>) => void,
    ) => {
        describe('in opts[' + name + ']', () => {
            if (extraScenario) {
                testScenario('extras', opts, extraScenario);
            }

            testScenario('with', opts, (c) => {
                c.with(makeShards(10));
            });

            testScenario('with->without', opts, (c) => {
                c.with(makeShards(10)).without((s) => s.id == 3);
            });

            testScenario('with->without->with', opts, (c) => {
                c.with(makeShards(10))
                    .without((s) => s.id == 3)
                    .with(makeShards(5));
            });

            testScenario('with->leave', opts, (c) => {
                c.with(makeShards(10)).leave(2);
            });

            testScenario('with->focus', opts, (c) => {
                c.with(makeShards(10)).focus((s) => s.id == 7);
            });

            testScenario('with->leave->with', opts, (c) => {
                c.with(makeShards(10)).leave(2).with(makeShards(7));
            });

            testScenario('with->focus->with', opts, (c) => {
                c.with(makeShards(10))
                    .focus((s) => s.id == 7)
                    .with(makeShards(7));
            });

            testScenario('with->leave->without', opts, (c) => {
                c.with(makeShards(10))
                    .leave(2)
                    .without((s) => s.id == 4)
                    .without((s) => s.id == 7);
            });

            testScenario('with->focus->without', opts, (c) => {
                c.with(makeShards(10))
                    .focus((s) => s.id == 7)
                    .without((s) => s.id == 4)
                    .without((s) => s.id == 7);
            });

            testScenario('with->leave->focus', opts, (c) => {
                c.with(makeShards(10))
                    .leave(7)
                    .focus((s) => s.id == 3);
            });

            testScenario('with->focus->leave', opts, (c) => {
                c.with(makeShards(10))
                    .focus((s) => s.id == 3)
                    .leave(7);
            });

            testScenario(
                'with->leave->focus->with->without->with',
                opts,
                (c) => {
                    c.with(makeShards(10))
                        .leave(7)
                        .focus((s) => s.id == 3)
                        .with(makeShards(10))
                        .without((s) => s.id == 9)
                        .with(makeShards(3));
                },
            );

            testScenario(
                'with->focus->leave->with->without->with',
                opts,
                (c) => {
                    c.with(makeShards(10))
                        .focus((s) => s.id == 3)
                        .leave(7)
                        .with(makeShards(10))
                        .without((s) => s.id == 9)
                        .with(makeShards(3));
                },
            );

            testScenario('with->focus->without(focused.id)', opts, (c) => {
                c.with(makeShards(10))
                    .focus((s) => s.id == 7)
                    .without((s) => s.id == 7);
            });

            testScenario('with->focus(no_find)', opts, (c) => {
                c.with(makeShards(10)).focus((s) => false);
            });
        });
    };

    testChainMethods('defaults', {});

    testChainMethods('map', {
        map: (shard) => ({ ...shard, newKey: 'k_' + shard.id }),
    });

    testChainMethods(
        'tsKey',
        {
            tsKey: TS_KEY,
            sort: ['desc', 'id'],
        },
        (c: Crystalizer<Crystal, Shard>) => {
            c = c
                .with(makeShards(10))
                .with([
                    { id: 102, value: 3, [TS_KEY]: 2 },
                    { id: 105, value: 3, [TS_KEY]: 103 },
                    { id: 103, value: 3, [TS_KEY]: 101 },
                    { id: 100, value: 3, [TS_KEY]: 0 },
                    { id: 107, value: 3, [TS_KEY]: 0 },
                    { id: 104, value: 3, [TS_KEY]: 102 },
                    { id: 101, value: 3, [TS_KEY]: 1 },
                ] as unknown as Shard[])
                .with(makeShards(10));
        },
    );

    testChainMethods(
        'keep => since',
        {
            tsKey: TS_KEY,
            sort: ['desc', 'id'],
            keep: ['since', 3],
            __getTime: () => 10,
        },
        (c: Crystalizer<Crystal, Shard>) => {
            c = c.with([
                { id: 102, value: 3, [TS_KEY]: 3 },
                { id: 105, value: 3, [TS_KEY]: 9 },
                { id: 103, value: 3, [TS_KEY]: 4 },
                { id: 100, value: 3, [TS_KEY]: 8 },
                { id: 107, value: 3, [TS_KEY]: 5 },
                { id: 104, value: 3, [TS_KEY]: 7 },
                { id: 101, value: 3, [TS_KEY]: 6 },
            ] as unknown as Shard[]);
        },
    );

    testChainMethods('keep => all', { keep: ['all'] });
    testChainMethods('keep => none', { keep: ['none'] });

    testChainMethods('keep => count:5', { keep: ['count', 5] });
    testChainMethods('keep => count:10', { keep: ['count', 10] });
    testChainMethods('keep => count:20', { keep: ['count', 20] });

    testChainMethods('keep => .id->3', { keep: ['first', (s) => s.id == 3] });
    testChainMethods('keep => .id->9', { keep: ['first', (s) => s.id == 9] });

    testChainMethods('keep => min[count:5, .id->3]', {
        keep: [
            'min',
            [
                ['count', 5],
                ['first', (s) => s.id == 3],
            ],
        ],
    });
    testChainMethods('keep => min[count:5, .id->7]', {
        keep: [
            'min',
            [
                ['count', 5],
                ['first', (s) => s.id == 7],
            ],
        ],
    });

    testChainMethods('keep => max[count:5, .id->3]', {
        keep: [
            'max',
            [
                ['count', 5],
                ['first', (s) => s.id == 3],
            ],
        ],
    });
    testChainMethods('keep => max[count:5, .id->7]', {
        keep: [
            'max',
            [
                ['count', 5],
                ['first', (s) => s.id == 7],
            ],
        ],
    });
});

import Crystalizer, { ShardSeekFn, Opts, Keep } from '../src/index';

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
        name: string,
        ...args: any
    ) => void,
) => {
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
            onCall(crst, name, args);
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
    let [p1, p2, ...pRest] = args;
    switch (fn) {
        case 'with': {
            if (opts.tsKey) {
                p1 = p1.map((s) => ({
                    ...s,
                    [opts.tsKey]: state.now(),
                }));
            }
            if (opts.map) {
                p1 = p1.map(opts.map);
            }
            const limit = state.ptr === 0 ? Infinity : -state.ptr;
            let newShards = state.shards.slice(0, limit).concat(p1);
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

const getOptsKeep = (shards: Shard[], keep: Keep<Shard>) => {
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
        case 'min': {
            return Math.min(...param.map((keep) => getOptsKeep(shards, keep)));
        }
        case 'max': {
            return Math.max(...param.map((keep) => getOptsKeep(shards, keep)));
        }
    }

    return Infinity;
};

const testScenario = (
    _opts: Opts<Crystal, Shard>,
    fn: (c: Crystalizer<Crystal, Shard>) => void,
) => {
    const getCrst = withRecordedCrst(_opts, (crst, fn, args) => {
        state = simulateCall(state, getOpts(), fn, args);

        const actual = crst.take();
        const expected = generateResult(state.takeCount);

        it('generates correct crystal|shard|old', () => {
            //console.log('\n\n\n\n ACTUAL', actual, 'EXPECTED', expected);
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
        now: makeIncer(),
    };

    const generateResult = (takeCount?: number) => {
        takeCount = takeCount === undefined ? Infinity : takeCount;

        takeCount = Math.min(
            takeCount,
            getOptsKeep(state.shards, getOpts().keep),
        );

        let shards = state.shards.slice();

        if (getOpts().tsKey) {
            shards.sort(
                (a, b) => (a[TS_KEY] as number) - (b[TS_KEY] as number),
            );
        }

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

        const old = toCrystal.reduce(getOpts().reduce, getOpts().initial);
        const crystal = shards.reduce(getOpts().reduce, old);

        return [crystal, shards, old];
    };

    fn(getCrst());
};

describe('Crystalizer', () => {
    const testChainMethods = (name, opts) => {
        describe('#with basic' + (name ? ` :: ${name}` : ''), () => {
            testScenario(opts, (c) => {
                c = c.with(makeShards(10));
            });

            testScenario(opts, (c) => {
                c.with(makeShards(20))
                    .without((s) => s.id == 4)
                    .with(makeShards(2));
            });

            testScenario(opts, (c) => {
                c.with(makeShards(7));
            });

            testScenario(opts, (c) => {
                c.with(makeShards(10));
            });

            testScenario(opts, (c) => {
                c.with(makeShards(7));
            });

            describe('added timestamp shards get sorted correctly', () => {
                testScenario(opts, (c) => {
                    c.with(makeShards(10))
                        .with([
                            { id: 102, value: 3, [TS_KEY]: 2 },
                            { id: 105, value: 3, [TS_KEY]: 103 },
                            { id: 103, value: 3, [TS_KEY]: 101 },
                            { id: 100, value: 3, [TS_KEY]: 0 },
                            { id: 104, value: 3, [TS_KEY]: 102 },
                            { id: 101, value: 3, [TS_KEY]: 1 },
                        ] as unknown as Shard[])
                        .with(makeShards(10));
                });
            });

            describe('#leave', () => {
                testScenario(opts, (c) => {
                    c.with(makeShards(10)).leave(1);
                });

                testScenario(opts, (c) => {
                    c.with(makeShards(20)).leave(7);
                });

                testScenario(opts, (c) => {
                    c.with(makeShards(10)).leave(1);
                });

                testScenario(opts, (c) => {
                    c.with(makeShards(20)).leave(7);
                });

                testScenario(opts, (c) => {
                    c.with(makeShards(20))
                        .leave(10)
                        .leave((n) => n - 4);
                });

                testScenario(opts, (c) => {
                    c.with(makeShards(20))
                        .leave((n) => n + 4)
                        .leave(10);
                });

                // leaving high number should not break
                testScenario(opts, (c) => {
                    c.with(makeShards(20)).leave(1e100);
                });

                // leaving low negative number should not break
                testScenario(opts, (c) => {
                    c.with(makeShards(20)).leave(-1e100);
                });

                describe('#with destroys shards beyond pointer', () => {
                    testScenario(opts, (c) => {
                        c.with(makeShards(20)).leave(7).with(makeShards(1));
                    });

                    testScenario(opts, (c) => {
                        c.with(makeShards(20))
                            .leave(19)
                            .with(makeShards(1, 10));
                    });
                });
            });

            describe('#focus', () => {
                testScenario(opts, (c) => {
                    c.with(makeShards(10)).focus((s) => s.id == 3);
                });

                describe('#with preserves itself and shards', () => {
                    testScenario(opts, (c) => {
                        c = c
                            .with(makeShards(10))
                            .focus((s) => s.id == 7)
                            .with(makeShards(10, 10));

                        c.leave(-1);
                    });
                });
            });
        });
    };

    testChainMethods('defaults', {});

    testChainMethods('map', {
        map: (shard) => ({ ...shard, newKey: 'k_' + shard.id }),
    });

    testChainMethods('tsKey', {
        tsKey: TS_KEY,
    });

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
                ['count', 3],
                ['first', (s) => s.id == 3],
            ],
        ],
    });
    testChainMethods('keep => min[count:5, .id->7]', {
        keep: [
            'min',
            [
                ['count', 5],
                ['first', (s) => s.id == 3],
            ],
        ],
    });

    testChainMethods('keep => max[count:5, .id->3]', {
        keep: [
            'max',
            [
                ['count', 3],
                ['first', (s) => s.id == 3],
            ],
        ],
    });
    testChainMethods('keep => max[count:5, .id->7]', {
        keep: [
            'max',
            [
                ['count', 5],
                ['first', (s) => s.id == 3],
            ],
        ],
    });

    // const testChainMethods = (name, opts, expectResults) => {
    //     let m = () => make(opts);
    //     // TODO: For all of these, add more expect's with takeCount != undefined
    //     describe('#with basic' + (name ? ` -- ${name}` : ''), () => {
    //         let c: Crystalizer<Crystal, Shard>;
    //
    //         c = m().with(makeShards(10));
    //         expectResults(c, undefined, 20, 10, 0);
    //
    //         c = m().with(makeShards(7));
    //         expectResults(c, undefined, 14, 7, 0);
    //
    //         c = m().with(makeShards(10));
    //         expectResults(c, 3, 20, 3, 14);
    //
    //         c = m().with(makeShards(7));
    //         expectResults(c, 3, 14, 3, 8);
    //
    //         describe('#leave', () => {
    //             c = m().with(makeShards(10)).leave(1);
    //             expectResults(c, undefined, 18, 9, 0);
    //
    //             c = m().with(makeShards(20)).leave(7);
    //             expectResults(c, undefined, 26, 13, 0);
    //
    //             c = m().with(makeShards(10)).leave(1);
    //             expectResults(c, undefined, 18, 9, 0);
    //
    //             c = m().with(makeShards(20)).leave(7);
    //             expectResults(c, undefined, 26, 13, 0);
    //
    //             c = m()
    //                 .with(makeShards(20))
    //                 .leave(10)
    //                 .leave((n) => n - 4);
    //             expectResults(c, undefined, 28, 14, 0);
    //
    //             c = m()
    //                 .with(makeShards(20))
    //                 .leave((n) => n + 4)
    //                 .leave(10);
    //             expectResults(c, undefined, 20, 10, 0);
    //
    //             // leaving high number should not break
    //             c = m().with(makeShards(20)).leave(1e100);
    //             expectResults(c, undefined, 0, 0, 0);
    //
    //             // leaving low negative number should not break
    //             c = m().with(makeShards(20)).leave(-1e100);
    //             expectResults(c, undefined, 40, 20, 0);
    //
    //             describe('#with destroys shards beyond pointer', () => {
    //                 c = m().with(makeShards(20)).leave(7).with(makeShards(1));
    //                 expectResults(c, undefined, 28, 14, 0);
    //
    //                 c = m().with(makeShards(20)).leave(19).with(makeShards(1, 10));
    //                 expectResults(c, undefined, 4, 2, 0);
    //             });
    //         });
    //
    //         describe('#focus', () => {
    //             c = m()
    //                 .with(makeShards(10))
    //                 .focus((s) => s.id == 3);
    //             expectResults(c, undefined, 6, 3, 0);
    //
    //             describe('#with preserves itself and shards', () => {
    //                 c = m()
    //                     .with(makeShards(10))
    //                     .focus((s) => s.id == 7)
    //                     .with(makeShards(10, 10));
    //                 expectResults(c, undefined, 14, 7, 0);
    //
    //                 c = c.leave(0);
    //                 expectResults(c, undefined, 40, 20, 0);
    //             });
    //         });
    //     });
    // };
    //
    // testChainMethods(
    //     'defaults',
    //     {},
    //     (crystalizer, count, total, sLength, oTotal) => {
    //         it('#take produces correct values', () => {
    //             const [crystal, shards, old] = crystalizer.take(count);
    //
    //             const expected = [total, sLength, oTotal];
    //             expect([crystal.total, shards.length, old.total]).toEqual(
    //                 expected,
    //             );
    //         });
    //     },
    // );
    //
    // testChainMethods(
    //     'keep => all',
    //     { keep: ['all'] },
    //     (crystalizer, count, total, sLength, oTotal) => {
    //         it('#take produces correct values', () => {
    //             const [crystal, shards, old] = crystalizer.take(count);
    //
    //             const expected = [total, sLength, oTotal];
    //             expect([crystal.total, shards.length, old.total]).toEqual(
    //                 expected,
    //             );
    //         });
    //     },
    // );
    //
    // testChainMethods(
    //     'keep => none',
    //     { keep: ['none'] },
    //     (crystalizer, count, total) => {
    //         it('#take produces correct values', () => {
    //             const [crystal, shards, old] = crystalizer.take(count);
    //
    //             const expected = [total, 0, total];
    //             expect([crystal.total, shards.length, old.total]).toEqual(
    //                 expected,
    //             );
    //         });
    //     },
    // );
    //
    // testChainMethods(
    //     'keep => count',
    //     { keep: ['count', 2] },
    //     (crystalizer, count, total, sLength, oTotal) => {
    //         it('#take produces correct values', () => {
    //             const [crystal, shards, old] = crystalizer.take(count);
    //
    //             const ptr =
    //                 (crystalizer as any).getPtrIndex(
    //                     (crystalizer as any).state.shards,
    //                 ) || 0;
    //
    //             count = count === undefined ? Infinity : count;
    //             const taken = Math.min(count, Math.max(0, 2 - ptr));
    //
    //             if (total == 6) {
    //                 console.log(total, sLength, oTotal, taken);
    //             }
    //
    //             sLength = taken;
    //             oTotal = total - taken * 2;
    //
    //             const expected = [total, sLength, oTotal];
    //             expect([crystal.total, shards.length, old.total]).toEqual(
    //                 expected,
    //             );
    //         });
    //     },
    // );
    //
    // testChainMethods(
    //     'keep => first',
    //     { keep: ['first', (s) => s.id == 5] },
    //     (crystalizer, count, total, sLength, oTotal) => {
    //         // discards 4
    //         // c = m().with(makeShards(20)).leave(19).with(makeShards(1));
    //         // expectResults(c, undefined, 4, 2, 0);
    //         it('#take produces correct values', () => {
    //             const [crystal, shards, old] = crystalizer.take(count);
    //
    //             const ptr =
    //                 (crystalizer as any).getPtrIndex(
    //                     (crystalizer as any).state.shards,
    //                 ) || 0;
    //
    //             if (total == 4) {
    //                 console.log(crystalizer.take(), ptr);
    //             }
    //
    //             const taken =
    //                 count === undefined
    //                     ? Math.max(0, sLength - 4)
    //                     : Math.min(count, 6);
    //
    //             sLength = taken;
    //             oTotal = total - taken * 2;
    //
    //             const expected = [total, sLength, oTotal];
    //             expect([crystal.total, shards.length, old.total]).toEqual(
    //                 expected,
    //             );
    //         });
    //     },
    // );
    //
    // describe('#map', () => {
    //     it('maps all shards', () => {
    //         let c = makeCrystalizer({
    //             map: (shard) => ({
    //                 ...shard,
    //                 someNumber: shard.value * 2 + shard.id,
    //             }),
    //         });
    //
    //         c = c.with(makeShards(3));
    //
    //         const [_, s] = c.take();
    //
    //         expect(s).toEqual([
    //             { id: 1, value: 2, someNumber: 5 },
    //             { id: 2, value: 2, someNumber: 6 },
    //             { id: 3, value: 2, someNumber: 7 },
    //         ]);
    //     });
    // });
    //
    // describe('#sort', () => {
    //     it('sorts shards with one or multiple sorts', () => {
    //         let c;
    //         let s;
    //         c = makeCrystalizer({
    //             sort: ['desc', 'id'],
    //         });
    //
    //         c = c.with(makeShards(3));
    //
    //         s = c.take()[1]; // [1] is shards
    //
    //         expect(s).toEqual([
    //             { id: 3, value: 2 },
    //             { id: 2, value: 2 },
    //             { id: 1, value: 2 },
    //         ]);
    //
    //         c = makeCrystalizer({
    //             sort: [
    //                 ['asc', 'num'],
    //                 ['desc', 'letter'],
    //             ],
    //         });
    //
    //         c = c.with([
    //             { id: 0, value: 2, num: 1, letter: 'a' },
    //             { id: 0, value: 2, num: 2, letter: 'b' },
    //             { id: 0, value: 2, num: 1, letter: 'c' },
    //             { id: 0, value: 2, num: 2, letter: 'd' },
    //             { id: 0, value: 2, num: 1, letter: 'e' },
    //             { id: 0, value: 2, num: 2, letter: 'f' },
    //         ]);
    //
    //         [, s] = c.take();
    //
    //         expect(s).toEqual([
    //             { id: 0, value: 2, num: 1, letter: 'e' },
    //             { id: 0, value: 2, num: 1, letter: 'c' },
    //             { id: 0, value: 2, num: 1, letter: 'a' },
    //             { id: 0, value: 2, num: 2, letter: 'f' },
    //             { id: 0, value: 2, num: 2, letter: 'd' },
    //             { id: 0, value: 2, num: 2, letter: 'b' },
    //         ]);
    //
    //         c = makeCrystalizer({
    //             sort: [
    //                 ['asc', (s) => (s as any).num],
    //                 ['desc', (s) => (s as any).letter],
    //             ],
    //         });
    //
    //         c = c.with([
    //             { id: 0, value: 2, num: 1, letter: 'a' },
    //             { id: 0, value: 2, num: 2, letter: 'b' },
    //             { id: 0, value: 2, num: 1, letter: 'c' },
    //             { id: 0, value: 2, num: 2, letter: 'd' },
    //             { id: 0, value: 2, num: 1, letter: 'e' },
    //             { id: 0, value: 2, num: 2, letter: 'f' },
    //         ]);
    //
    //         [, s] = c.take();
    //
    //         expect(s).toEqual([
    //             { id: 0, value: 2, num: 1, letter: 'e' },
    //             { id: 0, value: 2, num: 1, letter: 'c' },
    //             { id: 0, value: 2, num: 1, letter: 'a' },
    //             { id: 0, value: 2, num: 2, letter: 'f' },
    //             { id: 0, value: 2, num: 2, letter: 'd' },
    //             { id: 0, value: 2, num: 2, letter: 'b' },
    //         ]);
    //     });
    // });
});

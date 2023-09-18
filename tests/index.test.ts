import Crystalizer from '../src/index';

describe('Crystalizer', () => {
    const add = (
        crystalizer: Crystalizer<any>,
        qty: number,
        startingId: number = 0,
    ) => {
        const newShards = Array(qty)
            .fill(0)
            .map((_, i) => ({ value: 2, id: startingId + i }));

        return crystalizer.with(newShards);
    };

    const setup = (opts: object = {}) => {
        return new Crystalizer<
            { total: number },
            { value: number; id?: number; ts?: number }
        >({
            initial: { total: 0 },
            reducer: (crystal, shard) => ({
                total: crystal.total + shard.value,
            }),
            ...opts,
        });
    };

    const testBasicAddedShards = (c: Crystalizer, cTot, pLen, pTot) => {
        it('has correct generated values', () => {
            expect(c.harden().asCrystal().total).toBe(cTot);
            expect(c.harden().partialShards.length).toBe(pLen);
            expect(c.harden().partialCrystal.total).toBe(pTot);
        });
    };

    describe('modes', () => {
        it('defaults to keepAll', () => {
            expect((setup() as unknown as any).opts.mode.type).toBe('keepAll');
        });

        describe('keepAll', () => {
            const c = add(setup({ mode: { type: 'keepAll' } }), 10);

            testBasicAddedShards(c, 20, 10, 0);
        });

        describe('keepNone', () => {
            const c = add(setup({ mode: { type: 'keepNone' } }), 10);

            testBasicAddedShards(c, 20, 0, 20);
        });
        describe('keepCount', () => {
            const c = add(setup({ mode: { type: 'keepCount', count: 5 } }), 10);

            testBasicAddedShards(c, 20, 5, 10);
        });
        describe('keepAfter', () => {
            const seek = (shard: any) => shard.id == 2;
            const c = add(setup({ mode: { type: 'keepAfter', seek } }), 10);

            testBasicAddedShards(c, 20, 8, 4);
        });
        describe('keepSince', () => {
            let c = setup({
                initial: { total: 0 },
                reducer: (c, s) => ({ total: c.total + s.value }),
                __getTime: () => 110,
                tsKey: 'ts',
                mode: {
                    type: 'keepSince',
                    since: (t) => t - 10,
                },
            });

            c = c
                .with({ value: 1, ts: 91 })
                .with({ value: 1, ts: 93 })
                .with({ value: 1, ts: 95 })
                .with({ value: 1, ts: 97 })
                .with({ value: 1, ts: 99 })
                .with({ value: 1, ts: 101 })
                .with({ value: 1, ts: 103 })
                .with({ value: 1, ts: 104 })
                .harden();

            testBasicAddedShards(c as any as Crystalizer, 8, 3, 5);

            it('throws if in keepSince mode without tsKey', () => {
                const make = () =>
                    setup({
                        mode: {
                            type: 'keepSince',
                            since: (t) => t - 10,
                        },
                    });

                expect(make).toThrow();
            });
        });
    });

    describe('pointers', () => {
        it('defaults to absolute 0', () => {
            expect((setup() as unknown as any).opts.__ptrFinder).toEqual({
                type: 'absolute',
                ptr: 0,
            });
        });

        describe('withHeadTop', () => {
            it('resets it to absolute 0', () => {
                let c = add(setup(), 10).withHeadAt(-2).withHeadTop();

                expect((c as unknown as any).opts.__ptrFinder).toEqual({
                    type: 'absolute',
                    ptr: 0,
                });
            });
        });

        describe('withHeadAt', () => {
            let c = add(setup(), 10).withHeadAt(-2);
            testBasicAddedShards(c, 16, 8, 0);

            c = c.withHeadAt(-3);
            testBasicAddedShards(c, 14, 7, 0);

            c = c.withHeadAt(-1);
            testBasicAddedShards(c, 18, 9, 0);
        });

        describe('withHeadInc', () => {
            let c = add(setup(), 10).withHeadInc(-2);
            testBasicAddedShards(c, 16, 8, 0);

            c = c.withHeadInc(-3);
            testBasicAddedShards(c, 10, 5, 0);

            c = c.withHeadInc(2);
            testBasicAddedShards(c, 14, 7, 0);
        });

        describe('numeric pointer reset', () => {
            it('numeric pointer resets when `with` is called', () => {
                let c = add(setup(), 10);
                c = c.withHeadAt(-2);

                expect((c as any).opts.__ptrFinder.ptr).toBe(2);
                c = c.with({ value: 1 });
                expect((c as any).opts.__ptrFinder.ptr).toBe(0);
            });

            it('numeric pointer resets when `without` is called', () => {
                let c = add(setup(), 10);
                c = c.withHeadAt(-2);

                expect((c as any).opts.__ptrFinder.ptr).toBe(2);
                c = c.without((s) => s.id == 2);
                expect((c as any).opts.__ptrFinder.ptr).toBe(0);
            });
        });

        describe('withHeadSeek', () => {
            let c = add(setup({ mode: { type: 'keepCount', count: 3 } }), 20);

            c = c.withHeadSeek((s) => s.id == 15);
            c = c.harden();

            testBasicAddedShards(c, 32, 3, 26);

            it('has `last` as the shard found by the seek fn', () => {
                expect(c.last.id).toBe(15);
            });

            it('maintains itself despite shards being added or removed', () => {
                c = add(c, 10, 20);
                c = c.harden();

                expect(c.partialShards.length).toBe(3);
                expect(c.last.id).toBe(15);

                c = c.without((s) => s.id % 2 == 0);
                c = c.harden();

                expect(c.partialShards.length).toBe(2); // one of the 3 kept were even
                expect(c.last.id).toBe(15);
            });

            it('resets to head 0 if shard does not exist', () => {
                c = c.without((s) => s.id == 15);
                c = c.harden();

                const last = c.last;

                c = c.withHeadTop();
                c = c.harden();

                expect(c.last.id).not.toBe(15);
                expect(c.last.id).toBe(last.id);
            });
        });
    });

    describe('combination mode+pointer', () => {
        describe('withHeadAt', () => {
            let c = add(setup({ mode: { type: 'keepCount', count: 6 } }), 10);

            // cTot, pLen, pTot
            c = c.withHeadAt(-2);
            testBasicAddedShards(c, 16, 6, 4);

            c = c.withHeadTop();
            c = add(c, 10, 10);
            c = c.harden(); // after harden, ptr < 0 will result in < 6 kept shards
            c = c.withHeadAt(-4);
            testBasicAddedShards(c, 32, 2, 28);
            c = c.withHeadAt(-8);
            testBasicAddedShards(c, 28, 0, 28);

            c = c.withHeadAt(-1);
            testBasicAddedShards(c, 38, 5, 28);
        });
    });

    describe('without', () => {
        it('removes shards', () => {
            let c = setup();

            c = add(c, 5);
            c = add(c, 5);
            c = add(c, 5);
            c = add(c, 5);
            c = add(c, 5);

            c = c
                .without((s) => s.id == 0)
                .harden()
                .without((s) => s.id == 2)
                .without((s) => s.id == 5);

            expect(c.harden().partialShards).toEqual([
                { value: 2, id: 1 },
                { value: 2, id: 3 },
                { value: 2, id: 4 },
                { value: 2, id: 1 },
                { value: 2, id: 3 },
                { value: 2, id: 4 },
                { value: 2, id: 1 },
                { value: 2, id: 3 },
                { value: 2, id: 4 },
                { value: 2, id: 1 },
                { value: 2, id: 3 },
                { value: 2, id: 4 },
                { value: 2, id: 1 },
                { value: 2, id: 3 },
                { value: 2, id: 4 },
            ]);
        });
    });

    describe('sort', () => {
        it('sorts correctly per supplied sort fn', () => {
            let c = setup({ sort: (a, b) => a.id - b.id });
            c = add(c, 3);
            c = add(c, 3);
            c = add(c, 3);
            c = add(c, 3);

            expect(c.harden().partialShards).toEqual([
                { value: 2, id: 0 },
                { value: 2, id: 0 },
                { value: 2, id: 0 },
                { value: 2, id: 0 },

                { value: 2, id: 1 },
                { value: 2, id: 1 },
                { value: 2, id: 1 },
                { value: 2, id: 1 },

                { value: 2, id: 2 },
                { value: 2, id: 2 },
                { value: 2, id: 2 },
                { value: 2, id: 2 },
            ]);
        });
    });

    describe('tsKey', () => {
        it("adds keys if they don't exist", () => {
            const now = 50;
            let c = setup({ tsKey: 'ts', __getTime: () => now });

            c = add(c, 3).harden();

            expect(c.partialShards).toEqual([
                { value: 2, id: 0, ts: now },
                { value: 2, id: 1, ts: now },
                { value: 2, id: 2, ts: now },
            ]);
        });

        it('sorts by tsKey', () => {
            const now = 50;
            let c = setup({ tsKey: 'ts', __getTime: () => now });

            c = c
                .with([
                    { value: 2, id: 0, ts: 10 },
                    { value: 2, id: 0, ts: 8 },
                    { value: 2, id: 0, ts: 13 },
                    { value: 2, id: 0, ts: 11 },
                    { value: 2, id: 0, ts: 7 },
                ])
                .harden();

            expect(c.partialShards).toEqual([
                { value: 2, id: 0, ts: 7 },
                { value: 2, id: 0, ts: 8 },
                { value: 2, id: 0, ts: 10 },
                { value: 2, id: 0, ts: 11 },
                { value: 2, id: 0, ts: 13 },
            ]);
        });

        it('skips if key is already specified', () => {
            const now = 50;
            let c = setup({ tsKey: 'ts', __getTime: () => now });

            c = add(c, 2);
            c = c.with({ id: 2, value: 2, ts: 5 });
            c = c.with({ id: 2, value: 2, ts: 51 });
            c = add(c, 2, 3);
            c = c.harden();

            expect(c.partialShards).toEqual([
                { value: 2, id: 2, ts: 5 },
                { value: 2, id: 0, ts: now },
                { value: 2, id: 1, ts: now },
                { value: 2, id: 3, ts: now },
                { value: 2, id: 4, ts: now },
                { value: 2, id: 2, ts: 51 },
            ]);
        });

        it('throws if specified alongside sort fn', () => {
            const make = () => setup({ tsKey: 'ts', sort: () => 1 });
            expect(make).toThrow();
        });
    });

    describe('equivalency', () => {
        it('Crystalizer made with same crystal, shards, and opts should have matching results', () => {
            const opts = { mode: { type: 'keepCount', count: 4 } };
            let c1 = setup(opts);

            c1 = add(c1, 20).harden();

            let c2 = setup({ ...opts, initial: c1.partialCrystal });
            c2 = c2.with(c1.partialShards.slice()).harden();

            expect(c1.partialCrystal).toEqual(c2.partialCrystal);
            expect(c1.partialShards).toEqual(c2.partialShards);
            expect(c1.asCrystal()).toEqual(c2.asCrystal());
        });
    });
});

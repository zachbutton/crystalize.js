import { Crystalizer } from '../src/index';

describe('Crystalizer', () => {
    const add = (
        crystalizer: Crystalizer<any>,
        qty: number,
        startingId: number = 0,
    ) => {
        const newShards = Array(qty)
            .fill(0)
            .map((_, i) => ({ value: 2, id: startingId + i }));

        return crystalizer.modify((m) => m.with(newShards));
    };

    const setup = (opts: object = {}) => {
        return new Crystalizer<
            { total: number },
            { value: number; id: number }
        >({
            initial: { total: 0 },
            reducer: (crystal, shard) => ({
                total: crystal.total + shard.value,
            }),
            ...opts,
        });
    };

    const testBasicAddedShards = (c: Crystalizer, cTot, pLen, pTot) => {
        it('result correct generated values', () => {
            expect(c.harden().asCrystal().total).toBe(cTot);
            expect(c.harden().partialShards.length).toBe(pLen);
            expect(c.harden().partialCrystal.total).toBe(pTot);

            let startingShards = (c as any).opts.__shards;
            const ptr = (c as any).opts.__ptrFinder.ptr;
            startingShards =
                ptr == 0 ? startingShards : startingShards.slice(0, -ptr);
            expect(c.harden().partialShards).toEqual(
                pLen == 0 ? [] : startingShards.slice(-pLen),
            );
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
        describe('keepSeekFirst', () => {
            const seek = (shard: any) => shard.id == 2;
            const c = add(setup({ mode: { type: 'keepSeekFirst', seek } }), 10);

            testBasicAddedShards(c, 20, 8, 4);
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
    });

    describe('combination', () => {
        describe('withHeadAt', () => {
            let c = add(setup({ mode: { type: 'keepCount', count: 6 } }), 10);

            // cTot, pLen, pTot
            c = c.withHeadAt(-2);
            testBasicAddedShards(c, 16, 6, 4);

            c = c.withHeadTop();
            c = add(c, 10, 10);
            c = c.harden();
            c = c.withHeadAt(-8);
            testBasicAddedShards(c, 24, 6, 12);

            c = c.withHeadAt(-1);
            testBasicAddedShards(c, 38, 6, 26);
        });
    });

    // TODO: Test Modifier.without function
    // TODO: Test that using the modifier resets ptr to 0
});

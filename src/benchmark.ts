import Crystalizer from './index';

type Crystal = { count: number; total: number; max: number };
type Shard = { value: number };

type BenchFn = (state: any) => Record<string, any> | void;

const bench = (setup: BenchFn) => {
    const env = setup(null);

    const test = (name: string, env: any, fn: BenchFn) => {
        const start = performance.now();

        const res = fn(env) || {};

        const elapsed = performance.now() - start;

        let log = `\n:: ${name} :: took ${elapsed.toFixed(2)} ms.`;
        console.log(log, 'Output:', res.log || null);

        delete res.log;
        return { ...env, ...res };
    };

    const buildChain = (env: any) => {
        return {
            next: (name: string, fn: BenchFn) => {
                return buildChain(test(name, env, fn));
            },
        };
    };

    return buildChain(env);
};

let arr = [9, 8, 6, 5, 4, 3, 2, 1];

function fastFindIndex(
    arr: any[],
    fn: (v: any) => number,
    lazy: boolean = false,
) {
    let lp = 0;
    let rp = arr.length - 1;

    let ptr: number;
    let offset: number;

    do {
        ptr = ((rp + lp) / 2) >>> 0;
        offset = fn(arr[ptr]);

        if (offset < 0) {
            rp = ptr - 1;
        } else if (offset > 0) {
            lp = ptr + 1;
        }
        console.log(lp, ptr, rp, '--', offset);
    } while (offset != 0 && lp <= rp);

    if (offset == 0) {
        return ptr;
    }

    if (lazy) {
        return ptr;
    }

    return -1;
}

console.log(
    'index',
    fastFindIndex(arr, (v) => {
        return v - 10;
    }),
);

bench(() => {
    let time = 1;
    const { make } = Crystalizer.Maker<Crystal, Shard>({
        initial: { count: 0, total: 0, max: 0 },
        reducer: (crystal, shard) => {
            return {
                total: crystal.total + shard.value,
                count: crystal.count + 1,
                max: Math.max(crystal.max, shard.value),
            };
        },
        mode: {
            type: 'keepCount',
            count: 1000,
        },
        // mode: {
        //     type: 'keepSince',
        //     since: (t) => time - 1000,
        // },
        tsKey: 'ts',
        __getTime: () => time,
    });

    const manyShards = Array(10000)
        .fill(null)
        .map(() => {
            return Array(1000)
                .fill(null)
                .map(() => ({
                    value: Math.floor(Math.random() * 100000000),
                    ts: time++ + (Math.random() * 10000 - 5000),
                }));
        });

    return { manyShards, make };
})
    .next('make', ({ make }) => {
        const crystalizer = make();

        return { crystalizer };
    })
    .next('10000x1000 shards', ({ crystalizer, manyShards }) => {
        manyShards.forEach((shards) => {
            crystalizer = crystalizer.with(shards);
        });

        return { crystalizer };
    })
    // .next('harden', ({ crystalizer }) => {
    //     return { crystalizer: crystalizer.harden() };
    // })
    // .next('1000x10 shards w/ harden', ({ crystalizer, manyShards }) => {
    //     for (let i = 0; i < 10; i++) {
    //         crystalizer = crystalizer.with(manyShards).harden();
    //     }
    //
    //     return { crystalizer };
    // })
    .next('asCrystal', ({ crystalizer }) => {
        return { log: crystalizer.asCrystal() };
    })
    .next('partialShards', ({ crystalizer }) => {
        return { log: crystalizer.partialShards.length };
    });

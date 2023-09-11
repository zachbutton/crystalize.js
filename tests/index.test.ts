import { Crystalizer } from '../src/index';

describe('Crystalizer', () => {
	describe('Constructor', () => {
		it('should throw an error if shard does not contain a ts key', () => {
			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					shards: [{ id: 1 }],
					tsKey: 'timestamp',
				});
			}).toThrowError('Every shard must have the key "timestamp" as a number');
		});

		it('should only throw out of bounds error when throwPtrBounds is set', () => {
			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					ptrFromEnd: -1,
				});
			}).not.toThrow();

			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					throwPtrBounds: true,
					ptrFromEnd: -1,
				});
			}).toThrow();

			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					shards: [{ ts: 1 }, { ts: 2 }],
					throwPtrBounds: true,
					ptrFromEnd: 3,
				});
			}).toThrow();

			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					shards: [{ ts: 1 }, { ts: 2 }],
					ptrFromEnd: 3,
				});
			}).not.toThrow();
		});

		it('should throw when initialized with shards without timestamps', () => {
			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					shards: [{ ts: 1 }, { ts: 2 }],
					tsKey: 'ts',
				});
			}).not.toThrow();
			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					shards: [{ ts1: 1 }, { ts1: 2 }],
					tsKey: 'ts',
				});
			}).toThrow();

			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					shards: [{ ts1: 1 }, { ts1: 2 }],
					tsKey: 'ts1',
				});
			}).not.toThrow();
			expect(() => {
				new Crystalizer({
					initial: {},
					reducer: (acc) => acc,
					shards: [{ ts: 1 }, { ts: 2 }],
					tsKey: 'ts1',
				});
			}).toThrow();
		});
	});

	describe('#with', () => {
		it('should add a single shard', () => {
			const c = new Crystalizer({
				initial: {},
				reducer: (acc) => acc,
			}).with({ data: 'test' });

			expect(c.partialShards).toHaveLength(1);
		});

		it('should add multiple shards', () => {
			const c = new Crystalizer({
				initial: {},
				reducer: (acc) => acc,
			}).with([{ data: 'test1' }, { data: 'test2' }]);

			expect(c.partialShards).toHaveLength(2);
		});
	});

	describe('#without', () => {
		it('should remove shards based on selector', () => {
			const c = new Crystalizer<{}, { id: number }>({
				initial: {},
				reducer: (acc) => acc,
			})
				.with([{ id: 1 }, { id: 2 }, { id: 3 }])
				.without((shard) => shard.id === 2);

			const shards = c.partialShards;
			expect(shards).toHaveLength(2);
			expect(shards).toEqual(expect.not.arrayContaining([{ id: 2 }]));
		});
	});

	describe('#asCrystal', () => {
		it('should return a reduced crystal', () => {
			const c = new Crystalizer<{ count: number }, { value: number }>({
				initial: { count: 0 },
				reducer: (acc, shard) => ({ count: acc.count + shard.value }),
			}).with([{ value: 1 }, { value: 2 }, { value: 3 }]);

			expect(c.asCrystal()).toEqual({ count: 6 });
		});
	});

	describe('Mode-related operations', () => {
		const setup = () => {
			const currentTime = +new Date();
			return new Crystalizer({
				initial: { count: 0 },
				reducer: (acc, shard) => ({ count: acc.count + shard.value }),
				shards: [
					{ ts: currentTime - 30000, value: 1 },
					{ ts: currentTime - 20000, value: 2 },
					{ ts: currentTime - 10000, value: 3 },
					{ ts: currentTime, value: 4 },
				],
			});
		};

		describe('#leaveAll', () => {
			it('should leave all shards', () => {
				const c = setup().leaveAll();

				expect(c.partialShards).toHaveLength(4);
			});
		});

		describe('#leaveNone', () => {
			it('should not leave any shards', () => {
				const c = setup().leaveNone();

				expect(c.partialShards).toHaveLength(0);
			});
		});

		describe('#leaveCount', () => {
			it('should leave a certain number of shards', () => {
				const c = new Crystalizer<{ count: number }, { value: number }>({
					initial: { count: 0 },
					reducer: (acc, shard) => ({ count: acc.count + shard.value }),
				})
					.with([{ value: 1 }, { value: 2 }, { value: 3 }])
					.leaveCount(2);

				expect(c.partialShards).toHaveLength(2);
			});
		});

		describe('#leaveUntil', () => {
			it('should leave shards until a specified time', () => {
				const currentTime = +new Date();
				const c = setup().leaveUntil(() => currentTime - 15000);
				expect(c.partialShards).toHaveLength(2);
				expect(c.partialShards).toEqual([
					{ ts: currentTime - 10000, value: 3 },
					{ ts: currentTime, value: 4 },
				]);
			});
		});

		describe('#leaveSelected', () => {
			it('should leave shards based on a selector', () => {
				const c = setup().leaveSelected((shard) => shard.value % 2 === 0);

				expect(c.partialShards).toHaveLength(3);
				expect(c.partialShards).toEqual([
					{ ts: expect.any(Number), value: 2 },
					{ ts: expect.any(Number), value: 3 },
					{ ts: expect.any(Number), value: 4 },
				]);
			});
		});
	});

	describe('Head-related operations', () => {
		const setup = () => {
			return new Crystalizer({
				initial: { count: 0 },
				reducer: (acc, shard) => ({ count: acc.count + shard.value }),
				shards: [
					{ id: 1, value: 1, ts: 1 },
					{ id: 2, value: 2, ts: 2 },
					{ id: 3, value: 3, ts: 3 },
					{ id: 4, value: 4, ts: 4 },
				],
			});
		};

		describe('#headInc', () => {
			it('should increment head by a value', () => {
				const c = setup().headInc(-1);

				expect(c.partialShards).toHaveLength(3);
				expect(c.partialShards).toEqual([
					{ id: 1, value: 1, ts: 1 },
					{ id: 2, value: 2, ts: 2 },
					{ id: 3, value: 3, ts: 3 },
				]);
				expect(c.partialCrystal).toEqual({ count: 0 });
				expect(c.asCrystal()).toEqual({ count: 6 });
			});
		});

		describe('#headFind', () => {
			it('should move the head to the shard that matches the condition', () => {
				const c = setup().headFind((shard) => shard.id === 3);

				expect(c.partialShards).toHaveLength(3);
				expect(c.partialShards).toEqual([
					{ id: 1, value: 1, ts: 1 },
					{ id: 2, value: 2, ts: 2 },
					{ id: 3, value: 3, ts: 3 },
				]);
				expect(c.partialCrystal).toEqual({ count: 0 });
				expect(c.asCrystal()).toEqual({ count: 6 });
			});

			it('should not change if the condition does not match any shard', () => {
				const c = setup().headFind((shard) => shard.id === 10);

				expect(c.partialShards).toHaveLength(4);
				expect(c.partialCrystal).toEqual({ count: 0 });
				expect(c.asCrystal()).toEqual({ count: 10 });
			});
		});

		describe('#headLast', () => {
			it('should move the head to the last shard', () => {
				const c = setup().headInc(-3).headLast();

				expect(c.partialShards).toHaveLength(4);
				expect(c.partialCrystal).toEqual({ count: 0 });
				expect(c.asCrystal()).toEqual({ count: 10 });
			});
		});
	});
});

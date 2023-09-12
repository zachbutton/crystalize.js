![Coverage](coverage/badge-branches.svg)
![Coverage](coverage/badge-functions.svg)
![Coverage](coverage/badge-lines.svg)
![Coverage](coverage/badge-statements.svg)

# Crystalizer.js

The Crystalizer.js library introduces a structured methodology for data management and transformations based on the concepts of "Crystals" and "Shards". In this library, a "Crystal" is an immutable representation of accumulated data or state, formed over time. Conversely, "Shards" are the individual units or operations that contribute to this accumulation. This design provides an analogy to a crystallization process where individual elements come together to form a solid structure. Example use cases include managing application states, data sequencing, dataset manipulation, time-series data analysis, event sourcing, state tracking in simulations, and modularized data transformations.

## Installation

```bash
npm i -D crystalize.js
```

## Basic usage

```typescript
import { Crystalizer } from './index';

let crystalizer = new Crystalizer<{ total: number }, { value: number }>({
	initial: { total: 0 },
	reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
});

const newShards = [{ value: 2 }, { value: 7 }, { value: 1 }];
crystalizer = crystalizer.modify((m) => m.with(newShards)).harden();

console.log(crystalizer.asCrystal()); // { total: 10 }
console.log(crystalizer.partialShards); // [ {...}, {...}, {...} ]
```

This should start to resemble other forms of state management that you've seen. Though, you'll notice that while you have the final, calculated shard (or state), the shards that were passed in are still accessible. Keep reading, this gets interesting!

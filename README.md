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

```javascript
import { Crystalizer } from './crystalize.js';

let crystalizer = new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
});

const newShards = [{ value: 2 }, { value: 7 }, { value: 1 }];
crystalizer = crystalizer.modify((m) => m.with(newShards)).harden();

console.log(crystalizer.asCrystal()); // { total: 10 }
console.log(crystalizer.partialShards); // [ {...}, {...}, {...} ]
```

This should start to resemble other forms of state management that you've seen. Though, you'll notice that while you have the final, calculated shard (or state), the shards that were passed in are still accessible. Keep reading, this gets interesting!

### Typescript

Since Crystalize.js is written in Typescript, your LSP can make use of the types, and you can constrain which types to be used as Crystals and Shards.

```typescript
new Crystalyzer<Crystal, Shard>({ ... })

// to match the Basic Usage example above,
new Crystalizer<{ total: number}, { value: number }>({ ... })

// if Crystal and Shard are the same type,
new Crystalizer<T>({ ... })

// the type can also be inferred based on your initial value
new Crystalizer({ initial: { total: 0 }})
```

For most of this documentation, JS will be used for readability.

## Use cases

### Application state

Suppose you're making a basic incrementer app in React, like the sort you see in tutorials.Except, you want to spice it up with add an "Undo" feature.

```javascript
import { Crystalizer } from 'crystalizer.js';

import { useState } from 'react';

const baseIncrementerCrystalizer = new Crystalizer({
    initial: { count: 0 },
    reducer: (crystal, shard) => ({ count: crystal.count + shard.count }),
});

const Incrementer = () => {
    let [inputCount, setInputCount] = useState(0);
    let [crystalizer, setCrystalizer] = useState(baseIncrementerCrystalizer);

    const inc = (count) => {
        setCrystalizer(crystalizer.modify((m) => m.with({ count })));
    };

    const movePointer = (n) => {
        setCrystalizer(crystalizer.withHeadInc(n));
    };

    const currentCount = crystalizer.harden().asCrystal().count;

    return (
        <div>
            <span>Count: {currentCount}</span>

            <div>
                <input
                    onInput={(e) => setInputCount(Number(e.target.value))}
                    placeholder="Count"
                />
                <button onClick={() => inc(inputCount)}>Increment</button>
            </div>

            <button onClick={() => movePointer(-1)}>Undo</button>
            <button onClick={() => movePointer(1)}>Redo</button>
        </div>
    );
};
```

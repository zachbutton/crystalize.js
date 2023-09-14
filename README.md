![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)
[![NPM version](https://img.shields.io/npm/v/crystalize.js?style=flat-square)](https://img.shields.io/npm/v/crystalize.js?style=flat-square)
[![Package size](https://img.shields.io/bundlephobia/min/crystalize.js)](https://img.shields.io/bundlephobia/min/crystalize.js)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# Crystalizer.js

The Crystalizer.js library introduces a structured methodology for data management and transformations based on the concepts of "Crystals" and "Shards". In this library, a "Crystal" is an immutable representation of accumulated data or state, formed over time. Conversely, "Shards" are the individual units or operations that contribute to this accumulation. This design provides an analogy to a crystallization process where individual elements come together to form a solid structure. Example use cases include managing application states, data sequencing, dataset manipulation, time-series data analysis, event sourcing, state tracking in simulations, and modularized data transformations.

## Table of contents

<!-- toc -->

-   [Installation](#installation)
-   [Basic usage](#basic-usage)
    -   [Initialize](#initialize)
    -   [Options](#options)
    -   [Modify](#modify)
    -   [Harden](#harden)
    -   [Get the data](#get-the-data)
    -   [Putting it all together](#putting-it-all-together)
    *   [Typescript](#typescript)
-   [Advanced usage](#advanced-usage)
    -   [Modes](#modes)
    -   [Sorting](#sorting)
    -   [Pointers](#pointers)
-   [Examples](#examples)
    -   [Application state](#application-state)
    -   [Canonicalize frontend & backend state](#canonicalize-frontend--backend-state)
    -   [Event-driven canonical state](#event-driven-canonical-state)
-   [API reference](#api-reference)
    -   [Types](#types)
    -   [Methods](#methods)
-   [Planned features](#planned-features)

<!-- tocstop -->

## Installation

```bash
npm i -D crystalize.js
```

## Basic usage

#### Initialize

```javascript
import { Crystalizer } from './crystalize.js';

let crystalizer = new Crystalizer({
    // options
});
```

#### Options

For now, we'll just explain the required options: `initial` and `reducer`. For the other options, please reference [Advanced usage](#advanced-usage).

```javascript
new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
});
```

All crystalizer's must be initialized with at least these options. The option `initial` is the state your reducer starts with, and `reducer` is the function that defines how shards are reduced into that state.

#### Modify

Crystalizer objects are immutable, so all methods return a new Crystalizer instance instead of modifying the existing one.

You can call the method `modify` which exposes the API with which you use to add or remove shards from the crystalizer.

```javascript
crystalizer = crystalizer
    .modify(m => m.with({ value: 2 })
    .modify(m => {
        m.with({ value: 10 }).with({ value: 7 })
    })
    .modify(m => m.with({ value: 1}).without(s => s.value == 10));
```

#### Harden

Above, we defined the following changes:

-   Add a shard with value 2
-   Add a shard with value 10
-   Add a shard with value 7
-   Add a shard with value 1
-   Remove shards with value 10

However, these transformations have not taken place yet. We have a new crystalizer which is prepared to commit those changes. But, the new crystal will not be generated until we harden the crystalizer.

```javascript
crystalizer = crystalizer.harden();
```

#### Get the data

Now that we've hardened the crystal, we can access the resulting data. In other words, the result has been _crystalized_.

Thus, we are now exposed to the following: `.asCrystal()`, `partialShards`, and `.partialCrystal`.

```javascript
console.log(crystalizer.partialCrystal); // { total: 0 }
console.log(crystalizer.partialShards); // [{ value: 2 }, { value: 7 }, { value: 1 }]
console.log(crystalizer.asCrystal()); // { total: 10 }
```

We now not only have access to the final result of the reducer, via `asCrystal()`, but also to the shards we added before. This is useful, because it allows us to keep these for data auditing or stepping through event history (think undo/redo behavior), just to name a couple use-cases.

You'll also notice that `.partialCrystal` has the initial state we started with. It's not always the initial state. It's not even just the previous state; You could call `.harden()` as many times as you want to, and it would still be `{ total: 0 }`.

That might be a little bit confusing if we start from `.asCrystal()` and try to understand from there. Instead, let's look at it from a different perspective. Instead of looking at the result from `.asCrystal()` first, let's take a closer look at the partial crystal and partial shards and then work our way back to `.asCrystal()`.

Based on configurable behavior, `.partialCrystal` contains all of the data (shards) that were collapsed into the crystal (therefore lost).

By default, there is no data lost. Therefore, there is nothing to be collapsed into `.partialCrystal`, because we have all the shards in their original form still inside of `.partialShards`.

With default settings, `.partialCrystal` will always be the same as the initial state. But, we can still call `.asCrystal()` to get the final state, without losing the shards we added in before. Cool, huh?

But, you might not want to keep this data forever, depending on your use-case. So, this behavior can be defined, such that `.partialShards` remains a fixed size, or shards that are very old get collapsed into `.partialCrystal`.

To illustrate:

```
[partial crystal] -> [N quantity of shards] -> [final output via asCrystal()]
```

By default, `N` is infinite. It's configurable, and can also be determined statically or programatically (for example, by timestamp).

This will be explained in more detail in [Advanced usage](#advanced-usage).

#### Putting it all together

Here's what we did above all in one place, for easy reference:

```javascript
import { Crystalizer } from 'crystalize.js';

let crystalizer = new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
});

crystalizer = crystalizer
    .modify(m => m.with({ value: 2 })
    .modify(m => {
        m.with({ value: 10 }).with({ value: 7 })
    })
.modify(m => m.with({ value: 1}).without(s => s.value == 10));

crystalizer = crystalizer.harden();

console.log(crystalizer.partialCrystal); // { total: 0 }
console.log(crystalizer.partialShards); // [{ value: 2 }, { value: 7 }, { value: 1 }]
console.log(crystalizer.asCrystal()); // { total: 10 }
```

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


let c = new Crystalizer<{ total: number}, { value: number }>({
    initial: { total: 'aBadString' }, // TS error
    reducer: (c, s) => ({ count: c.count + s.value }) // TS error
});

c = c.modify(m => m.with({ count: 1 })); // TS error
```

For most of this documentation, JS will be used for readability.

## Advanced usage

#### Modes

As mentioned in the [Basic usage](#basic-usage), we can collapse our shards into a partial crystal which can be preserved. We might want to do this if we're processing lots of data, or alternatively, to minimize network transmission.

Here's the diagram from before, as a reminder:

```
[partial crystal] -> [N quantity of shards] -> [final output via asCrystal()]
```

`N` is what we're talking about here. We can decide how many shards to keep at any given time, with the rest being collapsed into the partial crystal as defined by our reducer function.

There are 4 modes that define how many shards we'll keep:

-   keepAll (default)
-   keepNone
-   keepCount
-   keepAfter

In the earlier section, we went over the default mode, keepAll. No shards are collapsed, thus the partial crystal is always identical to our initial state. The next mode, keepNone, what it sounds like. We don't keep any shards, and the partial crystal is the same as the value you get from `.asCrystal()`.

Somewhere in between, we have keepCount. But it's essentially similar in that there's a definite, static value of 'N', the number of shards we keep.

So, we can break these up into 2 basic categories of modes:

-   Static
-   Dynamic

The only dynamic mode is keepAfter.

For the sake of examples, we'll show what you get from keepCount mode and keepAfter, because they do something a little bit more novel than the other two. Let's start with keepCount.

Modes are passed into the Crystalizer constructor:

```javascript
new Crystalizer({
    ...,

    mode: { type: 'keepCount', count: 2 }
})
```

That's it for this one. Revisiting the example we went over in [Basic usage](#basic-usage), here's what we can expect as a result.

```javascript
// initial value: [{ value: 2 }, { value: 7 }, { value: 1 }]

// with keepCount 2
console.log(crystalizer.partialCrystal); // { total: 2 }
console.log(crystalizer.partialShards); // [{ value: 7 }, { value: 1 }]
console.log(crystalizer.asCrystal()); // { total: 10 }

// with keepCount 1
console.log(crystalizer.partialCrystal); // { total: 9 }
console.log(crystalizer.partialShards); // [{ value: 1 }]
console.log(crystalizer.asCrystal()); // { total: 10 }

// with keepCount 0 (or keepNone)
console.log(crystalizer.partialCrystal); // { total: 10 }
console.log(crystalizer.partialShards); // []
console.log(crystalizer.asCrystal()); // { total: 10 }
```

Now, let's take a look at keepAfter. This is where it starts to get interesting, and you have a lot of flexibility in how you implement it and for what use-case you're using it for.

The useAfter mode is passed with a `seek` function. In the seek function, you simple return `true` for the first shard which you would like to be kept.

```javascript
new Crystalizer({
    ...,

    seek: { type: 'keepFirst', seek: (shard) => { ... } }
})
```

You can implement anything you want here. One use-case would be keep all shards with a time stamp within a certain distance from the current time:

```javascript
const WEEK = 1000 * 60 * 60 * 24 * 7;
const now = () => +new Date();

let makeShard = (value) => ({ value, ts: now() });

let crystalizer = new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
    mode: {
        type: 'keepAfter',
        seek: (shard) => now() - shard.ts <= WEEK,
    },
});
```

Now, all shards that are older than 1 week will automatically be collapsed into the partial crystal during the `harden()` cycle.

In practical applications, we'll want to watch out for how much work the `seek` function is doing since it's executing for each of our shards. In this example, we're creating a new `Date` object, so we would want to do something a little more clever here if we're dealing with large data sets. But, this should serve as a working example.

You might wonder what will happen if the shards are added in out of order. Well, that takes us right to the next section, and we'll revisit this exact example to paint a clearer picture of how this would be implemented.

#### Sorting

Sorting is about as straightforward as any other JS array. This let's just revisit the above example, but with a sort function that enables us to utilize the keepAfter mode by timestamp.

```javascript
let crystalizer = new Crystalizer({
    ...
    mode: {
        type: 'keepAfter',
        seek: (shard) => now() - shard.ts <= WEEK,
    },

    sortBy: (a, b) => a.ts - b.ts,
});
```

That's it, and now we're certain the seek function of our keepAfter mode will do what we intend it to do. During the harden cycle, the shards will be sorted,
the seek function will be ran, and every shard that comes before the _first_ shard our seek function returned true for, will be collapsed into the partial crystal.

#### Pointers

Crystalizers keep an internal pointer. There are a few ways to manipulate the pointer.

-   withHeadAt
-   withHeadInc
-   withHeadTop

There are lots of potential use-cases, most notably being an undo/redo feature. You could utilize `withHeadInc` to undo or redo, or `withHeadAt` if you have an undo menu which lets you select a particular stage in an undo list.

```javascript
// undo
crystalizer = crystalizer.withHeadInc(-1);

// redo
crystalizer = crystalizer.withHeadInc(1);

// user selects 3rd step from most recent
crystalizer = crystalizer.withHeadAt(-3);

// jump back to current
crystalizer = crystalizer.withHeadTop();
// or
crystalizer = crystalizer.withHeadAt(0);
```

When you call `.harden()`, **only** the shards up to the pointer will be included when generating the values for `.partialCrystal`, `.partialShards`, and `.asCrystal()`.

The shards _beyond_ the crystal are effectively non-existent unless you move the pointer after them.

Using the `.modify()` function will reset the pointer back to 0, with all shards beyond the old pointer lost to the void of `/dev/null`.

## Examples

### Application state

Suppose you're making a basic incrementer app in React, like the sort you see in tutorials. Except, you want to spice it up with add an "Undo" feature.

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

### Canonicalize frontend & backend state

In today's web development landscape, we often grapple with the challenge of duplicated state: once in the backend and then mirrored on the frontend, leading to redundancy and potential synchronization issues.

There are some approaches to dealing with this problem, from GraphQL which helps to decouple them, all the way to HTMX which virtually eliminates frontend state (although, we can consider the DOM itself to be yet another state on it's own).

Each of these approaches have their use cases. One way we can utilize Crystalize.js is using it canonicalize our backend and frontend state. We'll still have state in both places, but we won't have to _programatically handle_ both states. It's not technically a single source of truth, but it's a _single source of logic_.

This will be some heavy psuedo-code, so get ready.

**Common**

```javascript
const defaultState = { ... };

export const makeCrystalizer = (initial = defaultState) => new Crystalizer({
    initial,
    reducer: (crystal, shard) => {
        // handle actions here, where it's shared between FE and BE
    };
});
```

**Frontend**

```javascript
// State.js

import { makeCrystalizer } from '../../Common';

let crystalizer;

const initialState = api.get('/state');
initialState.then((state) => {
    crystalizer = makeCrystalizer(state);
});

export async function dispatch(action) {
    await initialState;

    // send the plain action to the backend
    api.post('/event', { data: action });

    // generate a new crystalizer with the action, and harden it
    crystalizer = crystalizer.modify((m) => m.with(action)).harden();

    // emit the new state to subscribers to consume
    subscribers.emit(crystalizer.asCrystal());
}
```

**Backend**

```javascript
// Api.js

import { getUserState, setUserState } from '../your/db/utilities';
import { makeCrystalizer } from '../../Common';

function getUserCrystal(userId) {
    const state = getUserState(userId);

    return makeCrystalizer(state);
}

api.get('/state', (req) => {
    return getUserCrystal(req.jwt.userId).harden().asCrystal();
});

api.post('/event', (req) => {
    const crystal = getUserCrystal(req.jwt.userId);
    const newState = crystal.modify((m) => m.with(req.body)).harden();

    setUserState(req.jwt.userId, newState.asCrystal());
});
```

You might have wondered how, in the backend, we go from `getUserState` straight to constructing a `Crystalizer` intance, which takes an object. This depends on your architecture, and this pattern will work best with non-relational databases such as Mongo, or other databases that are document-driven and allows you to get a simple object.

For relational databases, we lose the _single source of logic_ here since you would still have to construct the object passed into the Crystalizer.

But, that brings us to the next use-case:

### Event-driven canonical state

Like before, we're sending single events from the frontend to the backend, and getting the whole state from the backend on load.

However, this time, we're only storing the raw events on the server.

**Common**

```javascript
const defaultState = { ... };

export const makeCrystalizer = (initial = defaultState) => new Crystalizer({
    initial,
    reducer: (crystal, shard) => {
        // handle actions here, where it's shared between FE and BE
    };
});
```

**Frontend**

```javascript
// State.js

import { makeCrystalizer } from '../../Common';

let crystalizer;

const initialState = api.get('/state');
initialState.then((state) => {
    crystalizer = makeCrystalizer(state);
});

export async function dispatch(action) {
    await initialState;

    // send the plain action to the backend
    api.post('/event', { data: action });

    // generate a new crystalizer with the action, and harden it
    crystalizer = crystalizer.modify((m) => m.with(action)).harden();

    // emit the new state to subscribers to consume
    subscribers.emit(crystalizer.asCrystal());
}
```

**Backend**

```javascript
// Api.js

import { getAllUserEvents, addUserEvent } from '../your/db/utilities';
import { makeCrystalizer } from '../../Common';

api.get('/state', (req) => {
    const events = getAllUserEvents(userId);

    return makeCrystalizer()
        .modify((m) => m.with(events))
        .harden()
        .asCrystal();
});

api.post('/event', (req) => {
    addUserEvent(req.jwt.userId, req.body);
});
```

Our backend is now quite slim, effectively operating as a simple event store.

## API reference

#### Types

WIP

#### Methods

WIP

## Planned features

-   Shorthand for `modify` function. Direct calling of `with` and `without` ?
-   Dump entire crystalizer state (as well as modes, pointers, etc.) into JSON format, and ability to import the same state from JSON.
-   When a `tsKey` parameter exists, apply timestamps to all shards that do not already have a value of that key. Introduce a new mode that just checks timestamps, which is just a QOL improvement on the includeAfter mode. Automatically sort by that timestep, with user-supplied sort being a tie-breaker.

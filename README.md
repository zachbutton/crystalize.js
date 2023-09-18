![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)
[![NPM version](https://img.shields.io/npm/v/crystalize.js?style=flat-square)](https://img.shields.io/npm/v/crystalize.js?style=flat-square)
[![Package size](https://img.shields.io/bundlephobia/min/crystalize.js)](https://img.shields.io/bundlephobia/min/crystalize.js)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# Crystalize.js

The Crystalize.js library is your magic wand for data wizardry, introducing a methodology for data management: "Crystals" and their foundational building blocks, "Shards". Think of a "Crystal" as an iceberg, immutably capturing the essence of time and tales, representing a culmination of data or states. Imagine "Shards" as the droplets that over time, meld to craft these icebergs. Now imagine that you could turn back the clock, and see the formation of the iceberg at different points in its history. 

That is Crystalize.js. It's like a reducer on steroids, but if reducers had undo/redo and time-travel.

Here’s how you can use it to empower your projects:

1. 📚 Application State Manager: Using a Crystal as your application state, you get your normal state management, but with super-powers.
2. 🕰️ Dynamic Time-based State: Turn your user into a time traveler, allowing them to explore the iceberg at any phase in its evolution, in anything from simple undo/redo, or a time-travel-based game.
3. 🌊 Time-Series Data Analyzer: Just as maritime explorers chart the seas, use this tool to revisit and analyze the stages of your data’s growth at different points.
4. 📝 Event Sourcing Recorder: Store the state changes triggered by events, not unlike the layers in an iceberg, to understand their influence on the overall structure.
5. 🔍 Simulation State Monitor: Monitor the gradual shifts and changes, capturing every nuance as your data evolves and grows.
6. 🛠️ Data Transformation Toolkit: Adjust and refine, much like sculpting the edges and facets to achieve the desired shape and structure.

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
    -   [Last](#last)
    -   [Typescript](#typescript)
-   [Advanced usage](#advanced-usage)
    -   [Sorting](#sorting)
    -   [Time sort](#time-sort)
    -   [Modes](#modes)
    -   [Pointers](#pointers)
-   [Examples](#examples)
    -   [Application state](#application-state)
    -   [Canonicalize frontend & backend state](#canonicalize-frontend--backend-state)
    -   [Event-driven canonical state](#event-driven-canonical-state)
    -   [IO-style multiplayer time-travel game](#io-style-multiplayer-time-travel-game)
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

### Initialize

```javascript
import Crystalizer from 'crystalize.js';

let crystalizer = new Crystalizer({
    // options
});
```

### Options

For now, we'll just explain the required options: `initial` and `reducer`. For the other options, please reference [Advanced usage](#advanced-usage).

```javascript
new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
});
```

All crystalizer's must be initialized with at least these options. The option `initial` is the state your reducer starts with, and `reducer` is the function that defines how shards are reduced into that state.

### Modify

Crystalizer objects are immutable, so all methods return a new Crystalizer instance instead of modifying the existing one.

You can use the methods `with` or `without` to return a new crystalizer with the shards added or removed.

```javascript
crystalizer = crystalizer
    .with({ value: 2 })
    .with([ { value: 10 }, { value: 7 } ])
    .without(s => s.value == 10))
    .with({ value: 1 });
```

### Harden

Above, we defined the following changes:

-   Add a shard with value 2
-   Add a shard with value 10
-   Add a shard with value 7
-   Remove shards with value 10
-   Add a shard with value 1

However, these transformations have not taken place yet. We have a new crystalizer that is prepared to commit those changes. But, the new crystal will not be generated until we harden the crystalizer.

```javascript
crystalizer = crystalizer.harden();
```

### Get the data

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

By default, `N` is infinite. It's configurable, and can also be determined statically or programmatically (for example, by timestamp).

This will be explained in more detail in [Advanced usage](#advanced-usage).

### Putting it all together

Here's what we did above all in one place, for easy reference:

```javascript
import Crystalizer from 'crystalize.js';

let crystalizer = new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
});

crystalizer = crystalizer
    .with({ value: 2 })
    .with([ { value: 10 }, { value: 7 } ])
    .without(s => s.value == 10))
    .with({ value: 1 });

crystalizer = crystalizer.harden();

console.log(crystalizer.partialCrystal); // { total: 0 }
console.log(crystalizer.partialShards); // [{ value: 2 }, { value: 7 }, { value: 1 }]
console.log(crystalizer.asCrystal()); // { total: 10 }
```

### Last

You can get the last partial shard just using `.last`. It will be `undefined` if there are no partial shards.

```
console.log(crystalizer.last); // { value: 1 }
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

c = c.with({ count: 1 }); // TS error
```

For most of this documentation, JS will be used for readability.

## Advanced usage

### Sorting

Sorting is about as straightforward as any other JS array. Suppose you have a `ts` key on each shard:

```javascript
let crystalizer = new Crystalizer({
    ...
    sort: (a, b) => a.ts - b.ts,
});
```

That's it, and now we're certain the shards will be in the correct order per their timestamp, even if they were added out of order.

### Time sort

You can do the above a little bit easier by initializing with the `tsKey` parameter:

```javascript
let crystalizer = new Crystalizer({
    ...
    tsKey: 'ts',
});
```

This will automatically sort by the `ts` key, like before. As a bonus, all added shards that do not already have the `ts` key will have one added automatically.

```javascript
const nextValue = 0;
const adder = () => {
    nextValue++;
    let timed = nextValue == 3 ? { ts: 5 } : {};
    crystalizer = crystalizer.with({ ...timed, value: nextValue });

    setTimeout(adder, 1000);
};
adder();

setTimeout(() => {
    console.log(crystalizer.harden().partialShards);
    // [
    //     { value: 3, ts: 5 },
    //     { value: 1, ts: 1695014000000 },
    //     { value: 2, ts: 1695014001000 },
    //     { value: 4, ts: 1695014003000 },
    // ]
}, 3500);
```

### Modes

As mentioned in the [Basic usage](#basic-usage), we can collapse our shards into a partial crystal that can be preserved. We might want to do this if we're processing lots of data, or alternatively, to minimize network transmission if we'll be sending the whole shard array over the network.

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
-   keepSince

In the earlier section, we went over the default mode, keepAll. No shards are collapsed, thus the partial crystal is always identical to our initial state. The next mode, keepNone, is what it sounds like. We don't keep any shards, and the partial crystal is the same as the value you get from `.asCrystal()`.

Somewhere in between, we have keepCount. But it's essentially similar in that there's a definite, static value of 'N', the number of shards we keep.

So, we can break these up into 2 basic categories of modes:

-   Static
-   Dynamic

The dynamic modes are keepAfter and keepSince.

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

Now, let's take a look at keepAfter. This is where it starts to get interesting, and you have a lot of flexibility in how you implement it depending on you use case.

The useAfter mode is passed with a `seek` function. In the seek function, you simply return `true` for the first shard you would like to be kept.

```javascript
new Crystalizer({
    ...,

    mode: { type: 'keepAfter', seek: (shard) => { ... } }
})
```

You can implement anything you want here. One use-case would be to keep all shards with a time stamp within a certain distance from the current time:

```javascript
const WEEK = 1000 * 60 * 60 * 24 * 7;
const now = () => +new Date();

let crystalizer = new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
    tsKey: 'ts',
    mode: {
        type: 'keepAfter',
        seek: (shard) => now() - shard.ts <= WEEK,
    },
});
```

Now, all shards that are older than 1 week will automatically collapse into the partial crystal during the `harden()` cycle.

In practical applications, we'll want to watch out for how much work the `seek` function is doing since it's executing for each of our shards. In this example, we're creating a new `Date` object, so we would want to do something a little more clever here if we're dealing with large data sets. But, this should serve as a working example.

There's a shorter and simpler way to do this, that also doesn't have the above problem. We can use the `keepSince` mode:

```javascript
const WEEK = 1000 * 60 * 60 * 24 * 7;

let crystalizer = new Crystalizer({
    initial: { total: 0 },
    reducer: (crystal, shard) => ({ total: crystal.total + shard.value }),
    tsKey: 'ts',
    mode: {
        type: 'keepSince',
        since: (now) => now - WEEK,
    },
});
```

### Pointers

Crystalizers keep an internal pointer. There are a few ways to manipulate the pointer.

-   withHeadAt (numeric)
-   withHeadInc (numeric)
-   withHeadTop (numeric)
-   withHeadSeek (dynamic)

There are lots of potential use cases, most notably being an undo/redo feature. You could utilize `withHeadInc` to undo or redo, or `withHeadAt` if you have an undo menu that lets you select a particular stage in an undo list.

Let's look at the numeric pointer first: withHeadAt, withHeadInc, and withHeadTop.

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

Using the `.with()` or `.without()` methods will reset numeric pointers back to 0, with all shards beyond the old pointer lost to the void of `/dev/null`.

You may sometimes want to preserve your selection of a specific shard, even after calling `.with()` or `.without()`. Let's look at the dynamic pointer, withHeadSeek:

```javascript
let crystalizer = new Crystalizer({
    ...
});

crystalizer = crystalizer
    .with({ id: 1000 })
    .with({ id: 1234 })
    .with({ id: 2000 })
    .harden();

console.log(crystalizer.partialShards); // [{ id: 1000 }, { id: 1234 }, { id: 2000 }]

crystalizer = crystalizer.withHeadSeek(s => s.id == 1234);

console.log(crystalizer.partialShards); // [{ id: 1000 }, { id: 1234 }]

// dynamic pointer will persist when shards are added or removed
crystalizer = crystalizer.with({ id: 3000 }).harden();

console.log(crystalizer.partialShards); // [{ id: 1000 }, { id: 1234 }]

crystalizer = crystalizer.withHeadTop();
console.log(crystalizer.partialShards); // [{ id: 1000 }, { id: 1234 }, { id: 2000 }, { id: 3000 }]
```

Although you cannot make numeric pointers "sticky" the way you can with dynamic pointers, you can use them together with `.last` to achieve a similar result.

```javascript
crystalizer = crystalizer.withHeadInc(-1);
crystalizer = crystalizer.withHeadSeek((s) => s.id == crystalizer.last.id);
```

Now, the pointer will always seek out the shard with the unique identifier `id`.

Note that if the seek function _does not_ find a matching shard, it will behave as though the pointer is at index 0. An error will not be thrown, because this would break the chaining model and create a frustrating API. In some cases, you might want to ensure you have the right pointer. Here's one way you can do that.

```javascript
const desiredId = 1234;

crystalizer = crystalizer.withHeadSeek((s) => s.id == desiredId);

if (crystalizer.last.id == desiredId) {
    // ... do stuff
}
```

**TBD**: In future versions, there might be something like a `.withHeadStrict()` method that will throw if the shard was not found. This is part of the future API that is still in the planning stage.

## Examples

### Application state

Suppose you're making a basic incrementer app in React, like the sort you see in tutorials. Except, you want to spice it up with an "Undo" feature.

```javascript
import Crystalizer from 'crystalizer.js';

import { useState } from 'react';

const baseIncrementerCrystalizer = new Crystalizer({
    initial: { count: 0 },
    reducer: (crystal, shard) => ({ count: crystal.count + shard.count }),
});

const Incrementer = () => {
    let [inputCount, setInputCount] = useState(0);
    let [crystalizer, setCrystalizer] = useState(baseIncrementerCrystalizer);

    const inc = (count) => {
        setCrystalizer(crystalizer.with({ count }));
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

Each of these approaches has its use cases. One way we can utilize Crystalize.js is using it to canonicalize our backend and frontend state. We'll still have state in both places, but we won't have to _programatically handle_ both states. It's not technically a single source of truth, but it's a _single source of logic_.

This will be some heavy pseudo code, so get ready.

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
    crystalizer = crystalizer.with(action).harden();

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
    const newState = crystal.with(req.body).harden();

    setUserState(req.jwt.userId, newState.asCrystal());
});
```

You might have wondered how, in the backend, we go from `getUserState` straight to constructing a `Crystalizer` intance, which takes an object. This depends on your architecture, and this pattern will work best with non-relational databases such as Mongo, or other databases that are document-driven and allow you to get a simple object.

For relational databases, we lose the _single source of logic_ here since you would still have to construct the object passed into the Crystalizer.

But, that brings us to the next use case:

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
    crystalizer = crystalizer.with(action).harden();

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

    return makeCrystalizer().with(events).harden().asCrystal();
});

api.post('/event', (req) => {
    addUserEvent(req.jwt.userId, req.body);
});
```

Our backend is now quite slim, effectively operating as a simple event store.

### IO-style multiplayer time-travel game

Imagine a game that includes time travel. You can time travel up to 5 minutes into the past.

We're going to put the game's state actions of each player into the crystalizer, as shards. Let's set up our crystalizer to always keep the last 5 minutes worth of shards.

```javascript
import { reducer, defaultState, TICK_DURATION } from './game-loop';

const FIVE_MINUTES = 1000 * 60 * 5;
const now = () => +new Date();

let crystalizer = new Crystalizer({
    initial: defaultState,
    reducer,
    tsKey: 'ts',
    mode: {
        type: 'keepSince',
        since: (now) => now - FIVE_MINUTES,
    },
});

let gameTime = now();

export function timeTravelExact(ts) {
    gameTime = Math.max(ts, now() - FIVE_MINUTES);
    crystalizer = crystalizer.withHeadSeek((shard) => shard.ts >= ts);
}

export function timeTravelRelative(trel) {
    gameTime = gameTime + trel;
    timeTravelExact(gameTime);
}

export function timeTravelPresent() {
    timeTravelExact(now());
}

export function tick() {
    timeTravelRelative(TICK_DURATION);
}

export function addAction(action) {
    // Explicitly set `ts` since it may not be present time.
    // However, this might be called when we receive actions
    // by other players via the network. So, if it has a timestamp
    // already, we'll want to keep it.
    action = { ts: gameTime, ...action };

    crystalizer = crystalizer.with(action);
}

export function getState() {
    return crystalizer.harden().asCrystal();
}
```

With the above module, we've created an abstraction around Crystalizer that serves our use case well. We have methods to move to different points in time, as well as a way to add actions, taken by either the local player or remote players, and handle their positions in the timeline correctly. We can get the current state via `getState()`, and we'll get the correct game state at current point in time.

## API reference

### Types

**PlainObject**

```typescript
type Primitive = string | number | boolean | null | undefined;
type PlainObject = {
    [key: string]: Primitive | Primitive[] | PlainObject;
};
```

**Shard**

```typescript
interface Shard extends PlainObject {}
```

**Crystal**

```typescript
interface Crystal extends PlainObject {}
```

**Crystalizer**

```typescript
declare class Crystalizer<Crystal, Shard> {}
```

**CrystalizerReducer**

```typescript
type CrystalizerReducer<Crystal, Shard> = (
    crystal: Readonly<Crystal>,
    shard: Readonly<Shard>,
) => Crystal;
```

**ShardSeekFn**

```typescript
type ShardSeekFn<Shard> = (shard: Readonly<Shard>) => boolean;
```

**ShardSortFn**

```typescript
type ShardSortFn<Shard> = (a: Readonly<Shard>, b: Readonly<Shard>) => number;
```

**Mode**

```typescript
type ModeKeepAll = {
    type: 'keepAll';
};
type ModeKeepNone = {
    type: 'keepNone';
};
type ModeKeepCount = {
    type: 'keepCount';
    count: number;
};
type ModeKeepAfter<Shard> = {
    type: 'keepAfter';
    seek: ShardSeekFn<Shard>;
};
type ModeKeepSince = {
    type: 'keepSince';
    since: (now: number) => number;
};
type Mode<Shard> =
    | ModeKeepAll
    | ModeKeepNone
    | ModeKeepCount
    | ModeKeepAfter<Shard>
    | ModeKeepSince;
```

**Opts**

```typescript
type Opts<Crystal, Shard> = {
    initial: Crystal;
    reducer: CrystalizerReducer<Crystal, Shard>;
    mode?: Mode<Shard>;
    sort?: ShardSortFn<Shard>;
    tsKey?: string;
};
```

### Methods

```typescript
constructor(opts: Opts<Crystal, Shard>);

// Sets head to exact position and returns a new Crystal
withHeadAt(ptr: number): Crystalizer<Crystal, Shard>;

// Sets head to 0 and returns a new Crystal
withHeadTop(): Crystalizer<Crystal, Shard>;

// Increments numeric head by specified value and returns a new Crystal
withHeadInc(inc: number): Crystalizer<Crystal, Shard>;

// Sets head to dynamically seek via ShardSeekFn and returns a new Crystal
withHeadSeek(seek: ShardSeekFn<Shard>): Crystalizer<Crystal, Shard>;

// Returns a new Crystal with additional shards
with(shards: Shard | Shard[]): Crystalizer<Crystal, Shard>;

// Returns a new Crystal without Shards that match in the ShardSeekFn
without(seek: ShardSeekFn<Shard>): Crystalizer<Crystal, Shard>;

// Returns a hardened Crystal
harden(): Crystalizer<Crystal, Shard>;

// Throws on non-hardened crystal. Returns the last partial shard
get last(): Shard;

// Throws on non-hardened crystalizers. Returns the partial crystal
get partialCrystal(): Crystal;

// Throws on non-hardened crystalizers. Returns the partial shards
get partialShards(): Shard[];

// Throws on non-hardened crystalizers. Returns the partial shards
// reduced into the partial crystal
asCrystal(): Crystal;
```

## Planned features

-   Whole-state import/export as JSON (shards, crystal, modes, pointers, etc.)
-   More ways to ensure `.withHeadSeek()` found a shard to point to

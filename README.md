![Branches](./badges/coverage-branches.svg)
![Functions](./badges/coverage-functions.svg)
![Lines](./badges/coverage-lines.svg)
![Statements](./badges/coverage-statements.svg)
![Jest coverage](./badges/coverage-jest%20coverage.svg)
[![NPM version](https://img.shields.io/npm/v/crystalize.js?style=flat-square)](https://img.shields.io/npm/v/crystalize.js?style=flat-square)
[![Package size](https://img.shields.io/bundlephobia/min/crystalize.js)](https://img.shields.io/bundlephobia/min/crystalize.js)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

# Crystalize.js [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social)](https://twitter.com/intent/tweet?text=A%20reducer%20on%20steroids%2C%20but%20if%20reducers%20had%20undo%2Fredo%20and%20time-travel.&url=https://github.com/zachbutton/crystalize.js)

Welcome to Crystalize.js, where state management gets a transformative twist. This isn't just another reducer; it's a game-changer that lets you retain, navigate, and selectively aggregate your data.

Here, 'crystals' are your final state, 'shards' are the elements you feed in, and—here's the kicker—the 'base crystal' is your initial point, accumulating the shards you don't need immediate access to, while also maintaining your prior aggregation (or state).

[What are 'Crystals' and 'Shards'? And why?](#what-are-crystals-and-shards-and-why)

Basic operation is easy and intuitive, using `.with()` to add shards to your crystalizer, and `.take(N)` to take your final crystal (state), N count of shards, and your 'base crystal'.

Feeling selective? Use `.without()` to filter out shards. Want to navigate through your state's history? Meet `.leave()` and .`focus()`, your time-traveling tools.

Initialization is a breeze with options to sort, map, timestamp, and even set shard retention limits.

So, are you ready to rewrite the rules of state management? Dive into Crystalize.js and discover the future, today!

Here's how to harness the transformative power of Crystalize.js for your projects:

1. 🚀 **Enhanced State Management**: Use a Crystal as your app's core state. It's like traditional state management, but on steroids.
2. 🕰 **Journey Through Time**: Enable users to navigate the progression of your app state—whether for simple undo/redo functions or a time-travel-based gaming experience.
3. 🗺 **Chronological Data Exploration**: Like seasoned explorers mapping new territories, journey back to analyze your data at specific moments.
4. 🌊 **Event-Driven State Insights**: Like the layers of an iceberg, capture state changes influenced by events, gaining deeper insights into their impact.
5. 👁️ **Dynamic State Watcher**: Track subtle shifts and transformations, capturing the essence of your data's evolution.
6. 🎨 **Precision Data Sculpting**: Mold and refine your data landscape, crafting it to perfection.

## Table of contents

<!-- toc -->

-   [Installation](#installation)
-   [API reference](#api-reference)
-   [Samples](#samples)
-   [FAQ](#faq)
-   [What are 'Crystals' and 'Shards'? And why?](#what-are-crystals-and-shards-and-why)
-   [Introduction](#introduction)
    -   [.with() and .take()](#with-and-take)
    -   [.without()](#without)
-   [Pointers (undo/redo)](#pointers-undoredo)
    -   [.leave()](#leave)
    -   [.focus()](#focus)
-   [Init options](#init-options)
    -   [Sort](#sort)
    -   [Map](#map)
    -   [Timestamp](#timestamp)
    -   [Keep](#keep)

<!-- tocstop -->

## Installation

```bash
npm i -D crystalize.js
```

```typescript
import Crystalizer from 'crystalize.js';
```

## API reference

crystalize.js / [Exports](docs/modules.md)

## Samples

Sample apps, as built, will be placed here and linked to `./samples`.

-   **TODO** React TODO app with undo/redo
-   **TODO** Time-based journal app
-   **TODO** Thin backend with seamless offline experience

## FAQ

**Q**: **Isn't `crystalize` spelled wrong?
**A**: ![Screenshot from 2023-09-25 04-04-22](https://github.com/zachbutton/crystalize.js/assets/5890542/efe9007d-e0fa-4b1e-9d25-228657699af4)


**Q**: Why are they called 'Crystals' and 'Shards' and not something more familiar?
**A**: See [below](#what-are-crystals-and-shards-and-why)

## What are 'Crystals' and 'Shards'? And why?

A crystalizer is, in essence, a reducer. With default settings, you get something that closely resembles state management from things like Redux. Which, of course, is just a normal reduce function used in a particular way. So, you might wonder what the names are for, and why not just use the colloquial names 'actions' and 'reducers'?

I'll answer that now, and also give an introduction to Crystalize.js.

## Introduction

Crystalize.js, while it _is_ essentially a reducer, serves a different purpose. A reducer simply _reduces_ a collection of elements into a single aggregate. But, what Crystalize.js sets out to do is a little bit different. What if you want to keep the collection you passed in? What if you want variable amounts of that collection aggregated, or to be able to rewind to different points of that aggregation to see what it was at that point?

It's fair to think of a 'crystal' as an accumulator, and a 'shard' as an element. And that's really what they are. But that doesn't capture the goal of Crystalize.js, either.

They could likewise be called 'state' and 'actions', and that's really what they are, _when Crystalize.js is used in that way_. But, Crystalize.js sets out to serve more use-cases than actions and state.

Thus, the names are chosen to reflect better what Crystalize.js is doing, in verb form. Shards are _crystalized_ into an accumulated state, and the name calls that out to reflect the control and choice you have in how that process takes place.

To illustrate, here's the flow of an action+reducer:

```
┌────────────┐   ┌───────────┐   ┌───────────┐
│            │   │           │   │           │
│   state    ◄───┤  reduce   ◄───┤  action   │
│            │   │           │   │           │
└─────▲──────┘   └───────────┘   └───────────┘
      │
   readable
```

You pass actions into the reducer, and then they're aggregated into the accumulator, in this case, your app state. You have your state, which is great, but your action is gone. It cannot be replayed, and timing data about that action is lost, unless you add _additional state_ to track that information.

Here's the flow of Crystalize.js:

```
┌─┬───────────────┬───┬──────────────────┬────┬────────────────┬─┐
│ │               │   │                  │    │                │ │
│ │    crystal    ◄───┤  N count shards  ◄────┤  base crystal  │ │
│ │               │   │                  │    │                │ │
│ └──────────v────┘   └────────v─────────┘    └───────v────────┘ │
│            │                 │                      │          │
│            │ ┌───────────────┘                      │          │
│            │ │                                      │          │
│            │ │ ┌────────────────────────────────────┘          │
│            │ │ │                                               │
│            │ │ │                                               │
│            │ │ │          Crystalizer                          │
└────────────┼─┼─┼────────────────────────────────────▲──────────┘
             │ │ │                                    │
             ▼ ▼ ▼                                    │
           .take(N)                             .with(shards)
```

You add shards (colloquially, 'actions'), via the `.with()` method. You get the state via the `take()` method. But, you can also do more than just get the final state. You also get `N` count of the most recent shards that were added via `.with`, and the crystal that is the aggregate of the shards you did _not_ take.

Putting this together, let's say you called `.with()` and added 5 shards. Then, you called `.take(3)`. You'll get: 1) The final crystal, 2) The 3 most recently added shards, 3) The crystal that is the aggregate of the 2 oldest shards.

Let's bring that home with a code example:

#### .with() and .take()

```typescript
let crystalizer = Crystalizer<Crystal, Shard>({
    initial: { total: 0 },
    reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
});

crystalizer = crystalizer.with([
    { value: 1 },
    { value: 1 },
    { value: 1 },
    { value: 1 },
    { value: 1 },
]);

const [crystal, shards, base] = crystalizer.take(3);

console.log(crystal); // { total: 5 }
console.log(shards); // [ { value: 1 }, { value: 1 }, { value: 1 } ]
console.log(base); // { total: 2 }
```

You can call this multiple times in a row without losing any data:

_(calling `take()` with no arguments is equivalent to `take(Infinity)`)_

```typescript
crystalizer = crystalizer.with([
    { value: 1 },
    { value: 1 },
    { value: 1 },
    { value: 1 },
    { value: 1 },
]);

function logCrystalN(n?: number) {
    const [crystal, shards, base] = crystalizer.take(n);
    console.log(crystal);
    console.log(shards);
    console.log(base);
}

logCrystalN(1);
// { total: 5 }
// [{ value: 1 }]
// { total: 4 }

logCrystalN(4);
// { total: 5 }
// [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }]
// { total: 1 }

logCrystalN();
// { total: 5 }
// [{ value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }, { value: 1 }]
// { total: 0 }
```

#### .without()

You can also remove shards by using `.without()`. It's just an inverse filter function, so return `true` for a shard to be removed.

```typescript
crystalizer = crystalizer.with([
    { value: 1 },
    { value: 2 },
    { value: 2 },
    { value: 3 },
]);

crystalizer = crystalizer.without((shard) => shard.value == 2);

const [, shards] = crystalizer.take();

console.log(shards); // [{ value: 1 }, { value: 3 }];
```

## Pointers (undo/redo)

Crystalizer's keep an internal pointer to the L'th most recent shard that we are currently interested in. `L` is the number of shards _left_ inside the crystalizer, and not counted when calling `take()`.

Ordinarily, the pointer is at `0`. To move it to the next most recent shard, we'd set it to `1`. Third most recent, `2`, and so on.

The simplest way to do this is with the `.leave(L)` method, which we'll look at first. If we know a specific shard that we are interested in, we can do that via the `.focus` method, which we'll look at a little later.

#### .leave()

First, let's add `.leave(L)` to our above diagram:

```
                      .leave(L)
                          │
                          │
┌─┬───────────────┬───┬───▼──┬─────────────┬────┬────────────────┬─┐
│ │               │   │  L   │             │    │                │ │
│ │    crystal    ◄─┐ │shards│  N shards   ◄────┤  base crystal  │ │
│ │               │ │ │      │             │    │                │ │
│ └──────────v────┘ │ └──────┴────┬───v────┘    └───────v────────┘ │
│            │      │             │   │                 │          │
│            │      └─────────────┘   │                 │          │
│            │                        │                 │          │
│            │ ┌──────────────────────┘                 │          │
│            │ │                                        │          │
│            │ │ ┌──────────────────────────────────────┘          │
│            │ │ │                                                 │
│            │ │ │                                                 │
│            │ │ │           Crystalizer                           │
└────────────┼─┼─┼──────────────────────────────────────▲──────────┘
             │ │ │                                      │
             ▼ ▼ ▼                                      │
           .take(N)                               .with(shards)
```

And some code:

```typescript
let crystalizer = new Crystalizer<Crystal, Shard>({
    initial: { total: 0 },
    reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
});

crystalizer = crystalizer.with([
    { id: 1, value: 1 },
    { id: 2, value: 1 },
    { id: 3, value: 1 },
    { id: 4, value: 1 },
    { id: 5, value: 1 },
]);

const [crystal, shards, base] = crystalizer.leave(2).take(1);

console.log(crystal); // { total: 3 }
console.log(shards); // [{ id: 3, value: 1 }]
console.log(base); // { total: 2 }
```

Let's step through what`s happening here.

1. We called `.leave(2)`, so shards with id `4` and `5` are excluded from here on.
2. We called `.take(1)`, so we're only interested in keeping the next most recend shard, id `3`
3. `crystal` contains the aggregate of all the shards we didn't leave: 1, 2, and 3
4. `base` contains only the aggregate of the shards we didn't take or leave. In this case, that's 1 & 2.

The value `L` is reset if you call `.with()` or `.without()`, and all shards that were left will not be part of the next crystalizer object:

```typescript
let crystalizer2 = crystalizer.leave(4).with([
    { id: 7, value: 1 },
    { id: 8, value: 1 },
]);

const [, shards] = crystalizer2.take();

console.log(shards); // [{ id: 1, value: 1}, { id: 7, value: 1}, { id: 7, value: 1}]

// the old shards aren't lost forever, they're just not part of the new crystalizer
const [, oldShards] = crystalizer.take();

console.log(oldShards); // { ... ids 1, 2, 3, 4, 5 ... }
```

You can also call `.leave()` with a callback that takes the current L value and return a new one. This is useful for undo/redo behavior:

```typescript
// undo
crystalizer = crystalizer.leave((l) => l + 1);

// redo
crystalizer = crystalizer.leave((l) => l - 1);
```

#### .focus()

The `.leave()` method is fine if you either know the historic index you want to backtrack to, or you simple want to increment the current one (undo/redo).

But, there might be times where you want to focus on a specific shard and calculate both crystals as though that shard is the most recent shard.

You can use `.focus()` to accomplish that.

```typescript
crystalizer = crystalizer.with([
    { id: 1, value: 1 },
    { id: 2, value: 1 },
    { id: 3, value: 1 },
    { id: 4, value: 1 },
    { id: 5, value: 1 },
]);

crystalizer = crystalizer.focus((shard) => shard.id == 3);
```

Note that unlike `.leave()`, the internal pointer is _NOT_ reset when you call `.with()` or `.without()`. Instead, the pointer is updated for each call of `.with()` or `.without()` per the seek function.

You can also use `.focus()` for a chronological value, such as `T` timestamp.

```typescript
crystalizer = crystalizer.focus((shard) => shard.ts >= Date.now() - WEEK);
```

However, this relies on the shards being sorted by that value. We'll get into sorting as well in the next section, but there's also builtin ways to handle timestamps in Crystalize.js (see [Timestamp](#timestamp)).

## Init options

### Sort

You can initialize a crystalizer with any number of sorts. You can either sort by a property of your shards, or use a function to do something more custom.

_(let's pretend values 1-10 are timestamps that make sense)_

```typescript
let crystalizer = new Crystalizer<Crystal, Shard>({
    initial: { total: 0 },
    reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
    sort: [
        ['asc', 'timestamp'],
        ['desc', (shard) => shard.value],
    ],
});

crystalizer = crystalizer.with([
    { timestamp: 2, value: 4 },
    { timestamp: 3, value: 7 },
    { timestamp: 1, value: 1 },
    { timestamp: 2, value: 8 },
    { timestamp: 1, value: 2 },
    { timestamp: 3, value: 3 },
]);

// Note that we're leaving 1 shard
const [crystal, shards, base] = crystalizer.leave(1).take();

console.log(crystal);
// { total: 22 }

console.log(shards);
// Note that { timestamp: 3, value: 3 } is missing
//
// [{ timestamp: 1, value: 2 },
//  { timestamp: 1, value: 1 },
//  { timestamp: 2, value: 8 },
//  { timestamp: 2, value: 4 },
//  { timestamp: 3, value: 7 }]

console.log(base);
// { total: 0 }
```

If you only need 1 sort, you can just pass it like so:

```typescript
new Crystalizer<Crystal, Shard>({
    ...

    sort: ['asc', 'timestamp'],
});
```

### Map

You might wish to automatically add or change certain keys to every shard. Id's are a great example of this. You can do so by specifying the `map` option, which takes a simple map function:

```typescript
import { ulid } from 'ulid';

let crystalizer = new Crystalizer<Crystal, Shard>({
    initial: { total: 0 },
    reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
    map: (shard) => ({ id: ulid(), ...shard }),
});
```

Now, all your shards will have a unique id from `ulid` if they didn't already have one.

### Timestamp

We have enough building blocks to ensure every shard has a timestamp, and are ordered by those timestamps.

```typescript
import { ulid } from 'ulid';

let crystalizer = new Crystalizer<Crystal, Shard>({
    initial: { total: 0 },
    reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
    map: (shard) => ({ id: ulid(), ts: Date.now(), ...shard }),
    sort: [
        ['asc', 'ts'],
        ['desc', 'value'],
    ],
});
```

But, we can do this much more simply by specifying the `tsKey` option:

```typescript
import { ulid } from 'ulid';

let crystalizer = new Crystalizer<Crystal, Shard>({
    initial: { total: 0 },
    reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
    map: (shard) => ({ id: ulid(), ...shard }),
    sort: ['desc', 'value'],
    tsKey: 'ts',
});
```

Now, it's handled for us automatically. Notice that in addition to removing it from our `map` call, it's not specified as a sort either. When a timestamp key is specified, shards are automatically sorted by that key first, and then everything else after.

### Keep

Remember that when we call `.take(N)`, we can pass in the value `N` which is the number of shards that are NOT collapsed into the base crystal. That's a mouthful, so let's bring back our earlier diagram:

```
┌─┬───────────────┬───┬──────────────────┬────┬────────────────┬─┐
│ │               │   │                  │    │                │ │
│ │    crystal    ◄───┤  N count shards  ◄────┤  base crystal  │ │
│ │               │   │                  │    │                │ │
│ └──────────v────┘   └────────v─────────┘    └───────v────────┘ │
│            │                 │                      │          │
│            │ ┌───────────────┘                      │          │
│            │ │                                      │          │
│            │ │ ┌────────────────────────────────────┘          │
│            │ │ │                                               │
│            │ │ │                                               │
│            │ │ │          Crystalizer                          │
└────────────┼─┼─┼────────────────────────────────────▲──────────┘
             │ │ │                                    │
             ▼ ▼ ▼                                    │
           .take(N)                             .with(shards)
```

We can set a limit on the `N` value by using the `keep` initialization option. If you recall, the default behavior of `.take()` when passed no arguments is equivalent to `.take(Infinity)`. So, setting a keep option is twofold: 1) We're setting a max value on `N`, and 2) We're setting the default `N` value when `.take()` is called without arguments.

```typescript
let crystalizer = new Crystalizer<Crystal, Shard>({
    initial: { total: 0 },
    reduce: (crystal, shard) => ({ total: crystal.total + shard.value }),
    keep: ['count', 2],
});

crystalizer = crystalizer.with([
    { value: 1 },
    { value: 1 },
    { value: 1 },
    { value: 1 },
    { value: 1 },
]);

const [crystal, shards, base] = crystalizer.take();

console.log(crystal); // { value: 5 }
console.log(shards); // [{ value: 1 }, { value: 1 }]
console.log(base); // { value: 3 }
```

Note that we can call `.take()` with a value _less_ than 2, but any value greater than 2 will return the same results as above.

This is very useful if you're dealing with a large number of shards. You can limit it to a specific quantity of shards like the above. Or, you can limit it to a certain range of time, such that old shards are automatically collapsed into the base crystal:

```typescript
const WEEK = 1000 * 60 * 60 * 24 * 7;
let crystalizer = new Crystalizer<Crystal, Shard>({
    ...
    keep: ['since', WEEK],
});
```

Maybe, you'll want to do a mix of both. The `min` and `max` options are your friend here.

```typescript
const WEEK = 1000 * 60 * 60 * 24 * 7;
let crystalizer = new Crystalizer<Crystal, Shard>({
    ...
    keep: ['min', [
        ['count', 5000],
        ['since', WEEK],
    ]],
});
```

This will keep, at most, 5000 shards, or the number of shards that are less than 1 week old, which ever is less. You'll never have more than 5000 shards, nor will you have shards older than 1 week. This is good if you're fine with missing some of that week's shards in some cases.

Maybe you have different requirements, and instead, want to have a full week's shards no matter what, but also don't mind backfilling up to 5000 shards if there's not many that week. You could use `max` for this:

```typescript
const WEEK = 1000 * 60 * 60 * 24 * 7;
let crystalizer = new Crystalizer<Crystal, Shard>({
    ...
    keep: ['max', [
        ['count', 5000],
        ['since', WEEK],
    ]],
});
```

Or, maybe you still want to set a limit of 10,000 total shards:

```typescript
const WEEK = 1000 * 60 * 60 * 24 * 7;
let crystalizer = new Crystalizer<Crystal, Shard>({
    ...
    keep: ['min', [
        ['count', 10000],
        ['max', [
            ['count', 5000],
            ['since', WEEK],
        ]],
    ]]

});
```

There is also `all`, which is the default behavior, and `none`, which will make it never keep any shards (crystal and base crystal will always be equivalent in this case).

```typescript
let crystalizer = new Crystalizer<Crystal, Shard>({
    ...
    keep: ['none'],
    // or
    keep: ['all'],
});
```

![Untitled Diagram drawio](https://github.com/zachbutton/crystalize.js/assets/5890542/a058a2d0-f3b3-4c66-9a1a-254141765da4)![Branches](./badges/coverage-branches.svg)
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

**Q**: Isn't `crystalize` spelled wrong?

![Screenshot from 2023-09-25 04-04-22](https://github.com/zachbutton/crystalize.js/assets/5890542/efe9007d-e0fa-4b1e-9d25-228657699af4)


**Q**: Why are they called 'Crystals' and 'Shards' and not something more familiar?

See [below](#what-are-crystals-and-shards-and-why).

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

![Uploading Untitled Diagram.drawio.svg…]<?xml version="1.0" encoding="UTF-8"?>
<!-- Do not edit this file with editors other than draw.io -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="441px" height="181px" viewBox="-0.5 -0.5 441 181" content="&lt;mxfile host=&quot;app.diagrams.net&quot; modified=&quot;2023-09-25T11:27:15.825Z&quot; agent=&quot;Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36&quot; etag=&quot;5g4dpEDRdaUfRWT1E-sB&quot; version=&quot;21.8.2&quot;&gt;&lt;diagram name=&quot;Page-1&quot; id=&quot;mH2hy6edKvKifKgGCu72&quot;&gt;5VjbUtswEP2azNCHZiwpicMjhEAfCgPDTEsfVVvYKrIV5M3F/fpKsXyLk5Q2GKflhfEe7epydvdIpEcm0epK0Vl4LX0metjxVz1y0cPYxUT/NUBqAdfNgEBxP4NQCdzzn8yCjkXn3GdJzRGkFMBnddCTccw8qGFUKbmsuz1KUV91RgPWAO49KproV+5DmKHjoVPinxgPwnxl5NiRiObOFkhC6stlBSLTHpkoKSH7ilYTJgx3OS9Z3OWO0WJjisXwkoDo+lKiZyW+XN09e5MHWNzB4KNNxoKKuT2w3SykOQNKzmOfmUmcHjlfhhzY/Yx6ZnSpU66xECKhLaQ/7XRMAVvt3CcqTq+rhsmIgUq1Sx5ALGG2YrBr7WXJ/2BgsbDKfR5Ibc6DYu6SFv1hmfkDltCwwQrzdZlYUyoIZSBjKqYlel7nrfT5LOXMsvWDAaS25ukcZJ1LtuLwYML7Q2t9q4xcrOzMayO1RrZPs7n97OuzyLny2L5Db8+SYoICX9Tn38a4Db2VXK9cZBc79ewO8EbSgKqAgY3ayFuxjQNS2Sh4T6UJUNF93Q826n7crHuEt9T9qK2yH3Va9ZWaLztge9VrhlX6kE9gjEqUMcuwtdVCt1jdzKq3xa46TMfcd6hjuB0dQ3+nY2dK0bTiNjMOye51yLC+Dhlt3PKNfaF9/voj28GriipuiOrN+kk2X+9MP3yUn3Sur/j02PS121fFv6Wv5IX6emi3H6avp+9QX0k7+orfRl+HG+9R4v5GXzHa59+OvpKGvn6nCTMSeyRv18HRvV3HDcr6Sw7hSXYZfWgwps8OdVoSUPKJTaSQSiOxjE2zPnIhNiAqeBBr09NcMY2fGya5R8WZHYi47687fVse6pl6jVS4OxqnkorRlky098+z0yC7M1F09opicc05/TE5rV51qO+g4u7bcdmtrVumuKbN1MFr6+z4hTeg2+UNmBdbte+APrGTm/+45dD4yFquqKkjaLk3e4e43faHNsvfcrOLv/xBnEx/AQ==&lt;/diagram&gt;&lt;/mxfile&gt;"><defs/><g><rect x="0" y="0" width="440" height="130" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><path d="M 70 70 L 70 110 L 70 143.63" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 70 148.88 L 66.5 141.88 L 70 143.63 L 73.5 141.88 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"/><rect x="10" y="10" width="120" height="60" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 40px; margin-left: 11px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">crystal</div></div></div></foreignObject><text x="70" y="44" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">crystal</text></switch></g><path d="M 160 40 L 136.37 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 131.12 40 L 138.12 36.5 L 136.37 40 L 138.12 43.5 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"/><path d="M 220 70 L 220 90 L 81 90 L 80.11 143.63" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 80.02 148.88 L 76.64 141.82 L 80.11 143.63 L 83.63 141.94 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"/><rect x="160" y="10" width="120" height="60" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 40px; margin-left: 161px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">N count shards</div></div></div></foreignObject><text x="220" y="44" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">N count shards</text></switch></g><path d="M 310 40 L 286.37 40" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 281.12 40 L 288.12 36.5 L 286.37 40 L 288.12 43.5 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"/><path d="M 370 70 L 370 100 L 91 100 L 90.13 143.63" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 90.02 148.88 L 86.66 141.81 L 90.13 143.63 L 93.66 141.95 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"/><rect x="310" y="10" width="120" height="60" fill="rgb(255, 255, 255)" stroke="rgb(0, 0, 0)" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 118px; height: 1px; padding-top: 40px; margin-left: 311px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">base crystal</div></div></div></foreignObject><text x="370" y="44" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">base crystal</text></switch></g><rect x="340" y="150" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 165px; margin-left: 341px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">.with(shards)</div></div></div></foreignObject><text x="370" y="169" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">.with(shar...</text></switch></g><path d="M 370 150 L 369.45 137.79" fill="none" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="stroke"/><path d="M 369.21 132.55 L 373.02 139.38 L 369.45 137.79 L 366.03 139.7 Z" fill="rgb(0, 0, 0)" stroke="rgb(0, 0, 0)" stroke-miterlimit="10" pointer-events="all"/><rect x="50" y="150" width="60" height="30" fill="none" stroke="none" pointer-events="all"/><g transform="translate(-0.5 -0.5)"><switch><foreignObject pointer-events="none" width="100%" height="100%" requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility" style="overflow: visible; text-align: left;"><div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; align-items: unsafe center; justify-content: unsafe center; width: 58px; height: 1px; padding-top: 165px; margin-left: 51px;"><div data-drawio-colors="color: rgb(0, 0, 0); " style="box-sizing: border-box; font-size: 0px; text-align: center;"><div style="display: inline-block; font-size: 12px; font-family: Helvetica; color: rgb(0, 0, 0); line-height: 1.2; pointer-events: all; white-space: normal; overflow-wrap: normal;">.take(N)</div></div></div></foreignObject><text x="80" y="169" fill="rgb(0, 0, 0)" font-family="Helvetica" font-size="12px" text-anchor="middle">.take(N)</text></switch></g></g><switch><g requiredFeatures="http://www.w3.org/TR/SVG11/feature#Extensibility"/><a transform="translate(0,-5)" xlink:href="https://www.drawio.com/doc/faq/svg-export-text-problems" target="_blank"><text text-anchor="middle" font-size="10px" x="50%" y="100%">Text is not SVG - cannot display</text></a></switch></svg>()

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

[crystalize.js](../README.md) / [Exports](../modules.md) / Opts

# Interface: Opts<Crystal, Shard\>

## Type parameters

| Name      |
| :-------- |
| `Crystal` |
| `Shard`   |

## Hierarchy

-   [`UserOpts`](../modules.md#useropts)<`Crystal`, `Shard`\>

-   `InternalOpts`<`Shard`\>

    ↳ **`Opts`**

## Table of contents

### Properties

-   [\_\_focus](Opts.md#__focus)
-   [\_\_getTime](Opts.md#__gettime)
-   [\_\_newShards](Opts.md#__newshards)
-   [\_\_ptr](Opts.md#__ptr)
-   [initial](Opts.md#initial)
-   [keep](Opts.md#keep)
-   [map](Opts.md#map)
-   [reduce](Opts.md#reduce)
-   [sort](Opts.md#sort)
-   [tsKey](Opts.md#tskey)

## Properties

### \_\_focus

• `Optional` **\_\_focus**: [`ShardSeekFn`](../modules.md#shardseekfn)<`Shard`\>

#### Inherited from

InternalOpts.\_\_focus

#### Defined in

[index.ts:38](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L38)

---

### \_\_getTime

• `Optional` **\_\_getTime**: () => `number`

#### Type declaration

▸ (): `number`

##### Returns

`number`

#### Inherited from

InternalOpts.\_\_getTime

#### Defined in

[index.ts:39](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L39)

---

### \_\_newShards

• `Optional` **\_\_newShards**: `Shard`[]

#### Inherited from

InternalOpts.\_\_newShards

#### Defined in

[index.ts:36](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L36)

---

### \_\_ptr

• `Optional` **\_\_ptr**: `number`

#### Inherited from

InternalOpts.\_\_ptr

#### Defined in

[index.ts:37](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L37)

---

### initial

• **initial**: `Crystal`

#### Inherited from

UserOpts.initial

#### Defined in

[index.ts:27](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L27)

---

### keep

• `Optional` **keep**: [`Keep`](../modules.md#keep)<`Shard`\>

#### Inherited from

UserOpts.keep

#### Defined in

[index.ts:30](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L30)

---

### map

• `Optional` **map**: (`shard`: `Readonly`<`Shard`\>) => `Shard`

#### Type declaration

▸ (`shard`): `Shard`

##### Parameters

| Name    | Type                 |
| :------ | :------------------- |
| `shard` | `Readonly`<`Shard`\> |

##### Returns

`Shard`

#### Inherited from

UserOpts.map

#### Defined in

[index.ts:29](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L29)

---

### reduce

• **reduce**: [`CrystalizerReducer`](../modules.md#crystalizerreducer)<`Crystal`, `Shard`\>

#### Inherited from

UserOpts.reduce

#### Defined in

[index.ts:28](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L28)

---

### sort

• `Optional` **sort**: [`SingleSort`](../modules.md#singlesort)<`Shard`\> \| [`SingleSort`](../modules.md#singlesort)<`Shard`\>[]

#### Inherited from

UserOpts.sort

#### Defined in

[index.ts:31](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L31)

---

### tsKey

• `Optional` **tsKey**: `string`

#### Inherited from

UserOpts.tsKey

#### Defined in

[index.ts:32](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L32)

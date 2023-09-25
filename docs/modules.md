[crystalize.js](README.md) / Exports

# crystalize.js

## Table of contents

### Classes

-   [default](classes/default.md)

### Type Aliases

-   [CrystalizerReducer](modules.md#crystalizerreducer)
-   [Keep](modules.md#keep)
-   [PlainObject](modules.md#plainobject)
-   [Primitive](modules.md#primitive)
-   [ShardSeekFn](modules.md#shardseekfn)
-   [SingleSort](modules.md#singlesort)
-   [UserOpts](modules.md#useropts)

## Type Aliases

### CrystalizerReducer

Ƭ **CrystalizerReducer**<`Crystal`, `Shard`\>: (`crystal`: `Readonly`<`Crystal`\>, `shard`: `Readonly`<`Shard`\>) => `Crystal`

#### Type parameters

| Name      |
| :-------- |
| `Crystal` |
| `Shard`   |

#### Type declaration

▸ (`crystal`, `shard`): `Crystal`

##### Parameters

| Name      | Type                   |
| :-------- | :--------------------- |
| `crystal` | `Readonly`<`Crystal`\> |
| `shard`   | `Readonly`<`Shard`\>   |

##### Returns

`Crystal`

#### Defined in

[index.ts:19](https://github.com/zachbutton/crystalize.js/blob/2938f5e/src/index.ts#L19)

---

### Keep

Ƭ **Keep**<`Shard`\>: [``"all"``] \| [``"none"``] \| [``"count"``, `number`] \| [`"first"`, [`ShardSeekFn`](modules.md#shardseekfn)<`Shard`\>] \| [``"since"``, `number`] \| [`"min"`, [`Keep`](modules.md#keep)<`Shard`\>[]] \| [`"max"`, [`Keep`](modules.md#keep)<`Shard`\>[]]

#### Type parameters

| Name    |
| :------ |
| `Shard` |

#### Defined in

[index.ts:10](https://github.com/zachbutton/crystalize.js/blob/2938f5e/src/index.ts#L10)

---

### PlainObject

Ƭ **PlainObject**: `Object`

#### Index signature

▪ [key: `string`]: [`Primitive`](modules.md#primitive) \| [`Primitive`](modules.md#primitive)[] \| [`PlainObject`](modules.md#plainobject)

#### Defined in

[index.ts:4](https://github.com/zachbutton/crystalize.js/blob/2938f5e/src/index.ts#L4)

---

### Primitive

Ƭ **Primitive**: `string` \| `number` \| `boolean` \| `null` \| `undefined`

#### Defined in

[index.ts:3](https://github.com/zachbutton/crystalize.js/blob/2938f5e/src/index.ts#L3)

---

### ShardSeekFn

Ƭ **ShardSeekFn**<`Shard`\>: (`shard`: `Readonly`<`Shard`\>) => `boolean`

#### Type parameters

| Name    |
| :------ |
| `Shard` |

#### Type declaration

▸ (`shard`): `boolean`

##### Parameters

| Name    | Type                 |
| :------ | :------------------- |
| `shard` | `Readonly`<`Shard`\> |

##### Returns

`boolean`

#### Defined in

[index.ts:8](https://github.com/zachbutton/crystalize.js/blob/2938f5e/src/index.ts#L8)

---

### SingleSort

Ƭ **SingleSort**<`Shard`\>: [`"asc"` \| `"desc"`, `string` \| [`ShardSeekFn`](modules.md#shardseekfn)<`Shard`\>]

#### Type parameters

| Name    |
| :------ |
| `Shard` |

#### Defined in

[index.ts:24](https://github.com/zachbutton/crystalize.js/blob/2938f5e/src/index.ts#L24)

---

### UserOpts

Ƭ **UserOpts**<`Crystal`, `Shard`\>: `Object`

#### Type parameters

| Name      |
| :-------- |
| `Crystal` |
| `Shard`   |

#### Type declaration

| Name      | Type                                                                                                 |
| :-------- | :--------------------------------------------------------------------------------------------------- |
| `initial` | `Crystal`                                                                                            |
| `keep?`   | [`Keep`](modules.md#keep)<`Shard`\>                                                                  |
| `map?`    | (`shard`: `Readonly`<`Shard`\>) => `Shard`                                                           |
| `reduce`  | [`CrystalizerReducer`](modules.md#crystalizerreducer)<`Crystal`, `Shard`\>                           |
| `sort?`   | [`SingleSort`](modules.md#singlesort)<`Shard`\> \| [`SingleSort`](modules.md#singlesort)<`Shard`\>[] |
| `tsKey?`  | `string`                                                                                             |

#### Defined in

[index.ts:26](https://github.com/zachbutton/crystalize.js/blob/2938f5e/src/index.ts#L26)

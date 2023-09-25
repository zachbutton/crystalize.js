[crystalize.js](../README.md) / [Exports](../modules.md) / default

# Class: default<Crystal, Shard\>

## Type parameters

| Name      | Type                                                                                            |
| :-------- | :---------------------------------------------------------------------------------------------- |
| `Crystal` | extends [`PlainObject`](../modules.md#plainobject) = [`PlainObject`](../modules.md#plainobject) |
| `Shard`   | extends [`PlainObject`](../modules.md#plainobject) = `Crystal`                                  |

## Table of contents

### Constructors

-   [constructor](default.md#constructor)

### Methods

-   [focus](default.md#focus)
-   [leave](default.md#leave)
-   [take](default.md#take)
-   [with](default.md#with)
-   [without](default.md#without)
-   [Builder](default.md#builder)

## Constructors

### constructor

• **new default**<`Crystal`, `Shard`\>(`_opts`)

#### Type parameters

| Name      | Type                                                                                            |
| :-------- | :---------------------------------------------------------------------------------------------- |
| `Crystal` | extends [`PlainObject`](../modules.md#plainobject) = [`PlainObject`](../modules.md#plainobject) |
| `Shard`   | extends [`PlainObject`](../modules.md#plainobject) = `Crystal`                                  |

#### Parameters

| Name    | Type                                                                                                              |
| :------ | :---------------------------------------------------------------------------------------------------------------- |
| `_opts` | [`Opts`](../interfaces/Opts.md)<`Crystal`, `Shard`\> \| [`UserOpts`](../modules.md#useropts)<`Crystal`, `Shard`\> |

#### Defined in

[index.ts:63](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L63)

## Methods

### focus

▸ **focus**(`seek`): [`default`](default.md)<`Crystal`, `Shard`\>

#### Parameters

| Name   | Type                                                 |
| :----- | :--------------------------------------------------- |
| `seek` | [`ShardSeekFn`](../modules.md#shardseekfn)<`Shard`\> |

#### Returns

[`default`](default.md)<`Crystal`, `Shard`\>

#### Defined in

[index.ts:159](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L159)

---

### leave

▸ **leave**(`count`): [`default`](default.md)<`Crystal`, `Shard`\>

#### Parameters

| Name    | Type                                    |
| :------ | :-------------------------------------- |
| `count` | `number` \| (`n`: `number`) => `number` |

#### Returns

[`default`](default.md)<`Crystal`, `Shard`\>

#### Defined in

[index.ts:154](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L154)

---

### take

▸ **take**(`count?`): (`Crystal` \| `Shard`[])[]

#### Parameters

| Name    | Type     | Default value |
| :------ | :------- | :------------ |
| `count` | `number` | `Infinity`    |

#### Returns

(`Crystal` \| `Shard`[])[]

#### Defined in

[index.ts:202](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L202)

---

### with

▸ **with**(`shards`): [`default`](default.md)<`Crystal`, `Shard`\>

#### Parameters

| Name     | Type                 |
| :------- | :------------------- |
| `shards` | `Shard` \| `Shard`[] |

#### Returns

[`default`](default.md)<`Crystal`, `Shard`\>

#### Defined in

[index.ts:163](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L163)

---

### without

▸ **without**(`seek`): [`default`](default.md)<`Crystal`, `Shard`\>

#### Parameters

| Name   | Type                                                 |
| :----- | :--------------------------------------------------- |
| `seek` | [`ShardSeekFn`](../modules.md#shardseekfn)<`Shard`\> |

#### Returns

[`default`](default.md)<`Crystal`, `Shard`\>

#### Defined in

[index.ts:191](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L191)

---

### Builder

▸ `Static` **Builder**<`Crystal`, `Shard`\>(`opts`): (`custom`: `Partial`<[`UserOpts`](../modules.md#useropts)<`Crystal`, `Shard`\>\>) => [`default`](default.md)<`Crystal`, `Shard`\>

#### Type parameters

| Name      | Type                                                                                            |
| :-------- | :---------------------------------------------------------------------------------------------- |
| `Crystal` | extends [`PlainObject`](../modules.md#plainobject) = [`PlainObject`](../modules.md#plainobject) |
| `Shard`   | extends [`PlainObject`](../modules.md#plainobject) = `Crystal`                                  |

#### Parameters

| Name   | Type                                                      |
| :----- | :-------------------------------------------------------- |
| `opts` | [`UserOpts`](../modules.md#useropts)<`Crystal`, `Shard`\> |

#### Returns

`fn`

▸ (`custom?`): [`default`](default.md)<`Crystal`, `Shard`\>

##### Parameters

| Name     | Type                                                                  |
| :------- | :-------------------------------------------------------------------- |
| `custom` | `Partial`<[`UserOpts`](../modules.md#useropts)<`Crystal`, `Shard`\>\> |

##### Returns

[`default`](default.md)<`Crystal`, `Shard`\>

| Name     | Type         |
| :------- | :----------- |
| `toJSON` | () => `void` |

#### Defined in

[index.ts:97](https://github.com/zachbutton/crystalize.js/blob/2881530/src/index.ts#L97)

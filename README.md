# ts-data-parser

This package contains a generic type `Parser<T, U>` which represents a conversion from type `T` to type `U`. Next it contains implementation of parsers for simple data types like `string`, `boolean`, `number` and so on, and combinator functions to combine these basic parsers into parsers for more complicated data structures (ie. `map`, `alt`, `identity`).

## Basic parsers

### string

Converts an `unknown` value into a `string` value.

```ts
  import * as data from "ts-data-parser"
  
  const v: unknown = "foo"
  const x: string = data.runParser(data.string, v)
  console.log(x)
```
```js
foo
```

### boolean

Converts an `unknown` value into a `boolean` value.

```ts
import * as data from "ts-data-parser"

const v: unknown = true
const x: boolean = data.runParser(data.boolean, v)
console.log(x)
```
```js
true
```

### number

Converts an `unknown` value into a `number` value.

```ts
import * as data from "ts-data-parser"

const v: unknown = 3.14
const x: number = data.runParser(data.number, v)
console.log(x)
```
```js
3.14
```

### constant

Ignore the input value and always return a constant value.

```ts
import * as data from "ts-data-parser"

type Foo = {
  a: string
  b: boolean
}

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.constant(true)
})

const value: unknown = { a: "some text" }
const foo: Foo = data.runParser(fooParser, value)
console.log(foo)
```
```js
{ a: "some text", b: true }
```

### identity

Don't parse anything, returns the input value as is.
Useful for example if you don't want to parse some property of object and leave it as `unknown`.

```ts
import * as data from "ts-data-parser"

type Foo = {
  a: string
  b: unknown
}

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.identity
})

const value: unknown = { a: "some text", b: 3.14 }
const foo: Foo = data.runParser(fooParser, value)
console.log(foo)
```
```js
{ a: "some text", b: 3.14 }
```

### unknown

Return an `uknown` value as is, its an alias for the `identity` parser.
Useful for example if you don't want to parse some property of object and leave it as `unknown`.

```ts
import * as data from "ts-data-parser"

type Foo = {
  a: string
  b: unknown
}

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.unknown
})

const value: unknown = { a: "some text", b: 3.14 }
const foo: Foo = data.runParser(fooParser, value)
console.log(foo)
```
```js
{ a: "some text", b: 3.14 }
```
### dateTime

Converts an `unknown` value into a `Moment` value.

```ts
import * as data from "ts-data-parser"
import type Moment from "moment"

const v: unknown = "2023-01-01T14:00:00.000Z"
const x: Moment = data.runParser(data.dateTime, v)
```

## Structured data parsers

### object

Converts an `unknown` value into some concrete object type.

```ts
import * as data from "ts-data-parser"

type Person = {
  firstname: string
  lastname: string
  age: number
  title?: string
}

const personParser = data.object<Person>({
  firstname: data.string,
  lastname: data.string,
  age: data.number,
  title: data.optional(data.string)
})

const value: unknown = {
  firstname: "Tom",
  lastname: "Walters",
  age: 27
}

const person = data.runParser(personParser, value)
console.log(person)
```
```js
{ firstname: "Tom", lastname: "Walters", age: 27 }
```

### array

Converts an `unknown` value into an array of some type.

```ts
import * as data from "ts-data-parser"

const v: unknown = [1, 2, 3]
const xs: Array<number> = data.array(data.number)
console.log(xs)
```
```js
[1, 2, 3]
```

## Combinator functions

### optional

Changes a parser to allow `undefined` value.

### nullable

Changes a parser to allow `null` value.

### withDefault

Changes a parser to return some value instead of `undefined` or `null`.

### map

Changes a parser to convert an output value using a closure.

### lift

Converts some ordinal function `<T, U>(x: T) => U` into a parser `Parser<T, U>`.

### alt

Creates a parser from alternative parsers of same type.
It calls these parsers in sequence and returns the result of the first parser which haven't failed.

## Example

```ts
import * as data from "ts-data-parser"

type Person = {
  firstname: string
  lastname: string
  age: number
  title?: string
}

const personParser = data.object<Person>({
  firstname: data.string,
  lastname: data.string,
  age: data.number,
  title: data.optional(data.string)
})

const getPeople = async () => {
  const response = await fetch("http://api.example.com/people")
  const body = await response.json()
  const people = data.runParser(data.array(personParser), body)
  return people
}
```

# ts-data-parser

This package contains a generic type `Parser<T, U>` which represents a conversion from type `T` to type `U`. Next it contains implementation of parsers for simple data types like `string`, `boolean`, `number` and so on, and combinator functions to combine these basic parsers into parsers for more complicated data structures (ie. `map`, `alt`, `identity`).

## Basic parsers

### string

Converts an `unknown` value into a `string` value.

```ts
import * as data from "ts-data-parser";

const v: unknown = "foo";
const x: string = data.runParser(data.string, v);
console.log(x);
```

```js
foo;
```

### boolean

Converts an `unknown` value into a `boolean` value.

```ts
import * as data from "ts-data-parser";

const v: unknown = true;
const x: boolean = data.runParser(data.boolean, v);
console.log(x);
```

```js
true;
```

### number

Converts an `unknown` value into a `number` value.

```ts
import * as data from "ts-data-parser";

const v: unknown = 3.14;
const x: number = data.runParser(data.number, v);
console.log(x);
```

```js
3.14;
```

### constant

Ignore the input value and always return a constant value.

```ts
import * as data from "ts-data-parser";

type Foo = {
  a: string;
  b: boolean;
};

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.constant(true),
});

const value: unknown = { a: "some text" };
const foo: Foo = data.runParser(fooParser, value);
console.log(foo);
```

```js
{ a: "some text", b: true }
```

### identity

Don't parse anything, returns the input value as is.
Useful for example if you don't want to parse some property of object and leave it as `unknown`.

```ts
import * as data from "ts-data-parser";

type Foo = {
  a: string;
  b: unknown;
};

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.identity,
});

const value: unknown = { a: "some text", b: 3.14 };
const foo: Foo = data.runParser(fooParser, value);
console.log(foo);
```

```js
{ a: "some text", b: 3.14 }
```

### unknown

Return an `uknown` value as is, its an alias for the `identity` parser.
Useful for example if you don't want to parse some property of object and leave it as `unknown`.

```ts
import * as data from "ts-data-parser";

type Foo = {
  a: string;
  b: unknown;
};

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.unknown,
});

const value: unknown = { a: "some text", b: 3.14 };
const foo: Foo = data.runParser(fooParser, value);
console.log(foo);
```

```js
{ a: "some text", b: 3.14 }
```

### dateTime

Converts an `unknown` value into a `Moment` value.

```ts
import * as data from "ts-data-parser";
import type Moment from "moment";

const v: unknown = "2023-01-01T14:00:00.000Z";
const x: Moment = data.runParser(data.dateTime, v);
```

## Structured data parsers

### object

Converts an `unknown` value into some concrete object type.

```ts
import * as data from "ts-data-parser";

type Person = {
  firstname: string;
  lastname: string;
  age: number;
  title?: string;
};

const personParser = data.object<Person>({
  firstname: data.string,
  lastname: data.string,
  age: data.number,
  title: data.optional(data.string),
});

const value: unknown = {
  firstname: "Tom",
  lastname: "Walters",
  age: 27,
};

const person = data.runParser(personParser, value);
console.log(person);
```

```js
{ firstname: "Tom", lastname: "Walters", age: 27 }
```

### array

Converts an `unknown` value into an array of some type.

```ts
import * as data from "ts-data-parser";

const v: unknown = [1, 2, 3];
const xs: Array<number> = data.array(data.number);
console.log(xs);
```

```js
[1, 2, 3];
```

## Combinator functions

### optional

Changes a parser to allow `undefined` value.

```ts
import * as data form "ts-data-parser"

type Foo = {
  a: string
  b?: boolean
}

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.optional(data.boolean)
})

const value: unknown = { a: "hello" }
const foo: Foo = data.runParser(fooParser, value)
console.log(foo)
```

```js
{
  a: "hello";
}
```

### nullable

Changes a parser to allow `null` value.

```ts
import * as data form "ts-data-parser"

type Foo = {
  a: string
  b: boolean | null
}

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.nullable(data.boolean)
})

const value: unknown = { a: "hello", b: null }
const foo: Foo = data.runParser(fooParser, value)
console.log(foo)
```

```js
{ a: "hello", b: null }
```

### withDefault

Changes a parser to return some value instead of `undefined` or `null`.

```ts
import * as data form "ts-data-parser"

type Foo = {
  a: string
  b: boolean | null
}

const fooParser = data.object<Foo>({
  a: data.string,
  b: data.withDefault(data.boolean, false)
})

const value: unknown = { a: "hello" }
const foo: Foo = data.runParser(fooParser, value)
console.log(foo)
```

```js
{ a: "hello", b: false }
```

### map

Changes a parser to convert an output value using a closure.

```ts
import * as data form "ts-data-parser"

const parser = data.map(data.string, (s) => Number.parseInt(s))

const v: unknown = "27"
const x: number = data.runParser(parser, value)
console.log(x)
```

```js
27;
```

### lift

Converts some ordinal function `<T, U>(x: T) => U` into a parser `Parser<T, U>`.

```ts
import * as data form "ts-data-parser"

const parser = data.compose(data.string, data.lift((v) => Number.parseInt(v)))

const v: unknown = "27"
const x: number = data.runParser(parser, v)
console.log(x)
```

```js
27;
```

### alt

Creates a parser from alternative parsers of same type.
It calls these parsers in sequence and returns the result of the first parser which haven't failed.

```ts
import * as data form "ts-data-parser"

const parser = data.alt(
  data.string,
  data.number,
  data.fail((v) => `"${v}" is nor string neither number`)
)

const v: unknown = 27
const x: string | number = data.runParser(parser, v)
console.log(x)
```

```js
27;
```

### compose

Composes two parser together.

```ts
import * as data form "ts-data-parser"

const parser = data.compose(data.string, data.lift((v) => Number.parseInt(v)))

const v: unknown = "27"
const x: number = data.runParser(parser, v)
console.log(x)
```

```js
27;
```

### fail

Fails with an error message.
Error message could be a string constant or a closure receiving input value and returning a string.

```ts
import * as data form "ts-data-parser"

const parser = data.alt(
  data.string,
  data.number,
  data.fail("Value is nor string neither number")
)

const v: unknown = 27
const x: string | number = data.runParser(parser, v)
console.log(x)
```

```js
27;
```

```ts
import * as data form "ts-data-parser"

const parser = data.alt(
  data.string,
  data.number,
  data.fail((v) => `"${v}" is nor string neither number`)
)

const v: unknown = 27
const x: string | number = data.runParser(parser, v)
console.log(x)
```

```js
27;
```

### preCondition

Changes a parser to test the input value.

```ts
import * as data form "ts-data-parser"

const parser = data.preCondition(
  data.number,
  (v) => {
    if (v === undefined)
      return `"${v}" cannot be undefined`
  }
)

const v: unknown = 27
const x: number = data.runParser(parser, v)
console.log(x)
```

```js
27;
```

### postCondition

Changes a parser to test the output value.

```ts
import * as data form "ts-data-parser"

const parser = data.postCondition(
  data.number,
  (n) => {
    if (n < 20)
      return `"${v}" have to be higher or equal to 20`
  }
)

const v: unknown = 27
const x: number = data.runParser(parser, v)
console.log(x)
```

```js
27;
```

## Example

```ts
import * as data from "ts-data-parser";

type Person = {
  firstname: string;
  lastname: string;
  age: number;
  title?: string;
};

const personParser = data.object<Person>({
  firstname: data.string,
  lastname: data.string,
  age: data.number,
  title: data.optional(data.string),
});

const getPeople = async () => {
  const response = await fetch("http://api.example.com/people");
  const body = await response.json();
  const people = data.runParser(data.array(personParser), body);
  return people;
};
```

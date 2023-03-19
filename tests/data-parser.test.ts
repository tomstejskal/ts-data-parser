import moment from "moment";

import * as data from "../src";

describe("data-parser", () => {
  test("string", () => {
    const v: unknown = "hello";
    const x = data.runParser(data.string, v);
    expect(x).toBe("hello");
  });

  test("string - failure", () => {
    const v: unknown = 27;
    expect(() => data.runParser(data.string, v)).toThrow();
  });

  test("number", () => {
    const v: unknown = 3.14;
    const x = data.runParser(data.number, v);
    expect(x).toBe(3.14);
  });

  test("number - failure", () => {
    const v: unknown = "hello";
    expect(() => data.runParser(data.number, v)).toThrow();
  });

  test("boolean", () => {
    const v: unknown = true;
    const x = data.runParser(data.boolean, v);
    expect(x).toBe(true);
  });

  test("boolean - failure", () => {
    const v: unknown = "hello";
    expect(() => data.runParser(data.boolean, v)).toThrow();
  });

  test("date and time", () => {
    const v: unknown = "2023-01-01T12:00:00.000Z";
    const x = data.runParser(data.dateTime, v);
    expect(x).toStrictEqual(moment("2023-01-01T12:00:00.000Z"));
  });

  test("date and time - failure", () => {
    const v: unknown = "hello";
    expect(() => data.runParser(data.dateTime, v)).toThrow();
  });

  test("object", () => {
    type Foo = { a: string; b: boolean; c?: number };

    const fooParser = data.object<Foo>({
      a: data.string,
      b: data.boolean,
      c: data.optional(data.number),
    });

    const v: unknown = {
      a: "hello",
      b: true,
    };

    const x = data.runParser(fooParser, v);
    expect(x).toStrictEqual({ a: "hello", b: true });
  });

  test("object failure", () => {
    type Foo = { a: string; b: boolean; c?: number };

    const fooParser = data.object<Foo>({
      a: data.string,
      b: data.boolean,
      c: data.optional(data.number),
    });

    const v: unknown = 27;

    expect(() => data.runParser(fooParser, v)).toThrow();
  });

  test("array", () => {
    const v: unknown = [1, 2, 3];
    const x = data.runParser(data.array(data.number), v);
    expect(x).toStrictEqual([1, 2, 3]);
  });

  test("array failure", () => {
    const v: unknown = 27;
    expect(() => data.runParser(data.array(data.number), v)).toThrow();
  });

  test("optional - with value", () => {
    const v: unknown = 27;
    expect(data.runParser(data.optional(data.number), v)).toBe(27);
  });

  test("optional - without value", () => {
    const v: unknown = undefined;
    expect(data.runParser(data.optional(data.number), v)).toBeUndefined();
  });

  test("nullable - with value", () => {
    const v: unknown = 27;
    expect(data.runParser(data.nullable(data.number), v)).toBe(27);
  });

  test("nullable - without value", () => {
    const v: unknown = null;
    expect(data.runParser(data.nullable(data.number), v)).toBeNull();
  });

  test("map", () => {
    const v: unknown = "27";
    const x = data.runParser(
      data.map(data.string, (x) => Number.parseInt(x)),
      v
    );
    expect(x).toBe(27);
  });

  test("alt - success", () => {
    const v: unknown = 27;
    const x = data.runParser(
      data.alt<unknown, number | string>(data.string, data.number),
      v
    );
    expect(x).toBe(27);
  });

  test("alt - failure", () => {
    const v: unknown = true;
    expect(() =>
      data.runParser(
        data.alt<unknown, number | string>(data.string, data.number),
        v
      )
    ).toThrow();
  });

  test("alt - no parsers", () => {
    const v: unknown = true;
    expect(() =>
      data.runParser(data.alt<unknown, number | string>(), v)
    ).toThrow();
  });

  test("lift", () => {
    const v: unknown = "27";
    expect(
      data.runParser(
        data.compose(
          data.string,
          data.lift((v) => Number.parseInt(v))
        ),
        v
      )
    ).toBe(27);
  });

  test("constant", () => {
    const v: unknown = 27;
    expect(data.runParser(data.constant(7), v)).toBe(7);
  });

  test("withDefault - with value", () => {
    const v: unknown = 27;
    expect(
      data.runParser(data.withDefault(data.optional(data.number), 7), v)
    ).toBe(27);
  });

  test("withDefault - without value, constant default value", () => {
    const v: unknown = undefined;
    expect(
      data.runParser(data.withDefault(data.optional(data.number), 7), v)
    ).toBe(7);
  });

  test("withDefault - without value, closure default value", () => {
    const v: unknown = undefined;
    expect(
      data.runParser(
        data.withDefault(data.optional(data.number), () => 7),
        v
      )
    ).toBe(7);
  });

  test("url", () => {
    const v: unknown = "http://www.example.com";
    expect(String(data.runParser(data.url, v))).toBe("http://www.example.com");
  });

  test("url - invalid", () => {
    const v: unknown = "()";
    expect(() => data.runParser(data.url, v)).toThrow();
  });

  test("record", () => {
    const v: unknown = { a: "hello", b: true };
    expect(data.runParser(data.record, v)).toStrictEqual({
      a: "hello",
      b: true,
    });
  });

  test("record - failure", () => {
    const v: unknown = 27;
    expect(() => data.runParser(data.record, v)).toThrow();
  });

  test("fail - with a constant", () => {
    expect(() => data.runParser(data.fail("foo"), undefined)).toThrow("foo");
  });

  test("fail - with a closure", () => {
    expect(() =>
      data.runParser(
        data.fail((v) => `foo ${v}`),
        7
      )
    ).toThrow("foo 7");
  });

  test("preCondition", () => {
    const v = 7;
    expect(
      data.runParser(
        data.preCondition(data.number, (v) => {
          if (typeof v !== "number") {
            return "foo";
          }
        }),
        v
      )
    ).toBe(7);
  });

  test("preCondition", () => {
    const v = "hello";
    expect(() =>
      data.runParser(
        data.preCondition(data.number, (v) => {
          if (typeof v !== "number") {
            return "foo";
          }
        }),
        v
      )
    ).toThrow("foo");
  });

  test("pushToCtx", () => {
    const ctx = data.newParsingCtx();
    expect(ctx()).toStrictEqual([]);
    const ctx2 = data.pushToCtx(ctx, "foo");
    expect(ctx2()).toStrictEqual(["foo"]);
  });

  test("error", () => {
    const ctx = data.newParsingCtx();
    const ctx2 = data.pushToCtx(ctx, "foo");
    const err = data.error("bar", ctx2);
    expect(err).toStrictEqual(new Error("bar in foo"));
  });
});

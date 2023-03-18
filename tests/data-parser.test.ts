import * as data from "../src";
import moment from "moment";

describe("data-parser", () => {
  test("parse string", () => {
    const v: unknown = "hello";
    const x = data.runParser(data.string, v);
    expect(x).toBe("hello");
  });

  test("parse number", () => {
    const v: unknown = 3.14;
    const x = data.runParser(data.number, v);
    expect(x).toBe(3.14);
  });

  test("parse boolean", () => {
    const v: unknown = true;
    const x = data.runParser(data.boolean, v);
    expect(x).toBe(true);
  });

  test("parse date and time", () => {
    const v: unknown = "2023-01-01T12:00:00.000Z";
    const x = data.runParser(data.dateTime, v);
    expect(x).toStrictEqual(moment("2023-01-01T12:00:00.000Z"));
  });

  test("parse object", () => {
    type Foo = {
      a: string;
      b: boolean;
      c?: number;
    };

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

  test("parse array", () => {
    const v: unknown = [1, 2, 3];
    const x = data.runParser(data.array(data.number), v);
    expect(x).toStrictEqual([1, 2, 3]);
  });
});

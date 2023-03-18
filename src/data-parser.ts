import moment, { Moment } from "moment";

export type ParsingCtx = () => Array<string>;

export const newParsingCtx = (): ParsingCtx => () => [];

export const pushToCtx =
  (ctx: ParsingCtx, msg: string): ParsingCtx =>
  () =>
    [msg, ...ctx()];

export type Parser<T, U> = (v: T, ctx: ParsingCtx) => U;

export const compose =
  <T, U, V>(a: Parser<T, U>, b: Parser<U, V>): Parser<T, V> =>
  (v: T, ctx: ParsingCtx) =>
    b(a(v, ctx), ctx);

export const error = (msg: string, ctx: ParsingCtx) => {
  let s = msg;
  if (ctx) {
    ctx().forEach((x) => {
      s += ` in ${x}`;
    });
  }
  return new Error(s);
};

export const fail =
  <T, U>(msg: string): Parser<T, U> =>
  (_, ctx) => {
    throw error(msg, ctx);
  };

export const failWith =
  <T, U>(f: (v: T) => string): Parser<T, U> =>
  (v, ctx) => {
    throw error(f(v), ctx);
  };

export const preCondition =
  <T, U>(
    parser: Parser<T, U>,
    pred: (v: T) => string | undefined
  ): Parser<T, U> =>
  (v, ctx) => {
    const msg = pred(v);
    if (msg !== undefined) {
      throw error(msg, ctx);
    }
    return parser(v, ctx);
  };

export const postCondition =
  <T, U>(
    parser: Parser<T, U>,
    pred: (result: U) => string | undefined
  ): Parser<T, U> =>
  (v, ctx) => {
    const result = parser(v, ctx);
    const msg = pred(result);
    if (msg !== undefined) {
      throw error(msg, ctx);
    }
    return result;
  };

export const string: Parser<unknown, string> = (v, ctx) => {
  if (typeof v === "string") {
    return v;
  }
  throw error(`Value ${String(v)} is not a string`, ctx);
};

export const boolean: Parser<unknown, boolean> = (v, ctx) => {
  if (typeof v === "boolean") {
    return v;
  }
  throw error(`Value ${String(v)} is not a boolean`, ctx);
};

export const number: Parser<unknown, number> = (v, ctx) => {
  if (typeof v === "number") {
    return v;
  }
  throw error(`Value ${String(v)} is not a number`, ctx);
};

export const dateTime: Parser<unknown, Moment | undefined> = compose(
  string,
  (v, ctx) => {
    try {
      const d = moment(v);
      if (d.diff(moment("1899-12-30T00:00:00.000Z")) > 0) {
        return d;
      }
    } catch {
      throw error(`Value ${String(v)} is not a date and time`, ctx);
    }
  }
);

const isRecord = (v: unknown): v is object =>
  typeof v === "object" && v !== null && !Array.isArray(v);

export const object: <T = object>(
  props: Record<keyof T, Parser<unknown, T[keyof T]>>
) => Parser<unknown, T> = (props) => (v, ctx) => {
  if (isRecord(v)) {
    let obj: any = {};
    Object.entries(props).forEach(([key, parser]) => {
      const ctx2 = pushToCtx(ctx, `object property ${String(key)}`);
      let u = undefined;
      if (Object.prototype.hasOwnProperty.call(v, key)) {
        u = (parser as any)((v as any)[key], ctx2);
      } else {
        u = (parser as any)(undefined, ctx2);
      }
      if (u !== undefined) {
        obj[key] = u;
      }
    });
    return obj;
  }
  throw error(`Value ${String(v)} is not an object`, ctx);
};

export const record: Parser<unknown, object> = (v, ctx) => {
  if (isRecord(v)) {
    return v;
  }
  throw error(`Value ${String(v)} is not an object`, ctx);
};

export const array =
  <T, U>(item: Parser<T, U>): Parser<T, Array<U>> =>
  (v, ctx) => {
    if (Array.isArray(v)) {
      return v.map((x, i) => {
        const ctx2 = pushToCtx(ctx, `array at index ${i}`);
        return item(x, ctx2);
      });
    }
    throw error(`Value ${String(v)} is not an array`, ctx);
  };

export const url = postCondition(string, (s) => {
  try {
    new URL(s);
  } catch {
    return `Invalid URL "${s}"`;
  }
});

export const optional =
  <T, U>(parser: Parser<T, U>): Parser<T, U | undefined> =>
  (v, ctx) => {
    if (typeof v === "undefined") {
      return undefined;
    }
    return parser(v, ctx);
  };

export const nullable =
  <T, U>(parser: Parser<T, U>): Parser<T, U | null> =>
  (v, ctx) => {
    if (v === null) {
      return null;
    }
    return parser(v, ctx);
  };

export const withDefault =
  <T, U>(
    parser: Parser<T, U | null | undefined>,
    def: U | (() => U)
  ): Parser<T, U> =>
  (v, ctx) => {
    const x = parser(v, ctx);
    if (x === null || x === undefined) {
      if (def instanceof Function) {
        return def();
      }
      return def;
    }
    return x;
  };

export const map =
  <T, U, V>(parser: Parser<T, U>, f: (x: U) => V): Parser<T, V> =>
  (v, ctx) =>
    f(parser(v, ctx));

export const constant =
  <T, U>(x: U) =>
  (_v: T, _ctx: ParsingCtx) =>
    x;

export const identity = <T>(v: T, _ctx: ParsingCtx) => v;

export const unknown = (v: unknown, _ctx: ParsingCtx) => v;

export const lift =
  <T, U>(f: (x: T) => U) =>
  (v: T, _ctx: ParsingCtx) =>
    f(v);

export const alt =
  <T, U>(...parsers: Array<Parser<T, U>>): Parser<T, U> =>
  (v: T, ctx: ParsingCtx) => {
    let err: any;
    for (const parser of parsers) {
      try {
        return parser(v, ctx);
      } catch (e) {
        // ignore the exception and try another parser
        err = e;
      }
    }
    if (err) {
      throw err;
    }
    throw error("Unexpected data", ctx);
  };

export const runParser = <T, U>(parser: Parser<T, U>, v: T) =>
  parser(v, newParsingCtx());

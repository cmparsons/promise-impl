const MyPromise = require("../src/promise");
const { resolve } = require("../src/promise");

const resolvePromise = (value) => new MyPromise((resolve) => resolve(value));
const rejectPromise = (value) => new MyPromise((_, reject) => reject(value));

describe(MyPromise, () => {
  it("throws when not given a function", () => {
    expect(() => new MyPromise(null)).toThrow();
  });

  it("then", () => {
    it("resolves the promise", () => {
      resolvePromise(5).then((actual) => {
        expect(actual).toBe(5);
      });
    });

    it("rejects the promise", () => {
      rejectPromise(5).then(null, (actual) => {
        expect(actual).toBe(5);
      });
    });

    it("is async", () => {
      const p = new MyPromise((resolve) => resolve(5));

      expect(p.value).not.toBe(5);
    });

    it("settles errors as rejected", () => {
      new MyPromise(() => {
        throw new Error("error");
      }).then(null, (actual) => {
        expect(actual).toBe(5);
      });
    });

    it("returns a new promise", () => {
      const p = new MyPromise((resolve) => resolve(5));
      const p2 = p.then((result) => result);

      expect(p).not.toBe(p2);
    });

    it("can resolve another MyPromise", () => {
      resolvePromise(5).then(() =>
        new MyPromise((resolve) => resolve(10)).then((actual) => {
          expect(actual).toBe(10);
        })
      );
    });

    it("is chainable", () => {
      resolvePromise(5)
        .then((actual) => {
          expect(actual).toBe(5);
          return 10;
        })
        .then((actual) => {
          expect(actual).toBe(10);
        });
    });

    it("settles the promise only once", () => {
      new MyPromise((resolve) => {
        resolve(5);
        resolve(10);
      }).then((actual) => expect(actual).toBe(5));
    });

    it("settles the promise only once with reject", () => {
      new MyPromise((_, reject) => {
        reject(5);
        reject(10);
      }).then(null, (actual) => expect(actual).toBe(5));
    });

    it("settles the promise only once with reject and resolve", () => {
      new MyPromise((resolve, reject) => {
        reject(5);
        resolve(10);
      }).then(null, (actual) => expect(actual).toBe(5));
    });
  });

  describe("catch", () => {
    it("handles rejections", () => {
      rejectPromise("error").catch((e) => {
        expect(e).toBe("error");
      });
    });

    it("catches errors", () => {
      new MyPromise(() => {
        throw new Error("error");
      }).catch((e) => {
        expect(e).toBe("error");
      });
    });
  });

  describe("finally", () => {
    it("gets called on resolves", () => {
      resolvePromise("resolve").finally((value) => {
        expect(value).toBeUndefined();
      });
    });

    it("gets called on rejections", () => {
      rejectPromise("error").finally((value) => {
        expect(value).toBeUndefined();
      });
    });
  });

  describe(MyPromise.resolve, () => {
    it("resolves like a promise", () => {
      MyPromise.resolve(5).then((actual) => expect(actual).toBe(5));
    });
  });

  describe(MyPromise.reject, () => {
    it("rejects like a promise", () => {
      MyPromise.reject(5).then(null, (actual) => expect(actual).toBe(5));
    });
  });
});

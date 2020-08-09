const MyPromise = require("../src/promise");

const resolvePromise = (value) => new MyPromise((resolve) => resolve(value));
const rejectPromise = (value) => new MyPromise((_, reject) => reject(value));

const rejectWithDelay = (value, delay) => new MyPromise((_, reject) => setTimeout(() => reject(value), delay));
const resolveWithDelay = (value, delay) => new MyPromise((resolve) => setTimeout(() => resolve(value), delay));

describe(MyPromise, () => {
  it("throws when not given a function", () => {
    expect(() => new MyPromise(null)).toThrowError(TypeError);
  });

  describe("then", () => {
    it("resolves the promise", () => {
      return resolvePromise(5).then((actual) => {
        expect(actual).toBe(5);
      });
    });

    it("rejects the promise", () => {
      return rejectPromise(5).then(null, (actual) => {
        expect(actual).toBe(5);
      });
    });

    it("is async", () => {
      const p = new MyPromise((resolve) => resolve(5));

      expect(p.value).not.toBe(5);
    });

    it("settles errors as rejected", () => {
      return new MyPromise(() => {
        throw new Error("error");
      }).then(null, (e) => {
        expect(e.message).toBe("error");
      });
    });

    it("returns a new promise", () => {
      const p = new MyPromise((resolve) => resolve(5));
      const p2 = p.then((result) => result);

      expect(p).not.toBe(p2);
    });

    it("can resolve another MyPromise", () => {
      return resolvePromise(5).then(() =>
        new MyPromise((resolve) => resolve(10)).then((actual) => {
          expect(actual).toBe(10);
        })
      );
    });

    it("is chainable", () => {
      return resolvePromise(5)
        .then((actual) => {
          expect(actual).toBe(5);
          return 10;
        })
        .then((actual) => {
          expect(actual).toBe(10);
        });
    });

    it("settles the promise only once", () => {
      return new MyPromise((resolve) => {
        resolve(5);
        resolve(10);
      }).then((actual) => {
        expect(actual).toBe(5);
      });
    });

    it("settles the promise only once with reject", () => {
      return new MyPromise((_, reject) => {
        reject(5);
        reject(10);
      }).then(null, (actual) => {
        expect(actual).toBe(5);
      });
    });

    it("settles the promise only once with reject and resolve", () => {
      return new MyPromise((resolve, reject) => {
        reject(5);
        resolve(10);
      }).then(null, (actual) => {
        expect(actual).toBe(5);
      });
    });
  });

  describe("catch", () => {
    it("handles rejections", () => {
      return rejectPromise("error").catch((e) => {
        expect(e).toBe("error");
      });
    });

    it("catches errors", () => {
      return new MyPromise(() => {
        throw new Error("error");
      }).catch((e) => {
        expect(e.message).toBe("error");
      });
    });
  });

  describe("finally", () => {
    it("gets called on resolves", () => {
      return resolvePromise("resolve").finally((value) => {
        expect(value).toBeUndefined();
      });
    });

    it("gets called on rejections", () => {
      return rejectPromise("error").finally((value) => {
        expect(value).toBeUndefined();
      });
    });
  });

  describe(MyPromise.resolve, () => {
    it("resolves like a promise", () => {
      return MyPromise.resolve(5).then((actual) => {
        expect(actual).toBe(5);
      });
    });
  });

  describe(MyPromise.reject, () => {
    it("rejects like a promise", () => {
      return MyPromise.reject(5).then(null, (actual) => {
        expect(actual).toBe(5);
      });
    });
  });

  describe(MyPromise.all, () => {
    it("throws an error when given null", () => {
      expect(() => MyPromise.all(null)).toThrowError(TypeError);
    });

    it("throws an error when given undefined", () => {
      expect(() => MyPromise.all()).toThrowError(TypeError);
    });

    it("throws an error when given an object", () => {
      expect(() => MyPromise.all({})).toThrowError(TypeError);
    });

    it("throws an error when given a primitive type", () => {
      expect(() => MyPromise.all(5)).toThrowError(TypeError);
    });

    it("resolves to an empty array when given an empty array", () => {
      return MyPromise.all([]).then((actual) => {
        expect(actual).toEqual([]);
      });
    });

    it("resolves all promises", () => {
      return MyPromise.all([MyPromise.resolve(1), MyPromise.resolve(2)]).then((resolvedCollection) => {
        expect(resolvedCollection).toEqual([1, 2]);
      });
    });

    it("rejects when one promise rejects", () => {
      return MyPromise.all([MyPromise.resolve(1), MyPromise.reject("rejected")]).catch((e) => {
        expect(e).toBe("rejected");
      });
    });

    it("rejects with the first promise to reject", () => {
      return MyPromise.all([rejectWithDelay("reject 1", 30), rejectWithDelay("reject 2", 1000)]).catch((e) => {
        expect(e).toBe("reject 1");
      });
    });
  });

  describe(MyPromise.race, () => {
    it("resolves with the first promise to resolve", () => {
      return MyPromise.race([resolveWithDelay(1, 100), resolveWithDelay(2, 50), resolveWithDelay(3, 30)]).then(
        (actual) => {
          expect(actual).toBe(3);
        }
      );
    });

    it("rejects with the first promise to reject", () => {
      return MyPromise.race([resolveWithDelay(1, 20), resolveWithDelay(2, 25), resolveWithDelay(3, 30)]).catch(
        (actual) => {
          expect(actual).toBe(1);
        }
      );
    });

    it("settles with the first promise to settle", () => {
      return MyPromise.race([resolveWithDelay(1, 20), rejectWithDelay(2, 25), resolveWithDelay(3, 30)]).then(
        (actual) => {
          expect(actual).toBe(1);
        }
      );
    });
  });

  describe(MyPromise.allSettled, () => {
    const status = {
      fulfilled: "fulfilled",
      rejected: "rejected",
    };

    it("resolves all promises", () => {
      return MyPromise.allSettled([MyPromise.resolve(1), MyPromise.resolve(2)]).then((resolvedCollection) => {
        expect(resolvedCollection).toEqual([
          { status: status.fulfilled, value: 1 },
          { status: status.fulfilled, value: 2 },
        ]);
      });
    });

    it("settles all promises even when some reject", () => {
      return MyPromise.allSettled([MyPromise.resolve(1), MyPromise.reject("rejected")]).then((resolvedCollection) => {
        expect(resolvedCollection).toEqual([
          { status: status.fulfilled, value: 1 },
          { status: status.rejected, reason: "rejected" },
        ]);
      });
    });

    it("settles collection when some are non-promise types", () => {
      return MyPromise.allSettled([true, 1, MyPromise.resolve("promise")]).then((resolvedCollection) => {
        expect(resolvedCollection).toEqual([
          { status: status.fulfilled, value: true },
          { status: status.fulfilled, value: 1 },
          { status: status.fulfilled, value: "promise" },
        ]);
      });
    });
  });
});

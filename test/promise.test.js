const MyPromise = require("../src/promise");

const resolvePromise = (value) => new MyPromise((resolve) => resolve(value));
const rejectPromise = (value) => new MyPromise((_, reject) => reject(value));

describe(MyPromise, () => {
  it("throws when not given a function", () => {
    expect(() => new MyPromise(null)).toThrowError(TypeError);
  });

  describe("then", () => {
    it("resolves the promise", (done) => {
      resolvePromise(5).then((actual) => {
        expect(actual).toBe(5);
        done();
      });
    });

    it("rejects the promise", (done) => {
      rejectPromise(5).then(null, (actual) => {
        expect(actual).toBe(5);
        done();
      });
    });

    it("is async", () => {
      const p = new MyPromise((resolve) => resolve(5));

      expect(p.value).not.toBe(5);
    });

    xit("settles errors as rejected", (done) => {
      new MyPromise(() => {
        throw new Error("error");
      }).then(null, (actual) => {
        expect(actual).toBe(5);
        done();
      });
    });

    it("returns a new promise", () => {
      const p = new MyPromise((resolve) => resolve(5));
      const p2 = p.then((result) => result);

      expect(p).not.toBe(p2);
    });

    it("can resolve another MyPromise", (done) => {
      resolvePromise(5).then(() =>
        new MyPromise((resolve) => resolve(10)).then((actual) => {
          expect(actual).toBe(10);
          done();
        })
      );
    });

    it("is chainable", (done) => {
      resolvePromise(5)
        .then((actual) => {
          expect(actual).toBe(5);
          return 10;
        })
        .then((actual) => {
          expect(actual).toBe(10);
          done();
        });
    });

    it("settles the promise only once", (done) => {
      new MyPromise((resolve) => {
        resolve(5);
        resolve(10);
      }).then((actual) => {
        expect(actual).toBe(5);
        done();
      });
    });

    it("settles the promise only once with reject", (done) => {
      new MyPromise((_, reject) => {
        reject(5);
        reject(10);
      }).then(null, (actual) => {
        expect(actual).toBe(5);
        done();
      });
    });

    it("settles the promise only once with reject and resolve", (done) => {
      new MyPromise((resolve, reject) => {
        reject(5);
        resolve(10);
      }).then(null, (actual) => {
        expect(actual).toBe(5);
        done();
      });
    });
  });

  describe("catch", () => {
    it("handles rejections", (done) => {
      rejectPromise("error").catch((e) => {
        expect(e).toBe("error");
        done();
      });
    });

    xit("catches errors", (done) => {
      new MyPromise(() => {
        throw new Error("error");
      }).catch((e) => {
        expect(e).toBe("error");
        done();
      });
    });
  });

  describe("finally", () => {
    it("gets called on resolves", (done) => {
      resolvePromise("resolve").finally((value) => {
        expect(value).toBeUndefined();
        done();
      });
    });

    it("gets called on rejections", (done) => {
      rejectPromise("error").finally((value) => {
        expect(value).toBeUndefined();
        done();
      });
    });
  });

  describe(MyPromise.resolve, () => {
    it("resolves like a promise", (done) => {
      MyPromise.resolve(5).then((actual) => {
        expect(actual).toBe(5);
        done();
      });
    });
  });

  describe(MyPromise.reject, () => {
    it("rejects like a promise", () => {
      MyPromise.reject(5).then(null, (actual) => {
        expect(actual).toBe(5);
        done();
      });
    });
  });

  describe(MyPromise.all, () => {
    it("resolves all promises", (done) => {
      MyPromise.all([MyPromise.resolve(1), MyPromise.resolve(2)]).then((resolvedCollection) => {
        expect(resolvedCollection).toEqual([1, 2]);
        done();
      });
    });

    it("rejects all when one promise rejects", (done) => {
      MyPromise.all([MyPromise.resolve(1), MyPromise.reject("rejected")]).catch((e) => {
        expect(e).toBe("rejected");
        done();
      });
    });
  });
});

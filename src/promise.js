const STATE = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  constructor(resolver) {
    if (typeof this !== "object") {
      throw new TypeError("MyPromise must be called with 'new'");
    }
    if (typeof resolver !== "function") {
      throw new TypeError("resolver must be function");
    }

    this.state = STATE.PENDING;
    this.value = null;

    this.handlers = [];

    const resolve = (value) => {
      // so promise only settles once
      if (this.state !== STATE.PENDING) {
        return;
      }

      // handle when resolved to another promise
      if (value && typeof value.then === "function") {
        return value.then(resolve, reject);
      }

      this.state = STATE.FULFILLED;
      this.value = value;

      for (const handler of this.handlers) {
        this.handle(handler);
      }
      this.handlers = [];
    };

    const reject = (error) => {
      // so promise only settles once
      if (this.state !== STATE.PENDING) {
        return;
      }

      this.state = STATE.REJECTED;
      this.value = error;

      for (const handler of this.handlers) {
        this.handle(handler);
      }
      this.handlers = [];
    };

    setTimeout(() => {
      try {
        resolver(resolve, reject);
      } catch (error) {
        reject(error);
      }
    }, 0);
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(_onFinally) {
    const onFinally = () => _onFinally();
    return this.then(onFinally, onFinally);
  }

  then(_onFulfilled, _onRejected) {
    return new MyPromise((resolve, reject) => {
      const handler = {
        onFulfilled(result) {
          if (!_onFulfilled) {
            return resolve(result);
          }
          try {
            return resolve(_onFulfilled(result));
          } catch (error) {
            return reject(error);
          }
        },
        onRejected(reason) {
          if (!_onRejected) {
            return reject(reason);
          }
          try {
            return resolve(_onRejected(reason));
          } catch (error) {
            return reject(error);
          }
        },
      };

      setTimeout(() => {
        this.handle.apply(this, [handler]);
      }, 0);
    });
  }

  handle(handler) {
    const { onFulfilled, onRejected } = handler;
    if (this.state === STATE.FULFILLED && typeof onFulfilled === "function") {
      onFulfilled(this.value);
    } else if (this.state === STATE.REJECTED && typeof onRejected === "function") {
      onRejected(this.value);
    } else {
      this.handlers.push(handler);
    }
  }

  static resolve(value) {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(error) {
    return new MyPromise((_, reject) => reject(error));
  }

  static all(promises) {
    if (!promises || !Array.isArray(promises)) {
      throw new TypeError(`MyPromise.all not given an array. Given ${typeof promises}`);
    }

    return new MyPromise((resolve, reject) => {
      if (promises.length < 1) {
        return resolve([]);
      }

      let fulfilledCount = 0;
      const resolvedPromises = Array.from({ length: promises.length });

      promises.forEach((value, index) => {
        // not a promise
        if (!value || typeof value.then !== "function") {
          fulfilledCount++;
          resolvedPromises[index] = value;
        } else {
          value.then((result) => {
            fulfilledCount++;
            resolvedPromises[index] = result;

            // promises can resolve in different orders, so once the last promise resolve, resolve the whole collection.
            if (fulfilledCount === promises.length) {
              return resolve(resolvedPromises);
            }
          }, reject); // if any promise rejects, reject the whole collection.
        }
      });
    });
  }

  static race(promises) {
    if (!promises || !Array.isArray(promises)) {
      throw new TypeError(`MyPromise.race not given an array. Given ${typeof promises}`);
    }

    return new MyPromise((resolve, reject) => {
      promises.forEach((value) => {
        // not a promise. resolve immediately
        if (!value || typeof value.then !== "function") {
          resolve(value);
        } else {
          // resolve or reject once the first promise settles
          value.then(resolve, reject);
        }
      });
    });
  }

  static allSettled(promises) {
    if (!promises || !Array.isArray(promises)) {
      throw new TypeError(`MyPromise.allSettled not given an array. Given ${typeof promises}`);
    }

    return new MyPromise((resolve) => {
      if (promises.length < 1) {
        return resolve([]);
      }

      let settledCount = 0;
      const settledPromises = Array.from({ length: promises.length });

      promises.forEach((value, index) => {
        // not a promise
        if (!value || typeof value.then !== "function") {
          settledCount++;
          settledPromises[index] = { status: STATE.FULFILLED, value };
        } else {
          const handleSettled = (status, resultKey) => (result) => {
            settledCount++;
            // return value has a status fulfilled or rejected and either a value or reason with the settled value
            resolvedPromises[index] = { status, [resultKey]: result };

            if (settledCount === promises.length) {
              return resolve(resolvedPromises);
            }
          };

          // wait until all promises are either resolved or rejected
          value.then(handleSettled(STATE.FULFILLED, "value"), handleSettled(STATE.REJECTED, "reason"));
        }
      });
    });
  }
}

module.exports = MyPromise;

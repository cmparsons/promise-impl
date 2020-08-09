const STATE = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
};

class MyPromise {
  constructor(resolver) {
    if (typeof this !== "object") {
      throw new Error("MyPromise must be called with 'new'");
    }
    if (typeof resolver !== "function") {
      throw new Error("resolver must be function");
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
}

module.exports = MyPromise;

describe('Test suite for testing lib.js', () => {
  describe('Test suite for testing sum function', () => {
    it('should return sum of two numbers', () => {
      assert.equal(sum(1, 2), 3)
      assert.equal(sum(-10, 5), -5)
      assert.equal(sum(-10, 10), 0)
    });

    it('should return NaN if one parameter is skipped', () => {
      assert.isNaN(sum(1))
    });

    it('should convert string to number if input parameters is string', () => {
      assert.equal(sum('5', '1'), 6)
      assert.equal(sum(10, '1'), 11)
      assert.equal(sum('25', 5), 30)
    });
  });

  describe('Test suite for testing pow function', () => {
    it('should raising x to the n power', () => {
      assert.equal(pow(2, 3), 8)
      assert.equal(pow(3, 4), 81)
      assert.equal(pow(-2, 3), -8)
      assert.equal(pow(-2, 2), 4)
    });

    it('should return 1 if n is 0', () => {
      assert.equal(pow(5, 0), 1)
      assert.equal(pow(0, 0), 1)
    });

    it('should return x if n is 1', () => {
      assert.equal(pow(7, 1), 7)
    });

    it('should return 0 if x is 0 and n is positive', () => {
      assert.equal(pow(0, 5), 0)
    });

    // RED test: current implementation returns 1 for negative n (BUG)
    it('should support negative power (2^-1 = 0.5)', () => {
      assert.equal(pow(2, -1), 0.5)
    });
  });

  describe('Test suite for testing factorial function', () => {
    it('should return 1 for 0 and 1', () => {
      assert.equal(factorial(0), 1)
      assert.equal(factorial(1), 1)
    });

    it('should calculate factorial of a number', () => {
      assert.equal(factorial(3), 6)
      assert.equal(factorial(5), 120)
      assert.equal(factorial(10), 3628800)
    });

    it('should throw RangeError for negative numbers (infinite recursion)', () => {
      assert.throws(() => factorial(-1), RangeError)
    });
  });

  describe('Test suite for testing fibonacci function', () => {
    it('should return 1 for the first two elements', () => {
      assert.equal(fibonacci(1), 1)
      assert.equal(fibonacci(2), 1)
    });

    it('should calculate n-th Fibonacci number', () => {
      assert.equal(fibonacci(3), 2)
      assert.equal(fibonacci(4), 3)
      assert.equal(fibonacci(7), 13)
      assert.equal(fibonacci(10), 55)
    });

    // RED test: current implementation returns 1 for 0 (BUG)
    it('should return 0 for n = 0', () => {
      assert.equal(fibonacci(0), 0)
    });
  });

  describe('Test suite for testing removeByName function', () => {
    it('should remove some element from array', () => {
      assert.deepEqual(removeByName(['a', 'b', 'c'], 'b'), ['a', 'c'])
      assert.deepEqual(removeByName(['a', 'b', 'c'], 'a'), ['b', 'c'])
      assert.deepEqual(removeByName(['a'], 'a'), [])
    });

    it('should not remove element from array', () => {
      assert.deepEqual(removeByName(['a', 'b', 'c'], 'z'), ['a', 'b', 'c'])
      assert.deepEqual(removeByName([], 'a'), [])
    });

    it('should remove only the first occurrence', () => {
      assert.deepEqual(removeByName(['a', 'b', 'a'], 'a'), ['b', 'a'])
    });

    it('should not mutate the original array', () => {
      const original = ['a', 'b', 'c']
      const result = removeByName(original, 'b')
      assert.deepEqual(original, ['a', 'b', 'c'])
      assert.notStrictEqual(result, original)
    });
  });

  describe('Test suite for testing makeCounter function', () => {
    it('should return a function', () => {
      assert.isFunction(makeCounter(0))
    });

    it('should return current value and then increment it', () => {
      const counter = makeCounter(5)
      assert.equal(counter(), 5)
      assert.equal(counter(), 6)
      assert.equal(counter(), 7)
    });

    it('should keep independent state for each counter', () => {
      const c1 = makeCounter(0)
      const c2 = makeCounter(100)
      c1(); c1()
      assert.equal(c1(), 2)
      assert.equal(c2(), 100)
    });
  });

  describe('Test suite for testing getAsyncTimerId function', () => {
    it('should return unixtime (in seconds) as timer id', async () => {
      const id = await getAsyncTimerId(100)
      assert.isNumber(id)
      assert.approximately(id, Math.floor(Date.now() / 1000), 2)
    });
  });

  describe('Test suite for testing asyncMultiply function', () => {
    it('should work with negative numbers and zero', async function () {
      this.timeout(5000)
      const [neg, zero] = await Promise.all([asyncMultiply(-3), asyncMultiply(0)])
      assert.equal(neg, -6)
      assert.equal(zero, 0)
    });

    it('should multiply parameter by 2', async function () {
      this.timeout(5000) // function takes 3s, default Mocha timeout is 2s
      assert.equal(await asyncMultiply(4), 8)
    });

  });

  describe('Test suite for testing httpGet function', () => {
    // Fake XMLHttpRequest: tests do not depend on the network
    const RealXHR = window.XMLHttpRequest;

    class FakeXHR {
      open(method, url) { this.method = method; this.url = url }
      send() {
        setTimeout(() => {
          if (FakeXHR.networkError) {
            this.onerror()
          } else {
            this.status = FakeXHR.status
            this.statusText = FakeXHR.statusText
            this.response = FakeXHR.response
            this.onload()
          }
        }, 0)
      }
    }

    beforeEach(() => {
      FakeXHR.networkError = false
      FakeXHR.status = 200
      FakeXHR.statusText = 'OK'
      FakeXHR.response = 'hello'
      window.XMLHttpRequest = FakeXHR
    });

    afterEach(() => {
      window.XMLHttpRequest = RealXHR
    });

    it('should return a Promise', () => {
      assert.instanceOf(httpGet('/test'), Promise)
    });

    it('should resolve with response body when status is 200', async () => {
      assert.equal(await httpGet('/test'), 'hello')
    });

    it('should reject with error code when status is not 200', async () => {
      FakeXHR.status = 404
      FakeXHR.statusText = 'Not Found'
      try {
        await httpGet('/missing')
        assert.fail('promise should be rejected')
      } catch (e) {
        assert.instanceOf(e, Error)
        assert.equal(e.code, 404)
        assert.equal(e.message, 'Not Found')
      }
    });

    it('should reject with "Network Error" on network failure', async () => {
      FakeXHR.networkError = true
      try {
        await httpGet('/test')
        assert.fail('promise should be rejected')
      } catch (e) {
        assert.equal(e.message, 'Network Error')
      }
    });
  });
});

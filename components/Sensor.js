const GPIO = require('onoff').Gpio;

class Sensor {
  constructor(pin) {
    this.pin = pin;

    this.gpio = new GPIO(this.pin, 'in', 'both', {
      debounceTimeout: 10
    });
  }

  getStatus() {
    return this.gpio.readSync();
  }

  onChange(fn = () => {}) {
    // console.log(`Watching sensor #${this.pin}`);
    this.gpio.watch((err, value) => {
      fn(value);
      // console.log("from the sensor: " + value);
    });
  }

  stopWatch() {
    this.gpio.unwatchAll();
  }

  kill() {
    this.gpio.unexport();
  }
}

module.exports = Sensor;

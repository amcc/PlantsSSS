const GPIO = require('onoff').Gpio;

const Sensor = require('./Sensor');

class Pump {
  constructor({ id, pump, sensor, plant, side, lastWatered = null } = {}, { openDelay = 2000, timeDelay = 5000 } = {}) {
    this.id = id;
    this.pin = pump;
    this.plant = plant;
    this.side = side;
    this.openDelay = openDelay;
    this.timeDelay = timeDelay;

    this.gpio = new GPIO(this.pin, 'out', {
      activeLow: true
    });
    this.gpio.writeSync(0);

    this.sensor = new Sensor(sensor);

    this.lastUsed = lastWatered;

    this._updateMethod = () => {};
  }

  open() {
    // console.log(`Opening pump #${this.pin}`);
    this.lastUsed = new Date();
    this.gpio.writeSync(1);
  }

  close() {
    // console.log(`Closing pump #${this.pin}`);
    this.gpio.writeSync(0);
  }

  toggle() {
    this.open();

    this.timer = setTimeout(() => {
      this.close();
    }, this.openDelay);
  }

  getLastUsed() {
    return this.lastUsed;
  }

  getStatus() {
    return this.sensor.getStatus();
  }

  getSensorPin() {
    return this.sensor.pin;
  }

  auto() {
    let oldState = -1;
    let checkState = state => {
      // console.log("state value is: " + state)
      if (oldState != state) {
        oldState = state;
        
        if (state == 1 && !this.autoWatering) {
          this._autoWater();
          // console.log("autowater");
        } else if (state == 0) {
          this._stopCheck();
          // console.log("stopping autowater");
        }
      }
    };

    this.sensor.onChange(checkState);
    checkState(this.sensor.getStatus());
    
  }

  _autoWater() {
    this.autoWatering = true;
    this.toggle();

    this._update();

    this.timer = setTimeout(() => {
      this._autoWater();
    }, this.timeDelay);
  }

  _stopCheck() {
    this.autoWatering = false;
    clearTimeout(this.timer);

    this._update();
  }

  stopAuto() {
    this.sensor.stopWatch();
    clearTimeout(this.timer);
  }

  // getData() {
  //   return {
  //     plant: this.plant,
  //     watering: this.autoWatering,
  //     lastWatered: this.lastUsed ? this.lastUsed.toISOString() : null,
  //     dry: Boolean(this.sensor.getStatus())
  //   }
  // }

  getData() {
    const data = {
      plant: this.plant,
      watering: this.autoWatering,
      dry: Boolean(this.sensor.getStatus()),
      side: this.side,
    };

    if (this.lastUsed) {
        data.lastWatered = this.lastUsed.toISOString();
    }

    return data;
  }

  _update() {
    this._updateMethod(this.id, this.getData());
  }

  onUpdate(fn) {
    this._updateMethod = fn;
  }

  kill() {
    clearTimeout(this.timer);
    this.gpio.unexport();

    this.sensor.kill();
  }
}

module.exports = Pump;

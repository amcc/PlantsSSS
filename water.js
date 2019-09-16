require('dotenv').config()
var firebaseAdmin = require("firebase-admin");

var serviceAccount = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY,
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-zvqgh%40piwatering-80e6c.iam.gserviceaccount.com"
};

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  databaseURL: "https://piwatering-80e6c.firebaseio.com"
});

// setup firebase refs
const rootRef = firebaseAdmin.database().ref('wateringStatus');
const pumpsRef = rootRef.child('pumps');

const Pump = require("./components/Pump");


const pumps = [];
let autoWatering = false;

function getByPin(pin) {
  return pumps.find(p => p.pin === pin);
}

function getBySensorPin(pin) {
  return pumps.find(p => p.getSensorPin() === pin);
}

function onPumpUpdate(pin, data) {
  console.log(pin, data);

  pumpsRef.child(pin).set(data);

}

function createPumps(pumpPins = []) {
  pumpPins.forEach(obj => {
    const pump = new Pump(obj.pump, obj.sensor, obj.plant, obj.side);
    pump.onUpdate(onPumpUpdate);

    pumps.push(pump);
  });
}

function getLastWatered(pin) {
  return getByPin(pin).getLastUsed();
}

function getStatus(pin) {
  console.log("status")
  console.log(getBySensorPin(pin).getStatus())
  return getBySensorPin(pin).getStatus();
}

function autoWater(pin) {
  getByPin(pin).auto();
}

function autoWaterAll(start = true) {
  if (start) {
    autoWatering = true;
    pumps.forEach(p => p.auto());
  } else {
    autoWatering = false;
    pumps.forEach(p => p.stopAuto());
  }
}

function getStatusAll() {
  // console.log(pumps);
  return pumps.map(pump => ({
    status: pump.getStatus(),
    pin: pump.getSensorPin()
  }));
}

function isAutoWatering() {
  return autoWatering;
}

function cleanup() {
  pumps.forEach(p => p.kill());
}

module.exports = {
  createPumps,
  getLastWatered,
  getStatus,
  getStatusAll,
  autoWater,
  autoWaterAll,
  isAutoWatering,
  cleanup
};

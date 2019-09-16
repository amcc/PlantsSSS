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
const pumpsHistoryRef = rootRef.child('pumpsHistory');

const Pump = require("./components/Pump");


const pumps = [];
let autoWatering = false;

function getByPin(pin) {
  return pumps.find(p => p.pin === pin);
}

function getBySensorPin(pin) {
  return pumps.find(p => p.getSensorPin() === pin);
}

// pub sub relationship
function onPumpUpdate(id, data) {
  console.log(id, data);

  pumpsRef.child(id).set(data);
  var timestamp = Date.now();
  pumpsHistoryRef.child(timestamp).child(key).set(data);
}

function createPumps(pumpParams = []) {
  // pumpPins.forEach(obj => {
  //   const pump = new Pump(obj.pump, obj.sensor, obj.plant, obj.side);
  //   pump.onUpdate(onPumpUpdate);

  //   pumps.push(pump);
  // });

  return Promise.all(pumpParams.map(obj => {
    return pumpsRef.child(obj.id)
      .once('value')
      .then(snapshot => {
        const val = snapshot.val();
        const pump = new Pump({
          ...obj,
          lastWatered: val && val.hasOwnProperty('lastWatered') ? val.lastWatered : null
        });
        pump.onUpdate(onPumpUpdate);
    
        return pump;
      });
  }))
    .then(_pumps => {
      _pumps.forEach(p => pumps.push(p));

      return pumps;
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

function getPumps() {
  return pumps.slice();
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
  getPumps,
  autoWater,
  autoWaterAll,
  isAutoWatering,
  cleanup
};

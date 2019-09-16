const path = require('path');
const express = require('express');
const mustache = require('mustache-express');

const Water = require('./water');
const Hardware = require('./hardware')
const app = express();
const port = 3000;

// Sets the templating engine to be mustache
// as express/node doesn't have its own default one
app.engine('html', mustache());
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'template'));

// This sets express to serve static files from the template/static folder
// So http://localhost:3000/static/css/styles.css actually is in
// template/static/css/styles.css
app.use('/static', express.static(path.join(__dirname, 'template', 'static')));

function template({ title = 'HELLO!', text = '' } = {}) {
  return {
    title,
    time: new Date().toISOString(),
    text
  };
}

// just in case the import doesn't work for Hardware

// const PINS = [
//   {
//     pump: 21,
//     sensor: 13,
//     plant: "plant 1",
//     side: 'right'
//   },
//   {
//     pump: 20,
//     sensor: 6,
//     plant: "plant 2",
//     side: 'right'
//   },
//   {
//     pump: 16,
//     sensor: 5,
//     plant: "plant 3",
//     side: 'right'
//   },
//   {
//     pump: 12,
//     sensor: 11,
//     plant: "plant 4",
//     side: 'right'
//   },
//   {
//     pump: 7,
//     sensor: 9,
//     plant: "plant 5",
//     side: 'right'
//   },
//   {
//     pump: 8,
//     sensor: 10,
//     plant: "plant 6",
//     side: 'right'
//   },
//   {
//     pump: 25,
//     sensor: 22,
//     plant: "plant 7",
//     side: 'right'
//   },
//   {
//     pump: 24,
//     sensor: 27,
//     plant: "plant 8",
//     side: 'right'
//   }
// ];

// Water.createPumps(PINS);

Water.createPumps(Hardware);
// turn on autowater at the beginning 
Water.autoWaterAll(true);

app.get('/', (req, res) => {
  res.render('index.html', template());
});

app.get('/auto/water/:toggle', (req, res) => {
  let text;

  if (req.params.toggle == 'ON') {
    if (Water.isAutoWatering()) {
      text = 'Already auto watering';
    } else {
      text = 'Auto watering on';
      Water.autoWaterAll(true);
    }
  } else {
    if (!Water.isAutoWatering()) {
      text = 'Not auto watering';
    } else {
      text = 'Auto watering off';
      Water.autoWaterAll(false);
    }
  }
  res.render('index.html', template({ text }));
});

app.get('/sensor', (req, res) => {
  let text;

  console.log(Water.getStatusAll())
  res.render('index.html', template({ text }));
});

app.listen(port, () => {
  console.log(`App running on http://localhost:${port}`);
})

process.on('exit', () => {
  Water.cleanup();
});

process.on('SIGINT', () => {
  // On CTRL+C force a clean exit to use above
  process.exit(0);
});

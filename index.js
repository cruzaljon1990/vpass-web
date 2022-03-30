require('dotenv').config();
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const port = process.env.PORT || 3001;
const cors = require('cors');
const glob = require('glob');
const _path = require('path');
const { default: mongoose } = require('mongoose');

app.use(cors());
app.use(express.json());

app.use(function (err, req, res, next) {
  if (err.code === 'permission_denied') {
    res.status(403).send('Forbidden');
  }
});

glob('services/**/*.js', (err, res) => {
  if (err) {
    console.log('Error', err);
  } else {
    res.reverse();
    res.forEach((path) => {
      const require_path = path;
      const router = require('./' + require_path);
      path =
        '/api/' +
        path.replace('.js', '').replace('services/', '').replace('index', '');
      path = path.replace('_', '-');
      app.use(path, router);
    });
  }
});

server.listen(port, async () => {
  console.log(`running http://localhost:${port}`);
  await mongoose.connect(process.env.DATABASE_URL, () => {
    console.log(`mongodb: connected!`);
  });
});

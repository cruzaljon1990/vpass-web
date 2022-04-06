const router = require('express').Router();
const { default: faker } = require('@faker-js/faker');
const Log = require('../db/mongo/Log');
const SitePrefs = require('../db/mongo/SitePrefs');
const User = require('../db/mongo/User');
const Vehicle = require('../db/mongo/Vehicle');
const check_for_available_slots = require('../helpers/logs/check_for_available_slots');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');

router.post('/', [auth(['admin', 'guard'])], async (req, res) => {
  try {
    let { firstname, middlename, lastname, model, plate_no, is_parking } =
      req.body;
    if (is_parking === true) {
      const has_available_slots = await check_for_available_slots(false);

      if (!has_available_slots) {
        return res.status(501).send({
          error: 'Limit exceeded!',
        });
      }
    }
    const log = await Log.create({
      firstname,
      middlename,
      lastname,
      model,
      plate_no,
      is_parking,
      is_visitor: true,
    });

    if (log) {
      return res.send(log);
    }
  } catch (error) {
    console.log(error);
  }
  return res.status(500).send({
    errors: 'Invalid log!',
  });
});

router.post('/:id', [auth(['admin', 'guard'])], async (req, res) => {
  const { firstname, middlename, lastname, model, plate_no } = req.body;
  const log = await Log.findByIdAndUpdate(req.params.id, {
    firstname,
    middlename,
    lastname,
    model,
    plate_no,
    updated_at: Date.now(),
  });

  if (log) {
    return res.send(log);
  } else {
    return res.status(500).send({ error: 'Log not found' });
  }
});

router.delete('/:id', [auth(['admin', 'driver'])], async (req, res) => {
  const log = await Log.findByIdAndDelete(req.params.id);
  if (!log) {
    return res.status(500).send({ error: 'Invalid log!' });
  }
  return res.send(log);
});

router.post(
  '/toggle-status/:id',
  [auth(['admin', 'guard']), validate('log_id')],
  async (req, res) => {
    let log = await Log.findById(req.params.id).populate({
      path: 'vehicle_ref',
      model: Vehicle,
    });

    if (log) {
      log = await Log.findByIdAndUpdate(
        req.params.id,
        { time_out: Date.now(), updated_at: Date.now() },
        { new: true }
      );
      return res.send(log);
    } else {
      return res.status(500).send({
        error: 'Invalid log',
      });
    }
  }
);

router.get('/generate-faker', async (req, res) => {
  let logs = [];
  const limit = 35;

  for (let i = 0; i < limit; i++) {
    firstname = faker.name.firstName();
    middlename = faker.name.middleName();
    lastname = faker.name.lastName();
    let log = {
      firstname,
      middlename,
      lastname,
      model: faker.vehicle.model(),
      plate_no: faker.vehicle.vrm(),
      is_parking: Math.round(Math.random()) == 0,
      is_visitor: Math.round(Math.random()) == 0,
    };
    if (log.is_visitor) {
      log['is_vip'] = Math.round(Math.random()) == 0;
    }
    if (Math.round(Math.random()) == 0) {
      log['time_out'] = Date.now();
    }
    logs.push(log);
  }
  if (logs) await Log.insertMany(logs);
  return res.send(logs);
});

router.get('/', [auth(['admin', 'guard'])], async (req, res) => {
  let condition = {};
  if (req.query.name) {
    condition = {
      $or: [
        { firstname: { $regex: '.*' + req.query.name + '.*', $options: 'i' } },
        { middlename: { $regex: '.*' + req.query.name + '.*', $options: 'i' } },
        { lastname: { $regex: '.*' + req.query.name + '.*', $options: 'i' } },
      ],
    };
  }
  if (req.query.is_visitor) {
    condition['is_visitor'] = req.query.is_visitor == 1;
  }
  if (req.query.page) {
    page = req.query.page;
  } else {
    page = 1;
  }
  let logs = await Log.paginate(condition, {
    sort: '-updated_at',
    page: page,
    perPage: 20,
  });
  logs.data.forEach((log) => {
    log.is_in = !log.time_out;
  });
  return res.send(logs);
});

router.get('/:id', [auth(['all'])], async (req, res) => {
  try {
    let log = await Log.findById(req.params.id);
    if (log) {
      log.is_in = !log.time_out;
      return res.send(log);
    } else {
      return res.status(404).send({ error: 'Log not found' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error: 'Log not found' });
  }
});

module.exports = router;

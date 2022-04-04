const router = require('express').Router();
const Log = require('../db/mongo/Log');
const SitePrefs = require('../db/mongo/SitePrefs');
const User = require('../db/mongo/User');
const Vehicle = require('../db/mongo/Vehicle');
const check_for_available_slots = require('../helpers/logs/check_for_available_slots');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { Query } = require('mongoose');

// Check
router.get('/test/:id', async (req, res) => {
  return res.send(await check_for_available_slots(false));
});

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

router.get('/', [auth(['admin', 'guard'])], async (req, res) => {
  let condition = {};

  if (req.query.name) {
    condition = {
      $or: [
        { firstname: { $regex: '.*' + req.query.name + '.*' } },
        { middlename: { $regex: '.*' + req.query.name + '.*' } },
        { lastname: { $regex: '.*' + req.query.name + '.*' } },
      ],
    };
  }
  if (req.query.is_visitor) {
    condition['is_visitor'] = req.query.is_visitor == 1;
  }

  let logs = await Log.paginate(condition, {
    page: parseInt(req.query.page) || 1,
    sort: '-created_at',
  });
  logs.data.forEach((log) => {
    log.is_in = !log.time_out;
  });
  return res.send(logs);
});

router.get('/:id', [auth(['admin', 'guard'])], async (req, res) => {
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

router.post('/:id', [auth(['admin', 'guard'])], async (req, res) => {
  const { firstname, middlename, lastname, model, plate_no } = req.body;
  const log = await Log.findByIdAndUpdate(req.params.id, {
    firstname,
    middlename,
    lastname,
    model,
    plate_no,
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
        { time_out: Date.now() },
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

module.exports = router;

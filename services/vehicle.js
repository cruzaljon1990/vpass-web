const router = require('express').Router();
const User = require('../db/mongo/User');
const Vehicle = require('../db/mongo/Vehicle');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Log = require('../db/mongo/Log');
const is_in = require('../helpers/vehicle/is_in');
const SitePrefs = require('../db/mongo/SitePrefs');
const check_for_available_slots = require('../helpers/logs/check_for_available_slots');

router.get('/', [auth(['admin', 'guard'])], async (req, res) => {
  let condition = {};
  let vehicles = await Vehicle.paginate(condition, {
    sort: '-updated_at',
    page: parseInt(req.query.page) || 1,
    populate: [
      {
        path: 'logs',
        model: Log,
        perDocumentLimit: 5,
        options: { sort: '-updated_at' },
      },
      {
        path: 'owner',
        model: User,
        select: '-password',
      },
    ],
  });
  vehicles.data.forEach((vehicle) => {
    vehicle.is_in = is_in(vehicle);
  });
  return res.send(vehicles);
});

router.get(
  '/:id',
  [auth(['all']), validate('vehicle_id')],
  async (req, res) => {
    try {
      let vehicle = await Vehicle.findById(req.params.id)
        .populate({
          path: 'logs',
          model: Log,
          perDocumentLimit: 5,
          options: { sort: '-updated_at' },
        })
        .populate({
          path: 'owner',
          model: User,
          select: '-password',
        });
      if (vehicle) {
        vehicle.is_in = is_in(vehicle);
        return res.send(vehicle);
      } else {
        return res.status(404).send({ error: 'Vehicle not found' });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).send({ error: 'Vehicle not found' });
    }
  }
);

router.post(
  '/',
  [auth(['all']), validate('vehicle_create')],
  async (req, res) => {
    let { model, plate_no, user_id } = req.body;
    try {
      switch (req.user_data.type) {
        case 'admin':
        case 'guard':
          if (!user_id) {
            return res.status(500).send({
              errors: {
                id: ['The id field is required!'],
              },
            });
          } else {
            id = user_id;
          }
          break;

        default:
          id = req.user_data.id;
          break;
      }

      const vehicle = await Vehicle.create({
        owner: id,
        model,
        plate_no,
      });
      const user = await User.findById(id);
      user.vehicles.push(vehicle);
      await user.save();
      return res.send(vehicle);
    } catch (error) {
      return res.status(500).send(error);
    }
  }
);

// router.post(
//   '/:id',
//   [auth(['admin', 'guard']), validate('vehicle_update')],
//   async (req, res) => {
//     const { model, plate_no } = req.body;
//     const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, {
//       model,
//       plate_no,
//     });
//     return res.send(vehicle);
//   }
// );

router.delete(
  '/:id',
  [validate('vehicle_id'), auth(['admin', 'driver'])],
  async (req, res) => {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(500).send({ error: 'Invalid vehicle!' });
    }
    return res.send(vehicle);
  }
);

router.post(
  '/toggle-status/:id',
  [auth(['admin', 'guard']), validate('vehicle_id')],
  async (req, res) => {
    let vehicle = await Vehicle.findById(req.params.id)
      .populate({
        path: 'logs',
        model: Log,
      })
      .populate({
        path: 'owner',
        model: User,
      });

    if (vehicle) {
      let { log_id } = req.body;

      let is_entering = true;
      if (vehicle.logs) {
        let result_ok = true;
        vehicle.logs.forEach(async (log) => {
          if (!log['time_out']) {
            log_id = log_id || log._id;
            is_entering = false;
            log = await Log.findByIdAndUpdate(
              log._id,
              { time_out: Date.now() },
              { new: true }
            );
          } else {
            log['time_out'] = Date.now();
          }
        });

        if (!result_ok && !is_entering) {
          return res.status(500).send({ error: 'Invalid log!' });
        }
      }

      if (is_entering) {
        const has_available_slots = await check_for_available_slots(
          vehicle.owner.is_vip
        );

        if (!has_available_slots) {
          return res.status(501).send({
            error: 'Limit exceeded!',
          });
        }

        let log = await Log.create({
          model: vehicle.model,
          plate_no: vehicle.plate_no,
          firstname: vehicle.owner.firstname,
          middlename: vehicle.owner.middlename,
          lastname: vehicle.owner.lastname,
          vehicle_ref: req.params.id,
          reason: 'Work',
          is_vip: vehicle.owner.is_vip == true,
        });
        vehicle.logs.push(log);
        await vehicle.save();
      }
      vehicle = await Vehicle.findById(req.params.id)
        .populate({
          path: 'logs',
          model: Log,
        })
        .populate({
          path: 'owner',
          model: User,
        });
      vehicle.is_in = is_in(vehicle);
      return res.send(vehicle);
    } else {
      return res.status(500).send({
        error: 'Invalid vehicle',
      });
    }
  }
);

module.exports = router;

const router = require('express').Router();
const User = require('../db/mongo/User');
const Vehicle = require('../db/mongo/Vehicle');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Log = require('../db/mongo/Log');

router.get('/', [auth(['admin', 'guard'])], async (req, res) => {
  let condition = {};
  const vehicles = await Vehicle.paginate(condition, {
    page: 1,
    populate: {
      path: 'owner',
      model: User,
      select: '-password',
    },
  });
  return res.send(vehicles);
});

router.get(
  '/:id',
  [auth(['all']), validate('vehicle_id')],
  async (req, res) => {
    try {
      const vehicle = await Vehicle.findById(req.params.id).populate({
        path: 'owner',
        model: User,
        select: '-password',
      });
      if (vehicle) {
        return res.send(vehicle);
      } else {
        return res.status(404).send({ error: 'Vehicle not found' });
      }
    } catch (error) {
      return res.status(500).send({ error: 'Vehicle not found' });
    }
  }
);

router.delete(
  '/:id',
  [validate('vehicle_id'), auth('admin')],
  async (req, res) => {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    return res.send(vehicle);
  }
);

module.exports = router;

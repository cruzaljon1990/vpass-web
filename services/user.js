const router = require('express').Router();
const Session = require('../db/mongo/Session');
const User = require('../db/mongo/User');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Vehicle = require('../db/mongo/Vehicle');
const moment = require('moment');
const has_vehicles_inside = require('../helpers/users/has_vehicles_inside');
const Log = require('../db/mongo/Log');
const { faker } = require('@faker-js/faker');

router.post('/login', [validate('user_login')], async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (user && bcrypt.compareSync(password, user.password)) {
      if (user.status == 1) {
        const token = jwt.sign(
          {
            id: user._id,
            username: user.username,
            status: user.status,
            type: user.type,
            exp: Math.floor(Date.now() / 1000) + parseInt(process.env.JWT_EXP),
          },
          process.env.JWT_SECRET,
          { algorithm: process.env.JWT_ALGO }
        );
        await Session.create({ token });
        return res.send({
          token,
          user_id: user._id,
          user_is_super: user.is_super,
          user_type: user.type,
          status: 1,
        });
      } else {
        return res.send({
          status: 0,
        });
      }
    } else {
      return res.status(404).send({ data: 'Invalid credentials!' });
    }
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.get('/logout', [auth(['all'])], async (req, res) => {
  try {
    await Session.deleteOne({ token: req.user_data.token });
    return res.send({ status: 1 });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.post('/', [validate('user_create')], async (req, res) => {
  try {
    let {
      username,
      password,
      type,
      firstname,
      middlename,
      lastname,
      birthday,
    } = req.body;
    status = type == 'admin' ? 1 : 0;
    password = bcrypt.hashSync(password, 12);

    const user = await User.create({
      username,
      password,
      type,
      firstname,
      middlename,
      lastname,
      birthday,
      status,
    });
    return res.send(user);
  } catch (error) {
    return res.status(500).send(error);
  }
});

router.post(
  '/:id?',
  [auth(['admin', 'guard', 'driver']), validate('user_update')],
  async (req, res) => {
    let { password, type, firstname, middlename, lastname, birthday, status } =
      req.body;
    if (password && password != '') password = bcrypt.hashSync(password, 12);
    const id =
      req.user_data.type == 'driver' ? req.user_data.id : req.params.id;
    const user = await User.findByIdAndUpdate(
      id,
      {
        password,
        type,
        firstname,
        middlename,
        lastname,
        birthday,
        status,
        updated_at: Date.now(),
      },
      {
        new: true,
        populate: {
          path: 'vehicles',
          model: Vehicle,
          populate: {
            path: 'logs',
            model: Log,
            perDocumentLimit: 5,
            options: { sort: '-updated_at' },
          },
        },
      }
    );
    if (user) {
      user.age = moment().diff(user.birthday, 'years');
      has_vehicles_inside(user);
      return res.send(user);
    } else {
      return res.status(500).send({ error: 'Invalid user' });
    }
  }
);

router.delete(
  '/:id',
  [auth(['admin'])],
  validate('user_id'),
  async (req, res) => {
    const user = await User.findByIdAndDelete(req.params.id);
    return res.send(user);
  }
);

router.post('/update-status-many', [auth(['admin'])], async (req, res) => {
  try {
    let { user_ids } = req.body;
    let promises = [];

    Array.from(user_ids).forEach((user_id, index) => {
      promises.push(User.findByIdAndUpdate(user_id, { status: 1 }));
    });

    const response = await Promise.all(promises);
    return res.send(response);
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.get('/get-admin-notifs', [auth(['admin'])], async (req, res) => {
  const inactive_users_count = await User.count({ status: 0 });
  return res.send({ inactive_users_count });
});

router.get('/me', [auth(['all'])], async (req, res) => {
  try {
    const user = await User.findById(req.user_data.id)
      .populate({
        path: 'vehicles',
        model: Vehicle,
        populate: {
          path: 'logs',
          model: Log,
          perDocumentLimit: 5,
          options: { sort: '-updated_at' },
        },
      })
      .select('-password');
    if (user) {
      user.age = moment().diff(user.birthday, 'years');
      has_vehicles_inside(user);
      return res.send(user);
    } else {
      return res.status(404).send({ error: 'User not found' });
    }
  } catch (error) {
    return res.status(500).send({ error: 'User not found' });
  }
});

router.get('/generate-faker', async (req, res) => {
  let users = [];
  const limit = 35;

  for (let i = 0; i < limit; i++) {
    firstname = faker.name.firstName();
    middlename = faker.name.middleName();
    lastname = faker.name.lastName();
    const user = {
      username: firstname.toLowerCase() + '.' + lastname.toLowerCase(),
      password: bcrypt.hashSync('1234', 12),
      type: 'driver',
      firstname,
      middlename,
      lastname,
      birthday: faker.date.between(
        '1990-01-01T00:00:00.000Z',
        '2020-01-01T00:00:00.000Z'
      ),
      is_vip: Math.round(Math.random()) == 0,
      status: Math.round(Math.random()),
    };
    users.push(user);
  }
  if (users) await User.insertMany(users);
  return res.send(users);
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

  if (req.query.status) {
    condition['status'] = req.query.status;
  }

  if (req.query.type) {
    condition['type'] = req.query.type;
  }

  if (req.query.page) {
    page = req.query.page;
  } else {
    page = 1;
  }
  try {
    let users = await User.paginate(condition, {
      populate: {
        path: 'vehicles',
        model: Vehicle,
        populate: {
          path: 'logs',
          model: Log,
          perDocumentLimit: 5,
          options: { sort: '-updated_at' },
        },
      },
      sort: '-updated_at',
      page: page,
      perPage: 20,
    });

    users.data.forEach((user) => {
      has_vehicles_inside(user);
      user.age = moment().diff(user.birthday, 'years');
    });
    return res.send(users);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ error });
  }
});

router.get(
  '/:id',
  [auth(['admin', 'guard']), validate('user_id')],
  async (req, res) => {
    try {
      let user = await User.findById(req.params.id)
        .populate({
          path: 'vehicles',
          model: Vehicle,
          populate: {
            path: 'logs',
            model: Log,
            perDocumentLimit: 5,
            options: { sort: '-updated_at' },
          },
        })
        .select('-password');
      if (user) {
        user.age = moment().diff(user.birthday, 'years');
        has_vehicles_inside(user);
        return res.send(user);
      } else {
        return res.status(404).send({ error: 'User not found' });
      }
    } catch (error) {
      return res.status(500).send({ error: 'User not found' });
    }
  }
);

module.exports = router;

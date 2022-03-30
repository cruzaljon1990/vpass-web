const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, Sequelize } = require('../db/main/models');
const auth = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const redisClient = require('../db/redis');

router.post(
  '/',
  [auth(['super', 'admin', 'lead', 'dev'])],
  async (req, res) => {
    try {
      let where = {};
      switch (req.user_data.type) {
        case 'super':
          where = { type: { [Sequelize.Op.notIn]: ['super'] } };
          break;
        case 'admin':
          where = { type: { [Sequelize.Op.notIn]: ['super', 'admin'] } };
          break;
        case 'lead':
        case 'dev':
          where = {
            type: { [Sequelize.Op.notIn]: ['super', 'admin', 'lead', 'dev'] },
          };
          break;
        default:
          break;
      }

      const users = await User.paginate({
        where,
        page: parseInt(req.body.page),
        attributes: { exclude: ['password'] },
      });
      return res.send(users);
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
);

router.post('/me', [auth(['all'])], async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user_data.id },
      attributes: { exclude: ['password'] },
    });
    return res.send(user);
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.post('/login', [validate('user_login')], async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });
    if (bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          status: user.status,
          type: user.type,
          exp: Math.floor(Date.now() / 1000) + parseInt(process.env.JWT_EXP),
        },
        process.env.JWT_SECRET,
        { algorithm: process.env.JWT_ALGO }
      );
      redisClient.set(
        'session_' + user.id,
        token,
        'EX',
        parseInt(process.env.JWT_EXP)
      );
      return res.send({ token });
    } else {
      return res.status(403).send({ data: 'Invalid credentials!' });
    }
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.post('/logout', [auth(['all'])], async (req, res) => {
  try {
    redisClient.del(req.user_data.token);
    return res.send({ status: 1 });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

router.post(
  '/register',
  [auth(['super', 'admin', 'lead']), validate('user_create')],
  async (req, res) => {
    try {
      let { username, password, firstname, lastname, type } = req.body;

      password = bcrypt.hashSync(password, 12);
      const user = await User.create({
        username,
        password,
        firstname,
        lastname,
        type,
      });

      return res.send({ user });
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
);

router.post(
  '/update/:id',
  [auth(['super', 'admin', 'lead', 'dev']), validate('user_update')],
  async (req, res) => {
    try {
      const { firstname, lastname, password, type } = req.body;
      const { id } = req.params;

      password = bcrypt.hashSync(password, 12);
      const user = await User.findOne({ where: { id } });
      if (user) {
        await user.update({ firstname, lastname, password, type });
        return res.send({ status: 1 });
      } else {
        return res.send({ status: 0 });
      }
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
);

router.post(
  '/update/profile',
  [auth(['all']), validate('user_update_profile')],
  async (req, res) => {
    try {
      const { firstname, lastname, password } = req.body;
      const id = req.user_data.id;

      password = bcrypt.hashSync(password, 12);
      const user = await User.findOne({ where: { id } });
      if (user) {
        await user.update({ firstname, lastname, password });
        return res.send({ status: 1 });
      } else {
        return res.send({ status: 0 });
      }
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
);

router.post(
  '/view/:id',
  [auth(['super', 'admin', 'lead', 'dev']), validate('user_id')],
  async (req, res) => {
    try {
      const { id } = req.params;
      let where = { id };
      switch (req.user_data.type) {
        case 'super':
          where['type'] = { [Sequelize.Op.notIn]: ['super'] };
          break;
        case 'admin':
          where['type'] = { [Sequelize.Op.notIn]: ['super', 'admin'] };
          break;
        case 'lead':
        case 'dev':
          where['type'] = {
            [Sequelize.Op.notIn]: ['super', 'admin', 'lead', 'dev'],
          };
          break;
        default:
          break;
      }

      const user = await User.findOne({
        where,
        attributes: { exclude: ['password'] },
      });
      return res.send({ data: user });
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
);

router.post(
  '/delete/:id',
  [auth(['super', 'admin']), validate('user_id')],
  async (req, res) => {
    try {
      const { id } = req.params;

      const user = await User.findOne({ where: { id } });
      if (user) {
        await user.destroy();
        return res.send({ status: 1 });
      } else {
        return res.send({ status: 0 });
      }
    } catch (error) {
      return res.status(500).send({ error });
    }
  }
);

module.exports = router;

const router = require('express').Router();
const test = require('../middlewares/test');
const Sample = require('../db/mongo/Sample');

router.get('/', [test], async (req, res) => {
  try {
    return res.send({ luh: 1 });
  } catch (error) {
    return res.send({
      data: error,
      status: 0,
    });
  }
});

module.exports = router;

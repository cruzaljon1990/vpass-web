const router = require('express').Router();

router.get('/', [], async (req, res) => {
  try {
    return res.send({ status: 1 });
  } catch (error) {
    return res.send({
      data: error,
      status: 0,
    });
  }
});

module.exports = router;

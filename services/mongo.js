const router = require('express').Router();
const Sample = require('../db/mongo/Sample');

router.get('/', async (req, res) => {
  const sample = await Sample.paginate({}, { page: 1, perPage: 1 });
  return res.send(sample);
});

router.get('/:id', async (req, res) => {
  const sample = await Sample.findById(req.params.id);
  return res.send(sample);
});

router.post('/', async (req, res) => {
  const sample = await Sample.create({ data: req.body.data });
  return res.send(sample);
});

router.post('/:id', async (req, res) => {
  const sample = await Sample.findByIdAndUpdate(req.params.id, {
    data: req.body.data,
  });
  return res.send(sample);
});

router.delete('/:id', async (req, res) => {
  const sample = await Sample.findByIdAndDelete(req.params.id);
  return res.send(sample);
});

module.exports = router;

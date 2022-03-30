const SitePrefs = require('../db/mongo/SitePrefs');

const router = require('express').Router();

router.get('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const site_pref = SitePrefs.findOne({ key });
    return res.send({ site_pref });
  } catch (error) {
    return res.send({
      error,
    });
  }
});

router.post('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const site_pref = SitePrefs.findOneAndUpdate({ key }, { value });
    return res.send({ site_pref });
  } catch (error) {
    return res.send({
      error,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;

    const site_pref = SitePrefs.create({
      key,
      value,
    });
    return res.send({ site_pref });
  } catch (error) {
    return res.send({
      error,
    });
  }
});

router.delete('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;

    const site_pref = SitePrefs.findOneAndDelete({ key });
    return res.send({ site_pref });
  } catch (error) {
    return res.send({
      error,
    });
  }
});

module.exports = router;

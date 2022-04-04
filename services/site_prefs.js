const SitePrefs = require('../db/mongo/SitePrefs');
const auth = require('../middlewares/auth');

const router = require('express').Router();

router.get('/key/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const site_pref = await SitePrefs.findOne({ key });
    return res.send(site_pref);
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

    const site_pref = await SitePrefs.findOneAndUpdate(
      { key },
      { value },
      { new: true, upsert: true }
    );
    return res.send(site_pref);
  } catch (error) {
    return res.send({
      error,
    });
  }
});

router.post('/update-many', [auth(['admin'])], async (req, res) => {
  try {
    const { values } = req.body;
    var promises = [];
    Array.from(values).forEach(async (value, index) => {
      if (value.value != '') {
        promises.push(
          SitePrefs.findOneAndUpdate(
            { key: value.key },
            { value: value.value },
            { new: true, upsert: true }
          )
        );
      }
    });

    const response = await Promise.all(promises);
    console.log(response);
    return res.send(response);
  } catch (error) {
    return res.send({
      error,
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { key, value } = req.body;

    const site_pref = await SitePrefs.create({
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

    const site_pref = await SitePrefs.findOneAndDelete({ key });
    return res.send({ site_pref });
  } catch (error) {
    return res.send({
      error,
    });
  }
});

module.exports = router;

const { Validator, rules } = require('../helpers/validation');

module.exports = (rule) => {
  return async (req, res, next) => {
    let data = {};
    Object.keys(rules[rule]).forEach((key) => {
      if (key in req.body) {
        data[key] = req.body[key];
      } else if (key in req.params) {
        data[key] = req.params[key];
      }
    });
    const validation = new Validator(data, rules[rule]);
    const callbacks = {
      passes: () => {
        return next();
      },
      fails: () => {
        return res.status(500).send(validation.errors);
      },
    };
    await validation.checkAsync(callbacks.passes, callbacks.fails);
  };
};

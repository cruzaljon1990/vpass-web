const Validator = require('validatorjs');
const { models } = require('mongoose');

/**
 * Rule Format: unique:<modelName>.<columnName>
 */
Validator.registerAsync('unique', async (value, requirement, param, passes) => {
  const [modelName, column] = requirement.split('.');
  let where = {};
  where[column] = value;
  const count = await models[modelName].countDocuments(where);
  if (count > 0) {
    passes(false, `The ${column} already exists!`);
  } else {
    passes();
  }
});

module.exports = { Validator };

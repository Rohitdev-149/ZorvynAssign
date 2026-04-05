const userValidators = require('./user.validator');
const recordValidators = require('./record.validator');

module.exports = {
  ...userValidators,
  ...recordValidators,
};

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-async-await');

const schema = mongoose.Schema(
  {
    id: String,
    token: Object,
    created_at: {
      type: Date,
      default: Date.now,
      expires: parseInt(process.env.JWT_EXP),
    },
  },
  {
    collection: 'session',
  }
);

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('Session', schema);

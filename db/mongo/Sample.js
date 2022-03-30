const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-async-await');

const schema = mongoose.Schema(
  {
    id: String,
    data: Object,
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'sample',
  }
);

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('Sample', schema);

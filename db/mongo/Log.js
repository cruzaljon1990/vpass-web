const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-async-await');

const schema = mongoose.Schema(
  {
    id: String,
    model: String,
    plate_no: String,
    firstname: String,
    middlename: String,
    lastname: String,
    is_visitor: {
      type: Boolean,
      default: false,
    },
    time_in: {
      type: Date,
      default: Date.now,
    },
    time_out: Date,
    created_at: {
      type: Date,
      default: Date.now,
    },
    vehicle_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
  },
  {
    collection: 'log',
  }
);

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('log', schema);

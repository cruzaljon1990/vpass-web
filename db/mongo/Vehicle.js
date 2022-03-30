const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-async-await');

const schema = mongoose.Schema(
  {
    id: String,
    model: String,
    plate_no: String,
    is_in: Boolean,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    logs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Log',
      },
    ],
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'vehicle',
  }
);

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('Vehicle', schema);

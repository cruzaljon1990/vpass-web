const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-async-await');

const schema = mongoose.Schema(
  {
    id: String,
    username: {
      type: String,
      unique: true,
      index: true,
    },
    password: String,
    type: {
      type: String,
      enum: ['admin', 'guard', 'driver'],
      default: 'driver',
    },
    firstname: String,
    middlename: String,
    lastname: String,
    birthday: Date,
    status: Number,
    age: Number,
    has_vehicles_inside: Boolean,
    vehicles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'user',
  }
);

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', schema);

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-async-await');

const schema = mongoose.Schema(
  {
    id: String,
    key: String,
    value: Object,
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'site_prefs',
  }
);

schema.plugin(mongoosePaginate);

module.exports = mongoose.model('SitePrefs', schema);

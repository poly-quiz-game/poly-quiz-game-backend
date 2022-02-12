const mongoose = require('mongoose');

const timeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  time: {
    type: Number,
    required: true,
  }

});


mongoose.model('timeLimits', timeSchema);

module.exports = timeSchema;

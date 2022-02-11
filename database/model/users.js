const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  role: {
    type: String,
    default: 'member',
  },
});

mongoose.model('Users', usersSchema);

module.exports = usersSchema;

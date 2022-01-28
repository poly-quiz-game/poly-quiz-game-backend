const mongoose = require('mongoose');

const quizzesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  backgroundImage: {
    type: String,
    required: true,
  },
  coverImage: {
    type: String,
    required: true,
  },
  music: {
    type: String,
    required: true,
  },
  needLogin: {
    type: Boolean,
  },
  numberOfPlayer: {
    type: Number,
    required: true,
  },
});

mongoose.model('Quizzes', quizzesSchema);

module.exports = quizzesSchema;

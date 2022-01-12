const mongoose = require('mongoose');

const quizzesSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  choices: {
    type: [String],
    required: true,
  },
  correctAnswer: {
    type: int,
    required: true,
  },
  time: {
    type: Number,
    required: true,
    default: 20000,
  },
});

mongoose.model('Quizzes', quizzesSchema);

module.exports = quizzesSchema;

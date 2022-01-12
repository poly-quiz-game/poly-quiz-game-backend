const mongoose = require('mongoose');

const quizzesSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['single-select', 'multi-select'],
  },
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

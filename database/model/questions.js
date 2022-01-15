const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const questionsSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['single-select', 'multi-select'],
    default: 'single-select',
  },
  question: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: '',
  },
  answers: {
    type: [String],
    required: true,
  },
  correctAnswer: {
    type: Number,
    required: true,
  },
  time: {
    type: Number,
    required: true,
    default: 20000,
  },
  quizId: {
    type: ObjectId,
    required: true,
  },
});

mongoose.model('Questions', questionsSchema);

module.exports = questionsSchema;

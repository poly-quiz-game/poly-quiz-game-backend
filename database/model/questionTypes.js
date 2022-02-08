const mongoose = require('mongoose');

const questionsTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
  },
});

mongoose.model('QuestionTypes', questionsTypeSchema);

module.exports = questionsTypeSchema;

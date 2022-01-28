const mongoose = require('mongoose');

const quizzesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

mongoose.model('Quizzes', quizzesSchema);

module.exports = quizzesSchema;

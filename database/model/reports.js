const mongoose = require('mongoose');
const Quiz = require('./quizzes');

const reportsSchema = new mongoose.Schema(
  {
    players: {
      type: [JSON],
      required: true,
    },
    quiz: {
      type: Quiz,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

mongoose.model('Reports', reportsSchema);

module.exports = reportsSchema;

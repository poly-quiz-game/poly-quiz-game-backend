const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const reportsSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: 'Users',
    },
    name: {
      type: String,
      required: true,
    },
    players: {
      type: [JSON],
      required: true,
    },
    questions: {
      type: [JSON],
      required: true,
    },
    quiz: {
      type: JSON,
      required: true,
    },
    quizId: {
      type: ObjectId,
      ref: 'Quizzes',
    },
  },
  {
    timestamps: true,
  }
);

mongoose.model('Reports', reportsSchema);

module.exports = reportsSchema;

const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const reportsSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

mongoose.model('Reports', reportsSchema);

module.exports = reportsSchema;

const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const quizzesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    user: { type: ObjectId, ref: 'Users' },
    backgroundImage: {
      type: String,
      default: '',
    },
    coverImage: {
      type: String,
      default: '',
    },
    music: {
      type: String,
      default: '',
    },
    needLogin: {
      type: Boolean,
      default: false,
    },
    numberOfPlayer: {
      type: Number,
      default: 20,
    },
    questions: {
      type: [JSON],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

mongoose.model('Quizzes', quizzesSchema);

module.exports = quizzesSchema;

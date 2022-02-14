const { ObjectId } = require('mongoose');
const mongoose = require('mongoose');

const usersSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      default: 'member',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    quizzes: [{ type: ObjectId, ref: 'Quizzes' }],
    reports: [{ type: ObjectId, ref: 'Reports' }],
  },
  {
    timestamps: true,
  }
);

mongoose.model('Users', usersSchema);

module.exports = usersSchema;

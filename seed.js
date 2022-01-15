const mongoose = require('mongoose');
const srvConfig = require('./config');
require('./database/model/questions');
const db = mongoose.connection;

const {
  CONNECTION_TYPE,
  DB_HOST,
  DB_USERNAME,
  DB_PASSWORD,
  DB_PORT,
  DB_NAME,
  DB_QUERY_PARAMS,
} = srvConfig;
const dbAuthString =
  DB_USERNAME && DB_PASSWORD
    ? `${srvConfig.DB_USERNAME}:${srvConfig.DB_PASSWORD}@`
    : '';

require('./database/model/users');

const Users = mongoose.model('Users');
const Questions = mongoose.model('Questions');

mongoose
  .connect(
    `${CONNECTION_TYPE}://${dbAuthString}${DB_HOST}/${DB_NAME}${DB_QUERY_PARAMS}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    return seedQuestions();
    return seedUsers();
  })
  .catch(err => {
    console.log(err);
  })
  .then(() => {
    console.log('Database successfully seeded!');
    db.close();
  });

async function seedUsers() {
  // await Users.deleteMany();
  await Users.insertMany([
    {
      name: 'John Doe',
      username: 'john',
      password: '$2a$10$KPtehsbArEr3XlIbNOOHOu7/N4s6ha31ZZ2jDngQ.jvFToDs5mNdO', //password123
    },
    {
      name: 'Jane Roe',
      username: 'jane',
      password: '$2a$10$M8R.EalzDPC.ZNz4K.SqMO87KQp0Paq3Qv9xyTG6LHJobNyViWFHi', //securepassword1
    },
  ]);
}

async function seedQuestions() {
  await Questions.deleteMany();
  await Questions.insertMany([
    {
      question: 'Câu hỏi số 1?',
      answers: ['Câu trả lời đúng', 'Câu trả lời sai', 'Sai', 'Vẫn sai'],
      correctAnswer: 0,
    },
    {
      question: 'Câu hỏi số 2?',
      answers: ['Câu trả lời sai', 'Câu trả lời sai', 'Đúng', 'Vẫn sai'],
      correctAnswer: 2,
    },
    {
      question: 'Câu hỏi số 3?',
      answers: ['Câu trả lời sai', 'Câu trả lời sai', 'Sai', 'Đúng'],
      correctAnswer: 3,
    },
  ]);
}

DROP TABLE users;
CREATE TABLE users (
    id SERIAL NOT NULL,
    name varchar(45) NOT NULL,
    email varchar(45) NOT NULL,
    role varchar(45) NOT NULL,
    createdAt timestamp NOT NULL,
    updatedAt timestamp NOT NULL,
    PRIMARY KEY (id)
);
DROP TABLE quizzes;
CREATE TABLE quizzes (
    id SERIAL NOT NULL PRIMARY KEY,
    name varchar(45) NOT NULL,
    userId int NOT NULL FOREIGN KEY(FK_users_quizzes) REFERENCES users(id),
    coverImage text NULL,
    backgroundImage text NULL,
    music text NULL,
    needLogin binary NOT NULL,
    numberOfPlayer int NOT NULL,
    createdAt timestamp NOT NULL,
    updatedAt timestamp NOT NULL,
);
DROP TABLE questions;
CREATE TABLE questions (
    id SERIAL NOT NULL,
    quizId int NOT NULL,
    question text NOT NULL,
    image text NULL,
    correctAnswer int NOT NULL,
    timeLimit int NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_quizzes_questions FOREIGN KEY (quizId) REFERENCES quizzes (id)
);
DROP TABLE answers;
CREATE TABLE answers (
    index int NOT NULL,
    questionId int NOT NULL,
    answer varchar(45) NOT NULL,
    PRIMARY KEY (index, questionId),
    CONSTRAINT FK_questions_answers FOREIGN KEY (questionId) REFERENCES questions (id),
);
DROP TABLE reports;
CREATE TABLE reports (
    id SERIAL NOT NULL,
    userId int NOT NULL,
    quizId int NOT NULL,
    name varchar(45) NOT NULL,
    createdAt timestamp NOT NULL,
    updatedAt timestamp NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_users_reports FOREIGN KEY (userId) REFERENCES users (id),
    CONSTRAINT FK_quizzes_reports FOREIGN KEY (quizId) REFERENCES quizzes (id)
);
DROP TABLE reportQuestions;
CREATE TABLE reportQuestions (
    id SERIAL NOT NULL,
    reportId int NOT NULL,
    question text NOT NULL,
    image text NULL,
    correctAnswer int NOT NULL,
    timeLimit int NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_reports_reportQuestions FOREIGN KEY (reportId) REFERENCES reports (id)
);
DROP TABLE reportQuestionAnswers;
CREATE TABLE reportQuestionAnswers (
    index int NOT NULL,
    questionId int NOT NULL,
    answer varchar(45) NOT NULL,
    PRIMARY KEY (index, questionId),
    CONSTRAINT FK_reportQuestions_reportQuestionAnswers FOREIGN KEY (questionId) REFERENCES reportQuestions (id),
);
CREATE TABLE players (
    id int NOT NULL,
    reportId int NOT NULL,
    name varchar(45) NOT NULL,
    score int NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT FK_141 FOREIGN KEY (reportId) REFERENCES reports (id)
);
CREATE TABLE playerAnswers (
    reportQuestionId int NOT NULL,
    playerId int NOT NULL,
    answer int NULL,
    time int NULL,
    PRIMARY KEY (reportQuestionId, playerId),
    CONSTRAINT FK_149 FOREIGN KEY (reportQuestionId) REFERENCES reportQuestions (id),
    CONSTRAINT FK_154 FOREIGN KEY (playerId) REFERENCES players (id)
);
INSERT INTO public.users(name, email, role, createdat, updatedat)
VALUES (
        'Tien',
        'tienbmph05304@fpt.edu.vn',
        'admin',
        current_timestamp,
        current_timestamp
    );

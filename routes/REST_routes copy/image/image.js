const express = require('express');

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'poly-quiz',
  api_key: '758845651286399',
  api_secret: 'cmS3oABXG7AmRnj2PVyBXw3i5OM',
});

const init = express.Router();

init.post('/upload', async (req, res) => {
  try {
    const fileStr = req.body.data;
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
      upload_preset: 'ml_default',
    });
    res.json(uploadResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: 'Something went wrong' });
  }
});

module.exports = init;

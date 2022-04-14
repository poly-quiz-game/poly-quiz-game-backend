const express = require('express');
const { BlobServiceClient } = require('@azure/storage-blob');
const multer = require('multer');
const upload = multer();

const STORAGE_CONNECTION_STRING = process.env.STORAGE_CONNECTION_STRING || '';

const blobServiceClient = BlobServiceClient.fromConnectionString(
  STORAGE_CONNECTION_STRING
);
console.log('STORAGE_CONNECTION_STRING: ', STORAGE_CONNECTION_STRING);
const containerName = 'primary';

const accountName = 'polyquizstorage';

const init = express.Router();

init.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;

    const title = Date.now() + '-' + file.originalname;

    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(title);

    const upload = await blockBlobClient.uploadData(file.buffer, {
      blobHTTPHeaders: {
        blobContentType: 'audio/mpeg',
      },
    });
    console.log(file.buffer);
    // const audioDuration = await blockBlobClient.getProperties();
    // console.log('audioDuration: ', audioDuration);
    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        name: file.originalname,
        size: file.size,
        url: `https://${accountName}.blob.core.windows.net/${containerName}/${title}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err: 'Something went wrong' });
  }
});

module.exports = init;

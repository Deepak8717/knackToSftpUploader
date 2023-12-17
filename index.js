const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const { createWriteStream } = require("fs");
const Client = require("ssh2-sftp-client");
const PDFDocument = require("pdfkit");

const app = express();
const port = 3000;
app.use(bodyParser.json());
app.use(express.json());

const generatePDF = (records) => {
  const doc = new PDFDocument();
  doc.pipe(createWriteStream("output.pdf"));
  let cursorPosition = 50;

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .text("Record #", 50, cursorPosition)
    .text("Unit Name", 200, cursorPosition)
    .font("Helvetica");

  cursorPosition += 20;

  records.forEach((record, index) => {
    doc
      .fontSize(14)
      .text(`${index + 1}`, 50, cursorPosition)
      .text(`${record.unitName}`, 200, cursorPosition);
    cursorPosition += 20; // Move cursor down by 20 units for each record
  });
  doc.end();
};

const uploadPDF = async () => {
  const sftp = new Client();
  const timestamp = new Date().getTime();
  const remotePath = `/sftpCloud/output-${timestamp}.pdf`;
  const localPath = "./output.pdf";
  const config = {
    host: "ap-southeast-1.sftpcloud.io",
    port: 22,
    username: "e3a2ad797805498d836b34ca8fdfe3d4",
    password: "Xrrv4puUaSAvwICEpRm0oqapn3qBlC2i",
  };
  try {
    await sftp.connect(config);
    await sftp.put(localPath, remotePath);
    console.log("File uploaded successfully");
  } catch (error) {
    console.log(error);
  } finally {
    await sftp.end();
  }
};

app.post("/webhook", async (req, res) => {
  try {
    await generatePDF([req.body]);
    await uploadPDF();
    res.status(200).send("Received a POST request");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.listen(port, async () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

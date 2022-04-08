const moment = require("moment");
const fs = require("fs");
const path = require("path");
const { Base64Decode } = require("base64-stream");
const Imap = require("imap");
const config = require("./config.json");
const maillogger = require("./maillogger");

const { sendMailReply } = require("./sendmail");

module.exports = {
  attachmentDownload: async (req, res, next) => {
    var fileNameList = [];

    config.mailconfig.forEach((mailList) => {
      var imap = new Imap({
        user: mailList.mailAddress,
        password: mailList.password,
        host: mailList.host,
        port: mailList.port,
        tls: mailList.tls,
        tlsOptions: mailList.tlsOptions,
        mailbox: mailList.mailbox,
        searchFilter: mailList.searchFilter,
        attachments: mailList.attachments,
      });

      function toUpper(thing) {
        return thing && thing.toUpperCase ? thing.toUpperCase() : thing;
      }

      function findAttachmentParts(struct, attachments) {
        attachments = attachments || [];
        for (var i = 0, len = struct.length, r; i < len; ++i) {
          if (Array.isArray(struct[i])) {
            findAttachmentParts(struct[i], attachments);
          } else {
            if (
              struct[i].disposition &&
              ["INLINE", "ATTACHMENT"].indexOf(
                toUpper(struct[i].disposition.type)
              ) > -1
            ) {
              attachments.push(struct[i]);
            }
          }
        }
        return attachments;
      }

      function buildAttMessageFunction(
        attachment,
        mailList,
        fileName,
        fileExtension
      ) {
        var fileDownPath = path.resolve(
          mailList.donwloadPath ? mailList.donwloadPath : config.defaultPath
        );

        var encoding = attachment.encoding;

        return function (msg, seqno) {
          var prefix = "(#" + seqno + ") ";
          msg.on("body", function (stream, info) {
            // Create a write stream so that we can stream the attachment to file;

            var writeStream = fs.createWriteStream(
              path.resolve(
                fileDownPath +
                  "/" +
                  fileName +
                  "_" +
                  moment(new Date()).format("DDMMYYYYHHmmss") +
                  fileExtension
              )
            );

            writeStream.on("finish", function () {
              // console.log(prefix + "Done writing to file %s", fileName);
            });

            if (toUpper(encoding) === "BASE64") {
              //the stream is base64 encoded, so here the stream is decode on the fly and piped to the write stream (file)
              stream.pipe(new Base64Decode()).pipe(writeStream);
            } else {
              //here we have none or some other decoding streamed directly to the file which renders it useless probably
              stream.pipe(writeStream);
            }
            // so we decode during streaming using
          });
          msg.once("end", function () {
            // console.log(prefix + "Finished attachment %s", fileName);
          });
        };
      }

      imap.once("ready", function () {
        imap.openBox("INBOX", false, function (err, box) {
          if (err) {
            console.error(err, "INBOX");

            return res.send({
              status: "unsuccess",
              msg: `INBOX`,
              id: "01",
            });
          }

          imap.search(["UNSEEN"], function (err, results) {
            if (err) {
              console.error(err, "UNSEEN");

              return res.send({
                status: "unsuccess",
                msg: `UNSEEN`,
                id: "01",
              });
            }

            if (results.length > 0) {
              var fileDownPath = path.resolve(
                mailList.donwloadPath
                  ? mailList.donwloadPath
                  : config.defaultPath
              );

              if (fs.existsSync(fileDownPath)) {
                res.send({
                  status: "success",
                  msg: `Mail attachment download process has been started.`,
                  id: "00",
                });
              } else {
                return res.send({
                  status: "unsuccess",
                  msg: `Download folder path does not exist. Please provide right path.`,
                  id: "01",
                });
              }

              var f = imap.fetch(results, { bodies: "", struct: true });

              f.on("message", function (msg, seqno) {
                var prefix = "(#" + seqno + ") ";

                let findEmailInConfig = null;
                let bufferData = null;

                msg.on("body", function (stream, info) {
                  var buffer = "";
                  stream.on("data", function (chunk) {
                    buffer += chunk.toString("utf8");
                  });

                  stream.once("end", function () {
                    bufferData = Imap.parseHeader(buffer);

                    let checkAllowedEmails = config.allowedEmails.some((x) => {
                      return Imap.parseHeader(buffer).from[0].includes(x);
                    });

                    let checkSubject =
                      mailList.subjectName.length === 0 ||
                      mailList.subjectName.some((x) => {
                        return Imap.parseHeader(buffer).subject[0].includes(x);
                      });

                    if (checkAllowedEmails && checkSubject) {
                      findEmailInConfig = Imap.parseHeader(buffer);
                    }
                  });
                });

                msg.once("attributes", function (attrs) {
                  // // Mark as seen code...
                  let uid = attrs.uid;
                  imap.addFlags(uid, ["\\Seen"], function (err) {
                    if (err) {
                      console.log(err);
                    } else {
                      // console.log("Marked as read!");
                    }
                  });

                  var attachments = findAttachmentParts(attrs.struct);
                  fileNameList = [];
                  for (var i = 0; i < attachments.length; i++) {
                    var attachment = attachments[i];

                    var f = imap.fetch(attrs.uid, {
                      bodies: [attachment.partID],
                      struct: true,
                    });

                    if (findEmailInConfig) {
                      var originalName = attachment.params.name;
                      var fileExtension = path.extname(originalName);
                      var fileName = path.basename(originalName, fileExtension);

                      if (
                        mailList.extensions.length === 0 ||
                        mailList.extensions.includes(fileExtension)
                      ) {
                        // Filename array in push
                        fileNameList.push(
                          fileName + fileExtension + " " + "success"
                        );

                        //build function to process attachment message
                        f.on(
                          "message",
                          buildAttMessageFunction(
                            attachment,
                            mailList,
                            fileName,
                            fileExtension
                          )
                        );
                      }
                    }
                  }

                  if (bufferData) {
                    // Remove extra string.
                    let fromEmail = bufferData.from[0]
                      .replace("<", "")
                      .replace(">", "");
                    fromEmail = [...fromEmail].reverse().join("");
                    fromEmail = fromEmail.split(" ")[0];
                    fromEmail = [...fromEmail].reverse().join("");

                    let toEmail = bufferData.to[0]
                      .replace("<", "")
                      .replace(">", "");
                    toEmail = [...toEmail].reverse().join("");
                    toEmail = toEmail.split(" ")[0];
                    toEmail = [...toEmail].reverse().join("");

                    let mailOptions = {
                      from: toEmail,
                      to: fromEmail,
                      subject: bufferData.subject[0]
                        .replace("<", "")
                        .replace(">", ""),
                      references: bufferData["message-id"][0]
                        .replace("<", "")
                        .replace(">", ""),
                      html: `<!DOCTYPE html>
                            <html lang="en">
                              <head>
                                  <meta charset="UTF-8" />
                                  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                                  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                              </head>
                              <body>
                                  <p style="font-size: medium; margin-bottom: 10px">
                                    Thank you for your mail.
                                    Your mail received.
                                    </b>
                              </body>
                            </html>`,
                    };

                    let mailCredential = {};
                    mailCredential.mailAddress = mailList.mailAddress;
                    mailCredential.password = mailList.password;

                    // Send replay mail message.
                    sendMailReply(mailOptions, mailCredential);

                    var newObject = {};
                    newObject = {
                      ...newObject,
                      to: toEmail,
                      from: fromEmail,
                      subject: mailOptions.subject,
                      attachment_file_list: fileNameList,
                    };

                    maillogger.info(JSON.stringify(newObject));
                  }
                });

                msg.once("end", function () {
                  // console.log(prefix + "Finished email");
                });
              });

              f.once("error", function (err) {
                throw err;
              });

              f.once("end", function () {
                // console.log("Done fetching all messages!");
                imap.end();
              });
            } else {
              return res.send({
                status: "unsuccess",
                msg: `No unseen mail found`,
                id: "01",
              });
            }
          });
        });
      });

      imap.once("error", function (err) {
        // console.log(err);
        next();
        if (err) {
          return res.send({
            status: "unsuccess",
            msg: `mail credentials wrong.`,
            // error: `${err.textCode}`,
            id: "01",
          });
        }
      });

      imap.once("end", function () {
        // console.log("imap end");
      });

      imap.connect();
    });
  },
};

var nodemailer = require("nodemailer");

const sendMailReply = async (mailOptions, mailCredential) => {
  // console.log(mailOptions, "mailOptions");

  let mailAddress = mailCredential.mailAddress;

  if (mailAddress.indexOf("gmail") > 0) {
    // console.log("We are in GMAIL");
    var transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      auth: {
        user: mailCredential.mailAddress,
        pass: mailCredential.password,
      },
    });
  } else if (mailAddress.indexOf("outlook") > 0) {
    // console.log("We are in OUTLOOK");
    var transporter = nodemailer.createTransport({
      host: "smtp.live.com", // hostname
      secureConnection: false, // use SSL
      port: 587, // port for secure SMTP
      auth: {
        user: mailCredential.mailAddress,
        pass: mailCredential.password,
      },
      tls: {
        ciphers: "SSLv3",
      },
    });
  } else if (mailAddress.indexOf("zoho") > 0) {
    // console.log("We are in ZOHO");
    var transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true, // use SSL
      auth: {
        user: mailCredential.mailAddress,
        pass: mailCredential.password,
      },
    });
  } else {
    console.log("Mail send in occurred error.", error);
  }

  Promise.all([
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log("Mail send in occurred error.", error);
      } else {
        // console.log(info.response + "Mail send successfully : ");
      }
    }),
  ]);
};

module.exports = { sendMailReply };

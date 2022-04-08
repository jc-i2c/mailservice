const logger = require("../../../servicemanager/logger");
const mailprocess = require("./mailprocess");

module.exports = (app) => {
  let _app = app;

  return {
    read: (req, res, next) => {
      try {
        mailprocess.attachmentDownload(req, res, next);
      } catch (err) {
        logger.error(err.stack);
        res.send({
          status: "unsuccess",
          msg: "Unable execute endpoint for mailservice/read",
          id: "01",
        });
      }
    },
  };
};

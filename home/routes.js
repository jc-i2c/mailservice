const getHandler = require("./handler");
const _ = require("lodash");

var expressApp = null;
module.exports = (router, app) => {
  expressApp = app;
  let handler = getHandler(app);
  const routes = ["read"];
  for (let k = 0, len = routes.length; k < len; k++) {
    if (handler[routes[k]]) router.post("/" + routes[k], handler[routes[k]]);
  }
};

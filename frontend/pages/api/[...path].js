/**
 * Catch-all → Express API (same codebase as backend/).
 * Lets the whole store run as one Vercel (Next.js) project.
 */
const app = require("../../server/app");

function handler(req, res) {
  return app(req, res);
}

module.exports = handler;

module.exports.config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

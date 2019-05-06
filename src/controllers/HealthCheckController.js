/**
 * Health Check Controller
 */
const service = require('../services/PreferenceService')

/**
 * Get Mailchimp status
 * @param req the http request
 * @param res the http response
 */
async function check (req, res) {
  const available = await service.healthCheck()

  if (available) {
    res.send({
      'checksRun': 1
    })
  } else {
    res.status(503).end()
  }
}

module.exports = {
  check
}

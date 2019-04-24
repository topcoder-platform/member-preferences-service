/**
 * Controller for preference endpoints
 */
const _ = require('lodash')
const service = require('../services/PreferenceService')
const constants = require('../../app-constants')
const errors = require('../common/errors')
const HttpStatus = require('http-status-codes')

/**
 * Check authorization.
 * @param {Object} req the request
 */
function checkAuthorization (req) {
  if (req.authUser.roles &&
    !_.find(req.authUser.roles, (role) => role.toLowerCase() === constants.UserRoles.Admin.toLowerCase()) &&
    String(req.authUser.userId) !== req.params.userId) {
    throw new errors.ForbiddenError('You are not allowed to access the user preferences')
  }
}

/**
 * Get user preferences head data
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getUserPreferencesHead (req, res) {
  checkAuthorization(req)
  await service.getUserPreferences(req.params.userId)
  res.status(HttpStatus.NO_CONTENT).end()
}

/**
 * Get user preferences
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function getUserPreferences (req, res) {
  checkAuthorization(req)
  res.send(await service.getUserPreferences(req.params.userId))
}

/**
 * Update user preferences
 * @param {Object} req the request
 * @param {Object} res the response
 */
async function updateUserPreferences (req, res) {
  checkAuthorization(req)
  await service.updateUserPreferences(req.params.userId, req.body)
  res.status(HttpStatus.NO_CONTENT).end()
}

module.exports = {
  getUserPreferencesHead,
  getUserPreferences,
  updateUserPreferences
}

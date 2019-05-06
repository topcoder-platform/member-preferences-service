/**
 * Contains all routes.
 * If access roles are not configured for a route, then any role is allowed.
 * If scopes are not configured for a route, then any scope is allowed.
 */

const constants = require('../app-constants')

module.exports = {
  '/users/:userId/preferences': {
    head: {
      controller: 'PreferenceController',
      method: 'getUserPreferencesHead',
      auth: 'jwt',
      access: [constants.UserRoles.Admin, constants.UserRoles.User],
      scopes: [constants.Scopes.ReadPreference, constants.Scopes.AllPreference]
    },
    get: {
      controller: 'PreferenceController',
      method: 'getUserPreferences',
      auth: 'jwt',
      access: [constants.UserRoles.Admin, constants.UserRoles.User],
      scopes: [constants.Scopes.ReadPreference, constants.Scopes.AllPreference]
    },
    put: {
      controller: 'PreferenceController',
      method: 'updateUserPreferences',
      auth: 'jwt',
      access: [constants.UserRoles.Admin, constants.UserRoles.User],
      scopes: [constants.Scopes.UpdatePreference, constants.Scopes.AllPreference]
    }
  },
  '/users/health': {
    get: {
      controller: 'HealthCheckController',
      method: 'check'
    }
  }
}

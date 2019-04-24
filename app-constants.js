/**
 * App constants
 */
const UserRoles = {
  Admin: 'Administrator',
  Copilot: 'Copilot',
  User: 'Topcoder User'
}

const Scopes = {
  ReadPreference: 'read:preferences',
  UpdatePreference: 'update:preferences',
  AllPreference: 'all:preferences'
}

const PreferenceSubscriptions = ['Dev Newsletter', 'Design Newsletter', 'Data Science Newsletter']

const MailchimpMemberStatuses = {
  Subscribed: 'subscribed'
}

const MailchimpTagStatuses = {
  Active: 'active',
  Inactive: 'inactive'
}

module.exports = {
  UserRoles,
  Scopes,
  PreferenceSubscriptions,
  MailchimpMemberStatuses,
  MailchimpTagStatuses
}

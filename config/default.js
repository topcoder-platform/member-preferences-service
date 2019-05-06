/**
 * The configuration file.
 */

module.exports = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
  PORT: process.env.PORT || 3000,
  API_VERSION: process.env.API_VERSION || '/v5',
  AUTH_SECRET: process.env.AUTH_SECRET || 'mysecret',
  VALID_ISSUERS: process.env.VALID_ISSUERS ? process.env.VALID_ISSUERS.replace(/\\"/g, '') : '["https://api.topcoder-dev.com"]',

  // used to get M2M token
  AUTH0_URL: process.env.AUTH0_URL,
  AUTH0_PROXY_SERVER_URL: process.env.AUTH0_PROXY_SERVER_URL,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || 'https://m2m.topcoder-dev.com/',
  TOKEN_CACHE_TIME: process.env.TOKEN_CACHE_TIME,
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET,

  AMAZON_AWS_REGION: process.env.AMAZON_AWS_REGION || 'us-east-1',
  AMAZON_AWS_DYNAMODB_READ_CAPACITY_UNITS: process.env.AMAZON_AWS_DYNAMODB_READ_CAPACITY_UNITS || 10,
  AMAZON_AWS_DYNAMODB_WRITE_CAPACITY_UNITS: process.env.AMAZON_AWS_DYNAMODB_WRITE_CAPACITY_UNITS || 10,
  // set DynamoDB endpoint ('http://localhost:8000') only for local DynamoDB, no need to set it for AWS DynamoDB
  AMAZON_AWS_DYNAMODB_ENDPOINT: process.env.AMAZON_AWS_DYNAMODB_ENDPOINT,
  AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE: process.env.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE || 'Preferences',
  AMAZON_AWS_ACCESS_KEY_ID: process.env.AMAZON_AWS_ACCESS_KEY_ID,
  AMAZON_AWS_SECRET_ACCESS_KEY: process.env.AMAZON_AWS_SECRET_ACCESS_KEY,

  MAILCHIMP_API_BASE_URL: process.env.MAILCHIMP_API_BASE_URL || 'https://us20.api.mailchimp.com/3.0',
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
  // list/audience id
  MAILCHIMP_LIST_ID: process.env.MAILCHIMP_LIST_ID,

  SEARCH_USERS_URL: process.env.SEARCH_USERS_URL || 'https://api.topcoder-dev.com/v3/users',

  BUSAPI_URL: process.env.BUSAPI_URL || 'https://api.topcoder-dev.com/v5',
  KAFKA_ERROR_TOPIC: process.env.KAFKA_ERROR_TOPIC || 'error.notification',

  EMAIL_PREFERENCE_CREATED_TOPIC: process.env.EMAIL_PREFERENCE_CREATED_TOPIC || 'member.action.profile.preference.create',
  EMAIL_PREFERENCE_UPDATED_TOPIC: process.env.EMAIL_PREFERENCE_UPDATED_TOPIC || 'member.action.profile.preference.update',
  KAFKA_MESSAGE_ORIGINATOR: process.env.KAFKA_MESSAGE_ORIGINATOR || 'member.preferences.service'
}

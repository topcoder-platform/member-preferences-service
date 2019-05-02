/**
 * The configuration file.
 */

module.exports = {
  AMAZON_AWS_REGION: process.env.AMAZON_AWS_REGION || 'us-east-1',
  AMAZON_AWS_DYNAMODB_READ_CAPACITY_UNITS: process.env.AMAZON_AWS_DYNAMODB_READ_CAPACITY_UNITS || 10,
  AMAZON_AWS_DYNAMODB_WRITE_CAPACITY_UNITS: process.env.AMAZON_AWS_DYNAMODB_WRITE_CAPACITY_UNITS || 10,
  // set DynamoDB endpoint ('http://localhost:8000') only for local DynamoDB, no need to set it for AWS DynamoDB
  AMAZON_AWS_DYNAMODB_ENDPOINT: process.env.AMAZON_AWS_DYNAMODB_ENDPOINT,
  AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE: process.env.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE || 'Preference',

  MAILCHIMP_API_BASE_URL: process.env.MAILCHIMP_API_BASE_URL || 'https://us20.api.mailchimp.com/3.0',
  MAILCHIMP_API_KEY: process.env.MAILCHIMP_API_KEY,
  // list/audience id
  MAILCHIMP_LIST_ID: process.env.MAILCHIMP_LIST_ID
}

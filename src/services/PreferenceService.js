/**
 * This service provides operations of preferences
 */
const _ = require('lodash')
const Joi = require('joi')
const config = require('config')
const helper = require('../common/helper')
const logger = require('../common/logger')
const errors = require('../common/errors')
const constants = require('../../app-constants')
const HttpStatus = require('http-status-codes')

/**
 * Get user preferences.
 * @param {String} userId the user id
 * @returns {Object} the user preferences
 */
async function getUserPreferences (userId) {
  // get user details
  const user = await helper.getUser(userId)
  const email = user.email.toLowerCase()

  // get Mailchimp member tags
  // see https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/tags/
  let tags
  try {
    const tagsData = await helper.callMailchimpAPI(`/lists/${
      config.MAILCHIMP_LIST_ID
    }/members/${
      helper.hash(email)
    }/tags`, 'get')
    tags = tagsData.tags || []
  } catch (err) {
    if (err.response.status === HttpStatus.NOT_FOUND) {
      // add contact to Mailchimp
      // see https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/
      logger.info(`Add contact ${email} to Mailchimp`)
      await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members`, 'post', {
        email_address: email,
        status: constants.MailchimpMemberStatuses.Subscribed,
        merge_fields: {
          FNAME: user.firstName,
          LNAME: user.lastName
        }
      })
      // new contact has no tags
      tags = []
    } else {
      throw err
    }
  }

  // construct result
  const result = {
    email: {
      subscriptions: {}
    },
    objectId: userId
  }
  _.forEach(constants.PreferenceSubscriptions, (sub) => {
    // the subscription is true if the contact has the matched tag
    const tag = _.find(tags, (tag) => tag.name === sub)
    result.email.subscriptions[sub] = !!tag
  })
  return result
}

getUserPreferences.schema = {
  userId: Joi.string().required()
}

/**
 * Update user preferences.
 *
 * @param {String} userId the user id
 * @param {Object} data the data to update user preferences
 */
async function updateUserPreferences (userId, data) {
  if (userId !== data.objectId) {
    throw new errors.BadRequestError(`The userId ${userId} does not match the objectId ${data.objectId}.`)
  }

  // get existing preferences
  const preferences = await getUserPreferences(userId)
  // add/remove changed subscriptions/tags
  const tags = []
  for (const sub of constants.PreferenceSubscriptions) {
    if (!preferences.email.subscriptions[sub] && data.email.subscriptions[sub]) {
      // add subscription/tag
      logger.info(`Add subscription ${sub} for user id ${userId}`)
      tags.push({ name: sub, status: constants.MailchimpTagStatuses.Active })
    } else if (preferences.email.subscriptions[sub] && !data.email.subscriptions[sub]) {
      // remove subscription/tag
      logger.info(`Remove subscription ${sub} for user id ${userId}`)
      tags.push({ name: sub, status: constants.MailchimpTagStatuses.Inactive })
    }
  }
  if (tags.length > 0) {
    const user = await helper.getUser(userId)
    const email = user.email.toLowerCase()
    // see https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/tags/
    await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members/${helper.hash(email)}/tags`,
      'post', { tags })
  }

  data.updatedAt = new Date().toISOString()
  // get db record, user id is used as record id
  const dbRecord = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId)
  if (dbRecord) {
    // update db record
    logger.info('Update DynamoDB user preferences record')
    const record = {
      TableName: config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE,
      Key: { id: userId }, // userId is used as record id
      UpdateExpression: 'set updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':updatedAt': data.updatedAt
      }
    }
    if (!_.isEqual(dbRecord.email, data.email)) {
      record.UpdateExpression += ', email = :email'
      record.ExpressionAttributeValues[':email'] = data.email
    }
    await helper.updateRecord(record)
  } else {
    // create db record
    logger.info('Create DynamoDB user preferences record')
    data.id = userId // userId is used as record id
    await helper.insertRecord({
      TableName: config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE,
      Item: data
    })
  }
}

updateUserPreferences.schema = {
  userId: Joi.string().required(),
  data: Joi.object().keys({
    email: Joi.object().keys({
      createdBy: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      subscriptions: _.reduce(constants.PreferenceSubscriptions, (s, sub) => {
        s[sub] = Joi.boolean().required()
        return s
      }, {}),
      updatedBy: Joi.string().required()
    }).required(),
    objectId: Joi.string().required()
  }).required()
}

module.exports = {
  getUserPreferences,
  updateUserPreferences
}

logger.buildService(module.exports)

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
const busApi = require('tc-bus-api-wrapper')
const busApiClient = busApi(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME', 'AUTH0_CLIENT_ID',
  'AUTH0_CLIENT_SECRET', 'BUSAPI_URL', 'KAFKA_ERROR_TOPIC', 'AUTH0_PROXY_SERVER_URL']))

/**
 * Construct event message
 * @params {String} topic the topic name
 * @params {Object} payload the payload
 * @returns the event message
 */
function constructEvent (topic, payload) {
  return {
    topic,
    originator: config.KAFKA_MESSAGE_ORIGINATOR,
    timestamp: new Date().toISOString(),
    'mime-type': 'application/json',
    payload
  }
}

/**
 * Create a new subscriber in MailChimp
 * @param {Object} user the user data
 * @param {Array} tags the tag array
 */
async function createSubscriber (user, tags) {
  await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members`, 'post', {
    email_address: user.email,
    status: constants.MailchimpMemberStatuses.Subscribed,
    merge_fields: {
      FNAME: user.firstName,
      LNAME: user.lastName
    },
    tags
  })
}

/**
 * Get user preferences.
 * @param {String} userId the user id
 * @returns {Object} the user preferences
 */
async function getUserPreferences (userId) {
  // get user details
  const user = await helper.getUser(userId)
  const subscriberHash = helper.hash(user.email.toLowerCase())

  let isCreated = false

  // get Mailchimp member tags
  // see https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/tags/
  let tags = []
  try {
    const tagsData = await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`, 'get')
    tags = tagsData.tags
  } catch (err) {
    if (err.response.status === HttpStatus.NOT_FOUND) {
      // add contact to Mailchimp
      // see https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/
      logger.info(`Add contact ${user.email} to Mailchimp`)
      await createSubscriber(user)
      isCreated = true
    } else {
      throw err
    }
  }

  // construct result
  const result = { email: { subscriptions: {} }, objectId: userId }
  _.forEach(constants.PreferenceSubscriptions, (sub) => {
    // the subscription is true if the contact has the matched tag
    const tag = _.find(tags, (tag) => tag.name === sub)
    result.email.subscriptions[sub] = !!tag
  })

  if (isCreated) {
    await busApiClient.postEvent(constructEvent(config.EMAIL_PREFERENCE_CREATED_TOPIC, result))
  }

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

  // get user details
  const user = await helper.getUser(userId)
  const subscriberHash = helper.hash(user.email.toLowerCase())

  let isCreated = false

  let oldTags
  try {
    const tagsData = await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`, 'get')
    oldTags = tagsData.tags
  } catch (err) {
    if (err.response.status === HttpStatus.NOT_FOUND) {
      // if no subscriber found, create a new one
      logger.info(`Add contact ${user.email} to Mailchimp`)
      let tags = []
      _.each(data.email.subscriptions, (isSubscribed, tag) => {
        if (isSubscribed) {
          tags.push(tag)
        }
      })

      await createSubscriber(user, tags)

      isCreated = true
    } else {
      throw err
    }
  }

  if (!isCreated) {
    // update first name and last name
    await helper.callMailchimpAPI(
      `/lists/${config.MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      'patch',
      {
        'merge_fields': {
          FNAME: data.email.firstName,
          LNAME: data.email.lastName
        }
      }
    )

    // add/remove changed subscriptions/tags
    const tags = []
    for (const sub of constants.PreferenceSubscriptions) {
      const oldExist = _.findIndex(oldTags, { name: sub }) !== -1
      const newExist = data.email.subscriptions[sub]
      if (oldExist !== newExist) {
        if (oldExist) {
          // remove subscription/tag
          logger.info(`Remove subscription ${sub} for user id ${userId}`)
          tags.push({ name: sub, status: constants.MailchimpTagStatuses.Inactive })
        } else {
          // add subscription/tag
          logger.info(`Add subscription ${sub} for user id ${userId}`)
          tags.push({ name: sub, status: constants.MailchimpTagStatuses.Active })
        }
      }
    }

    if (tags.length > 0) {
      // see https://developer.mailchimp.com/documentation/mailchimp/reference/lists/members/tags/
      await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
        'post', { tags })
    }
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

  if (isCreated) {
    await busApiClient.postEvent(constructEvent(
      config.EMAIL_PREFERENCE_CREATED_TOPIC,
      { email: { subscriptions: data.email.subscriptions }, objectId: data.objectId })
    )
  }
  await busApiClient.postEvent(constructEvent(config.EMAIL_PREFERENCE_UPDATED_TOPIC, _.omit(data, 'id', 'updatedAt')))
}

updateUserPreferences.schema = {
  userId: Joi.string().required(),
  data: Joi.object().keys({
    email: Joi.object().keys({
      createdBy: Joi.string().required(),
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      subscriptions: Joi.object().keys(_.reduce(constants.PreferenceSubscriptions, (s, sub) => {
        s[sub] = Joi.boolean().required()
        return s
      }, {})).required(),
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

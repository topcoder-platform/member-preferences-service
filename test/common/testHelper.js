/**
 * This file defines helper methods
 */

const _ = require('lodash')
const config = require('config')
const constants = require('../../app-constants')
const helper = require('../../src/common/helper')

/**
 * Clear the tags.
 */
async function clearData () {
  const email = 'repeat@test.com'
  const subscriberHash = helper.hash(email)
  const res = await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`, 'get')
  let tags = []
  _.each(res.tags, tag => {
    tags.push({ name: tag.name, status: constants.MailchimpTagStatuses.Inactive })
  })
  if (tags.length > 0) {
    await helper.callMailchimpAPI(`/lists/${config.MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
      'post', { tags })
  }
}

/**
 * Delete record in DynamoDB
 * @param     {String} userId the user id
 * @return    {promise} the result
 */
async function deleteRecord (userId) {
  const param = {
    TableName: config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE,
    Key: { objectId: userId }
  }
  const dbClient = helper.getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.delete(param, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

module.exports = {
  clearData,
  deleteRecord
}

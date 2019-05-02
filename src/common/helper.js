/**
 * This file defines helper methods
 */
const _ = require('lodash')
const errors = require('./errors')
const config = require('config')
const AWS = require('aws-sdk')
const axios = require('axios')
const m2mAuth = require('tc-core-library-js').auth.m2m
const m2m = m2mAuth(_.pick(config, ['AUTH0_URL', 'AUTH0_AUDIENCE', 'TOKEN_CACHE_TIME']))
const crypto = require('crypto')
const HttpStatus = require('http-status-codes')

// Database instance
let dbInstance
// Database Document client
let dbClientInstance

AWS.config.update({
  region: config.AMAZON_AWS_REGION,
  accessKeyId: config.AMAZON_AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AMAZON_AWS_SECRET_ACCESS_KEY
})

/**
 * Wrap async function to standard express function
 * @param {Function} fn the async function
 * @returns {Function} the wrapped function
 */
function wrapExpress (fn) {
  return function (req, res, next) {
    fn(req, res, next).catch(next)
  }
}

/**
 * Wrap all functions from object
 * @param obj the object (controller exports)
 * @returns {Object|Array} the wrapped object
 */
function autoWrapExpress (obj) {
  if (_.isArray(obj)) {
    return obj.map(autoWrapExpress)
  }
  if (_.isFunction(obj)) {
    if (obj.constructor.name === 'AsyncFunction') {
      return wrapExpress(obj)
    }
    return obj
  }
  _.each(obj, (value, key) => {
    obj[key] = autoWrapExpress(value)
  })
  return obj
}

/**
 * Get DynamoDB Connection Instance
 * @return {Object} DynamoDB Connection Instance
 */
function getDb () {
  // cache it for better performance
  if (!dbInstance) {
    if (config.AMAZON_AWS_DYNAMODB_ENDPOINT) {
      dbInstance = new AWS.DynamoDB({ endpoint: config.AMAZON_AWS_DYNAMODB_ENDPOINT })
    } else {
      dbInstance = new AWS.DynamoDB()
    }
  }
  return dbInstance
}

/**
 * Get DynamoDB Document Client
 * @return {Object} DynamoDB Document Client Instance
 */
function getDbClient () {
  // cache it for better performance
  if (!dbClientInstance) {
    const db = getDb()
    dbClientInstance = new AWS.DynamoDB.DocumentClient({ service: db })
  }
  return dbClientInstance
}

/**
 * Creates table in DynamoDB
 * @param     {object} model Table structure in JSON format
 * @return    {promise} the result
 */
async function createTable (model) {
  const db = getDb()
  return new Promise((resolve, reject) => {
    db.createTable(model, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Deletes table in DynamoDB
 * @param     {String} tableName Name of the table to be deleted
 * @return    {promise} the result
 */
async function deleteTable (tableName) {
  const db = getDb()
  const item = {
    TableName: tableName
  }
  return new Promise((resolve, reject) => {
    db.deleteTable(item, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Insert record into DynamoDB
 * @param     {object} record Data to be inserted
 * @return    {promise} the result
 */
async function insertRecord (record) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.put(record, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Update record in DynamoDB
 * @param     {object} record Data to be updated
 * @return    {promise} the result
 */
async function updateRecord (record) {
  const dbClient = getDbClient()
  return new Promise((resolve, reject) => {
    dbClient.update(record, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

/**
 * Get single record from DynamoDB
 * @param     {String} table the table name
 * @param     {String} id the record id
 * @return    {promise} the result, null/undefined is returned if none is found
 */
async function getRecord (table, id) {
  const dbClient = getDbClient()
  const params = {
    TableName: table,
    Key: { id }
  }
  return new Promise((resolve, reject) => {
    dbClient.get(params, (err, data) => {
      if (err) {
        reject(err)
      } else {
        resolve(data.Item)
      }
    })
  })
}

/**
 * Get M2M token.
 * @returns {String} the M2M token
 */
async function getM2MToken () {
  return m2m.getMachineToken(config.AUTH0_CLIENT_ID, config.AUTH0_CLIENT_SECRET)
}

/**
 * Get user details by user id.
 * @param {String} userId the user id
 * @returns {Object} the user details
 */
async function getUser (userId) {
  const token = await getM2MToken()
  const url = `${config.SEARCH_USERS_URL}?filter=id=${userId}`
  let result
  try {
    result = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } })
  } catch (err) {
    if (err.response.status === HttpStatus.NOT_FOUND) {
      throw new errors.NotFoundError(`User of id ${userId} is not found, details: ${err.message}`)
    } else {
      throw err
    }
  }
  const user = _.get(result.data, 'result.content[0]')
  if (!_.get(result.data, 'result.success') || !user) {
    throw new errors.NotFoundError(`Can not get user of id: ${userId}`)
  }
  if (!user.email || _.isEmpty(user.email)) {
    throw new Error(`Missing email for user of id ${userId}`)
  }
  if (!user.firstName || _.isEmpty(user.firstName)) {
    throw new Error(`Missing firstName for user of id ${userId}`)
  }
  if (!user.lastName || _.isEmpty(user.lastName)) {
    throw new Error(`Missing lastName for user of id ${userId}`)
  }
  // Refer https://apps.topcoder.com/forums/?module=Thread&threadID=935232&mc=6
  // send a fake email address during testing
  if (process.env.NODE_ENV === 'test') {
    if (userId === '8547899') {
      user.email = 'repeat@test.com'
    } else {
      user.email = `${Date.now()}@test.com`
    }
  }
  return user
}

/**
 * Get MD5 hash of given string.
 * @param {String} s to string to hash
 * @returns {String} the MD5 hash
 */
function hash (s) {
  const md5 = crypto.createHash('md5')
  return md5.update(s).digest('hex')
}

/**
 * Call Mailchimp API.
 * @param {String} urlSuffix the url suffix
 * @param {String} method the HTTP method, can be 'get', 'post', 'put', 'patch' or 'delete'
 * @param {Object} body the request body, optional
 * @return {Object} the response data
 */
async function callMailchimpAPI (urlSuffix, method, body) {
  const url = `${config.MAILCHIMP_API_BASE_URL}${urlSuffix}`
  const options = {
    url,
    method,
    auth: {
      username: 'user', // any user name
      password: config.MAILCHIMP_API_KEY
    }
  }
  if (method !== 'get' && body) {
    options.data = body
  }
  const result = await axios.request(options)
  return result.data
}

module.exports = {
  wrapExpress,
  autoWrapExpress,
  getDb,
  getDbClient,
  createTable,
  deleteTable,
  insertRecord,
  updateRecord,
  getRecord,
  getM2MToken,
  getUser,
  hash,
  callMailchimpAPI
}

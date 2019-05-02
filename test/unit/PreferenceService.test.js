/**
 * Mocha tests of the Member Preferences Service.
 */
process.env.NODE_ENV = 'test'
require('../../app-bootstrap')

const _ = require('lodash')
const config = require('config')
const testHelper = require('../common/testHelper')
const expect = require('chai').expect
const service = require('../../src/services/PreferenceService')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')
const { userId, reqBody } = require('../common/testData')

describe('Topcoder - MemberPreferences Service Unit Test', () => {
  let infoLogs = []
  let errorLogs = []
  let debugLogs = []
  const info = logger.info
  const error = logger.error
  const debug = logger.debug

  /**
   * Assert validation error
   * @param err the error
   * @param message the message
   */
  function assertValidationError (err, message) {
    expect(err.isJoi).to.equal(true)
    expect(err.name).to.equal('ValidationError')
    expect(err.details.map(x => x.message)).to.include(message)
  }

  before(async () => {
    // inject logger with log collector
    logger.info = (message) => {
      infoLogs.push(message)
      info(message)
    }
    logger.debug = (message) => {
      debugLogs.push(message)
      debug(message)
    }
    logger.error = (message) => {
      errorLogs.push(message)
      error(message)
    }

    await testHelper.deleteRecord(userId.user1)
    await testHelper.deleteRecord(userId.user2)

    // ensure this user existed in MailChimp before test
    await service.getUserPreferences(userId.user2)
  })

  after(async () => {
    // restore logger
    logger.error = error
    logger.info = info
    logger.debug = debug

    await testHelper.deleteRecord(userId.user1)
    await testHelper.deleteRecord(userId.user2)
    await testHelper.clearData()
  })

  beforeEach(() => {
    // clear logs
    infoLogs = []
    debugLogs = []
    errorLogs = []
  })

  it('Get user preferences, no user in MailChimp', async () => {
    const result = await service.getUserPreferences(userId.user1)
    expect(result.objectId).to.equal(userId.user1)
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(false)
    expect(infoLogs.length).to.equal(1)
    expect(infoLogs[0]).match(/Add contact \d+@test.com to Mailchimp/)
  })

  it('Get user preferences, user already in MailChimp', async () => {
    const result = await service.getUserPreferences(userId.user2)
    expect(result.objectId).to.equal(userId.user2)
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(false)
    expect(infoLogs.length).to.equal(0)
  })

  it('Failure - Get user preferences, parameter missing', async () => {
    try {
      await service.getUserPreferences()
      throw new Error('should not throw error here')
    } catch (err) {
      assertValidationError(err, '"userId" is required')
    }
  })

  it('Failure - Get user preferences, parameter invalid', async () => {
    try {
      await service.getUserPreferences(123)
      throw new Error('should not throw error here')
    } catch (err) {
      assertValidationError(err, '"userId" must be a string')
    }
  })

  it('Failure - Get user preferences, user not found', async () => {
    try {
      await service.getUserPreferences(userId.user3)
      throw new Error('should not throw error here')
    } catch (err) {
      expect(err.name).to.equal('NotFoundError')
      expect(errorLogs[1]).to.include(`Can not get user of id: ${userId.user3}`)
    }
  })

  it('Update user preferences, no user in MailChimp', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.email.subscriptions['Design Newsletter'] = false
    data.objectId = userId.user1
    await service.updateUserPreferences(userId.user1, data)
    expect(infoLogs.length).to.equal(2)
    expect(infoLogs[0]).match(/Add contact \d+@test.com to Mailchimp/)
    expect(infoLogs[1]).to.equal('Create DynamoDB user preferences record')
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user1)
    expect(_.omit(entity, ['id', 'updatedAt'])).to.deep.equal(data)
  })

  it('Update user preferences fail, objectId is invalid', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.objectId = 'abcdefg'
    try {
      await service.updateUserPreferences(userId.user2, data)
      throw new Error('should not throw error here')
    } catch (err) {
      expect(err.name).to.equal('BadRequestError')
      expect(errorLogs[1]).to.include(`The userId ${userId.user2} does not match the objectId abcdefg.`)
    }
  })

  it('Update user preferences, user already in MailChimp', async () => {
    await testHelper.clearData()
    const data = {
      email: {
        createdBy: 'tester',
        firstName: 'new-firstName',
        lastName: 'new-lastName',
        subscriptions: {
          'Dev Newsletter': true,
          'Design Newsletter': false,
          'Data Science Newsletter': true
        },
        updatedBy: 'user'
      },
      objectId: userId.user2
    }
    await service.updateUserPreferences(userId.user2, data)
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user2)
    const result = await service.getUserPreferences(userId.user2)
    expect(_.omit(entity, ['id', 'updatedAt'])).to.deep.equal(data)
    expect(infoLogs.length).to.equal(3)
    expect(infoLogs[0]).to.equal(`Add subscription Dev Newsletter for user id ${userId.user2}`)
    expect(infoLogs[1]).to.equal(`Add subscription Data Science Newsletter for user id ${userId.user2}`)
    expect(infoLogs[2]).to.equal('Create DynamoDB user preferences record')
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(true)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(true)
  })

  it('Update user preferences again, user already in MailChimp', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.email.subscriptions['Dev Newsletter'] = false
    data.objectId = userId.user2
    await service.updateUserPreferences(userId.user2, data)
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user2)
    const result = await service.getUserPreferences(userId.user2)
    expect(_.omit(entity, ['id', 'updatedAt'])).to.deep.equal(data)
    expect(infoLogs.length).to.equal(3)
    expect(infoLogs[0]).to.equal(`Remove subscription Dev Newsletter for user id ${userId.user2}`)
    expect(infoLogs[1]).to.equal(`Add subscription Design Newsletter for user id ${userId.user2}`)
    expect(infoLogs[2]).to.equal('Update DynamoDB user preferences record')
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(true)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(true)
  })

  it('Update user preferences, no change, user already in MailChimp', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.email.subscriptions['Dev Newsletter'] = false
    data.objectId = userId.user2
    await service.updateUserPreferences(userId.user2, data)
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user2)
    const result = await service.getUserPreferences(userId.user2)
    expect(_.omit(entity, ['id', 'updatedAt'])).to.deep.equal(data)
    expect(infoLogs.length).to.equal(1)
    expect(infoLogs[0]).to.equal('Update DynamoDB user preferences record')
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(true)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(true)
  })

  let requiredFields = reqBody.requiredFields
  let stringFields = reqBody.stringFields
  let booleanFields = reqBody.booleanFields
  for (const requiredField of requiredFields) {
    it(`test invalid parameters, required field ${requiredField} is missing`, async () => {
      let data = _.cloneDeep(reqBody.data)
      data = _.omit(data, requiredField)
      try {
        await service.updateUserPreferences(userId.user2, data)
        throw new Error('should not throw error here')
      } catch (err) {
        const fieldName = requiredField.startsWith('email.subscriptions[') ? requiredField.split(`'`)[1] : _.last(requiredField.split('.'))
        assertValidationError(err, `"${fieldName}" is required`)
      }
    })
  }

  for (const stringField of stringFields) {
    it(`test invalid parameters, invalid string type field ${stringField}`, async () => {
      let data = _.cloneDeep(reqBody.data)
      _.set(data, stringField, 123)
      try {
        await service.updateUserPreferences(userId.user2, data)
        throw new Error('should not throw error here')
      } catch (err) {
        assertValidationError(err, `"${_.last(stringField.split('.'))}" must be a string`)
      }
    })
  }

  for (const booleanField of booleanFields) {
    it(`test invalid parameters, invalid boolean type field ${booleanField}`, async () => {
      let data = _.cloneDeep(reqBody.data)
      _.set(data, booleanField, 123)
      try {
        await service.updateUserPreferences(userId.user2, data)
        throw new Error('should not throw error here')
      } catch (err) {
        const fieldName = booleanField.split(`'`)[1]
        assertValidationError(err, `"${fieldName}" must be a boolean`)
      }
    })
  }
})

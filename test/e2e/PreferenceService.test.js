/**
 * Mocha tests of the Member Preferences API.
 */
process.env.NODE_ENV = 'test'

const _ = require('lodash')
const config = require('config')
const chai = require('chai')
const expect = require('chai').expect
const chaiHttp = require('chai-http')
const service = require('../../src/services/PreferenceService')
const testHelper = require('../common/testHelper')
const logger = require('../../src/common/logger')
const helper = require('../../src/common/helper')
const app = require('../../app')
const { userId, token, reqBody } = require('../common/testData')

chai.use(chaiHttp)

describe('Topcoder - MemberPreferences API E2E Test', () => {
  let infoLogs = []
  let errorLogs = []
  let debugLogs = []
  const info = logger.info
  const error = logger.error
  const debug = logger.debug

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

  it('Get user preferences, no user in MailChimp, return 200', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.user1}`)

    expect(res.status).to.equal(200)
    expect(res.body.objectId).to.equal(userId.user1)
    expect(res.body.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(res.body.email.subscriptions['Design Newsletter']).to.equal(false)
    expect(res.body.email.subscriptions['Data Science Newsletter']).to.equal(false)
    expect(infoLogs[0]).match(/Add contact \d+@test.com to Mailchimp/)
  })

  it('Get user preferences, user already in MailChimp, return 200', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.user2}`)

    expect(res.status).to.equal(200)
    expect(res.body.objectId).to.equal(userId.user2)
    expect(res.body.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(res.body.email.subscriptions['Design Newsletter']).to.equal(false)
    expect(res.body.email.subscriptions['Data Science Newsletter']).to.equal(false)
    expect(infoLogs.length).to.equal(0)
  })

  it('Get user preferences using m2m token, return 200', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.all}`)
    expect(res.status).to.equal(200)
    expect(res.body.objectId).to.equal(userId.user2)
    expect(res.body.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(res.body.email.subscriptions['Design Newsletter']).to.equal(false)
    expect(res.body.email.subscriptions['Data Science Newsletter']).to.equal(false)
    expect(infoLogs.length).to.equal(0)
  })

  it('Get user preferences, no token provided, return 403', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user2}/preferences`)
    expect(res.status).to.equal(403)
    expect(res.body.result.content.message).to.equal('No token provided.')
  })

  it('Get user preferences, invalid token provided, return 403', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer invalid`)
    expect(res.status).to.equal(403)
    expect(res.body.result.content.message).to.equal('Invalid Token.')
  })

  it('Get user preferences by another user(not admin), return 403', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.user2}`)
    expect(res.status).to.equal(403)
    expect(res.body.message).to.equal('You are not allowed to access the user preferences')
  })

  it('Get user preferences incorrect token, return 401', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.noRoles}`)
    expect(res.status).to.equal(401)
    expect(res.body.message).to.equal('You are not authorized to perform this action')
  })

  it('Get user preferences using incorrect m2m token, return 403', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.update}`)
    expect(res.status).to.equal(403)
    expect(res.body.message).to.equal('You are not allowed to perform this action!')
  })

  it('Get user preferences, no user found, return 404', async () => {
    const res = await chai.request(app)
      .get(`${config.API_VERSION}/users/${userId.user3}/preferences`)
      .set('Authorization', `Bearer ${token.user3}`)
    expect(res.status).to.equal(404)
    expect(res.body.message).to.equal(`Can not get user of id: ${userId.user3}`)
  })

  it('Head user preferences, return 204', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.user2}`)
    expect(res.status).to.equal(204)
  })

  it('Head user preferences by admin, return 204', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.user1}`)
    expect(res.status).to.equal(204)
  })

  it('Head user preferences using M2M read token, return 204', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.read}`)
    expect(res.status).to.equal(204)
  })

  it('Head user preferences using M2M all token, return 204', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.all}`)
    expect(res.status).to.equal(204)
  })

  it('Head user preferences using incorrect token, return 401', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.noRoles}`)
    expect(res.status).to.equal(401)
  })

  it('Head user preferences by another user(not-admin), return 403', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.user2}`)
    expect(res.status).to.equal(403)
  })

  it('Head user preferences using not-allowed M2M token, return 403', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.update}`)
    expect(res.status).to.equal(403)
  })

  it('Head user preferences not found, return 404', async () => {
    const res = await chai.request(app)
      .head(`${config.API_VERSION}/users/${userId.user3}/preferences`)
      .set('Authorization', `Bearer ${token.user3}`)
    expect(res.status).to.equal(404)
  })

  it('Update user preferences, no user in MailChimp, return 204', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.email.subscriptions['Design Newsletter'] = false
    data.objectId = userId.user1
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.user1}`)
      .send(data)
    expect(res.status).to.equal(204)
    expect(infoLogs[0]).match(/Add contact \d+@test.com to Mailchimp/)
    expect(infoLogs[1]).to.equal('Create DynamoDB user preferences record')
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user1)
    expect(_.omit(entity, ['updatedAt'])).to.deep.equal(data)
  })

  it('Update user preferences, user already in MailChimp, return 204', async () => {
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
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.user1}`)
      .send(data)
    expect(res.status).to.equal(204)
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user2)
    const result = await service.getUserPreferences(userId.user2)
    expect(_.omit(entity, ['updatedAt'])).to.deep.equal(data)
    expect(infoLogs.length).to.equal(3)
    expect(infoLogs[0]).to.equal(`Add subscription Dev Newsletter for user id ${userId.user2}`)
    expect(infoLogs[1]).to.equal(`Add subscription Data Science Newsletter for user id ${userId.user2}`)
    expect(infoLogs[2]).to.equal('Create DynamoDB user preferences record')
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(true)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(true)
  })

  it('Update user preferences again using M2M all token, user already in MailChimp, return 204', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.email.subscriptions['Dev Newsletter'] = false
    data.objectId = userId.user2
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.all}`)
      .send(data)
    expect(res.status).to.equal(204)
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user2)
    const result = await service.getUserPreferences(userId.user2)
    expect(_.omit(entity, ['updatedAt'])).to.deep.equal(data)
    expect(infoLogs.length).to.equal(3)
    expect(infoLogs[0]).to.equal(`Remove subscription Dev Newsletter for user id ${userId.user2}`)
    expect(infoLogs[1]).to.equal(`Add subscription Design Newsletter for user id ${userId.user2}`)
    expect(infoLogs[2]).to.equal('Update DynamoDB user preferences record')
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(true)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(true)
  })

  it('Update user preferences using M2M update token, no change, user already in MailChimp, return 204', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.email.subscriptions['Dev Newsletter'] = false
    data.objectId = userId.user2
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.update}`)
      .send(data)
    expect(res.status).to.equal(204)
    const entity = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, userId.user2)
    const result = await service.getUserPreferences(userId.user2)
    expect(_.omit(entity, ['updatedAt'])).to.deep.equal(data)
    expect(infoLogs.length).to.equal(1)
    expect(infoLogs[0]).to.equal('Update DynamoDB user preferences record')
    expect(result.email.subscriptions['Dev Newsletter']).to.equal(false)
    expect(result.email.subscriptions['Design Newsletter']).to.equal(true)
    expect(result.email.subscriptions['Data Science Newsletter']).to.equal(true)
  })

  it('Update user preferences, objectId is invalid, return 400', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.objectId = 'abcdefg'
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.update}`)
      .send(data)
    expect(res.status).to.equal(400)
    expect(res.body.message).to.equal(`The userId ${userId.user2} does not match the objectId abcdefg.`)
  })

  it('Update user preferences, no token provided, return 403', async () => {
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .send(reqBody.data)
    expect(res.status).to.equal(403)
    expect(res.body.result.content.message).to.equal('No token provided.')
  })

  it('Update user preferences, invalid token provided, return 403', async () => {
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
      .set('Authorization', `Bearer invalid`)
      .send(reqBody.data)
    expect(res.status).to.equal(403)
    expect(res.body.result.content.message).to.equal('Invalid Token.')
  })

  it('Update user preferences by another user(not admin), return 403', async () => {
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.user2}`)
      .send(reqBody.data)
    expect(res.status).to.equal(403)
    expect(res.body.message).to.equal('You are not allowed to access the user preferences')
  })

  it('Update user preferences incorrect token, return 401', async () => {
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.noRoles}`)
      .send(reqBody.data)
    expect(res.status).to.equal(401)
    expect(res.body.message).to.equal('You are not authorized to perform this action')
  })

  it('Update user preferences, non admin user cannot update another users preferences, return 400', async () => {
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.invalidRole}`)
      .send(reqBody.data)
    expect(res.status).to.equal(400)
    expect(res.body.message).to.equal('The userId 305384 does not match the objectId 12345.')
  })

  it('Update user preferences using incorrect m2m token, return 403', async () => {
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user1}/preferences`)
      .set('Authorization', `Bearer ${token.m2m.read}`)
      .send(reqBody.data)
    expect(res.status).to.equal(403)
    expect(res.body.message).to.equal('You are not allowed to perform this action!')
  })

  it('Update user preferences, no user found, return 404', async () => {
    const data = _.cloneDeep(reqBody.data)
    data.objectId = userId.user3
    const res = await chai.request(app)
      .put(`${config.API_VERSION}/users/${userId.user3}/preferences`)
      .set('Authorization', `Bearer ${token.user3}`)
      .send(data)
    expect(res.status).to.equal(404)
    expect(res.body.message).to.equal(`Can not get user of id: ${userId.user3}`)
  })

  let requiredFields = reqBody.requiredFields
  let stringFields = reqBody.stringFields
  let booleanFields = reqBody.booleanFields
  for (const requiredField of requiredFields) {
    it(`test invalid parameters, required field ${requiredField} is missing`, async () => {
      let data = _.cloneDeep(reqBody.data)
      data = _.omit(data, requiredField)
      const res = await chai.request(app)
        .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
        .set('Authorization', `Bearer ${token.user2}`)
        .send(data)
      const fieldName = requiredField.startsWith('email.subscriptions[') ? requiredField.split(`'`)[1] : _.last(requiredField.split('.'))
      expect(res.status).to.equal(400)
      expect(res.body.message).to.equal(`"${fieldName}" is required`)
    })
  }

  for (const stringField of stringFields) {
    it(`test invalid parameters, invalid string type field ${stringField}`, async () => {
      let data = _.cloneDeep(reqBody.data)
      _.set(data, stringField, 123)
      const res = await chai.request(app)
        .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
        .set('Authorization', `Bearer ${token.user2}`)
        .send(data)
      expect(res.status).to.equal(400)
      expect(res.body.message).to.equal(`"${_.last(stringField.split('.'))}" must be a string`)
    })
  }

  for (const booleanField of booleanFields) {
    it(`test invalid parameters, invalid boolean type field ${booleanField}`, async () => {
      let data = _.cloneDeep(reqBody.data)
      _.set(data, booleanField, 123)
      const res = await chai.request(app)
        .put(`${config.API_VERSION}/users/${userId.user2}/preferences`)
        .set('Authorization', `Bearer ${token.user2}`)
        .send(data)
      expect(res.status).to.equal(400)
      expect(res.body.message).to.equal(`"${booleanField.split(`'`)[1]}" must be a boolean`)
    })
  }
})

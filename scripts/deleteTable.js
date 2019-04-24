/**
 * Delete table in Amazon DynamoDB
 */

require('../app-bootstrap')
const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

logger.info('Delete DynamoDB table.')

const deleteTable = async () => {
  await helper.deleteTable(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE)
}

deleteTable().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit(1)
})

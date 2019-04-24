/**
 * Create table in Amazon DynamoDB
 */

require('../app-bootstrap')
const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

logger.info('Create DynamoDB table.')

const createTable = async () => {
  await helper.createTable({
    TableName: config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE,
    KeySchema: [
      { AttributeName: 'id', KeyType: 'HASH' } // Partition key
    ],
    AttributeDefinitions: [
      { AttributeName: 'id', AttributeType: 'S' } // S -> String
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: Number(config.AMAZON_AWS_DYNAMODB_READ_CAPACITY_UNITS),
      WriteCapacityUnits: Number(config.AMAZON_AWS_DYNAMODB_WRITE_CAPACITY_UNITS)
    }
  })
}

createTable().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit(1)
})

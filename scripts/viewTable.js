/**
 * View table record in Amazon DynamoDB
 */

require('../app-bootstrap')
const config = require('config')
const logger = require('../src/common/logger')
const helper = require('../src/common/helper')

if (process.argv.length < 3) {
  logger.info('Missing record id argument.')
  process.exit(1)
}
const id = process.argv[2]

const viewTable = async () => {
  const data = await helper.getRecord(config.AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE, id)
  if (data) {
    logger.info(`Data of id ${id}: ${JSON.stringify(data, null, 4)}`)
  } else {
    logger.info(`There is no data of id ${id}`)
  }
}

viewTable().then(() => {
  logger.info('Done!')
  process.exit()
}).catch((e) => {
  logger.logFullError(e)
  process.exit(1)
})

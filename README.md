# Member preferences service

## Prerequisites

- NodeJS (v10)
- AWS DynamoDB
- Java 6+ (if using runnable jar of local DynamoDB)
- Docker, Docker Compose

## Configuration

Configuration for the application is at `config/default.js` and `config/production.js`.
The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level
- PORT: the server port
- API_VERSION: the API version
- AUTH_SECRET: TC Authentication secret
- VALID_ISSUERS: valid issuers for TC authentication
- AUTH0_URL: AUTH0 URL, used to get M2M token
- AUTH0_PROXY_SERVER_URL: AUTH0 proxy server URL, used to get M2M token
- AUTH0_AUDIENCE: AUTH0 audience, used to get M2M token
- TOKEN_CACHE_TIME: AUTH0 token cache time, used to get M2M token
- AUTH0_CLIENT_ID: AUTH0 client id, used to get M2M token
- AUTH0_CLIENT_SECRET: AUTH0 client secret, used to get M2M token
- AMAZON_AWS_REGION: the Amazon AWS region to access DynamoDB
- AMAZON_AWS_DYNAMODB_READ_CAPACITY_UNITS: AWS DynamoDB read capacity units
- AMAZON_AWS_DYNAMODB_WRITE_CAPACITY_UNITS: AWS DynamoDB write capacity units
- AMAZON_AWS_DYNAMODB_ENDPOINT: DynamoDB endpoint, set it only for `local DynamoDB`
- AMAZON_AWS_DYNAMODB_PREFERENCE_TABLE: AWS DynamoDB table for user preferences
- AMAZON_AWS_ACCESS_KEY_ID: AWS access key id
- AMAZON_AWS_SECRET_ACCESS_KEY: AWS secret access key
- MAILCHIMP_API_BASE_URL: Mailchimp API base URL
- MAILCHIMP_API_KEY: Mailchimp API key
- MAILCHIMP_LIST_ID: Mailchimp list/audience id
- SEARCH_USERS_URL: URL to search users
- BUSAPI_URL: the bus api, default value is 'https://api.topcoder-dev.com/v5'
- KAFKA_ERROR_TOPIC: Kafka error topic, default value is 'error.notification',
- EMAIL_PREFERENCE_CREATED_TOPIC: the topic name for creating email preference, default value is 'member.action.profile.preference.create'.
- EMAIL_PREFERENCE_UPDATED_TOPIC: the topic name for updating email preference, default value is 'member.action.profile.preference.update'.
- KAFKA_MESSAGE_ORIGINATOR: the Kafka message originator, default value is 'member.preferences.service'

Set the following environment variables so that the app can get TC M2M token (use 'set' insted of 'export' for Windows OS):

- export AUTH0_CLIENT_ID=8QovDh27SrDu1XSs68m21A1NBP8isvOt
- export AUTH0_CLIENT_SECRET=3QVxxu20QnagdH-McWhVz0WfsQzA1F8taDdGDI4XphgpEYZPcMTF4lX3aeOIeCzh
- export AUTH0_URL=https://topcoder-dev.auth0.com/oauth/token
- export AUTH0_AUDIENCE=https://m2m.topcoder-dev.com/

## AWS Setup

1. Download your AWS Credentials from AWS Console. Refer [AWS Documentation](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/getting-your-credentials.html)

2. Depending on your Operating System, create AWS credentials file in the path listed below

    ```bash
    Linux, Unix, and macOS users: ~/.aws/credentials

    Windows users: C:\Users\{USER_NAME}\.aws\credentials
    ```

3. credentials file should look like below

    ```bash
    [default]
    aws_access_key_id=SOME_ACCESS_KEY_ID
    aws_secret_access_key=SOME_SECRET_ACCESS_KEY
    ```

4. Configure AMAZON_AWS_REGION in config file or environment

## Local DynamoDB setup (Optional)

This page `https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html` provides several ways to deploy local DynamoDB.

If you want to use runnable jar of local DynamoDB:

- see `https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.DownloadingAndRunning.html` for details
- download the local DynamoDB of your region
- extract out the downloaded archive
- ensure Java 6+ is installed
- in the extracted folder, run `java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb`
- configure the AMAZON_AWS_DYNAMODB_ENDPOINT config parameter to `http://localhost:8000` in config file or via environment variable
- follow above section to configure AWS credential, when using local DynamoDB, any fake access key id and secret access key may be used

If you want to use docker of local DynamoDB:

- see `https://hub.docker.com/r/amazon/dynamodb-local` for details
- you may go to `docker/dynamodb` folder, and run `docker-compose up` to start local DynamoDB
- configure the AMAZON_AWS_DYNAMODB_ENDPOINT config parameter to `http://localhost:8000` in config file or via environment variable
- follow above section to configure AWS credential, when using local DynamoDB, any fake access key id and secret access key may be used. An alternative approach is setting AMAZON_AWS_ACCESS_KEY_ID and AMAZON_AWS_SECRET_ACCESS_KEY under `config/default.js`

## AWS DynamoDB setup

- setup AWS credential and region properly
- do not configure the AMAZON_AWS_DYNAMODB_ENDPOINT config param, then AWS DynamoDB will be used by default

## Mailchimp setup

- register a new account at `https://mailchimp.com`
- after login, see the URL of your admin page, it is like `https://us20.admin.mailchimp.com/`,
  here the `us20` is data center, it may be different for different users,
  the MAILCHIMP_API_BASE_URL config param is like `https://{data-center}.api.mailchimp.com/3.0`,
  so if data center is `us20`, then the MAILCHIMP_API_BASE_URL param should be `https://us20.api.mailchimp.com/3.0`
- click right top profile -> Account -> Extras -> API keys, here you can generate API key, configure it to
  MAILCHIMP_API_KEY config param
- click header Audience -> right side Manage Audience -> Settings, scroll down and you can see the audience id,
  configure it to MAILCHIMP_LIST_ID config param
- click header Audience -> right side Manage Audience -> Settings -> Manage contacts -> Tags, here you can manage tags,
  create 3 tags: `Data Science Newsletter`, `Design Newsletter`, `Dev Newsletter`

- during review, you may simply use the provided Mailchimp config params, and then you don't need to do above setup

## Local Deployment

- Install dependencies `npm install`
- Run lint `npm run lint`
- Run lint fix `npm run lint:fix`
- To delete DynamoDB table if needed `npm run delete-table`
- To create DynamoDB table if needed `npm run create-table`
- Start app `npm start`
- App is running at `http://localhost:3000`

## Deployment with Docker

1. Make sure that DynamoDB are running as per instructions above.

2. Go to `docker` folder

3. Rename the file `sample.api.env` to `api.env` And properly update the IP addresses to match your environment for the variables if need: AMAZON_AWS_DYNAMODB_ENDPOINT( make sure to use IP address instead of hostname ( i.e localhost will not work)).
If you are using local DynamoDB:
```
AMAZON_AWS_DYNAMODB_ENDPOINT=http://192.168.31.8:8000
AMAZON_AWS_ACCESS_KEY_ID=SOME_ACCESS_KEY_ID
AMAZON_AWS_SECRET_ACCESS_KEY=SOME_SECRET_ACCESS_KEY
```
If you are using AWS DynamoDB, you need to configure the following environment:
```
AMAZON_AWS_REGION=YOUR_AWS_REGION
AMAZON_AWS_ACCESS_KEY_ID=YOUR_AWS_ACCOUNT_ACCESS_KEY_ID
AMAZON_AWS_SECRET_ACCESS_KEY=YOUR_AWS_ACCOUNT_SECRET_ACCESS_KEY
```

4. Once that is done, go to run the following command

```
docker-compose up
```

5. When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

## Verification

- import Postman collection and environment in the docs folder to Postman
- then run the Postman tests

- you may use command `npm run view-table 23124329` to view DynamoDB preferences table record of given user id,
  console will show info like below:

```bash
info: Data of id 23124329: {
    "id": "23124329",
    "email": {
        "firstName": "first name",
        "lastName": "last name",
        "subscriptions": {
            "Dev Newsletter": false,
            "Data Science Newsletter": true,
            "Design Newsletter": true
        },
        "updatedBy": "user2",
        "createdBy": "user1"
    },
    "objectId": "23124329",
    "updatedAt": "2019-04-19T18:24:15.128Z"
}
info: Done!
```

- Check the app console if you find `info: Add contact <EMAIL> to Mailchimp`, An Kafka event has sent using bus api. For each success PUT request, it will also send an event using bus api. Go to https://lauscher.topcoder-dev.com/ view topics `member.action.profile.preference.create` and `member.action.profile.preference.update` to verify the Kafka message have successfully received.

- if you are using AWS DynamoDB, you may also view the table content in AWS web console

## Notes

- swagger is at `docs/swagger.yaml`, you may check it using `http://editor.swagger.io/`
- all JWT tokens provided in Postman environment file and tests are created in `https://jwt.io` with secret `mysecret`

## Testing

- Set configuration under `config/test.js`
- Run `npm run test` to execute unit tests and generate coverage report.
- RUN `npm run e2e` to execute e2e tests and generate coverage report.

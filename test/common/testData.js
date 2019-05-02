/*
 * Test data to be used in tests
 */

const token = {
  user1: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIiwiQ29ubmVjdCBTdXBwb3J0IiwiYWRtaW5pc3RyYXRvciIsInRlc3RSb2xlIiwiYWFhIiwidG9ueV90ZXN0XzEiLCJDb25uZWN0IE1hbmFnZXIiLCJDb25uZWN0IEFkbWluIiwiY29waWxvdCIsIkNvbm5lY3QgQ29waWxvdCBNYW5hZ2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJtZXNzIiwiZXhwIjoxNTY1NjgxOTIwLCJ1c2VySWQiOiIzMDUzODQiLCJpYXQiOjE1NTU2ODEzMjAsImVtYWlsIjoibWVzc0BhcHBpcmlvLmNvbSIsImp0aSI6IjE5YTA5MzcwLTI5ODgtNDdiOC05MTg5LTBkYTg1YzYzNGVkMiJ9.LuUNj6_yg-ldFEisEYfJVmvctq-mhCisf_Xca9_5njE',
  user2: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJUb255SiIsImV4cCI6MTU2NTY4MTkyMCwidXNlcklkIjoiODU0Nzg5OSIsImlhdCI6MTU1NTY4MTMyMCwiZW1haWwiOiJhamVmdHNAdG9wY29kZXIuY29tIiwianRpIjoiMTlhMDkzNzAtMjk4OC00N2I4LTkxODktMGRhODVjNjM0ZWQyIn0.hgzOt5ahxDoikLCe-cApbjYXZzrSGhm39n0rRDPHpKs',
  user3: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJUb3Bjb2RlciBVc2VyIl0sImlzcyI6Imh0dHBzOi8vYXBpLnRvcGNvZGVyLWRldi5jb20iLCJoYW5kbGUiOiJUb255SiIsImV4cCI6MTU2NTY4MTkyMCwidXNlcklkIjoiMTExMTExMTEiLCJpYXQiOjE1NTU2ODEzMjAsImVtYWlsIjoiYWplZnRzQHRvcGNvZGVyLmNvbSIsImp0aSI6IjE5YTA5MzcwLTI5ODgtNDdiOC05MTg5LTBkYTg1YzYzNGVkMiJ9.RZm2mTswv_e7LSFPNnZ44j8JKswRXZorShWyYqN7KnU',
  invalidRole: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJyb2xlcyI6WyJDb25uZWN0IE1hbmFnZXIiXSwiaXNzIjoiaHR0cHM6Ly9hcGkudG9wY29kZXItZGV2LmNvbSIsImhhbmRsZSI6Im1lc3MiLCJleHAiOjE1NjU2ODE5MjAsInVzZXJJZCI6IjMwNTM4NCIsImlhdCI6MTU1NTY4MTMyMCwiZW1haWwiOiJtZXNzQGFwcGlyaW8uY29tIiwianRpIjoiMTlhMDkzNzAtMjk4OC00N2I4LTkxODktMGRhODVjNjM0ZWQyIn0.WMgFOccpYL5KHjNjNPGljHZqfmIATdTuJgb9RSiTHUw',
  noRoles: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS50b3Bjb2Rlci1kZXYuY29tIiwiaGFuZGxlIjoiVG9ueUoiLCJleHAiOjE1NjU2ODE5MjAsInVzZXJJZCI6IjExMTExMTExIiwiaWF0IjoxNTU1NjgxMzIwLCJlbWFpbCI6ImFqZWZ0c0B0b3Bjb2Rlci5jb20iLCJqdGkiOiIxOWEwOTM3MC0yOTg4LTQ3YjgtOTE4OS0wZGE4NWM2MzRlZDIifQ.XACWu9b4FgrIQrZ8TNUqehQE-ixgEQ6yQyH3g97Ho_M',
  m2m: {
    update: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20iLCJzdWIiOiJlbmp3MTgxMGVEejNYVHdTTzJSbjJZOWNRVHJzcG4zQkBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9tMm0udG9wY29kZXItZGV2LmNvbS8iLCJpYXQiOjE1NTU2ODcxODQsImV4cCI6MTU2NTc3MzU4NCwiYXpwIjoiZW5qdzE4MTBlRHozWFR3U08yUm4yWTljUVRyc3BuM0IiLCJzY29wZSI6InVwZGF0ZTpwcmVmZXJlbmNlcyIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.aNzJCHwh4oXLl20HZjObrWnOWzVg9dDRxXRr7QY6A0U',
    read: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20iLCJzdWIiOiJlbmp3MTgxMGVEejNYVHdTTzJSbjJZOWNRVHJzcG4zQkBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9tMm0udG9wY29kZXItZGV2LmNvbS8iLCJpYXQiOjE1NTU2ODcxODQsImV4cCI6MTU2NTc3MzU4NCwiYXpwIjoiZW5qdzE4MTBlRHozWFR3U08yUm4yWTljUVRyc3BuM0IiLCJzY29wZSI6InJlYWQ6cHJlZmVyZW5jZXMiLCJndHkiOiJjbGllbnQtY3JlZGVudGlhbHMifQ.DDIulTl1eSSdgjQk0gx3Vmhc5uBrkaWNAOtm754W_cA',
    all: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3RvcGNvZGVyLWRldi5hdXRoMC5jb20iLCJzdWIiOiJlbmp3MTgxMGVEejNYVHdTTzJSbjJZOWNRVHJzcG4zQkBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9tMm0udG9wY29kZXItZGV2LmNvbS8iLCJpYXQiOjE1NTU2ODcxODQsImV4cCI6MTU2NTc3MzU4NCwiYXpwIjoiZW5qdzE4MTBlRHozWFR3U08yUm4yWTljUVRyc3BuM0IiLCJzY29wZSI6ImFsbDpwcmVmZXJlbmNlcyIsImd0eSI6ImNsaWVudC1jcmVkZW50aWFscyJ9.uNmwMjO98KB0PrDhCUfSNdePgRZZAW0lmvesBXQxFBc'
  }
}

const userId = {
  user1: '305384',
  user2: '8547899',
  user3: '11111111'
}

const reqBody = {
  requiredFields: ['email', 'objectId', 'email.createdBy', 'email.firstName', 'email.lastName', 'email.subscriptions', 'email.updatedBy', `email.subscriptions['Dev Newsletter']`, `email.subscriptions['Design Newsletter']`, `email.subscriptions['Data Science Newsletter']`],
  stringFields: ['email.createdBy', 'email.firstName', 'email.lastName', 'email.updatedBy', 'objectId'],
  booleanFields: [`email.subscriptions['Dev Newsletter']`, `email.subscriptions['Design Newsletter']`, `email.subscriptions['Data Science Newsletter']`],
  data: {
    email: {
      createdBy: 'user',
      firstName: 'firstName',
      lastName: 'lastName',
      subscriptions: {
        'Dev Newsletter': true,
        'Design Newsletter': true,
        'Data Science Newsletter': true
      },
      updatedBy: 'user'
    },
    objectId: '12345'
  }
}

module.exports = {
  token,
  userId,
  reqBody
}

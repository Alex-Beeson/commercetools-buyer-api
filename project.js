const { createClient } = require('@commercetools/sdk-client')
const { createRequestBuilder } = require('@commercetools/api-request-builder')
const { createAuthMiddlewareForClientCredentialsFlow } = require('@commercetools/sdk-middleware-auth')
const { createHttpMiddleware } = require('@commercetools/sdk-middleware-http')
const fetch = require('node-fetch')
const sdk = require('api')('@convictional/v1.0#1j0kv34kt0n3x28');

require('dotenv').config()

const { 
    ADMIN_CLIENT_ID,
    ADMIN_CLIENT_SECRET,
    CONVICTIONAL_API_KEY,
} = process.env;

const projectKey = 'convictional-buyer-api-example'

// Create a httpMiddleware for the your project AUTH URL
const authMiddleware = createAuthMiddlewareForClientCredentialsFlow({
    host: 'https://auth.us-central1.gcp.commercetools.com',
    projectKey,
    credentials: {
        clientId: ADMIN_CLIENT_ID,
        clientSecret: ADMIN_CLIENT_SECRET,
    },
    scopes: ['manage_project:convictional-buyer-api-example'],
    fetch,
})

// Create a httpMiddleware for the your project API URL
const httpMiddleware = createHttpMiddleware({
    host: 'https://api.us-central1.gcp.commercetools.com',
    fetch,
})

// Create a client using authMiddleware and httpMiddleware
const client = createClient({
    middlewares: [authMiddleware, httpMiddleware],
})

// Create a request builder for the project
const projectService = createRequestBuilder({ projectKey }).project;

// Create a request to get project information
const createGetProjectRequest = {
    uri: projectService.build(),
    method: 'GET',
};

(async () => {
    try {
        // Use the `client.execute` method to send a message from this app
        await client.execute(createGetProjectRequest)
            .then(data => {
                console.log('Project information initialized');
            })
            .catch(error => {
                console.log('ERROR --->', error);
            })
    } catch (error) {
        console.log('ERROR --->', error);
    }
    console.log('Got project information');
})();


// Product Routes
// Fetch Convictional Products
sdk.getBuyerProducts({
  page: '0',
  limit: '50',
  Authorization: `${CONVICTIONAL_API_KEY}`
})
  .then(res => console.log(res))
  .catch(err => console.error(err));


// Fetch commercetools Products
// Create a request to get product information
const createGetProductsRequest = {
    uri: `${projectService.build()}products`,
    method: 'GET',
};

(async () => {
    try {
        // Use the `client.execute` method to send a message from this app
        await client.execute(createGetProductsRequest)
            .then(data => {
                console.log('Products --->', data);
            })
            .catch(error => {
                console.log('ERROR --->', error);
            })
    } catch (error) {
        console.log('ERROR --->', error);
    }
    console.log('Fetched Products from commercetools');
})();

// Compare Product Arrays


// Establish Deltas


// Push Deltas into commercetools



// Order Routes
// Fetch commercetools Orders



// Fetch Convictional Orders


// Compare Order Arrays


// Establish Deltas


// Push Deltas into Convictional
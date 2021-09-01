const { createClient } = require('@commercetools/sdk-client')
const { createRequestBuilder } = require('@commercetools/api-request-builder')
const { createAuthMiddlewareForClientCredentialsFlow } = require('@commercetools/sdk-middleware-auth')
const { createHttpMiddleware } = require('@commercetools/sdk-middleware-http')
const fetch = require('node-fetch')
const sdk = require('api')('@convictional/v1.0#1j0kv34kt0n3x28');

require('dotenv').config()

console.log('App Loaded - Sync Beginning')

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
            .then(res => {
                console.log('commercetools Project Connected');
            })
            .catch(error => {
                console.log('ERROR --->', error);
            })
    } catch (error) {
        console.log('ERROR --->', error);
    }
    console.log('Got project information');
})();


/* Product Routes */

// Fetch Convictional Products

const fetchConvictionalProducts = () => {
    return sdk.getBuyerProducts({
        page: '0',
        limit: '50',
        Authorization: `${CONVICTIONAL_API_KEY}`
    })
        .then(res => {
            console.log(`${res.data.length} products fetched from Convictional`)
            return res.data
        })
        .catch(err => console.error(err));

}

// Fetch commercetools Products

const fetchCommercetoolsProducts = () => {

    // Create a request to get product information
    const createGetProductsRequest = {
        uri: `${projectService.build()}products`,
        method: 'GET',
    };

    return client.execute(createGetProductsRequest)
        .then(res => {
            console.log(`${res.body.results.length} products fetched from commercetools`);
            return res.body.results
        })
        .catch(error => {
            console.log('ERROR --->', error);
        })
}

// Compare Product Arrays and add to Delta Array
const compareProductDatasets = async () => {

    const convictionalProducts = await fetchConvictionalProducts();
    const commercetoolsProducts = await fetchCommercetoolsProducts();

    let productsToSync = [];
    convictionalProducts.forEach(sourceProduct => {
        
        (function(){
            console.log('Beginning Comparisons')
            let isMatched = false
            commercetoolsProducts.forEach(destinationProduct => {

                if (sourceProduct.id == destinationProduct.id) {
                    isMatched = true
                }
            })
            if (isMatched == false) {
                productsToSync.push(sourceProduct)
            }
        })()
    })

    console.log(`${productsToSync.length} products to sync`)
    return productsToSync
}
compareProductDatasets()
/*



// Push Deltas into commercetools
// Create a request to get product information
const createPostProductsRequest = {
    uri: `${projectService.build()}products`,
    method: 'POST',
};

deltaProducts.forEach(product => {

    (async () => {
        try {
            // Use the `client.execute` method to send a message from this app
            await client.execute(createPostProductsRequest)
                .then(res => {
                    console.log('Products --->', res);
                    commercetoolsProducts.push(res.body.results)
                })
                .catch(error => {
                    console.log('ERROR --->', error);
                })
        } catch (error) {
            console.log('ERROR --->', error);
        }
        console.log('Fetched Products from commercetools');
    })();

})
*/


/* Order Routes */
// Fetch commercetools Orders



// Fetch Convictional Orders


// Compare Order Arrays


// Establish Deltas


// Push Deltas into Convictional
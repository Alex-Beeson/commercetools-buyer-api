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
// End Auth Middlewares


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

const fetchCommercetoolsProducts = async () => {

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
    console.log('Beginning Comparisons');
    const convictionalProducts = await fetchConvictionalProducts();
    const commercetoolsProducts = await fetchCommercetoolsProducts();

let productsToSync = convictionalProducts.filter(function (sourceProduct) {
    return !commercetoolsProducts.some(function (destinationProduct) {
        return sourceProduct.id === destinationProduct.key; // return the ones with equal id
   });
});

    console.log(`${productsToSync.length} products to sync`)
    productsToSync.forEach(product =>{
        console.log(product.title);
    })
    return productsToSync
}

// Push Deltas into commercetools
const pushProductInformation = async () => {
    console.log('Beginning Push of Product Information');
    let successfullyPushedProducts = [];
    const productsToPush = await compareProductDatasets();
    
    productsToPush.forEach(product => {
// Create a request to get product information
        let urlSlug = encodeURIComponent(product.title.replace(/\s+/g, '-').replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '').toLowerCase());
        let retailPrice = Math.round((product.variants[0].retailPrice)*100);
        const createPostProductsRequest = {
            uri: `${projectService.build()}products`,
            method: 'POST',
            body: {
                "key": `${product.id}`,
                "name": {
                    "en": `${product.title}`
                },
                "productType": {
                    "key": "home-goods"
                },
                "slug": {
                    "en": `${urlSlug}`
                },
                "description": {
                    "en": `${product.description}`
                },
                "masterVariant": {
                    "sku": `${product.variants[0].sku}`,
                    "key": `${product.variants[0].id}`,
                    "prices": [
                        {
                            "value": {
                                "currencyCode": "USD",
                                "centAmount": retailPrice
                            }
                        }],
                    "images": [
                        {
                            "url": `${product.images[0].source}`,
                            "dimensions": {
                                "w": 400,
                                "h": 400
                            }
                        }
                    ]
                }
            },
        };
        client.execute(createPostProductsRequest)
            .then(res => {
                successfullyPushedProducts.push(res.body);
                console.log(`product synced`);
                return res.body.results
            })
            .catch(error => {
                console.log('ERROR --->', error.body.errors.length);
            })

    })
}
pushProductInformation();


/* Order Routes */
// Fetch commercetools Orders
const fetchCommercetoolsOrders = async () => {

    // Create a request to get product information
    const createGetOrdersRequest = {
        uri: `${projectService.build()}orders`,
        method: 'GET',
    };

    return client.execute(createGetOrdersRequest)
        .then(res => {
            console.log(`${res.body.results.length} orders fetched from commercetools`);
            return res.body.results
        })
        .catch(error => {
            console.log('ERROR --->', error);
        })
}

// Filter to just those that contain Convictional Products
const filterCommercetoolsOrders = async () => {
    console.log('Beginning Order Filter');
    const fetchedOrders = await fetchCommercetoolsOrders();
    const convictionalProducts = await fetchConvictionalProducts();

    let convictionalProductIds = convictionalProducts.map(product => product.variants[0].id);


    let filteredOrders = fetchedOrders.filter(function (order) {

        return order.lineItems.some(function (lineItem) {
            convictionalProductIds.includes(lineItem.variant.key)
             return order
            });
    });
    console.log(`${filteredOrders.length} orders include Convictional products`)
    return filteredOrders
}
filterCommercetoolsOrders();

// Fetch Convictional Orders


// Compare Order Arrays


// Establish Deltas


// Push Deltas into Convictional
const path = require('path');
const core = require('@actions/core');
const fs = require('fs');

/**
 * Asynchronously uploads a given local file to an Azure blob.
 * @param {string} localFilename                The local file to be uploaded to Azure storage.
 * @param {ContainerClient} containerClient     Azure storage container client.
 */
async function uploadToBlobAsync(localFilename, containerClient) {
    try {
        const blobName = path.basename(localFilename);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const fileStream = fs.createReadStream(localFilename);
        await blockBlobClient.uploadStream(fileStream);
        console.log(`The file uploaded to ${blockBlobClient.url}`);
        return blockBlobClient.url;
    } catch (error) {
        core.setFailed(`Error uploading blob: ${error.message}`);
        throw error;
    }
}

async function runAsync(localFilename, containerClient) {
    try {
        const blobUrl = await uploadToBlobAsync(localFilename, containerClient);
        return blobUrl;
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
};

exports.runAsync = runAsync;

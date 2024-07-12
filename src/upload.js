const path = require('path');
const core = require('@actions/core');
const fs = require('fs');

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

const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");
const core = require("@actions/core");

async function downloadFromBlobAsync(localFilename, blobName, containerClient) {
    try {
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const downloadBlockBlobResponse = await blockBlobClient.download(0);
        const fileWriteStream = fs.createWriteStream(localFilename);

        await new Promise((resolve, reject) => {
            downloadBlockBlobResponse.readableStreamBody.pipe(fileWriteStream)
                .on('finish', resolve)
                .on('error', reject);
        });

        console.log(`Downloaded ${localFilename} successfully.`);
    } catch (error) {
        core.setFailed(`Failed downloading blob: ${error.message}`);
        throw error;
    }
}

async function runAsync(localFilename, blobName, containerClient) {
    try {
        await downloadFromBlobAsync(localFilename, blobName, containerClient);
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
};

exports.runAsync = runAsync;
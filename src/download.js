const { BlobServiceClient } = require("@azure/storage-blob");
const fs = require("fs");
const path = require("path");
const core = require("@actions/core");

/**
 * Asynchronously downloads a blob from Azure storage to a local filename.
 *
 * @async
 * @function downloadFromBlobAsync
 * @param {string} localFilename            The local filename of the blob.
 * @param {string} blobName                 The blob name in Azure Storage.
 * @param {ContainerClient} containerClient The Azure Storage container client.
 */
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
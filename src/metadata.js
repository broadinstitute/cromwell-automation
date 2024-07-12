const download = require('./download');

async function getMetadataAsync(localFilename, clientWorkflowId, containerClient) {
    try {
        let blobItem = null;
        for await (const item of containerClient.listBlobsFlat({ prefix: clientWorkflowId })) {
            blobItem = item;
            break;
        }

        if (!blobItem) {
            let msg = `Blob with the given ${clientWorkflowId} prefix not found`;
            core.setFailed(msg)
            console.error("Error", msg);
        }

        download.runAsync(localFilename, blobItem.name, containerClient);

        console.log(`Successfully downloaded metadata for ${clientWorkflowId} to ${localFilename}.`);
    } catch (error) {
        core.setFailed(`Failed getting metadata for workflow ${clientWorkflowId}`);
        throw error;
    }
}

async function downloadAsync(localFilename, clientWorkflowId, containerClient) {
    try {
        await getMetadataAsync(localFilename, clientWorkflowId, containerClient);
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
}

exports.downloadAsync = downloadAsync;
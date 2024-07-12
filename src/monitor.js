const core = require('@actions/core');

async function monitorAsync(containerClient, clientWorkflowId) {
    const failedBlobPrefix = `failed/${clientWorkflowId}`;
    const succeededBlobPrefix = `succeeded/${clientWorkflowId}`;

    const waitInterval = 30; // seconds

    let isDone = false;
    while (!isDone) {
        try {
            for await (const {} of containerClient.listBlobsFlat({ prefix: succeededBlobPrefix })) {
                console.log('Workflow succeeded.');
                core.setOutput("status", "succeeded");
                isDone = true
                break;
            }
            if (isDone) break;

            for await (const {} of containerClient.listBlobsFlat({ prefix: failedBlobPrefix })) {
                core.setFailed('Workflow failed.');
                isDone = true;
                break;
            }
            if (isDone) break;

            console.log(`The workflow is running, will recheck in ${waitInterval} seconds.`);
        } catch (error) {
            console.log(`Error occurred; will retry in ${waitInterval} seconds.  ${error.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, waitInterval * 1000));
    }
}

async function runAsync(containerClient, clientWorkflowId) {
    try {
        await monitorAsync(containerClient, clientWorkflowId);
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
};

exports.runAsync = runAsync;

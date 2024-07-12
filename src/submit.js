const core = require('@actions/core');
const { v4: uuidv4 } = require('uuid');

async function submitWorkflowAsync(containerClient, blobBaseName, workflowPath, inputsPath, dependenciesPath) {
    const clientWorkflowId = uuidv4();
    const blobName = `${blobBaseName}/${clientWorkflowId}.json`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const data = {
        "WorkflowUrl": workflowPath,
        "WorkflowInputsUrl": inputsPath,
        "WorkflowOptionsUrl": core.getInput("workflow_options_path"),
        "WorkflowDependenciesUrl": dependenciesPath
    };
    const jsonData = JSON.stringify(data);

    try {
        await blockBlobClient.upload(jsonData, jsonData.length);
        console.log(`Trigger file created: ${blockBlobClient.url}`);
        return clientWorkflowId;
    } catch (error) {
        core.setFailed(`Error uploading blob: ${error.message}`);
        throw error;
        // return;
    }
}

async function runAsync(containerClient, blobBaseName, workflowPath, inputsPath, dependenciesPath) {
    try {
        const clientWorkflowId = await submitWorkflowAsync(
            containerClient, blobBaseName, workflowPath, inputsPath, dependenciesPath);
        return clientWorkflowId;
    } catch (error) {
        core.setFailed(error.message);
        throw error;
    }
};

exports.runAsync = runAsync;

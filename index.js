const core = require('@actions/core');
const submit = require('./src/submit');
const monitor = require('./src/monitor');
const upload = require('./src/upload');
const metadata = require('./src/metadata');
const { BlobServiceClient } = require("@azure/storage-blob");
const { DefaultAzureCredential } = require('@azure/identity');

module.exports = {
    runCreateTask: submit.run
};

const accountNameENV = 'azure_storage_account_name';
const containerNameEnv = 'azure_storage_container_name';
const blobBaseNameEnv = 'azure_storage_blob_name';
const inputsContainerNameEnv = 'azure_storage_inputs_container_name';
const workflowPathEnv = 'workflow_path';
const inputsPathEnv = "workflow_inputs_path"
const dependenciesPathEnv = "workflow_dependencies_path";
const metadataContainerNameEnv = 'azure_storage_metadata_container_name';
const requiredEnvironmentVariables = [
    accountNameENV,
    containerNameEnv,
    blobBaseNameEnv,
    inputsContainerNameEnv,
    workflowPathEnv,
    inputsPathEnv,
    dependenciesPathEnv
];

function assertEnvVarsDefined(vars) {
    const undefinedVars = vars.filter(varName => !core.getInput(varName));

    if (undefinedVars.length > 0) {
        errorMessage = `The following environment variables are not defined: ${undefinedVars.join(', ')}`;
        core.setFailed(errorMessage);
        throw new Error(errorMessage);
    }
}

async function runAsync() {
    assertEnvVarsDefined(requiredEnvironmentVariables);

    const accountName = core.getInput(accountNameENV);

    const blobServiceClient = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        new DefaultAzureCredential()
    );

    const containerName = core.getInput(containerNameEnv);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blobBaseName = core.getInput(blobBaseNameEnv);

    const metadataContainerName = core.getInput(metadataContainerNameEnv);
    const metadataContainerClient = blobServiceClient.getContainerClient(metadataContainerName);

    try {
        const inputsContainerClient = blobServiceClient.getContainerClient(
            core.getInput(inputsContainerNameEnv));
        const workflowPath = await upload.runAsync(core.getInput(workflowPathEnv), inputsContainerClient);
        const inputsPath = await upload.runAsync(core.getInput(inputsPathEnv), inputsContainerClient);
        const dependenciesPath = await upload.runAsync(core.getInput(dependenciesPathEnv), inputsContainerClient);

        const subcommand = core.getInput('subcommand');
        if (subcommand === 'synchronous') {
            const clientWorkflowId = await submit.runAsync(containerClient, blobBaseName, workflowPath, inputsPath, dependenciesPath);
            await monitor.runAsync(containerClient, clientWorkflowId);
            await metadata.downloadAsync(clientWorkflowId + ".json", clientWorkflowId, metadataContainerClient);
        } else if (subcommand === 'submit') {
            const clientWorkflowId = await submit.runAsync(containerClient, blobBaseName, workflowPath, inputsPath, dependenciesPath);
            core.setOutput('workflowId', clientWorkflowId);
        } else if (subcommand === 'monitor') {
            const clientWorkflowId = core.getInput("workflow_id");
            if (!clientWorkflowId) {
                const msg = "workflow_id environment variable not defined.";
                core.sefFailed(msg);
                throw new Error(msg);
            }
            await monitor.runAsync(containerClient, clientWorkflowId);
        } else if (subcommand === 'metadata') {
            const clientWorkflowId = core.getInput("workflow_id");
            await metadata.downloadAsync(clientWorkflowId + ".json", clientWorkflowId, metadataContainerClient);
        } else {
            throw new Error(`Unknown subcommand: ${subcommand}`);
        }
    } catch (error) {
        console.error('Error in main script:', error);
        core.setFailed(error.message);
    }
}

runAsync();

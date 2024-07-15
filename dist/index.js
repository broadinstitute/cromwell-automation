/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 716:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(320);
const submit = __nccwpck_require__(773);
const monitor = __nccwpck_require__(668);
const upload = __nccwpck_require__(241);
const metadata = __nccwpck_require__(428);
const { BlobServiceClient } = __nccwpck_require__(782);
const { DefaultAzureCredential } = __nccwpck_require__(62);

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


/***/ }),

/***/ 497:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const { BlobServiceClient } = __nccwpck_require__(782);
const fs = __nccwpck_require__(147);
const path = __nccwpck_require__(17);
const core = __nccwpck_require__(320);

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

/***/ }),

/***/ 428:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const download = __nccwpck_require__(497);

/**
 * Asynchronously downloads the metadata file of a submission with the given UUID. 
 * 
 * @param {string} localFilename                The filename of the local file where the metadata will be saved.
 * @param {string} clientWorkflowId             The UUID of the workflow submission whose metadata should be downloaded.
 * @param {ContainerClient} containerClient     The Azure storage container client.
 */
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

/***/ }),

/***/ 668:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const core = __nccwpck_require__(320);

/**
 * Asynchronously monitors the execution status of a given workflow submission, 
 * and it fails or succeeds depending on the execution statuss.
 * 
 * @param {ContainerClient} containerClient     Azure storage container client.
 * @param {string} clientWorkflowId             The UUID of the workflow submission to monitor.
 */
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


/***/ }),

/***/ 773:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const core = __nccwpck_require__(320);
const { v4: uuidv4 } = __nccwpck_require__(143);

/**
 * Asynchronously submits a workflow to Cromwell on Azure instance.
 * 
 * @param {ContainerClient} containerClient     The Azure storage container client.
 * @param {string} blobBaseName                 The name of the blob where the Cromwell on Azure is monitoring for new submission requests (e.g., `new`).
 * @param {string} workflowPath                 The local filename of the workflow to be submitted to Cromwell on Azure. 
 * @param {string} inputsPath                   The local filename to a JSON file containing the inputs to the workflow.
 * @param {string} dependenciesPath             The local filename to a compressed file containing all the dependencies of the workflow.
 */
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


/***/ }),

/***/ 241:
/***/ ((__unused_webpack_module, exports, __nccwpck_require__) => {

const path = __nccwpck_require__(17);
const core = __nccwpck_require__(320);
const fs = __nccwpck_require__(147);

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


/***/ }),

/***/ 320:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 62:
/***/ ((module) => {

module.exports = eval("require")("@azure/identity");


/***/ }),

/***/ 782:
/***/ ((module) => {

module.exports = eval("require")("@azure/storage-blob");


/***/ }),

/***/ 143:
/***/ ((module) => {

module.exports = eval("require")("uuid");


/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 17:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(716);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
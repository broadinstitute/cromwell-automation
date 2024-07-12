This action automates testing workflows written in Workflow Description Language (WDL)
on a self-hosted Cromwell server on Azure. 

## Inputs

- `subcommand`
  [Optional] Specifies the task that the action should perform, and its value can be either of the following. 
  - `synchronous` [Default]: Submits the workflow, monitors its execution status, and downloads the 
     metadata file of the completed submission.  
  - `submit`: Submits the workflow to Cromwell on Azure.
  - `monitor`: Checks the status of submission every `30` seconds, and fails or succeeds based on the submission's status.
  - `metadata`: Downloads the metadata file of the submission, named `[UUID of the submission].json`. 

- `azure_storage_account_name`
  [Required] Sets the storage account name used by the Cromwell on Azure instance.

- `azure_storage_container_name`
  [Required] Sets the Azure container name under the given storage account that Cromwell on Azure instance uses. 

- `azure_storage_inputs_container_name`
  [Required] Sets the Azure container name that will be used to store the files used for submitting a workflow to Cromwell on Azure.  

- `azure_storage_blob_name`
  [Optional] Sets the name of the blob under the set `azure_storage_account_name/azure_storage_container_name`
  that Cromwell on Azure listens for new submissions. [Default: `new`]

- `azure_storage_metadata_container_name`
  [Optional] Sets the container name that contains the metadata of the completed tasks. 
  [Default: `outputs`]

- `workflow_path`
  [Required] Sets the local path of the workflow to be tested.

- `workflow_inputs_path`
  [Required] Sets the local path of a file in `JSON` format that contains the inputs of the workflow to be tested.

- `workflow_options_path`
  [Optional] Sets the local path to a file in `JSON` format that contains the Cromwell options for running the workflow.
  [Default: `null`]

- `workflow_dependencies_path`
  [Required] Sets the local path to a file in `.zip` format that contains all the dependencies of the workflow to be tested.

- `workflow_id`
  [Optional] Sets the UUID of the workflow. This option is used when `subcommand = monitor` or `subcommand = metadata`.
  [Default: `null`]

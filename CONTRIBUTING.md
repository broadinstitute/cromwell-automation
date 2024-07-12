Thank you for your interest in contributing to this project.

You may run the following steps to set up your local environment for testing purposes. 

# Setup Environment

## Setup node
```shell
npm init -y
npm install @actions/core @actions/github
```

## Setup Azure AuthNZ

```shell
npm install @azure/ms-rest-nodeauth
```

```shell
SP_NAME="actions-local-test"
SUBSCRIPTION_ID="..."
RESOURCE_GROUP_NAME="..."
STORAGE_ACCOUNT_NAME="..."
```

```shell
az ad sp create-for-rbac --name $SP_NAME --role "Storage Blob Data Contributor" --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT_NAME
```

the output of this command will be like this: 

```json
{
  "appId": "...",
  "displayName": "...",
  "password": "...",
  "tenant": "..."
}
```

```shell
APP_ID=""
```

```shell
az role assignment create --assignee $APP_ID --role "Storage Blob Data Contributor" --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.Storage/storageAccounts/$STORAGE_ACCOUNT_NAME
```

```shell
export AZURE_CLIENT_ID="$APP_ID"
export AZURE_TENANT_ID="<tenant>"
export AZURE_CLIENT_SECRET="<password>"
export AZURE_STORAGE_ACCOUNT_NAME="your-storage-account-name"
export AZURE_STORAGE_CONTAINER_NAME="your-container-name"
```


```shell
az login
```

```shell
az account set --subscription <subscription id>
```

## Setup Test Data

You only need to perform the following when you update any of the data used for 
testing the action; otherwise, you may skip this section. 

Build the dependencies of the workflows using the following command. 

```shell
zip -jq ./tests/data/Dependencies.zip ./tests/data/*.wdl 
```

## Setup Environment Variables

These environment variables defines specifies the Cromwell server and its configured directories. 
Set the following variables based on your Cromwell configuration. 


```shell
export INPUT_AZURE_STORAGE_ACCOUNT_NAME="..."  # e.g., cromwell0123456789
export INPUT_AZURE_STORAGE_CONTAINER_NAME="..."  # e.g., workflows
export INPUT_AZURE_STORAGE_INPUTS_CONTAINER_NAME="..."  # e.g., tests-inputs
export INPUT_AZURE_STORAGE_BLOB_NAME="..."  # e.g., new
```

# Run Locally

Having setup the environment, you may the following command to run the action on test data.

```shell
node tests/test.js
```

# Compile

## Install `ncc`

```shell
npm i -g @vercel/ncc
```

## Install dependencies

```shell
npm install
```


# Set up CI/CD on your own fork

1. Create a Github environment named `CoA`.
2. Follow [this](https://github.com/Azure/login?tab=readme-ov-file#login-with-openid-connect-oidc-recommended) 
   documentation to setup Azure Login secrets.
3. Give the service principal the `Storage Blob Data Contributor`  role. 
4. Define the following environment variables.

```shell
AZURE_STORAGE_ACCOUNT_NAME
AZURE_STORAGE_CONTAINER_NAME
AZURE_STORAGE_INPUTS_CONTAINER_NAME
AZURE_STORAGE_BLOB_NAME
```

# Release


1. compile:
```shell
ncc build index.js --license licenses.txt
```

2. git commit push:

3. git tag:

```shell
git tag -a -m "update" v1.12
```

4. push tag:

```shell
git push --follow-tags
``` 
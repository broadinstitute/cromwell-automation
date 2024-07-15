const { exec } = require('child_process');

process.env['INPUT_SUBCOMMAND'] = 'synchronous';
//process.env['INPUT_AZURE_STORAGE_ACCOUNT_NAME'] = '...';
//process.env['INPUT_AZURE_STORAGE_CONTAINER_NAME'] = 'workflows';
//process.env['INPUT_AZURE_STORAGE_INPUTS_CONTAINER_NAME'] = 'tests-inputs';
//process.env['INPUT_AZURE_STORAGE_BLOB_NAME'] = 'new';
process.env['INPUT_AZURE_STORAGE_METADATA_CONTAINER_NAME'] = 'outputs';
process.env['INPUT_WORKFLOW_PATH'] = './tests/data/HelloWorld.wdl';
process.env['INPUT_WORKFLOW_INPUTS_PATH'] = './tests/data/HelloWorldInputs.json';
process.env['INPUT_WORKFLOW_DEPENDENCIES_PATH'] = './tests/data/Dependencies.zip';


//exec('node dist/index.js', (error, stdout, stderr) => {
exec('node index.js', (error, stdout, stderr) => {
    if (error) {
        console.error('Error:', error);
        process.exit(1);
    }
    if (stderr) {
        console.error('stderr:', stderr);
        process.exit(1);
    }
    console.log('stdout:', stdout);
    process.exit(0);
});

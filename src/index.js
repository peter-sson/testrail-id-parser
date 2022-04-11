const core = require('@actions/core')
const recursiveReadDir = require('recursive-readdir');
const fs = require('fs');
const Testrail = require('testrail-api');

const testrail_url = core.getInput('testrail-url');
const testrailPlanId = parseInt(core.getInput('testrail-plan-id'));
const TESTRAIL_API_KEY = core.getInput('TESTRAIL_API_KEY');
const TESTRAIL_USER = core.getInput('TESTRAIL_USER');
const test_directory = core.getInput('test-directory');


const testrail = new Testrail({
    host: testrail_url,
    user: TESTRAIL_USER,
    password: TESTRAIL_API_KEY 
});

async function run() {
    const repoTestIds = [] // Collection of target repo's test ids from cucumber tag.
    const testrailTests = [] // Collection of test objects from testrail.

    // Get test `@CXXXXX` test ids 
    const regex = /(@C)[0-9]+/g;
    const featureFiles = await recursiveReadDir(test_directory, ['!*.feature']);
    
    for (const file of featureFiles) {
        const contents = await readFile(file);
        const oneLineData = contents.replace(/\n/g, " ");
        const matchTestId = oneLineData.match(regex);
        if (matchTestId != null) {
            repoTestIds.push(...matchTestId);
        }
    }

    // Get testrail template test ids
    console.log(`Getting testrail test ids from plan id: ...`);
    const testrailPlan = await testrail.getPlan(/*PLAN_ID=*/39654);

    const testrailRunIds = []
    for (const entry of testrailPlan.body.entries) {
        testrailRunIds.push(...entry.runs.map(x => x.id));
    }

    for (const run of testrailRunIds) {
        const test = await testrail.getTests(run);
        testrailTests.push(...test.body.tests);
    }

    const testrailIds = testrailTests.map(x => x.case_id)
    
    // Find test ids not included in testrail template
    const missingIds = [] // Collection of repo's test ids not included in testrail plan.
    const includedIds = []
    for (const id of repoTestIds) {
        const idInt = parseInt(id.substring(2));
        if (!testrailIds.includes(idInt)) {
            missingIds.push(id.substring(1));
        } else {
            includedIds.push(idInt)
        }
    }
    if (missingIds.length > 0) {
        console.log(`Following test ids not included in TestRail Plan ${testrailPlanId}: ` + missingIds)
    } else {
        console.log('There are no tests excluded from TestRail plan.')
    }

    // Find test ids marked not automated but included in the framework.
    console.log('Getting test execution value ...')

    let falseExecutionIds = []
    for (const test of testrailTests) {
        if (includedIds.includes(test.case_id) && test.custom_automation_type != 1){
            falseExecutionIds.push("C" + test.case_id.toString())
        }
    }

    falseExecutionIds = [...new Set(falseExecutionIds)]

    if (falseExecutionIds.length > 0){
        console.log(`Following test ids included in the framework but marked as not automated in TestRail : ` + falseExecutionIds);
    } else {
        console.log('All tests are correctly marked automated in TestRail.')
    }
    
    
    core.setOutput('missing-ids', missingIds);
    core.setOutput('false-execution-ids', falseExecutionIds);
 }

run();

async function readFile(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }
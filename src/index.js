import core from "@actions/core";
import recursiveReadDir from 'recursive-readdir';
import { readFile as _readFile } from 'fs';
import Testrail from 'testrail-api';

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
    let testrailIds = [] // Collection of targe testrail plan's test ids.
    const missingIds = [] // Collection of repo's test ids not included in testrail plan.

    // Get test `@CXXXXX` test ids 
    const regex = /[\@C][0-9]+/g
    const featureFiles = await recursiveReadDir(test_directory, ['!*.feature']);
    
    for (const file of featureFiles) {
        const constents = await readFile(file);
        const newData = constents.replace(/\n/g, " ");
        repoTestIds.push(...newData.match(regex));
    }

    // Get testrail template test ids
    console.log(`Getting testrail test ids from plan id: ${testrailPlanId}...`);
    const testrailPlan = await testrail.getPlan(/*RUN_ID=*/testrailPlanId);

    const testrailRunIds = []
    for (const entry of testrailPlan.body.entries) {
        testrailRunIds.push(...entry.runs.map(x => x.id));
    }

    for (const run of testrailRunIds) {
        const test = await testrail.getTests(run);
        testrailIds.push(...test.body.tests.map(x => x.case_id));
    }

    // Find test ids not included in testrail template
    for (const id of repoTestIds) {
        const idInt = parseInt(id.substring(1));
        if (!testrailIds.includes(idInt)) {
            missingIds.push(id);
        }
    }
    
    core.setOutput('missing-ids', missingIds);
}

run();

async function readFile(path) {
    return new Promise((resolve, reject) => {
      _readFile(path, 'utf8', function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }
import core from "@actions/core"
import recursiveReadDir from 'recursive-readdir';
import { readFile as _readFile } from 'fs';
import Testrail from 'testrail-api';

const testrail_url = core.getInput('testrail-url');
const TESTRAIL_API_KEY = core.getInput('TESTRAIL_API_KEY');
const TESTRAIL_USER = core.getInput('TESTRAIL_USER')
const test_directory = core.getInput('test-directory');

const testrail = new Testrail({
    host: testrail_url,
    user: TESTRAIL_USER,
    password: TESTRAIL_API_KEY
});

async function run() {
    const repoTestIds = []
    const testRailIds = []
    const missingIds = []

    //get test `@CXXXXX` test ids 
    const regex = /[\@C][0-9]+/g
    const featureFiles = await recursiveReadDir(test_directory, ['!*.feature'])
    
    for (const file of featureFiles) {
        const constents = await readFile(file);
        const newData = constents.replace(/\n/g, " ");
        repoTestIds.push(...newData.match(regex))
    }
    
    console.log(repoTestIds)

    //get testrail template test ids
    testrail.getPlan(/*RUN_ID=*/39654, function (err, response, cases) {

        console.log(cases.entries[0].runs);
      });
    

    //core.setOutput('missing-ids', missingIds)
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
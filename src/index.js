import core from "@actions/core"
import recursiveReadDir from "recursive-readdir"
import fs from "fs"
import Testrail from "testrail-api"

// const testrail_url = core.getInput('testrail-url');
// const TESTRAIL_TOKEN = core.getInput('TESTRAIL_TOKEN');
// const test_directory = core.getInput('test-directory');

const testrail = new Testrail({
    host: 'host',
    user: 'user_email',
    password: 'password'
});

async function run() {
    const repoTestIds = []
    const testRailIds = []
    const missingIds = []

    //get test `@CXXXXX` test ids 
    const regex = /[\@C][0-9]+/g
    const featureFiles = await recursiveReadDir('src', ['!*.feature'])
    
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
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }
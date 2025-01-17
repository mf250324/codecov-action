const core = require('@actions/core');
const exec = require('@actions/exec');

const fs = require('fs');
const request = require('requestretry');

import buildExec from './buildExec';

let failCi;
try {
  request({
    json: false,
    maxAttempts: 10,
    timeout: 3000,
    url: 'https://codecov.io/bash',
  }, (error, response, body) => {
    const {execArgs, options, filepath, failCi} = buildExec();
    console.log(`exec arg`, execArgs);
    console.log(`opts`, options);
    console.log(`fp`, filepath);
    try {
      if (error && failCi) {
        throw error;
      } else if (error) {
        core.warning(`Codecov warning0: ${error.message}`);
      }

      fs.writeFile(filepath, body, (err) => {
        if (err && failCi) {
          throw err;
        } else if (err) {
          core.warning(`Codecov warningA: ${err.message}`);
        }

        exec.exec('bash', execArgs, options)
            .catch((err) => {
              if (failCi) {
                core.setFailed(
                    `Codecov failed with the following error: ${err.message}`,
                );
              } else {
                core.warning(`Codecov warning1: ${err.message}`);
              }
            })
            .then(() => {
              unlinkFile();
            });

        const unlinkFile = () => {
          fs.unlink(filepath, (err) => {
            if (err && failCi) {
              throw err;
            } else if (err) {
              core.warning(`Codecov warning2: ${err.message}`);
            }
          });
        };
      });
    } catch (error) {
      core.setFailed(
          `Codecov failed with the following error: ${error.message}`,
      );
    }
  });
} catch (error) {
  if (failCi) {
    core.setFailed(`Codecov failed with the following error: ${error.message}`);
  } else {
    core.warning(`Codecov warning3: ${error.message}`);
  }
}

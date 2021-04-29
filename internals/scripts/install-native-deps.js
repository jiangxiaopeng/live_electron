const sh = require('shelljs');
const colors = require('colors/safe');
const fs = require('fs');
const os = require('os');
const path = require('path');
const stream = require('stream');

const node_modules = path.join(process.cwd(), 'src/node_modules');

const fetch = require('node-fetch');

function log_info(msg) {
    sh.echo(colors.magenta(msg));
  }
  
function log_error(msg) {
    sh.echo(colors.red(`ERROR: ${msg}`));
}

function executeCmd(cmd, options) {
  // Default is to exit on failure
  if (options.exit == null) options.exit = true;

  const result = options.silent ? sh.exec(cmd, { silent: true }) : sh.exec(cmd);

  if (result.code !== 0) {
    error(`Command Failed >>> ${cmd}`);
    if (options.exit) {
      sh.exit(1);
    } else {
      throw new Error(`Failed to execute command: ${cmd}`);
    }
  }

  return result.stdout;
}

function downloadFile(srcUrl, dstPath) {
  const tmpPath = `${dstPath}.tmp`;
  return new Promise((resolve, reject) => {
    fetch(srcUrl)
      .then(response => {
        if (response.ok) return response;
        log_error(`Got ${response.status} response from ${srcUrl}`);
        return Promise.reject(response);
      })
      .then(({ body }) => {
        const fileStream = fs.createWriteStream(tmpPath);
        stream.pipeline(body, fileStream, e => {
          if (e) {
            log_error(`Error downloading ${srcUrl}`, e);
            reject(e);
          } else {
            fs.rename(tmpPath, dstPath, e => {
              if (e) {
                reject(e);
                return;
              }
              log_info(`Successfully downloaded ${srcUrl}`);
              resolve();
            });
          }
        });
      })
      .catch(e => reject(e));
  });
}

async function runScript() {
  colors.blue('----Streamlabs OBS native dependecies installation----');

  try {
    const jsonData = fs.readFileSync('./internals/scripts/repositories.json')
    const root = JSON.parse(jsonData.toString());
    const dependecies = root.files;
    let os = '';

    if (process.platform === 'win32')
      os = 'win64';
    else if (process.platform === 'darwin')
      os = 'osx';
    else
      throw 'Platform not supported.';

    sh.cd(node_modules);

    const promises = dependecies.filter(dependency => dependency[os])
      .map(async dependency => {
        const file = path.join(process.cwd(), dependency['name'], 'package.json');
        let jsonData;
        try {
          jsonData = fs.readFileSync(file);
        } catch (e) {
          log_error(`jsonData error: ${e}`);
        }
        if (jsonData) {
          const root = JSON.parse(jsonData.toString());
          const currentVersion = root['version'];
          if (currentVersion == dependency['version'])
            return;
        }

        let moduleVersion = '';
        if (os === 'osx' && dependency['mac_version'])
          moduleVersion = dependency['mac_version'];
        else
          moduleVersion = dependency['version'];
        
        sh.rm('-rf', path.join(node_modules, dependency['name']));

        let fileName = dependency['archive'];
        fileName = fileName.replace('[VERSION]', moduleVersion);
        fileName = fileName.replace('[OS]', os);
        
        const url = dependency['url'] + fileName;
        const filePath = path.join(process.cwd(), fileName);

        log_info ('Downloading ' + fileName);
        await downloadFile(url, filePath);
        log_info ('Installing ' + fileName);
        executeCmd('tar -xzvf ' + fileName, { silent: true });
        sh.rm(fileName);
      });
      await Promise.all(promises);

      // if (process.platform === 'win32') {
      //   sh.cd('../scripts');
      //   executeCmd('facemask-plugin-move.bat', { silent: false });
      // }
  } catch (error) {
    log_error('An error occured preventing the script from installing successfully all required native dependencies.')
    log_error(error);
    sh.exit(1);
  }
}

runScript().then(() => {
  sh.exit(0);
});
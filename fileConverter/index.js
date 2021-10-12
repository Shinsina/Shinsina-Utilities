import fs from 'fs';
import readline from 'readline';
import inquirer from 'inquirer';

const { fileLocation, convertTo, hasLabels } = await inquirer.prompt([
  {
    type: 'input',
    name: 'fileLocation',
    message: 'Provide a relative file path to the data file',
    default: `./data.json`
  },
  {
    type: 'input',
    name: 'convertTo',
    message: 'Name the file extension for the converted file',
    default: 'txt'
  },
  {
    type: 'confirm',
    name: 'hasLabels',
    message: 'Is this data labeled in the first row?',
    default: true,
    when: (ans) => !ans.fileLocation.match(/json$/),
  }
]);

async function readLines(stream) {
  const lineReader = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });
  return new Promise((resolve) => {
    stream.once('error', () => resolve(null));
    const lines = [];
    lineReader.on('line', (line) => lines.push(line));
    lineReader.on('close', () => resolve(lines));
  });
}

const isJSON = (filePath) => {
  const fileData = fs.readFileSync(filePath);
  const JSONData = JSON.parse(fileData);
  const formattedData = [];
  if  (Array.isArray(JSONData)) {
    JSONData.forEach((item) => {
      formattedData.push(`${item}`)
    });
  } else {
    const fieldArrays = {};
    Object.keys(JSONData).forEach((key) => {
      if (Array.isArray(JSONData[key])) {
        fieldArrays[key] = JSONData[key];
      }
    });
    let longestArr = 0;
    formattedData.push(`${Object.keys(fieldArrays).join()},\n`);
    Object.keys(fieldArrays).forEach((fieldArray) => {
      if(fieldArray.length > longestArr) {
        longestArr = fieldArray.length;
      }
    });
    for (let i = 0; i < longestArr; i += 1) {
      let fileLine = '';
      Object.keys(fieldArrays).forEach((array) => {
        if(fieldArrays[array][i]){
          fileLine += `${String(fieldArrays[array][i])},`;
        }
      });
      if(fileLine){
        formattedData.push(`${fileLine}\n`);
      }
    }
  }
  return formattedData
};

const isNotJSON = async (filePath) => {
  const fileStream = fs.createReadStream(filePath);
  const lines = await readLines(fileStream);
  return await lines.join('\n')
};

const supportedFileTypes = {
  'json': (fileLocation) => isJSON(fileLocation),
  'txt': async (fileLocation) => await isNotJSON(fileLocation),
  'csv': async (fileLocation) => await isNotJSON(fileLocation),
  'xlsx': async (fileLocation) => await isNotJSON(fileLocation),
};

const finalizeData = {
  'json': (processedData) => processedData.toString().replace(/\n,/g, '\n'),
  'txt': (processedData) => processedData.toString(),
  'csv': (processedData) => processedData.toString(),
  'xlsx': (processedData) => processedData.toString()
}

const isSupportedFileType = fileLocation.match(/json$|txt$|csv$|xlsx$/)[0];
const fileName = fileLocation.match(/\/(.+)\./)[1];

if(isSupportedFileType) {
  const processedData = isSupportedFileType === 'json'
    ? supportedFileTypes[isSupportedFileType](fileLocation)
    : await supportedFileTypes[isSupportedFileType](fileLocation);
  if (supportedFileTypes[convertTo]) {
    if(convertTo !== 'json') {
      fs.writeFileSync(`./${fileName}.${convertTo}`, finalizeData[isSupportedFileType](processedData));
    } else {
      const keyedOutputObj = {};
      const arrayofDataArrays = [];
      if  (hasLabels) {
        const labelsArray = processedData.match(/.+\n/)[0].split(',').filter((value) => value !== '\n');
        const filterOutKeys = processedData.match(/.+\n/)[0];
        const dataArrays = processedData.match(/.+\n/g).filter((value) => value !== filterOutKeys);
        dataArrays.forEach((dataArray) => {
          arrayofDataArrays.push(dataArray.split(',').filter((value) => value !== '\n'));
        });
        labelsArray.forEach((label, index) => {
          arrayofDataArrays.forEach((dataArray) => {
            if(keyedOutputObj[label]) {
              keyedOutputObj[label].push(dataArray[index]);
            } else {
              keyedOutputObj[label] = [dataArray[index]];
            }
          });
        });
        fs.writeFileSync(`./${fileName}.${convertTo}`, JSON.stringify(keyedOutputObj));
      } else {
        const dataArrays = processedData.match(/.+\n/g);
        dataArrays.forEach((dataArray, index) => {
          arrayofDataArrays[index] = dataArray.split(',').filter((value) => value !== '\n');
        });
        let longestDataArr = 0;
        arrayofDataArrays.forEach((dataArray) => {
          if (dataArray.length > longestDataArr) {
            longestDataArr = dataArray.length
          }
        });
        for (let i = 0; i < longestDataArr; i += 1) {
          arrayofDataArrays.forEach((dataArray) => {
            if (keyedOutputObj[i]) {
              keyedOutputObj[i].push(dataArray[i]);
            } else {
              keyedOutputObj[i] = [dataArray[i]];
            }
          });
        }
        fs.writeFileSync(`./${fileName}.${convertTo}`, JSON.stringify(keyedOutputObj));
      }
    }
  } else {
    console.log(`Cannot convert to ${convertTo} file type`)
  }
} else {
  console.log('File type is not supported');
}
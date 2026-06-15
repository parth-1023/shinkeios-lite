const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const datasetPath = path.join(__dirname, '../Dataset for fish');
const outputPath = path.join(__dirname, '../public/data/dafif.csv');

// Make sure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const results = [];

console.log('Scanning dataset directories to extract ALL raw readings...');

// 1. Get all day directories
const dayDirs = fs.readdirSync(datasetPath).filter(name => {
  const fullPath = path.join(datasetPath, name);
  return fs.statSync(fullPath).isDirectory() && /^Day \d+$/.test(name);
});

// Sort day directories numerically
dayDirs.sort((a, b) => {
  const numA = parseInt(a.replace('Day ', ''), 10);
  const numB = parseInt(b.replace('Day ', ''), 10);
  return numA - numB;
});

// 2. Loop through each day and its species subfolders
for (const dayDir of dayDirs) {
  const dayNum = parseInt(dayDir.replace('Day ', ''), 10);
  const dayPath = path.join(datasetPath, dayDir);
  
  const speciesDirs = fs.readdirSync(dayPath).filter(name => {
    const fullPath = path.join(dayPath, name);
    return fs.statSync(fullPath).isDirectory();
  });

  for (const species of speciesDirs) {
    const speciesPath = path.join(dayPath, species);
    
    // Find Excel files in this folder
    const files = fs.readdirSync(speciesPath).filter(file => file.endsWith('.xlsx'));
    
    if (files.length === 0) {
      console.warn(`Warning: No .xlsx file found in ${dayDir}/${species}`);
      continue;
    }

    for (const file of files) {
      const filePath = path.join(speciesPath, file);
      
      try {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON array
        const rows = xlsx.utils.sheet_to_json(sheet);
        let fileCount = 0;

        for (const row of rows) {
          let mqValue = null;
          let timeVal = '';

          // Look for MQ1 or mq1 keys (case insensitive, trimmed)
          for (const key of Object.keys(row)) {
            if (key.trim().toUpperCase() === 'MQ1') {
              mqValue = row[key];
            }
            if (key.trim().toUpperCase() === 'TIME') {
              timeVal = row[key];
            }
          }

          if (mqValue !== null && mqValue !== undefined) {
            const val = parseFloat(mqValue);
            if (!isNaN(val)) {
              // Format time to string
              let timeStr = '00:00:00';
              if (timeVal) {
                if (typeof timeVal === 'object' && timeVal instanceof Date) {
                  timeStr = timeVal.toTimeString().split(' ')[0];
                } else if (typeof timeVal === 'number') {
                  // Excel serial time
                  const totalSeconds = Math.round(timeVal * 24 * 60 * 60);
                  const hours = Math.floor(totalSeconds / 3600);
                  const minutes = Math.floor((totalSeconds % 3600) / 60);
                  const seconds = totalSeconds % 60;
                  timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                } else {
                  timeStr = String(timeVal).trim();
                }
              }

              results.push({
                species: species.trim(),
                day: dayNum,
                time: timeStr,
                mq135Value: val
              });
              fileCount++;
            }
          }
        }

        console.log(`Processed ${dayDir} - ${species}: Extracted ${fileCount} raw readings`);
      } catch (err) {
        console.error(`Error processing file ${filePath}:`, err);
      }
    }
  }
}

// 3. Write results to public/data/dafif.csv
const csvLines = ['species,day,time,mq135Value'];
for (const res of results) {
  csvLines.push(`${res.species},${res.day},${res.time},${res.mq135Value}`);
}

fs.writeFileSync(outputPath, csvLines.join('\n'), 'utf-8');
console.log(`\nSuccessfully merged ALL raw data! Total rows written: ${results.length} to ${outputPath}`);

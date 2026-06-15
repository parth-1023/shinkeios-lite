import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database...');
  await prisma.sensorReading.deleteMany({});
  await prisma.traceabilityEvent.deleteMany({});
  await prisma.batch.deleteMany({});

  // 1. Read Vessel Coordinates
  const vesselsPath = path.join(process.cwd(), 'public/data/vessels.json');
  const vessels = JSON.parse(fs.readFileSync(vesselsPath, 'utf-8'));

  // 2. Read DaFiF CSV data (All raw readings)
  const csvPath = path.join(process.cwd(), 'public/data/dafif.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.trim().split('\n').slice(1); // Skip header

  console.log(`Parsing ${lines.length} raw readings...`);
  
  // Group readings by species
  const sensorData: Record<string, { day: number; time: string; mq135Value: number }[]> = {};

  for (const line of lines) {
    const [species, dayStr, timeStr, mqStr] = line.split(',');
    if (!species || !dayStr || !timeStr || !mqStr) continue;

    const day = parseInt(dayStr.trim(), 10);
    const mq135Value = parseFloat(mqStr.trim());
    const speciesKey = species.trim();

    if (!sensorData[speciesKey]) {
      sensorData[speciesKey] = [];
    }
    sensorData[speciesKey].push({ day, time: timeStr.trim(), mq135Value });
  }

  // 3. Create 5 Batches of Fish
  const batchDefinitions = [
    { species: 'Mackerel', vesselIndex: 0 },
    { species: 'Tuna', vesselIndex: 1 },
    { species: 'Tilapia', vesselIndex: 2 },
    { species: 'Mackerel', vesselIndex: 3 },
    { species: 'Tuna', vesselIndex: 4 },
  ];

  const elevenDaysAgo = new Date();
  elevenDaysAgo.setDate(elevenDaysAgo.getDate() - 11);

  console.log('Seeding new batch data...');

  for (let i = 0; i < batchDefinitions.length; i++) {
    const def = batchDefinitions[i];
    const vessel = vessels[def.vesselIndex];

    // Create the batch record
    const batch = await prisma.batch.create({
      data: {
        species: def.species,
        originLat: vessel.lat,
        originLng: vessel.lng,
        catchTime: elevenDaysAgo,
      },
    });

    console.log(`Seeding telemetry for Batch ${batch.id} (${def.species})...`);

    // Prepare sensor readings for bulk insert
    const readings = sensorData[def.species] || [];
    const sensorReadingsData = [];

    for (const r of readings) {
      const readingTime = new Date(elevenDaysAgo);
      readingTime.setDate(readingTime.getDate() + (r.day - 1));

      // Parse "HH:MM:SS" time and set it on the date object
      const [hours, minutes, seconds] = r.time.split(':').map(Number);
      if (!isNaN(hours)) readingTime.setHours(hours);
      if (!isNaN(minutes)) readingTime.setMinutes(minutes);
      if (!isNaN(seconds)) readingTime.setSeconds(seconds);

      sensorReadingsData.push({
        batchId: batch.id,
        recordedAt: readingTime,
        mq135Value: r.mq135Value,
      });
    }

    // Use high-performance bulk insert (createMany)
    if (sensorReadingsData.length > 0) {
      await prisma.sensorReading.createMany({
        data: sensorReadingsData,
      });
      console.log(`Inserted ${sensorReadingsData.length} readings.`);
    }

    // Create logistical traceability events (GDST standard)
    const eventTimeline = [
      { dayOffset: 0, bizStep: 'harvesting', location: `Vessel ${vessel.name} (At Sea)` },
      { dayOffset: 3, bizStep: 'transporting', location: 'Port of Tokyo (Cold Storage)' },
      { dayOffset: 7, bizStep: 'receiving', location: 'Shinkei Processing Center A' },
      { dayOffset: 9, bizStep: 'processing', location: 'Tokyo Central Distribution Hub' },
    ];

    for (const event of eventTimeline) {
      const eventTime = new Date(elevenDaysAgo);
      eventTime.setDate(eventTime.getDate() + event.dayOffset);

      await prisma.traceabilityEvent.create({
        data: {
          batchId: batch.id,
          eventTime,
          bizStep: event.bizStep,
          location: event.location,
        },
      });
    }
  }

  console.log('Database successfully seeded with ALL raw data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateFreshness } from '@/lib/freshness';

export async function GET() {
    try {
        const batches = await prisma.batch.findMany({
            include: {
                sensorReadings: {
                    orderBy: {
                        recordedAt: 'desc',
                    },
                    take: 1, // Only get the most recent reading
                },
            },
        });

        const augmentedBatches = batches.map((batch) => {
            const latestReading = batch.sensorReadings[0];
            const mq135Value = latestReading ? latestReading.mq135Value : 70.0;
            const freshnessScore = calculateFreshness(mq135Value, batch.species);

            return {
                id: batch.id,
                species: batch.species,
                originLat: batch.originLat,
                originLng: batch.originLng,
                catchTime: batch.catchTime,
                latestReading: latestReading || null,
                freshnessScore,
            };
        });

        return NextResponse.json(augmentedBatches);
    } catch (error) {
        console.error('Error fetching batches:', error);
        return NextResponse.json({ error: 'Failed to fetch batches' }, { status: 500 });
    }
}

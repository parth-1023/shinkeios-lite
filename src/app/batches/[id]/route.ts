import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { forecastBatch, revenueAtRisk, getSpeciesProfile } from '@/lib/freshness';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const getRaw = searchParams.get('raw') === 'true';

        const batch = await prisma.batch.findUnique({
            where: { id },
            include: {
                traceabilityEvents: { orderBy: { eventTime: 'asc' } },
            },
        });

        if (!batch) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        const sensorReadings = await prisma.sensorReading.findMany({
            where: { batchId: id },
            orderBy: { recordedAt: 'asc' },
            select: { id: true, recordedAt: true, mq135Value: true },
        });

        let processedReadings = sensorReadings;
        if (!getRaw && sensorReadings.length > 150) {
            const targetCount = 120;
            const step = Math.ceil(sensorReadings.length / targetCount);
            processedReadings = sensorReadings.filter((_, index) => index % step === 0);
        }

        const forecast = forecastBatch(batch.species, sensorReadings);
        const profile = getSpeciesProfile(batch.species);

        return NextResponse.json({
            ...batch,
            sensorReadings: processedReadings,
            forecast,
            revenueAtRisk: revenueAtRisk(batch.species, forecast.recommendation),
            speciesProfile: profile,
            _metadata: {
                totalReadings: sensorReadings.length,
                returnedReadings: processedReadings.length,
                downsampled: processedReadings.length !== sensorReadings.length,
            },
        });
    } catch (error) {
        console.error('Error fetching batch detail:', error);
        return NextResponse.json({ error: 'Failed to fetch batch details' }, { status: 500 });
    }
}

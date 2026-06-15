import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> } // Type params as a Promise
) {
    try {
        const { id } = await params; // Await the params Promise
        const { searchParams } = new URL(request.url);
        const getRaw = searchParams.get('raw') === 'true';

        // 1. Fetch batch and logistical timeline
        const batch = await prisma.batch.findUnique({
            where: { id },
            include: {
                traceabilityEvents: {
                    orderBy: {
                        eventTime: 'asc',
                    },
                },
            },
        });

        if (!batch) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
        }

        // 2. Fetch all sensor readings
        const sensorReadings = await prisma.sensorReading.findMany({
            where: { batchId: id },
            orderBy: {
                recordedAt: 'asc',
            },
        });

        // 3. Apply Downsampling if not requesting raw telemetry
        let processedReadings = sensorReadings;
        if (!getRaw && sensorReadings.length > 150) {
            const targetCount = 120;
            const step = Math.ceil(sensorReadings.length / targetCount);
            processedReadings = sensorReadings.filter((_, index) => index % step === 0);
        }

        return NextResponse.json({
            ...batch,
            sensorReadings: processedReadings,
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

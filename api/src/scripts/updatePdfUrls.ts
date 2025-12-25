import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

async function updatePdfUrls() {
  try {
    console.log('Starting PDF URL update...');
    console.log(`BASE_URL: ${BASE_URL}`);

    // Update job sheet URLs
    const jobSheets = await prisma.jobSheet.findMany({
      where: {
        pdfUrl: {
          startsWith: '/uploads',
        },
      },
    });

    console.log(`Found ${jobSheets.length} job sheets with relative URLs`);

    for (const jobSheet of jobSheets) {
      const newUrl = `${BASE_URL}${jobSheet.pdfUrl}`;
      await prisma.jobSheet.update({
        where: { id: jobSheet.id },
        data: { pdfUrl: newUrl },
      });
      console.log(`Updated job sheet ${jobSheet.jobSheetNumber}: ${jobSheet.pdfUrl} -> ${newUrl}`);
    }

    // Update invoice URLs
    const invoices = await prisma.invoice.findMany({
      where: {
        pdfUrl: {
          startsWith: '/uploads',
        },
      },
    });

    console.log(`Found ${invoices.length} invoices with relative URLs`);

    for (const invoice of invoices) {
      if (invoice.pdfUrl) {
        const newUrl = `${BASE_URL}${invoice.pdfUrl}`;
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { pdfUrl: newUrl },
        });
        console.log(`Updated invoice ${invoice.invoiceNumber}: ${invoice.pdfUrl} -> ${newUrl}`);
      }
    }

    console.log('\n✅ PDF URL update completed successfully!');
    console.log(`Updated ${jobSheets.length} job sheets and ${invoices.length} invoices`);
  } catch (error) {
    console.error('Error updating PDF URLs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updatePdfUrls();

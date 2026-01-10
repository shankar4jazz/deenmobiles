import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { S3Service } from './s3Service';

interface UpdateCompanyData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  stateCode?: string;
  logo?: string;
  jobSheetInstructions?: string;
}

export class CompanyService {
  /**
   * Get company details by ID
   */
  static async getCompanyById(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        gstin: true,
        stateCode: true,
        jobSheetInstructions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw new AppError(404, 'Company not found');
    }

    return company;
  }

  /**
   * Update company details
   */
  static async updateCompany(companyId: string, data: UpdateCompanyData) {
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      throw new AppError(404, 'Company not found');
    }

    // If email is being changed, check for duplicates
    if (data.email && data.email !== existingCompany.email) {
      const emailExists = await prisma.company.findFirst({
        where: {
          email: data.email,
          id: { not: companyId },
        },
      });

      if (emailExists) {
        throw new AppError(400, 'Email already in use by another company');
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        gstin: true,
        stateCode: true,
        jobSheetInstructions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedCompany;
  }

  /**
   * Update company logo
   */
  static async updateLogo(companyId: string, logoUrl: string) {
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      throw new AppError(404, 'Company not found');
    }

    // Delete old logo from S3 if exists
    if (existingCompany.logo && S3Service.isS3Url(existingCompany.logo)) {
      try {
        await S3Service.deleteFileByUrl(existingCompany.logo);
      } catch (error) {
        // Log but don't fail if old logo deletion fails
        console.warn('Failed to delete old logo:', error);
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        logo: logoUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        gstin: true,
        stateCode: true,
        jobSheetInstructions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedCompany;
  }

  /**
   * Delete company logo
   */
  static async deleteLogo(companyId: string) {
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      throw new AppError(404, 'Company not found');
    }

    // Delete logo from S3 if exists
    if (existingCompany.logo && S3Service.isS3Url(existingCompany.logo)) {
      try {
        await S3Service.deleteFileByUrl(existingCompany.logo);
      } catch (error) {
        console.warn('Failed to delete logo from S3:', error);
      }
    }

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        logo: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        logo: true,
        gstin: true,
        stateCode: true,
        jobSheetInstructions: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedCompany;
  }
}

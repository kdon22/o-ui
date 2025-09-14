/**
 * Metrics service for marketplace analytics and user metrics
 */

import { prisma } from '@/lib/prisma';
import { ServiceContext, UserMetrics } from '../types';
import { CacheService } from './cache-service';

export class MetricsService {
  private cacheService: CacheService;

  constructor(private context: ServiceContext) {
    this.cacheService = new CacheService();
  }

  async getUserMetrics(): Promise<UserMetrics> {
    const cacheKey = `marketplace:user-metrics:${this.context.userId}:${this.context.tenantId}`;
    const cached = await this.cacheService.get<UserMetrics>(cacheKey);
    if (cached) {
      return cached;
    }

    const [
      installedCount,
      publishedCount,
      reviewsCount,
      starsCount,
      collectionsCount,
      publishedPackages
    ] = await Promise.all([
      this.getUserInstalledCount(),
      this.getUserPublishedCount(),
      this.getUserReviewsCount(),
      this.getUserStarsCount(),
      this.getUserCollectionsCount(),
      this.getUserPublishedPackagesSimple()
    ]);

    const reputationScore = this.calculateReputationScore({
      publishedCount,
      reviewsCount,
      starsCount,
      publishedPackages
    });

    const metrics: UserMetrics = {
      totalInstalled: installedCount,
      totalPublished: publishedCount,
      totalReviews: reviewsCount,
      totalStars: starsCount,
      totalCollections: collectionsCount,
      reputationScore
    };

    await this.cacheService.set(cacheKey, metrics, 1800); // Cache for 30 minutes
    return metrics;
  }

  async getAvailableUpdates(): Promise<any[]> {
    const installations = await prisma.packageInstallation.findMany({
      where: {
        userId: this.context.userId,
        tenantId: this.context.tenantId,
        status: 'active'
      },
      include: {
        package: {
          select: {
            id: true,
            name: true,
            version: true,
            category: true
          }
        }
      }
    });

    const updates = [];
    for (const installation of installations) {
      if (this.hasNewerVersion(installation.version, installation.package.version)) {
        updates.push({
          packageId: installation.package.id,
          packageName: installation.package.name,
          currentVersion: installation.version,
          availableVersion: installation.package.version,
          category: installation.package.category,
          installDate: installation.createdAt.toISOString()
        });
      }
    }

    return updates;
  }

  async recordPackageView(packageId: string): Promise<void> {
    try {
      await prisma.packageAnalytics.upsert({
        where: {
          packageId_date: {
            packageId,
            date: new Date().toISOString().split('T')[0]
          }
        },
        update: {
          views: { increment: 1 }
        },
        create: {
          packageId,
          date: new Date().toISOString().split('T')[0],
          views: 1,
          downloads: 0
        }
      });
    } catch (error) {
      console.error('Failed to record package view:', error);
    }
  }

  async recordPackageDownload(packageId: string): Promise<void> {
    try {
      await prisma.packageAnalytics.upsert({
        where: {
          packageId_date: {
            packageId,
            date: new Date().toISOString().split('T')[0]
          }
        },
        update: {
          downloads: { increment: 1 }
        },
        create: {
          packageId,
          date: new Date().toISOString().split('T')[0],
          views: 0,
          downloads: 1
        }
      });

      // Update package total downloads
      await prisma.marketplacePackage.update({
        where: { id: packageId },
        data: {
          totalDownloads: { increment: 1 },
          weeklyDownloads: { increment: 1 },
          monthlyDownloads: { increment: 1 }
        }
      });
    } catch (error) {
      console.error('Failed to record package download:', error);
    }
  }

  private async getUserInstalledCount(): Promise<number> {
    return prisma.packageInstallation.count({
      where: {
        userId: this.context.userId,
        tenantId: this.context.tenantId,
        status: 'active'
      }
    });
  }

  private async getUserPublishedCount(): Promise<number> {
    return prisma.marketplacePackage.count({
      where: {
        authorId: this.context.userId,
        tenantId: this.context.tenantId,
        status: 'active'
      }
    });
  }

  private async getUserReviewsCount(): Promise<number> {
    return prisma.packageReview.count({
      where: {
        userId: this.context.userId,
        package: {
          tenantId: this.context.tenantId
        }
      }
    });
  }

  private async getUserStarsCount(): Promise<number> {
    return prisma.packageStar.count({
      where: {
        userId: this.context.userId,
        package: {
          tenantId: this.context.tenantId
        }
      }
    });
  }

  private async getUserCollectionsCount(): Promise<number> {
    return prisma.packageCollection.count({
      where: {
        createdBy: this.context.userId,
        tenantId: this.context.tenantId
      }
    });
  }

  private async getUserPublishedPackagesSimple(): Promise<any[]> {
    return prisma.marketplacePackage.findMany({
      where: {
        authorId: this.context.userId,
        tenantId: this.context.tenantId,
        status: 'active'
      },
      select: {
        totalDownloads: true,
        averageRating: true,
        totalReviews: true
      }
    });
  }

  private calculateReputationScore(data: {
    publishedCount: number;
    reviewsCount: number;
    starsCount: number;
    publishedPackages: any[];
  }): number {
    let score = 0;

    // Base points for activity
    score += data.publishedCount * 10;
    score += data.reviewsCount * 2;
    score += data.starsCount * 1;

    // Bonus points for package quality
    data.publishedPackages.forEach(pkg => {
      score += (pkg.totalDownloads || 0) * 0.1;
      score += (pkg.averageRating || 0) * 5;
      score += (pkg.totalReviews || 0) * 2;
    });

    return Math.round(score);
  }

  private hasNewerVersion(currentVersion: string, availableVersion: string): boolean {
    const current = this.parseVersion(currentVersion);
    const available = this.parseVersion(availableVersion);

    return (
      available.major > current.major ||
      (available.major === current.major && available.minor > current.minor) ||
      (available.major === current.major && available.minor === current.minor && available.patch > current.patch)
    );
  }

  private parseVersion(version: string): { major: number; minor: number; patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  async getRecentInstallations(limit: number = 5): Promise<any[]> {
    try {
      const installations = await prisma.packageInstallation.findMany({
        where: {
          userId: this.context.userId,
          tenantId: this.context.tenantId,
          status: 'active'
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              version: true,
              authorId: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });

      return installations.map((installation: any) => ({
        id: installation.id,
        packageId: installation.package.id,
        packageName: installation.package.name,
        packageDescription: installation.package.description,
        category: installation.package.category,
        version: installation.version,
        installedAt: installation.createdAt.toISOString(),
        author: installation.package.authorId
      }));
    } catch (error) {
      console.error('Error fetching recent installations:', error);
      return [];
    }
  }

  async getUserInstallations(): Promise<any[]> {
    try {
      const installations = await prisma.packageInstallation.findMany({
        where: {
          userId: this.context.userId,
          tenantId: this.context.tenantId,
          status: 'active'
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              version: true,
              authorId: true,
              rating: true,
              downloadCount: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return installations.map((installation: any) => ({
        id: installation.id,
        packageId: installation.package.id,
        packageName: installation.package.name,
        packageDescription: installation.package.description,
        category: installation.package.category,
        version: installation.version,
        installedAt: installation.createdAt.toISOString(),
        author: installation.package.authorId,
        rating: installation.package.rating,
        downloads: installation.package.downloadCount,
        hasUpdate: this.hasNewerVersion(installation.version, installation.package.version)
      }));
    } catch (error) {
      console.error('Error fetching user installations:', error);
      return [];
    }
  }

  async getStarredPackages(): Promise<any[]> {
    try {
      const stars = await prisma.packageStar.findMany({
        where: {
          userId: this.context.userId,
          tenantId: this.context.tenantId,
          status: 'active'
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              version: true,
              authorId: true,
              rating: true,
              downloadCount: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return stars.map((star: any) => ({
        id: star.id,
        packageId: star.package.id,
        packageName: star.package.name,
        packageDescription: star.package.description,
        category: star.package.category,
        version: star.package.version,
        starredAt: star.createdAt.toISOString(),
        author: star.package.authorId,
        rating: star.package.rating,
        downloads: star.package.downloadCount
      }));
    } catch (error) {
      console.error('Error fetching starred packages:', error);
      return [];
    }
  }

  async getUserCollections(): Promise<any[]> {
    try {
      const collections = await prisma.packageCollection.findMany({
        where: {
          createdBy: this.context.userId,
          tenantId: this.context.tenantId
        },
        include: {
          packages: {
            include: {
              package: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  rating: true
                }
              }
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return collections.map((collection: any) => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        packageCount: collection.packages.length,
        createdAt: collection.createdAt.toISOString(),
        updatedAt: collection.updatedAt.toISOString(),
        isOfficial: collection.isOfficial,
        packages: collection.packages.map((cp: any) => cp.package)
      }));
    } catch (error) {
      console.error('Error fetching user collections:', error);
      return [];
    }
  }

  async getUserReviews(): Promise<any[]> {
    try {
      const reviews = await prisma.packageReview.findMany({
        where: {
          userId: this.context.userId,
          tenantId: this.context.tenantId
        },
        include: {
          package: {
            select: {
              id: true,
              name: true,
              category: true,
              version: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reviews.map((review: any) => ({
        id: review.id,
        packageId: review.package.id,
        packageName: review.package.name,
        category: review.package.category,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        isPublic: review.isPublic
      }));
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return [];
    }
  }

  async getUserPublishedPackages(): Promise<any[]> {
    try {
      const packages = await prisma.marketplacePackage.findMany({
        where: {
          authorId: this.context.userId,
          tenantId: this.context.tenantId,
          status: 'active'
        },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          version: true,
          downloadCount: true,
          rating: true,
          reviewCount: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      return packages.map((pkg: any) => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        category: pkg.category,
        version: pkg.version,
        downloads: pkg.downloadCount,
        rating: pkg.rating,
        reviewCount: pkg.reviewCount,
        createdAt: pkg.createdAt.toISOString(),
        updatedAt: pkg.updatedAt.toISOString(),
        status: 'published'
      }));
    } catch (error) {
      console.error('Error fetching user published packages:', error);
      return [];
    }
  }

  async getPackageAnalytics(packageId: string, options: any = {}): Promise<any> {
    const cacheKey = `marketplace:analytics:${packageId}:${this.context.tenantId}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached && !options.forceRefresh) {
      return cached;
    }

    try {
      const [packageData, analytics] = await Promise.all([
        prisma.marketplacePackage.findUnique({
          where: { id: packageId },
          select: {
            downloadCount: true,
            installCount: true,
            activeInstalls: true,
            rating: true,
            reviewCount: true,
            createdAt: true
          }
        }),
        prisma.packageAnalytics.findUnique({
          where: { packageId },
          select: {
            totalDownloads: true,
            weeklyDownloads: true,
            monthlyDownloads: true,
            activeInstallations: true,
            averageRating: true,
            totalReviews: true
          }
        })
      ]);

      if (!packageData) {
        throw new Error('Package not found');
      }

      const result = {
        downloads: packageData.downloadCount || 0,
        installations: packageData.installCount || 0,
        activeUsers: packageData.activeInstalls || 0,
        rating: packageData.rating || 0,
        reviewCount: packageData.reviewCount || 0,
        createdAt: packageData.createdAt.toISOString(),
        weeklyDownloads: analytics?.weeklyDownloads || 0,
        monthlyDownloads: analytics?.monthlyDownloads || 0,
        activeInstallations: analytics?.activeInstallations || 0
      };

      await this.cacheService.set(cacheKey, result, 1800); // Cache for 30 minutes
      return result;
    } catch (error) {
      console.error('Error fetching package analytics:', error);
      return {
        downloads: 0,
        installations: 0,
        activeUsers: 0,
        rating: 0,
        reviewCount: 0,
        createdAt: new Date().toISOString(),
        weeklyDownloads: 0,
        monthlyDownloads: 0,
        activeInstallations: 0
      };
    }
  }

}

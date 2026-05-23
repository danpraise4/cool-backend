import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { AzureBlobService } from "../../shared/services/azure/blobstorage.service";
import { ICommunityCreateNews } from "./news.interfase";
import { Admin, News, Status } from "@prisma/client";
import { v4 } from "uuid";
import { BlobResponse } from "../../shared/services/azure/blobstorage.model";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";

export class NewsService {
  public async createNews(config: { admin: Admin; post: ICommunityCreateNews }) {
    const uploads: BlobResponse[] = [];

    if (config.post.image?.length) {
      for (const image of config.post.image) {
        const upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${v4()}-${uploads.length}`,
          "image/png"
        );
        uploads.push(upload);
      }
    }

    return prismaClient.news.create({
      data: {
        title: config.post.title,
        body: config.post.body,
        adminId: config.admin.id,
        media: uploads.map((u) => ({ url: u.url, name: u.blobName })),
      },
    });
  }

  public async getNews(
    page = 1,
    pageSize = 20
  ): Promise<{
    news: News[];
    meta: {
      currentPage: number;
      pageSize: number;
      totalPosts: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * pageSize;
    const where = { status: { not: Status.DELETED } };

    const [posts, totalPosts] = await Promise.all([
      prismaClient.news.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prismaClient.news.count({ where }),
    ]);

    return {
      news: posts,
      meta: {
        currentPage: page,
        pageSize,
        totalPosts,
        totalPages: Math.ceil(totalPosts / pageSize),
      },
    };
  }

  public async deleteNews(id: string, adminId: string): Promise<News> {
    const post = await prismaClient.news.findFirst({ where: { id, adminId } });

    if (!post) {
      throw new AppException(
        "News not found or you don't have permission",
        httpStatus.NOT_FOUND
      );
    }

    return prismaClient.news.update({
      where: { id },
      data: { status: Status.DELETED },
    });
  }

  public async updateNews(config: {
    id: string;
    adminId: string;
    post: ICommunityCreateNews;
  }) {
    const existing = await prismaClient.news.findFirst({
      where: { id: config.id, adminId: config.adminId },
    });

    if (!existing) {
      throw new AppException(
        "News not found or you don't have permission",
        httpStatus.NOT_FOUND
      );
    }

    let media = existing.media as { url: string; name: string }[];

    if (config.post.image?.length) {
      const uploads: BlobResponse[] = [];
      for (const image of config.post.image) {
        const upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${v4()}-${uploads.length}`,
          "image/png"
        );
        uploads.push(upload);
      }
      media = uploads.map((u) => ({ url: u.url, name: u.blobName }));
    }

    return prismaClient.news.update({
      where: { id: config.id },
      data: { body: config.post.body, title: config.post.title, media },
    });
  }

  public async getNewsById(id: string): Promise<News> {
    const post = await prismaClient.news.findFirst({ where: { id } });

    if (!post) {
      throw new AppException("News not found", httpStatus.NOT_FOUND);
    }

    return post;
  }
}

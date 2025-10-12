import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { AzureBlobService } from "../../shared/services/azure/blobstorage.service";

import { ICommunityCreateNews } from "./news.interfase";
import { Admin, News } from "@prisma/client";

import { v4 } from "uuid";
import { BlobResponse } from "../../shared/services/azure/blobstorage.model";

export class NewsService {
  constructor() {}

  public async createNews(cofig: { admin: Admin; post: ICommunityCreateNews }) {
    const _file = v4();
    let _uploads: BlobResponse[] = [];

    if (cofig.post.image && cofig.post.image.length > 0) {
      // Upload each image and collect responses
      for (const image of cofig.post.image) {
        const _upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${_file}-${_uploads.length}`,
          "image/png"
        );
        _uploads.push(_upload);
      }
    }

    const post = await prismaClient.news.create({
      data: {
        title: cofig.post.title,
        body: cofig.post.body,
        adminId: cofig.admin.id,
        media:
          _uploads.length > 0
            ? _uploads.map((upload) => ({
                url: upload.url,
                name: upload.blobName,
              }))
            : [],
      },
    });

    return post;
  }

  public async getNews(
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    news: News[];
    meta: {
      currentPage: number;
      pageSize: number;
      totalPosts: number;
      totalPages: number;
    };
  }> {
    const skip = Number((page - 1) * pageSize); // Ensure skip is a number
    const take = Number(pageSize); // Ensure take is a number

    const posts = await prismaClient.news.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" }, // Order posts by latest
    });

    const totalPosts = await prismaClient.news.count(); // Total post count for pagination

    return {
      news: posts.map((post) => ({
        ...post,
      })),
      meta: {
        currentPage: page,
        pageSize,
        totalPosts,
        totalPages: Math.ceil(totalPosts / pageSize),
      },
    };
  }

  public async deleteNews(id: string, adminId: string): Promise<News | null> {
    const post = await prismaClient.news.findFirst({
      where: { id, adminId },
    });

    if (!post) {
      throw new Error(
        "Post not found or you don't have permission to delete it"
      );
    }

    const deletedPost = await prismaClient.news.update({
      where: { id },
      data: {
        status: "DELETED",
      },
    });

    return deletedPost;
  }

  public async updateNews(config: {
    id: string;
    adminId: string;
    post: ICommunityCreateNews;
  }) {
    const existingPost = await prismaClient.news.findFirst({
      where: {
        id: config.id,
        adminId: config.adminId,
      },
    });

    if (!existingPost) {
      throw new Error(
        "Post not found or you don't have permission to update it"
      );
    }

    let media = existingPost.media;

    if (config.post.image && config.post.image.length > 0) {
      const _file = v4();
      let _uploads: BlobResponse[] = [];

      // Upload each image and collect responses
      for (const image of config.post.image) {
        const _upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${_file}-${_uploads.length}`,
          "image/png"
        );
        _uploads.push(_upload);
      }

      media = _uploads.map((upload) => ({
        url: upload.url,
        name: upload.blobName,
      }));
    }

    const updatedPost = await prismaClient.news.update({
      where: { id: config.id },
      data: {
        body: config.post.body,
        media,
      },
    });

    return updatedPost;
  }

  public async getNewsById(id: string): Promise<News | null> {
    const post = await prismaClient.news.findFirst({
      where: { id },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    return post;
  }
}

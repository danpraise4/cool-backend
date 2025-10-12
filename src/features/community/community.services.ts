import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { AzureBlobService } from "../../shared/services/azure/blobstorage.service";

import { ICommunityCreatePost } from "./community.intercase";
import { Post, User } from "@prisma/client";

import { v4 } from "uuid";
import { BlobResponse } from "../../shared/services/azure/blobstorage.model";

export class CommunityService {
  constructor() { }

  public async createCommunnityPost(cofig: {
    user: User;
    post: ICommunityCreatePost;
  }) {
    const _file = v4();
    let _uploads: BlobResponse[] = [];

    console.log("here");

    if (!cofig.post.content && cofig.post.images.length == 0) {
      throw new Error("You have to specify a content or an image");
    }

    console.log(cofig.post);

    if (cofig.post.images) {
      const imagesList = cofig.post.images;

      for (const image of imagesList) {
        const upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          `${_file}-${v4()}`,
          "image/png"
        );
        _uploads.push(upload);
      }
    }

    const post = await prismaClient.post.create({
      data: {
        body: cofig.post.content,
        userId: cofig.user.id,
        images: _uploads.map((upload) => upload.url),
      },
    });

    return post;
  }

  public async createComment(
    postId: string,
    userId: string,
    body: { content: string }
  ) {
    const comment = await prismaClient.comment.create({
      data: {
        postId,
        userId,
        body: body.content,
      },
    });

    return comment;
  }

  public async getPosts(
    userId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<{
    posts: (Post & {
      _count: {
        comments: number;
        likes: number;
        bookmarks: number;
      };
    })[];
    meta: {
      currentPage: number;
      pageSize: number;
      totalPosts: number;
      totalPages: number;
    };
  }> {
    const skip = Number((page - 1) * pageSize); // Ensure skip is a number
    const take = Number(pageSize); // Ensure take is a number

    const posts = await prismaClient.post.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" }, // Order posts by latest
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
        likes: {
          where: { userId },
          select: { id: true }, // Check if user liked the post
        },
        bookmarks: {
          where: { userId },
          select: { id: true }, // Check if user bookmarked the post
        },
      },
    });

    const totalPosts = await prismaClient.post.count(); // Total post count for pagination

    return {
      posts: posts.map((post) => ({
        ...post,
        isLiked: post.likes.length > 0,
        isBookmarked: post.bookmarks.length > 0,
        commentsCount: post._count.comments,
        likesCount: post._count.likes,
        bookmarkCount: post._count.bookmarks,
      })),
      meta: {
        currentPage: page,
        pageSize,
        totalPosts,
        totalPages: Math.ceil(totalPosts / pageSize),
      },
    };
  }

  public async deletePost(id: string, userId: string): Promise<Post | null> {
    const post = await prismaClient.post.findFirst({
      where: { id, userId },
    });

    if (!post) {
      throw new Error(
        "Post not found or you don't have permission to delete it"
      );
    }

    const deletedPost = await prismaClient.post.update({
      where: { id },
      data: {
        status: "DELETED",
      },
    });

    return deletedPost;
  }

  public async updatePost(config: {
    id: string;
    userId: string;
    post: ICommunityCreatePost;
  }) {
    const existingPost = await prismaClient.post.findFirst({
      where: {
        id: config.id,
        userId: config.userId,
      },
    });

    if (!existingPost) {
      throw new Error(
        "Post not found or you don't have permission to update it"
      );
    }

    let images = existingPost.images;

    if (config.post.images?.length) {
      const uploadPromises = config.post.images.map(async (image) => {
        const _file = v4();
        const _upload = await AzureBlobService.instance.uploadBase64Image(
          image,
          _file,
          "image/png"
        );
        return _upload.url;
      });

      images = await Promise.all(uploadPromises);
    }

    const updatedPost = await prismaClient.post.update({
      where: { id: config.id },
      data: {
        body: config.post.content,
        images,
      },
    });

    return updatedPost;
  }

  // Action for comment

  public async createCommentReply(id: string, userId: string, body: { content: string }) {
    const comment = await prismaClient.commentReply.create({
      data: {
        commentId: id,
        userId,
        content: body.content,
      },
    });

    return comment;
  }

  public async toggleCommentLike(commentId: string, postId: string, userId: string) {
    const post = await prismaClient.post.findFirst({
      where: { id: postId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const existingLike = await prismaClient.commentLike.findFirst({
      where: {
        userId: userId,
        commentId: commentId,
      },
    });

    if (existingLike) {
      // Unlike - delete the existing like
      await prismaClient.commentLike.delete({
        where: {
          id: existingLike.id,
        },
      });
      return false;
    } else {
      // Like - create new like
      await prismaClient.commentLike.create({
        data: {
          commentId: commentId,
          userId: userId,
        },
      });
      return true;
    }
  }

  public async toggleCommentBookmark(commentId: string, postId: string, userId: string) {
    const post = await prismaClient.post.findFirst({
      where: { id: postId },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const existingBookmark = await prismaClient.commentBookmark.findFirst({
      where: { userId: userId, commentId: commentId },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prismaClient.commentBookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      });
      return false;
    } else {
      // Add bookmark
      await prismaClient.commentBookmark.create({
        data: {
          commentId: commentId,
          userId: userId,
        },
      });
      return true;
    }
  }


  // Action for post

  public async toggleLike(id: string, userId: string) {
    const post = await prismaClient.post.findFirst({
      where: { id },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const existingLike = await prismaClient.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: userId,
        },
      },
    });

    if (existingLike) {
      // Unlike - delete the existing like
      await prismaClient.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return false;
    } else {
      // Like - create new like
      await prismaClient.like.create({
        data: {
          postId: id,
          userId: userId,
        },
      });
      return true;
    }
  }

  public async toggleBookmark(id: string, userId: string) {
    const post = await prismaClient.post.findFirst({
      where: { id },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    const existingBookmark = await prismaClient.bookmark.findUnique({
      where: { postId_userId: { postId: id, userId: userId } },
    });

    if (existingBookmark) {
      // Remove bookmark
      await prismaClient.bookmark.delete({
        where: {
          id: existingBookmark.id,
        },
      });
      return false;
    } else {
      // Add bookmark
      await prismaClient.bookmark.create({
        data: {
          postId: id,
          userId: userId,
        },
      });
      return true;
    }
  }

  public async getPostLikes(id: string) {
    const likes = await prismaClient.like.findMany({
      where: { postId: id },
    });
    return likes;
  }


  public async getPostComments(id: string, userId: string) {
    const comments = await prismaClient.comment.findMany({
      where: { postId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true
          }
        },
        _count: {
          select: {
            likes: true,
            bookmarks: true,
            replies: true,
          },
        },

        likes: {
          where: { userId },
          select: { id: true }, // Check if user liked the post
        },
        bookmarks: {
          where: { userId },
          select: { id: true }, // Check if user bookmarked the post
        },
        replies: {
          where: { userId },
          select: { id: true }, // Check if user replied to the comment
        },
      }
    });

    return comments.map((comment) => ({
      ...comment,
      isLiked: comment.likes.length > 0,
      isBookmarked: comment.bookmarks.length > 0,
      repliesCount: comment._count.replies,
      likesCount: comment._count.likes,
      bookmarkCount: comment._count.bookmarks,
    }));
  }

  public async getPostBookmarks(id: string) {
    const bookmarks = await prismaClient.bookmark.findMany({
      where: { postId: id },
    });
    return bookmarks;
  }
}

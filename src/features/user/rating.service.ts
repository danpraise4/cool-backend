import prismaClient from "../../infastructure/database/postgreSQL/connect";
import AppException from "../../infastructure/https/exception/app.exception";
import httpStatus from "http-status";
import { Status } from "@prisma/client";

export type SubmitRatingInput = {
  reviewerId: string;
  targetUserId: string;
  rating: number;
  review?: string;
  contextType: "order" | "charity";
  contextId: string;
};

export function formatUserRating(user: {
  averageRating?: number | null;
  ratingCount?: number | null;
}) {
  const averageRating = Number((user.averageRating ?? 0).toFixed(1));
  return {
    rating: averageRating,
    averageRating,
    ratingCount: user.ratingCount ?? 0,
  };
}

export async function recomputeUserAverageRating(targetUserId: string) {
  const aggregate = await prismaClient.userRating.aggregate({
    where: { targetUserId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = Number((aggregate._avg.rating ?? 0).toFixed(1));
  const ratingCount = aggregate._count.rating;

  await prismaClient.user.update({
    where: { id: targetUserId },
    data: { averageRating, ratingCount },
  });

  return { averageRating, ratingCount };
}

export class RatingService {
  public async submitRating(input: SubmitRatingInput) {
    if (input.reviewerId === input.targetUserId) {
      throw new AppException("You cannot rate yourself", httpStatus.BAD_REQUEST);
    }

    await this.assertRatingContext(input);

    const existing = await prismaClient.userRating.findUnique({
      where: {
        reviewerId_contextType_contextId: {
          reviewerId: input.reviewerId,
          contextType: input.contextType,
          contextId: input.contextId,
        },
      },
    });

    if (existing) {
      throw new AppException(
        "You have already submitted a rating for this interaction",
        httpStatus.CONFLICT
      );
    }

    await prismaClient.userRating.create({
      data: {
        reviewerId: input.reviewerId,
        targetUserId: input.targetUserId,
        rating: input.rating,
        review: input.review,
        contextType: input.contextType,
        contextId: input.contextId,
      },
    });

    const { averageRating } = await recomputeUserAverageRating(input.targetUserId);

    return {
      rating: input.rating,
      averageRating,
    };
  }

  private async assertRatingContext(input: SubmitRatingInput) {
    if (input.contextType === "order") {
      const order = await prismaClient.order.findUnique({
        where: { id: input.contextId },
        include: {
          product: {
            select: { userId: true },
          },
        },
      });

      if (!order) {
        throw new AppException("Order not found", httpStatus.NOT_FOUND);
      }

      if (order.userId !== input.reviewerId) {
        throw new AppException(
          "Only the buyer can rate this order",
          httpStatus.FORBIDDEN
        );
      }

      if (order.status !== Status.COMPLETED) {
        throw new AppException(
          "Order must be completed before rating",
          httpStatus.BAD_REQUEST
        );
      }

      if (order.product.userId !== input.targetUserId) {
        throw new AppException("Invalid seller for this order", httpStatus.BAD_REQUEST);
      }

      return;
    }

    const charityRequest = await prismaClient.charityProductRequest.findFirst({
      where: {
        productId: input.contextId,
        userId: input.reviewerId,
        status: { in: [Status.PENDING, Status.APPROVED] },
      },
      include: {
        product: {
          select: { userId: true },
        },
      },
    });

    if (!charityRequest) {
      throw new AppException(
        "No charity request found for this product",
        httpStatus.BAD_REQUEST
      );
    }

    if (charityRequest.product.userId !== input.targetUserId) {
      throw new AppException("Invalid charity owner for this rating", httpStatus.BAD_REQUEST);
    }
  }
}

export const ratingService = new RatingService();

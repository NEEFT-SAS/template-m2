export class FeedNotFoundError extends Error {
  constructor(id: string) {
    super(`Post ${id} not found`);
    this.name = 'FeedNotFoundError';
  }
}

export class FeedForbiddenError extends Error {
  constructor(message = 'You do not have permission to perform this action') {
    super(message);
    this.name = 'FeedForbiddenError';
  }
}

export class FeedCommentNotFoundError extends Error {
  constructor(commentId: string) {
    super(`Comment ${commentId} not found`);
    this.name = 'FeedCommentNotFoundError';
  }
}

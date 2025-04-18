import { update, operations } from '@aws-appsync/utils/dynamodb';

export function request(ctx) {
  return {
    operation: 'UpdateItem',
    key: util.dynamodb.toMapValues({ id: ctx.args.postId}),
    update: {
      expression: 'ADD likes :plusOne',
      expressionValues: { ':plusOne': { N: 1 } },
    }
  }
}

export function response(ctx) {
  return ctx.result
}
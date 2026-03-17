import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement, Role, ServicePrincipal, ManagedPolicy } from 'aws-cdk-lib/aws-iam';
import { Aws } from 'aws-cdk-lib';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';
import { logSheetEntryFunction } from './functions/log-sheet-entry/resource.js';

const backend = defineBackend({
  auth,
  data,
  logSheetEntryFunction,
});

const { cfnIdentityPool } = backend.auth.resources.cfnResources;
cfnIdentityPool.allowUnauthenticatedIdentities = true;

backend.logSheetEntryFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ['ssm:GetParameter'],
    resources: [
      `arn:aws:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/amplify/shared/d2i0ep7cpx287/GOOGLE_SERVICE_ACCOUNT_KEY`,
    ],
  })
);

// Create SSR Compute Role for accessing Parameter Store and other AWS resources
const ssrComputeRole = new Role(backend.stack, 'SSRComputeRole', {
  assumedBy: new ServicePrincipal('amplify.amazonaws.com'),
  roleName: 'amplify-ssr-compute-role',
  description: 'IAM role for Amplify SSR compute to access AWS resources',
});

// Add permissions to access Parameter Store
ssrComputeRole.addToPrincipalPolicy(
  new PolicyStatement({
    actions: ['ssm:GetParameter', 'ssm:GetParameters'],
    resources: [
      `arn:aws:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/amplify/shared/*`,
      `arn:aws:ssm:${Aws.REGION}:${Aws.ACCOUNT_ID}:parameter/app/*`,
    ],
  })
);

// Export the role ARN for reference
backend.addOutput({
  custom: {
    ssrComputeRoleArn: ssrComputeRole.roleArn,
  },
});

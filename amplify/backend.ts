import { defineBackend } from '@aws-amplify/backend';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
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

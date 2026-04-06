import { defineBackend } from '@aws-amplify/backend';
import { Aws, Duration } from 'aws-cdk-lib';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  Architecture,
  DockerImageCode,
  DockerImageFunction,
  FunctionUrlAuthType,
  HttpMethod,
} from 'aws-cdk-lib/aws-lambda';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { auth } from './auth/resource.js';
import { data } from './data/resource.js';

const backend = defineBackend({
  auth,
  data,
});

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const { cfnIdentityPool } = backend.auth.resources.cfnResources;
cfnIdentityPool.allowUnauthenticatedIdentities = true;

// Create SSR Compute Role for accessing Parameter Store and other AWS resources
const ssrComputeRole = new Role(backend.stack, 'SSRComputeRole', {
  assumedBy: new ServicePrincipal('amplify.amazonaws.com'),
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

const youtubeToMidiFunction = new DockerImageFunction(backend.stack, 'YoutubeToMidiFunction', {
  code: DockerImageCode.fromImageAsset(path.join(backendDir, 'functions', 'youtubeToMidi')),
  architecture: Architecture.X86_64,
  memorySize: 3008,
  timeout: Duration.minutes(5),
  description: 'Converts YouTube audio into piano MIDI for the Synthesia Clone page.',
});

const youtubeToMidiFunctionUrl = youtubeToMidiFunction.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedMethods: [HttpMethod.POST],
    allowedHeaders: ['*'],
  },
});

backend.addOutput({
  custom: {
    ssrComputeRoleArn: ssrComputeRole.roleArn,
    youtubeToMidiFunctionUrl: youtubeToMidiFunctionUrl.url,
  },
});

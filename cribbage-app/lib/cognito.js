// lib/cognito.js
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";

const region = process.env.NEXT_PUBLIC_COGNITO_REGION;
const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

const poolData = {
  UserPoolId: userPoolId,
  ClientId: clientId
};

const userPool = new CognitoUserPool(poolData);

const cognitoClient = new CognitoIdentityProviderClient({
  region: region,
});

export { userPool, cognitoClient, region, userPoolId, clientId };

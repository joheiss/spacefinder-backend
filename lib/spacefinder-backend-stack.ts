import { CfnOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import {
    AuthorizationType,
    CognitoUserPoolsAuthorizer,
    LambdaIntegration,
    MethodOptions,
    RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Effect, FederatedPrincipal, PolicyStatement, Role } from "aws-cdk-lib/aws-iam";
import {
    CfnIdentityPool,
    CfnIdentityPoolRoleAttachment,
    CfnUserPoolGroup,
    UserPool,
    UserPoolClient,
} from "aws-cdk-lib/aws-cognito";

export class SpacefinderBackendStack extends Stack {
    private table: Table;
    private api = new RestApi(this, "SpaceFinderApi");
    private listFn: NodejsFunction;
    private createFn: NodejsFunction;
    private readFn: NodejsFunction;
    private updateFn: NodejsFunction;
    private deleteFn: NodejsFunction;
    private readonly userPool: UserPool;
    private readonly userPoolClient: UserPoolClient;
    private readonly identityPool: CfnIdentityPool;
    private readonly authorizer: CognitoUserPoolsAuthorizer;
    private readonly adminRole: Role;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // create DynamoDB Table
        this.table = this._createTable();

        // create Cognito User Pool and Authorizer
        this.userPool = this._createCognitoUserPool();
        this.userPoolClient = this._addUserPoolClient();
        this.identityPool = this._createIdentityPool();
        this._createAndAttachIdentityPoolRoles();
        this.adminRole = this._createAdminRole();
        this._createUserPoolGroups();

        this.authorizer = this._createAuthorizer();

        const methodOptions: MethodOptions = {
            authorizer: this.authorizer,
            authorizationType: AuthorizationType.COGNITO,
        };

        // create CRUD Lambda Functions
        const lambdaFn = this._createLambdaFunction();
        const helloResource = this.api.root.addResource("hello");
        helloResource.addMethod("GET", new LambdaIntegration(lambdaFn), methodOptions);

        // create CRUD Lambda Functions
        this._createCrudLambdaFunctions();

        // create API resources and add methods - /spaces & /spaces/{:id}
        const spacesResource = this.api.root.addResource("spaces");
        spacesResource.addMethod("GET", new LambdaIntegration(this.listFn));
        spacesResource.addMethod("POST", new LambdaIntegration(this.createFn));
        spacesResource.addMethod("PUT", new LambdaIntegration(this.updateFn));
        const spacesIdResource = spacesResource.addResource("{id}");
        spacesIdResource.addMethod("GET", new LambdaIntegration(this.readFn));
        spacesIdResource.addMethod("DELETE", new LambdaIntegration(this.deleteFn));
    }

    private _createCrudLambdaFunctions(): void {
        // list function
        this.listFn = new NodejsFunction(this, "listFn", {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, "../services/data-services", "list-spaces.ts"),
            handler: "handler",
        });
        this.table.grantReadData(this.listFn);

        // create function
        this.createFn = new NodejsFunction(this, "createFn", {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, "../services/data-services", "create-space.ts"),
            handler: "handler",
        });
        this.table.grantWriteData(this.createFn);

        // read function
        this.readFn = new NodejsFunction(this, "readFn", {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, "../services/data-services", "read-space.ts"),
            handler: "handler",
        });
        this.table.grantReadData(this.readFn);

        // update function
        this.updateFn = new NodejsFunction(this, "updateFn", {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, "../services/data-services", "update-space.ts"),
            handler: "handler",
        });
        this.table.grantReadWriteData(this.updateFn);

        // delete function
        this.deleteFn = new NodejsFunction(this, "deleteFn", {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, "../services/data-services", "delete-space.ts"),
            handler: "handler",
        });
        this.table.grantWriteData(this.deleteFn);
    }

    private _createTable(): Table {
        // create a DynamoDB table
        const table = new Table(this, "spaces", {
            tableName: "spaces",
            partitionKey: {
                name: "pk",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "sk",
                type: AttributeType.STRING,
            },
            readCapacity: 1,
            writeCapacity: 1,
        });

        // add a Global Secondary Index
        table.addGlobalSecondaryIndex({
            indexName: "gs1",
            partitionKey: {
                name: "gs1pk",
                type: AttributeType.STRING,
            },
            sortKey: {
                name: "gs1sk",
                type: AttributeType.STRING,
            },
            readCapacity: 1,
            writeCapacity: 1,
        });

        return table;
    }

    private _createLambdaFunction(): NodejsFunction {
        // create Lambda from NodeJsFunction
        const lambdaFn = new NodejsFunction(this, "HelloFn", {
            runtime: Runtime.NODEJS_14_X,
            entry: path.join(__dirname, "../services/node-lambda", "hello.ts"),
            handler: "handler",
        });

        // create policy to allow list access to S3
        const policy = new PolicyStatement({
            actions: ["s3:ListAllMyBuckets"],
            resources: ["*"],
        });

        // add role policy to Lambda Function
        lambdaFn.addToRolePolicy(policy);

        return lambdaFn;
    }

    private _createCognitoUserPool(): UserPool {
        const pool = new UserPool(this, "SpaceFinderUserPool", {
            userPoolName: "SpaceFinderUserPool",
            selfSignUpEnabled: false,
            passwordPolicy: {
                minLength: 8,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false,
                tempPasswordValidity: Duration.days(3),
            },
            signInAliases: {
                username: true,
                email: true,
            },
        });

        new CfnOutput(this, "UserPoolIdOutput", {
            value: pool.userPoolId,
        });

        return pool;
    }

    private _addUserPoolClient(): UserPoolClient {
        const poolClient = this.userPool.addClient("app-client", {
            userPoolClientName: "SpaceFinderUserPool-client",
            authFlows: {
                adminUserPassword: true,
                custom: true,
                userPassword: true,
                userSrp: true,
            },
            generateSecret: false,
        });

        new CfnOutput(this, "UserPoolClientIdOutput", {
            value: poolClient.userPoolClientId,
        });

        return poolClient;
    }

    private _createUserPoolGroups(): void {
        new CfnUserPoolGroup(this, "SpaceFinderUserPoolGroupAdmins", {
            groupName: "admins",
            userPoolId: this.userPool.userPoolId,
            precedence: 1,
            roleArn: this.adminRole.roleArn,
        });

        new CfnUserPoolGroup(this, "SpaceFinderUserPoolGroupEditors", {
            groupName: "editors",
            userPoolId: this.userPool.userPoolId,
            precedence: 2,
        });

        new CfnUserPoolGroup(this, "SpaceFinderUserPoolGroupViewers", {
            groupName: "viewers",
            userPoolId: this.userPool.userPoolId,
            precedence: 3,
        });
    }

    private _createIdentityPool(): CfnIdentityPool {
        const idPool = new CfnIdentityPool(this, "SpaceFinderIdentityPool", {
            allowUnauthenticatedIdentities: true,
            cognitoIdentityProviders: [
                {
                    clientId: this.userPoolClient.userPoolClientId,
                    providerName: this.userPool.userPoolProviderName,
                },
            ],
        });

        new CfnOutput(this, "UserIdentityPoolIdOutput", {
            value: idPool.ref,
        });

        return idPool;
    }

    private _createAndAttachIdentityPoolRoles(): void {
        // authenticated role
        const authenticatedRole = new Role(this, "IdentityPoolAuthenticatedRole", {
            assumedBy: new FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated",
                    },
                },
                "sts:AssumeRoleWithWebIdentity"
            ),
        });

        // unauthenticated role
        const unAuthenticatedRole = new Role(this, "IdentityPoolUnAuthenticatedRole", {
            assumedBy: new FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "unauthenticated",
                    },
                },
                "sts:AssumeRoleWithWebIdentity"
            ),
        });

        // attach roles to identity pool
        new CfnIdentityPoolRoleAttachment(this, "IdentityPoolRolesAttachment", {
            identityPoolId: this.identityPool.ref,
            roles: {
                authenticated: authenticatedRole.roleArn,
                unauthenticated: unAuthenticatedRole.roleArn,
            },
            roleMappings: {
                adminsMapping: {
                    type: "Token",
                    ambiguousRoleResolution: "AuthenticatedRole",
                    identityProvider: `${this.userPool.userPoolProviderName}:${this.userPoolClient.userPoolClientId}`,
                },
            },
        });
    }

    private _createAdminRole(): Role {
        // admin role
        const adminRole = new Role(this, "IdentityPoolAdmindRole", {
            assumedBy: new FederatedPrincipal(
                "cognito-identity.amazonaws.com",
                {
                    StringEquals: {
                        "cognito-identity.amazonaws.com:aud": this.identityPool.ref,
                    },
                    "ForAnyValue:StringLike": {
                        "cognito-identity.amazonaws.com:amr": "authenticated",
                    },
                },
                "sts:AssumeRoleWithWebIdentity"
            ),
        });

        adminRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: ["s3:ListAllMyBuckets"],
                resources: ["*"],
            })
        );

        return adminRole;
    }

    private _createAuthorizer(): CognitoUserPoolsAuthorizer {
        const authorizer = new CognitoUserPoolsAuthorizer(this, "SpaceFinderUserPoolAuth", {
            cognitoUserPools: [this.userPool],
            authorizerName: "SpaceFinderUserAuthorizer",
            identitySource: "method.request.header.Authorization",
        });
        // authorizer._attachToApi(this.api);

        return authorizer;
    }
}

import { Stack, StackProps } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

export class SpacefinderBackendStack extends Stack {
    private table: Table;
    private api = new RestApi(this, "SpaceFinderApi");
    private listFn: NodejsFunction;
    private createFn: NodejsFunction;
    private readFn: NodejsFunction;
    private updateFn: NodejsFunction;
    private deleteFn: NodejsFunction;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // create DynamoDB Table
        this.table = this._createTable();

        // create CRUD Lambda Functions
        const lambdaFn = this._createLambdaFunction();
        const helloResource = this.api.root.addResource("hello");
        helloResource.addMethod("GET", new LambdaIntegration(lambdaFn));

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
}

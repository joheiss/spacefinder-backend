import { Stack, StackProps } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as path from "path";
import { LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, Table } from "aws-cdk-lib/aws-dynamodb";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

export class SpacefinderBackendStack extends Stack {
  // static initializer
  private api = new RestApi(this, "SpaceFinderApi");

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // create Lambda from NodeJsFunction
    const helloFn = new NodejsFunction(this, "HelloFn", {
      runtime: Runtime.NODEJS_14_X,
      entry: path.join(__dirname, "../services/node-lambda", "hello.ts"),
      handler: "handler",
    });

    // const helloFn = new Function(this, "HelloFn", {
    //   runtime: Runtime.NODEJS_14_X,
    //   code: Code.fromAsset(path.join(__dirname, "../services/hello")),
    //   handler: "hello.main",
    // });

    // integrate API and Lambda
    const helloLambdaIntegration = new LambdaIntegration(helloFn);
    const helloLambdaResource = this.api.root.addResource("hello");
    helloLambdaResource.addMethod("GET", helloLambdaIntegration);

    // create DynamoDB Table
    const table = this._createTable();
  }

  private _createTable(): Table {
    return new Table(this, "spaces", {
      tableName: "spaces",
      partitionKey: {
        name: "PK",
        type: AttributeType.STRING,
      },
      sortKey: {
        name: "SK",
        type: AttributeType.STRING,
      },
      readCapacity: 1,
      writeCapacity: 1,
    });
  }
}

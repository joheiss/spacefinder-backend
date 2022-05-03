import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { SpacefinderBackendStack } from "../lib/spacefinder-backend-stack";

describe("SpaceFinder Backend is running as expected", () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new SpacefinderBackendStack(app, "TestStack");
  });

  test("SpaceFinder Backend contains all necessary resources", () => {
    Template.fromStack(stack).hasResource("AWS::ApiGateway::RestApi", {});
    Template.fromStack(stack).hasResource("AWS::Lambda::Function", {});
    Template.fromStack(stack).hasResource("AWS::DynamoDB::Table", {});
  });
});

#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { SpacefinderBackendStack } from '../lib/spacefinder-backend-stack';

const app = new App();
new SpacefinderBackendStack(app, 'SpacefinderBackendStack', {});
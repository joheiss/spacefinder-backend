import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { Entity, Table } from "dynamodb-onetable";
import Dynamo from "dynamodb-onetable/Dynamo";

const Match = {
    ulid: /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/,
    email: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    // name:   /^[a-z0-9 ,.'-]+$/i,
    name: /^[a-zA-Z0-9äöüÄÖÜß ,.'-]+$/,
    address: /[a-z0-9 ,.-]+$/,
    zip: /^\d{5}(?:[-\s]\d{4})?$/,
    phone: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/,
};
const client = new Dynamo({ client: new DynamoDBClient({}) });

const schema = {
    indexes: {
        primary: { hash: "pk", sort: "sk" },
        gs1: { hash: "gs1pk", sort: "gs1sk", project: ["gs1pk", "gs1sk"] },
    },
    models: {
        space: {
            pk: { type: String, value: "space:${id}" },
            sk: { type: String, value: "space:" },
            id: { type: String, generate: "ulid", validate: Match.ulid },
            name: { type: String, required: true, unique: true, validate: Match.name },
            location: { type: String, required: true },
            photoUrl: { type: String, required: false },
            date: { type: String, required: false },
            //  Search by location name or by type
            gs1pk: { type: String, value: "space:" },
            gs1sk: { type: String, value: "space:${location}:${id}" },
        },
    },
    version: "0.1.0",
    format: "onetable:1.1.0",
} as const;

export type SpaceType = Entity<typeof schema.models.space>;

const table = new Table({
    client,
    name: "spaces",
    schema,
    timestamps: false,
});

export const Space = table.getModel<SpaceType>("space");

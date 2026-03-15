"use client";

import { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import config from "../../amplify_outputs.json";

Amplify.configure(config);

export const ampClient = generateClient<Schema>()

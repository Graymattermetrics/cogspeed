/**
 * Tests the practice test mode
 */

import { describe, it, jest } from "@jest/globals";
import axios from "axios";
import { Config } from "../src/types/Config";

jest.useFakeTimers();
jest.spyOn(global, "setTimeout");


let config: Config;
beforeAll(async () => {
  const response = await axios.get("https://t6pedjjwcb.execute-api.us-east-2.amazonaws.com/default/getCogspeedConfig");
  config = response.data;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("Test practice test mode", () => {
    it("should use the config variable", () => {
        // Use the config variable in your test assertions
        expect(config).toBeDefined();
        expect(config.error).toEqual(false);
    });
})
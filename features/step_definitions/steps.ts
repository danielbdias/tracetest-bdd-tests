import * as assert from "assert";

import Tracetest from "@tracetest/client";
import { TestResource } from "@tracetest/client/dist/modules/openapi-client";
import { Given, When, Then } from "@cucumber/cucumber";
import { callAPI } from "../../src";

const { TRACETEST_API_TOKEN = '' } = process.env;

interface TestContext {
    walletId: number;
    customerYears: number;
    orderStatus: string;
    boudariesResult: string;
}

Given("I have the walletId {int}", function (this: TestContext, walletId: number) {
    this.walletId = walletId;
});

Given('I am a customer for {int} year\\(s)', function (this: TestContext, customerYears: number) {
    this.customerYears = customerYears;
});

When("I enter a payment order into our system", async function (this: TestContext) {
    const apiPayload = {
        walletId: this.walletId,
        yearsAsACustomer: this.customerYears
    }

    const status = await callAPI('http://localhost:10013/executePaymentOrder', apiPayload);
    this.orderStatus = status;
});

Then("the order should be executed", function (this: TestContext) {
    assert.equal(this.orderStatus, "executed");
});

Then("all system boundaries should be respected", {timeout: 60 * 1000}, async function (this: TestContext) {
    const tracetestClient = await Tracetest({ apiToken: TRACETEST_API_TOKEN });

    const definition: TestResource = {
        type: 'Test',
        spec: {
            id: 'ouhSlFj',
            name: 'Gateway API call with success',
            description: 'Test call that will work, showing the internal calls made on the Payment System',
            trigger: {
                type: 'http',
                httpRequest: {
                    method: 'POST',
                    url: 'http://gateway-api:10013/executePaymentOrder',
                    body: JSON.stringify({
                        walletId: this.walletId,
                        yearsAsACustomer: this.customerYears
                    }),
                    headers: [
                        { key: 'Content-Type', value: 'application/json' }
                    ],
                    auth: {
                        type: 'basic',
                        basic: {
                            username: 'admin',
                            password: 'supersecret'
                        }
                    }
                },
            },
            specs: [
                {
                    name: "Gateway-API is OK",
                    selector: 'span[name="POST /executePaymentOrder" http.target="/executePaymentOrder" http.method="POST"]',
                    assertions: ["attr:http.status_code = 200"],
                },
                {
                    name: "Payment-Executor is OK",
                    selector: 'span[tracetest.span.type="http" name="POST" http.target="/payment/execute" http.method="POST"]',
                    assertions: ["attr:http.status_code = 200"],
                },
                {
                    name: "Risk-Analysis API calculation is returning OK",
                    selector: 'span[name="POST /computeRisk" http.target="/computeRisk" http.method="POST"]',
                    assertions: ["attr:http.status_code = 200"],
                },
            ]
        }
    }

    const test = await tracetestClient.newTest(definition);
    const run = await tracetestClient.runTest(test);
    await tracetestClient.wait();

    this.boudariesResult = await tracetestClient.getSummary();

    console.log()
    console.log('Boundaries result:');
    console.log(this.boudariesResult);
    console.log()
});
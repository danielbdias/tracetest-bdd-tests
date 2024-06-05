Feature: You want to enter a payment order into a Payment Ecosystem

    Scenario: Adding a payment order to the system
        Given I have the walletId 4
        And I am a customer for 1 year(s)
        When I enter a payment order into our system
        Then the order should be executed
        And all system boundaries should be respected
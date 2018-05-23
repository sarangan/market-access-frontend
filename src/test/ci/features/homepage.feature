Feature: Market Access Homepage
	Everyone has to start somewhere

	Scenario: Default homepage
		Given I'm on the homepage
		Then the title should be Market Access - Homepage
		And the page should not have any accessibility violations
		And there should be a link to report a barrier
		And the active heading link should be Dashboard
		And the main heading should be Market access barriers Dashboard
		And the footer links should be present

	Scenario: Navigate to Report a barrier
		Given I'm on the homepage
		When I navigate to the report a barrier page
		Then the title should be Market Access - Report a barrier

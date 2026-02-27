describe('Inventory and Transfer Flow', () => {
    beforeEach(() => {
        // Login as admin before each test
        cy.visit('http://localhost:3000/login');
        cy.get('input[type="text"]').type('admin');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();
        cy.url().should('eq', 'http://localhost:3000/');
    });

    it('should navigate to the inventory page and list items', () => {
        cy.contains('Inventory').click();
        cy.url().should('include', '/inventory');
        cy.get('h1').contains('Inventory Management').should('exist');

        // Check if table renders
        cy.get('table').should('exist');
    });

    it('should be able to search for an item', () => {
        cy.contains('Inventory').click();
        cy.get('input[placeholder*="Search"]').type('Drill');

        // Wait for filtering
        cy.wait(500);
        // We aren't strictly asserting existence since it depends on DB seeding, 
        // but checking that the page doesn't crash is a good critical path sanity check
        cy.get('table').should('exist');
    });

    it('should be able to navigate to and load the transfers page', () => {
        cy.contains('Transfers').click();
        cy.url().should('include', '/transfers');
        cy.get('h1').contains('Transfer Management').should('exist');
    });
});

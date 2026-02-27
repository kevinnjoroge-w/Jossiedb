describe('Authentication Flow', () => {
    beforeEach(() => {
        // Assuming app runs on 3000 locally via Vite/React defaults
        cy.visit('http://localhost:3000/login');
    });

    it('successfully loads the login page', () => {
        cy.get('h1').contains(/Jossie/i).should('exist');
    });

    it('displays error on invalid credentials', () => {
        cy.get('input[type="text"]').type('invaliduser');
        cy.get('input[type="password"]').type('wrongpassword');
        cy.get('button[type="submit"]').click();

        // Check for toast error message
        cy.contains('Invalid credentials').should('exist');
    });

    it('successfully logs in an admin and redirects to dashboard', () => {
        // Note: This assumes an 'admin' user exists with 'password123'
        // In a real E2E environment, you'd seed the DB first
        cy.get('input[type="text"]').type('admin');
        cy.get('input[type="password"]').type('password123');
        cy.get('button[type="submit"]').click();

        cy.url().should('include', '/');
        cy.contains('Dashboard').should('exist');

        // Check if token is set
        cy.window().its('localStorage').invoke('getItem', 'token').should('exist');
    });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Home from '../app/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Home Page', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        mockPush.mockClear();
        (global.fetch as jest.Mock).mockClear();
    });

    test('renders main elements', () => {
        render(<Home />);
        
        expect(screen.getByText('Connect to Connect')).toBeInTheDocument();
        expect(screen.getByText('Create New Room')).toBeInTheDocument();
        expect(screen.getByText('Join Existing Room')).toBeInTheDocument();
    });

    test('shows create room form when create button clicked', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, roomId: 'ABC123' })
        });

        render(<Home />);
        
        const createButton = screen.getByText('Create New Room');
        fireEvent.click(createButton);
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        });
    });

    test('creates room with valid inputs', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, roomId: 'ABC123' })
        });

        render(<Home />);
        
        const createButton = screen.getByText('Create New Room');
        fireEvent.click(createButton);
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
        });

        const nameInput = screen.getByPlaceholderText('Enter your name');
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const submitButton = screen.getByText('Create Room');
        
        fireEvent.change(nameInput, { target: { value: 'TestUser' } });
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.click(submitButton);
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/create-room'),
                expect.objectContaining({
                    method: 'POST',
                    body: expect.stringContaining('TestUser')
                })
            );
        });
    });

    test('prevents form submission with empty fields', async () => {
        render(<Home />);
        
        const createButton = screen.getByText('Create New Room');
        fireEvent.click(createButton);
        
        await waitFor(() => {
            expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
        });

        const submitButton = screen.getByText('Create Room');
        expect(submitButton).toBeDisabled();
    });

    test('navigates to join page when join button clicked', () => {
        render(<Home />);
        
        const joinLink = screen.getByText('Join Existing Room').closest('a');
        expect(joinLink).toHaveAttribute('href', '/join');
    });
});
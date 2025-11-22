import { render, screen, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import Home from '../app/page';

// Mock Next.js router
jest.mock('next/navigation', () => ({
    useRouter: jest.fn(),
}));

describe('Home Page', () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        (useRouter as jest.Mock).mockReturnValue({
            push: mockPush,
        });
        mockPush.mockClear();
    });

    test('renders main elements', () => {
        render(<Home />);
        
        expect(screen.getByText('Connect to Connect')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter room ID')).toBeInTheDocument();
        expect(screen.getByText('Join Room')).toBeInTheDocument();
    });

    test('generates random room ID when create button clicked', () => {
        render(<Home />);
        
        const createButton = screen.getByTitle('Generate Random Room ID');
        const roomInput = screen.getByPlaceholderText('Enter room ID') as HTMLInputElement;
        
        fireEvent.click(createButton);
        
        expect(roomInput.value).toHaveLength(6);
        expect(roomInput.value).toMatch(/^[a-z0-9]+$/);
    });

    test('prevents form submission with empty fields', () => {
        render(<Home />);
        
        const joinButton = screen.getByText('Join Room');
        fireEvent.click(joinButton);
        
        expect(mockPush).not.toHaveBeenCalled();
    });

    test('navigates to room with valid inputs', () => {
        render(<Home />);
        
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const roomInput = screen.getByPlaceholderText('Enter room ID');
        const joinButton = screen.getByText('Join Room');
        
        fireEvent.change(nameInput, { target: { value: 'TestUser' } });
        fireEvent.change(roomInput, { target: { value: 'room123' } });
        fireEvent.click(joinButton);
        
        expect(mockPush).toHaveBeenCalledWith('/room/room123?name=TestUser');
    });

    test('handles special characters in display name', () => {
        render(<Home />);
        
        const nameInput = screen.getByPlaceholderText('Enter your name');
        const roomInput = screen.getByPlaceholderText('Enter room ID');
        const joinButton = screen.getByText('Join Room');
        
        fireEvent.change(nameInput, { target: { value: 'Test User @#$' } });
        fireEvent.change(roomInput, { target: { value: 'room123' } });
        fireEvent.click(joinButton);
        
        expect(mockPush).toHaveBeenCalledWith('/room/room123?name=Test%20User%20%40%23%24');
    });
});
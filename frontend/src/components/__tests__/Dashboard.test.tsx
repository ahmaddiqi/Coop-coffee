import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Dashboard from '../Dashboard'

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  Navigate: ({ to }: { to: string }) => <div>Navigate to {to}</div>,
  Link: ({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) => (
    <a href={to} className={className}>{children}</a>
  ),
}))

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('Dashboard Component', () => {
  it('should render welcome message', () => {
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      username: 'testuser',
      role: 'admin'
    }))
    
    render(<Dashboard />)
    
    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })

  it('should render with null user data', () => {
    mockLocalStorage.getItem.mockReturnValue(null)
    
    render(<Dashboard />)
    
    expect(screen.getByText(/welcome to the dashboard/i)).toBeInTheDocument()
    expect(screen.getByText(/you have successfully logged in as/i)).toBeInTheDocument()
  })
})
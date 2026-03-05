import { useState, useCallback } from 'react';
import { WelcomeAnimation } from '@/components/WelcomeAnimation';

function Dashboard() {
  const params = new URLSearchParams(window.location.search);
  const isWelcome = params.get('welcome') === 'true';
  const welcomeName = params.get('name') || 'there';

  const [showWelcome, setShowWelcome] = useState(isWelcome);

  const handleWelcomeComplete = useCallback(() => {
    setShowWelcome(false);
    window.history.replaceState({}, '', '/dashboard');
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '32px' }}>
      {showWelcome && (
        <WelcomeAnimation
          userName={decodeURIComponent(welcomeName)}
          onComplete={handleWelcomeComplete}
        />
      )}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>Dashboard</h1>
            <p style={{ color: '#666', marginTop: '8px', margin: 0 }}>Welcome back to Sonata Finance</p>
          </div>
          <button 
            onClick={() => window.location.href = '/login'}
            style={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb', 
              padding: '10px 20px', 
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Sign out
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          {/* Total Portfolio */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px', margin: 0 }}>Total Portfolio</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>$5,247,892.00</div>
            <div style={{ fontSize: '14px', color: '#10b981', marginTop: '8px', fontWeight: '500' }}>+2.34% this month</div>
          </div>

          {/* Investments */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px', margin: 0 }}>Active Investments</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>23</div>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>Across 8 asset classes</div>
          </div>

          {/* Monthly Budget */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginBottom: '12px', margin: 0 }}>Monthly Budget</h3>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#1a1a1a', margin: 0 }}>$12,450.00</div>
            <div style={{ fontSize: '14px', color: '#ef4444', marginTop: '8px', fontWeight: '500' }}>73% used this month</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <button style={{ 
              backgroundColor: '#1a1a1a', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              📈 Add Investment
            </button>
            <button style={{ 
              backgroundColor: 'white', 
              color: '#374151', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              💰 Update Budget
            </button>
            <button style={{ 
              backgroundColor: 'white', 
              color: '#374151', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              📊 View Reports
            </button>
            <button style={{ 
              backgroundColor: 'white', 
              color: '#374151', 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: '1px solid #e5e7eb', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              💬 Chat with Sidekick
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f3f4f6' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a1a', marginBottom: '16px', margin: '0 0 16px 0' }}>Recent Activity</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>AAPL Stock Purchase</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Today, 2:30 PM</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#ef4444' }}>-$2,840.00</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Dividend Payment - MSFT</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>Yesterday, 9:15 AM</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>+$142.50</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a1a1a' }}>Monthly Budget Update</div>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>2 days ago</div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Updated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

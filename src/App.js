import React, { useState, useEffect, useCallback } from 'react';
import { getAccount, getTrades, getPositions, getMarketData, getMarketStatus, getQuote, executeTrade } from './api';
import { TrendingUp, TrendingDown, DollarSign, Activity, RefreshCw, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './App.css';

// ============================================
// Utility Functions
// ============================================

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const formatNumber = (value, decimals = 2) => {
  return parseFloat(value).toFixed(decimals);
};

// ============================================
// Components
// ============================================

const StatusBadge = ({ isOpen }) => (
  <span style={{
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
    backgroundColor: isOpen ? '#064e3b' : '#450a0a',
    color: isOpen ? '#34d399' : '#f87171',
    border: `1px solid ${isOpen ? '#34d399' : '#f87171'}`,
  }}>
    {isOpen ? '● MARKET OPEN' : '● MARKET CLOSED'}
  </span>
);

const Card = ({ title, children, style }) => (
  <div style={{
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '8px',
    padding: '20px',
    ...style
  }}>
    {title && (
      <h3 style={{
        margin: '0 0 16px 0',
        fontSize: '12px',
        fontWeight: '600',
        letterSpacing: '0.1em',
        color: '#6b7280',
        textTransform: 'uppercase',
      }}>
        {title}
      </h3>
    )}
    {children}
  </div>
);

const MetricCard = ({ label, value, subvalue, color }) => (
  <Card>
    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '24px', fontWeight: 'bold', color: color || '#f9fafb' }}>{value}</div>
    {subvalue && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{subvalue}</div>}
  </Card>
);

const TradeForm = ({ onTradeExecuted }) => {
  const [form, setForm] = useState({
    symbol: '',
    direction: 'BUY',
    quantity: '1',
    price: '',
  });
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const fetchQuote = async () => {
    if (!form.symbol) return;
    try {
      const res = await getQuote(form.symbol.toUpperCase());
      setQuote(res.data);
      setForm(f => ({ ...f, price: formatNumber(res.data.price || res.data.ask, 4) }));
      setError(null);
    } catch (e) {
      setError(`No quote found for ${form.symbol}`);
      setQuote(null);
    }
  };

  const handleSubmit = async () => {
    if (!form.symbol || !form.price || !form.quantity) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await executeTrade({
        symbol: form.symbol.toUpperCase(),
        direction: form.direction,
        quantity: parseFloat(form.quantity),
        price: parseFloat(form.price),
        asset_type: 'STOCK',
      });
      setSuccess(`${form.direction} ${form.quantity} ${form.symbol.toUpperCase()} @ $${form.price} executed!`);
      setForm({ symbol: '', direction: 'BUY', quantity: '1', price: '' });
      setQuote(null);
      onTradeExecuted();
    } catch (e) {
      setError(e.response?.data?.error || 'Trade execution failed');
    }
    setLoading(false);
  };

  const total = form.quantity && form.price
    ? formatCurrency(parseFloat(form.quantity) * parseFloat(form.price))
    : '$0.00';

  const inputStyle = {
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '6px',
    color: '#f9fafb',
    padding: '10px 12px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
  };

  return (
    <Card title="Execute Trade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Symbol</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={inputStyle}
              value={form.symbol}
              onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))}
              placeholder="AAPL"
              onKeyDown={e => e.key === 'Enter' && fetchQuote()}
            />
            <button
              onClick={fetchQuote}
              style={{ ...buttonStyle, backgroundColor: '#1f2937', color: '#9ca3af', border: '1px solid #374151', whiteSpace: 'nowrap' }}
            >
              Get Quote
            </button>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Direction</label>
          <select
            style={inputStyle}
            value={form.direction}
            onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}
          >
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Quantity</label>
          <input
            style={inputStyle}
            type="number"
            value={form.quantity}
            onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
            min="1"
          />
        </div>

        <div>
          <label style={{ fontSize: '12px', color: '#6b7280', display: 'block', marginBottom: '6px' }}>Price</label>
          <input
            style={inputStyle}
            type="number"
            value={form.price}
            onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      {quote && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#1f2937', borderRadius: '6px', fontSize: '13px', color: '#9ca3af' }}>
          Bid: <span style={{ color: '#f87171' }}>${formatNumber(quote.bid, 4)}</span>
          {' · '}
          Ask: <span style={{ color: '#34d399' }}>${formatNumber(quote.ask, 4)}</span>
          {' · '}
          Mid: <span style={{ color: '#f9fafb', fontWeight: 'bold' }}>${formatNumber(quote.price, 4)}</span>
        </div>
      )}

      <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Total: <span style={{ color: '#f9fafb', fontWeight: 'bold', fontSize: '18px' }}>{total}</span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...buttonStyle,
            backgroundColor: form.direction === 'BUY' ? '#065f46' : '#7f1d1d',
            color: form.direction === 'BUY' ? '#34d399' : '#f87171',
            border: `1px solid ${form.direction === 'BUY' ? '#34d399' : '#f87171'}`,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Executing...' : `${form.direction} ${form.symbol || 'Stock'}`}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#450a0a', borderRadius: '6px', color: '#f87171', fontSize: '13px' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#064e3b', borderRadius: '6px', color: '#34d399', fontSize: '13px' }}>
          ✅ {success}
        </div>
      )}
    </Card>
  );
};

// ============================================
// Main App
// ============================================

export default function App() {
  const [account, setAccount] = useState(null);
  const [trades, setTrades] = useState([]);
  const [positions, setPositions] = useState([]);
  const [marketData, setMarketData] = useState([]);
  const [marketStatus, setMarketStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [accountRes, tradesRes, positionsRes, marketRes, statusRes] = await Promise.all([
        getAccount(),
        getTrades(),
        getPositions(),
        getMarketData(),
        getMarketStatus(),
      ]);
      setAccount(accountRes.data);
      setTrades(tradesRes.data);
      setPositions(positionsRes.data);
      setMarketData(marketRes.data);
      setMarketStatus(statusRes.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Failed to fetch data:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  if (loading) {
    return (
      <div style={{ backgroundColor: '#030712', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399', fontFamily: 'monospace' }}>
        Loading Trading Simulator...
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#030712', minHeight: '100vh', color: '#f9fafb', fontFamily: "'Inter', -apple-system, sans-serif", padding: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#34d399' }}>
            📈 Trading Simulator
          </h1>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Last updated: {lastUpdated}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {marketStatus && <StatusBadge isOpen={marketStatus.is_open} />}
          <button
            onClick={fetchAll}
            style={{ background: 'none', border: '1px solid #374151', borderRadius: '6px', color: '#6b7280', padding: '6px 10px', cursor: 'pointer' }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Account Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <MetricCard
          label="Cash Balance"
          value={account ? formatCurrency(account.cash_balance) : '-'}
          subvalue="Total account value"
          color="#f9fafb"
        />
        <MetricCard
          label="Available to Trade"
          value={account ? formatCurrency(account.available_to_trade) : '-'}
          subvalue="Settled cash"
          color="#34d399"
        />
        <MetricCard
          label="Unsettled Cash"
          value={account ? formatCurrency(account.unsettled_cash) : '-'}
          subvalue="Pending T+1 settlement"
          color="#fbbf24"
        />
        <MetricCard
          label="Open Positions"
          value={positions.length}
          subvalue={`${trades.length} total trades`}
          color="#60a5fa"
        />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        {/* Market Data */}
        <Card title="Market Data">
          {marketData.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '14px' }}>No watched symbols configured</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Symbol</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Price</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {marketData.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #111827' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold', color: '#60a5fa' }}>{item.symbol}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px' }}>
                      {item.latest_price ? formatCurrency(item.latest_price) : '—'}
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', color: item.is_active ? '#34d399' : '#6b7280' }}>
                        {item.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* Open Positions */}
        <Card title="Open Positions">
          {positions.length === 0 ? (
            <div style={{ color: '#6b7280', fontSize: '14px' }}>No open positions</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1f2937' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Symbol</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Qty</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Avg Cost</th>
                  <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Cost Basis</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => (
                  <tr key={pos.id} style={{ borderBottom: '1px solid #111827' }}>
                    <td style={{ padding: '10px 0', fontWeight: 'bold', color: '#60a5fa' }}>{pos.symbol}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace' }}>{pos.quantity}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(pos.avg_cost)}</td>
                    <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(pos.cost_basis)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Trade Form */}
      <div style={{ marginBottom: '16px' }}>
        <TradeForm onTradeExecuted={fetchAll} />
      </div>

      {/* Recent Trades */}
      <Card title="Recent Trades">
        {trades.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>No trades yet</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Symbol</th>
                <th style={{ textAlign: 'left', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Direction</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Qty</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Price</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Total</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ textAlign: 'right', padding: '8px 0', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {trades.map(trade => (
                <tr key={trade.id} style={{ borderBottom: '1px solid #111827' }}>
                  <td style={{ padding: '10px 0', fontWeight: 'bold', color: '#60a5fa' }}>{trade.symbol}</td>
                  <td style={{ padding: '10px 0' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      backgroundColor: trade.direction === 'BUY' ? '#064e3b' : '#450a0a',
                      color: trade.direction === 'BUY' ? '#34d399' : '#f87171',
                    }}>
                      {trade.direction}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace' }}>{trade.quantity}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(trade.price)}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(trade.total_value)}</td>
                  <td style={{ padding: '10px 0', textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: trade.settled ? '#34d399' : '#fbbf24' }}>
                      {trade.settled ? '✓ Settled' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 0', textAlign: 'right', fontSize: '12px', color: '#6b7280' }}>
                    {new Date(trade.executed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

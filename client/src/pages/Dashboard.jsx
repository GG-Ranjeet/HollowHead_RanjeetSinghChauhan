import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, DollarSign, Calendar, TrendingUp, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { AreaChart, Area, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const chartData = [
  { name: 'Jan', revenue: 40000, tickets: 240 },
  { name: 'Feb', revenue: 30000, tickets: 139 },
  { name: 'Mar', revenue: 90000, tickets: 980 },
  { name: 'Apr', revenue: 120000, tickets: 1908 },
  { name: 'May', revenue: 180000, tickets: 1800 },
  { name: 'Jun', revenue: 230000, tickets: 2800 },
  { name: 'Jul', revenue: 340000, tickets: 3300 },
];

const goalsData = [
  { metric: 'Revenue', achieved: 62, remaining: 38, current: '₹1.24L', target: '₹2L', numericValue: 124000, prefix: '₹', suffix: '', format: (v) => v >= 100000 ? `₹${(v/100000).toFixed(2)}L` : `₹${(v/1000).toFixed(0)}k` },
  { metric: 'Tickets', achieved: 69, remaining: 31, current: '3,450', target: '5,000', numericValue: 3450, prefix: '', suffix: '', format: (v) => v.toLocaleString() },
  { metric: 'Events', achieved: 40, remaining: 60, current: '4', target: '10', numericValue: 4, prefix: '', suffix: '', format: (v) => Math.round(v).toString() },
  { metric: 'Views', achieved: 62.5, remaining: 37.5, current: '12.5k', target: '20k', numericValue: 12500, prefix: '', suffix: '', format: (v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : Math.round(v).toString() },
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899']; // Indigo, Green, Amber, Pink
const REMAINING_COLORS = ['#e0e7ff', '#d1fae5', '#fef3c7', '#fce7f3']; // Lighter matching shades for remaining

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [organizerEvents, setOrganizerEvents] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [animProgress, setAnimProgress] = useState(0); // 0 to 1
  const animRef = useRef(null);

  useEffect(() => {
    const startTime = performance.now();
    const delay = 100;
    const duration = 1800;

    const animate = (now) => {
      const elapsed = now - startTime - delay;
      if (elapsed < 0) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimProgress(eased);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const fetchEvents = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const response = await fetch('http://localhost:5000/api/events/organizer/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.events) {
        // Format events for the table
        const hostedEvents = data.events
          .map(event => ({
            id: event.id,
            title: event.title,
            date: new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            totalSpots: event.totalCapacity || 0,
            spotsLeft: (event.totalCapacity || 0) - (event.ticketsSold || 0),
            status: event.status || 'published'
          }));
        
        setOrganizerEvents(hostedEvents);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchEvents();
    }
  }, [currentUser]);

  const handleDeleteEvent = async (id) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/events/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchEvents(); // Refresh list
        } else {
          alert("Failed to delete event.");
        }
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleOfflineSale = async (id) => {
    const input = window.prompt("Enter the number of offline tickets sold:");
    if (input !== null && input.trim() !== '') {
      const amount = parseInt(input, 10);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive number.");
        return;
      }
      try {
        const token = await auth.currentUser.getIdToken();
        const response = await fetch(`http://localhost:5000/api/events/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ offlineTicketsSold: amount })
        });
        if (response.ok) {
          fetchEvents(); // Refresh list to see updated spots
        } else {
          alert("Failed to update offline sales.");
        }
      } catch (error) {
         console.error("Error updating offline sales:", error);
      }
    }
  };

  // Animated data — bars grow because the values change
  const animatedGoalsData = goalsData.map((item) => ({
    ...item,
    achieved: item.achieved * animProgress,
  }));
  
  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Organizer Dashboard</h1>
        <Link to="/organizer/create" className="btn btn-primary">Create Event +</Link>
      </div>

      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        {[
          { label: 'Total Revenue', value: '₹1,24,000', icon: DollarSign, color: 'var(--primary-color)' },
          { label: 'Tickets Sold', value: '3,450', icon: Ticket, color: 'var(--success-color)' },
          { label: 'Upcoming Events', value: '4', icon: Calendar, color: 'var(--warning-color)' },
          { label: 'Profile Views', value: '12.5k', icon: TrendingUp, color: 'var(--text-main)' },
        ].map((stat, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-full)', display: 'flex' }}>
               <stat.icon color={stat.color} size={24} />
            </div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{stat.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        
        {/* Metrics Progress Chart */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid #334155', minWidth: 0 }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#f1f5f9' }}>Metrics Progress</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={animatedGoalsData} margin={{ top: 30, right: 30, left: 0, bottom: 10 }} barSize={50}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="metric" stroke="#94a3b8" fontSize={13} tickLine={false} axisLine={false} dy={10} fontWeight={500} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                <Bar 
                  dataKey="achieved" 
                  name="Achieved" 
                  fill="var(--primary-color)" 
                  radius={[8, 8, 8, 8]}
                  isAnimationActive={false}
                  label={({ x, y, width, value, index }) => {
                    const item = goalsData[index];
                    const animatedValue = item.numericValue * animProgress;
                    return (
                      <text 
                        x={x + width / 2} 
                        y={y - 10} 
                        fill={COLORS[index % COLORS.length]} 
                        textAnchor="middle" 
                        fontSize={14} 
                        fontWeight={700}
                      >
                        {item.format(animatedValue)}
                      </text>
                    );
                  }}
                >
                  {goalsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends Area Chart */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid #334155', minWidth: 0 }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#f1f5f9' }}>Revenue Trends</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)' }}
                  itemStyle={{ color: '#818cf8', fontWeight: 500 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#818cf8" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  isAnimationActive={true}
                  animationBegin={200}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Event List */}
      <h3>All Events Hosted By You</h3>
      <div style={{ marginTop: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '1rem' }}>Event Name</th>
              <th style={{ padding: '1rem' }}>Date</th>
              <th style={{ padding: '1rem' }}>Tickets Sold</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {organizerEvents.map((e, index) => (
              <tr key={e.id} style={{ borderBottom: index < organizerEvents.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <td style={{ padding: '1rem', fontWeight: 500 }}>{e.title}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{e.date}</td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '100px', height: '6px', background: 'var(--bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${((e.totalSpots - e.spotsLeft) / (e.totalSpots || 1)) * 100}%`, height: '100%', background: 'var(--success-color)' }}></div>
                    </div>
                    <span style={{ fontSize: '0.875rem' }}>{e.totalSpots - e.spotsLeft}/{e.totalSpots}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.25rem 0.5rem', background: e.status === 'published' ? '#dcfce7' : '#fef3c7', color: e.status === 'published' ? '#166534' : '#92400e', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600 }}>{e.status === 'published' ? 'Active' : 'Draft'}</span>
                </td>
                <td style={{ padding: '1rem', position: 'relative' }}>
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === e.id ? null : e.id)} 
                    className="btn btn-secondary" 
                    style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                  >
                    Manage
                  </button>
                  {activeMenuId === e.id && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '1rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: '120px',
                      overflow: 'hidden'
                    }}>
                      <button onClick={() => { setActiveMenuId(null); navigate(`/organizer/edit/${e.id}`); }} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem', cursor: 'pointer', outline: 'none' }}>Edit Event</button>
                      <button onClick={() => { setActiveMenuId(null); handleOfflineSale(e.id); }} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', fontSize: '0.875rem', cursor: 'pointer', outline: 'none' }}>+ Offline Sale</button>
                      <button onClick={() => { setActiveMenuId(null); handleDeleteEvent(e.id); }} style={{ padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', fontSize: '0.875rem', cursor: 'pointer', outline: 'none', color: '#ef4444' }}>Delete Event</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;

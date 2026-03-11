'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TicketDef {
  id: string;
  name: string;
  description: string;
  free: boolean;
  price: { amount: string };
  saleStatus: string;
  limitPerCheckout: number;
}

interface ROTREvent {
  id: string;
  title: string;
  status: string;
  dateAndTimeSettings: {
    startDate: string;
    endDate: string;
    formatted: {
      dateAndTime: string;
      startDate: string;
      startTime: string;
      endDate: string;
      endTime: string;
    };
  };
  location: {
    name: string;
    address?: { formattedAddress: string };
  };
  mainImage?: { url: string; width: number; height: number };
  registration: {
    type: string;
    status: string;
    tickets?: {
      lowestPrice?: { formattedValue: string };
      highestPrice?: { formattedValue: string };
      soldOut: boolean;
      currency: string;
    };
  };
  eventPageUrl?: { base: string; path: string };
  ticketDefinitions: TicketDef[];
}

interface Order {
  orderNumber: string;
  eventId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  status: string;
  ticketsQuantity: number;
  totalPrice?: { amount: string };
  created: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export default function ROTREventDetailPage() {
  const params = useParams();
  const eventId = params.eventId as string;

  const [event, setEvent] = useState<ROTREvent | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/rotr');
        const data = await res.json();
        const found = (data.events || []).find((e: ROTREvent) => e.id === eventId);
        setEvent(found || null);
      } catch (err) {
        console.error('Failed to load event:', err);
      }
      setLoading(false);
    }
    load();
  }, [eventId]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch(`/api/admin/rotr/orders?eventId=${eventId}`);
        const data = await res.json();
        setOrders((data.orders || []).sort(
          (a: Order, b: Order) => new Date(b.created).getTime() - new Date(a.created).getTime()
        ));
      } catch (err) {
        console.error('Failed to load orders:', err);
      }
      setOrdersLoading(false);
    }
    loadOrders();
  }, [eventId]);

  const totalRevenue = orders.reduce(
    (sum, o) => sum + parseFloat(o.totalPrice?.amount || '0'),
    0
  );
  const totalTickets = orders.reduce((sum, o) => sum + o.ticketsQuantity, 0);

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="admin-page">
        <p>Event not found.</p>
        <Link href="/admin/rotr" className="admin-btn admin-btn-secondary">
          <i className="fas fa-arrow-left"></i> Back
        </Link>
      </div>
    );
  }

  const wixUrl = event.eventPageUrl
    ? `${event.eventPageUrl.base}${event.eventPageUrl.path}`
    : null;

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Link href="/admin/rotr" className="admin-back-link">
            <i className="fas fa-arrow-left"></i> Back to ROTR
          </Link>
          <h1>{event.title}</h1>
          <p>{event.dateAndTimeSettings.formatted.dateAndTime}</p>
        </div>
        <div className="admin-header-actions">
          {wixUrl && (
            <a href={wixUrl} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary">
              <i className="fas fa-external-link-alt"></i> View on Wix
            </a>
          )}
        </div>
      </div>

      {/* Event Info Card */}
      <div className="rotr-event-detail-grid">
        <div className="admin-card">
          {event.mainImage && (
            <img
              src={event.mainImage.url}
              alt={event.title}
              className="rotr-event-hero-img"
            />
          )}
          <div style={{ padding: '1.25rem' }}>
            <div className="lead-detail-field">
              <span className="lead-detail-label">Status</span>
              <span className="lead-detail-value">
                <span
                  className="admin-status-badge"
                  style={{
                    background: event.status === 'UPCOMING' ? '#10B981'
                      : event.status === 'ENDED' ? '#6B7280'
                      : '#EF4444',
                  }}
                >
                  {event.status}
                </span>
              </span>
            </div>
            <div className="lead-detail-field">
              <span className="lead-detail-label">Location</span>
              <span className="lead-detail-value">{event.location.name}</span>
            </div>
            {event.location.address?.formattedAddress && (
              <div className="lead-detail-field">
                <span className="lead-detail-label">Address</span>
                <span className="lead-detail-value">{event.location.address.formattedAddress}</span>
              </div>
            )}
            <div className="lead-detail-field">
              <span className="lead-detail-label">Registration</span>
              <span className="lead-detail-value">
                {event.registration.tickets?.soldOut
                  ? 'Sold Out'
                  : event.registration.status.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        <div>
          {/* Stats */}
          <div className="rotr-stats-row" style={{ marginBottom: '1rem' }}>
            <div className="rotr-stat-card">
              <div className="rotr-stat-value">{orders.length}</div>
              <div className="rotr-stat-label">Orders</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-value">{totalTickets}</div>
              <div className="rotr-stat-label">Tickets</div>
            </div>
            <div className="rotr-stat-card">
              <div className="rotr-stat-value">{formatCurrency(totalRevenue)}</div>
              <div className="rotr-stat-label">Revenue</div>
            </div>
          </div>

          {/* Ticket Definitions */}
          {event.ticketDefinitions.length > 0 && (
            <div className="admin-card" style={{ marginBottom: '1rem' }}>
              <h3 style={{ padding: '1rem 1.25rem 0' }}>Ticket Types</h3>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Sale Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {event.ticketDefinitions.map(td => (
                      <tr key={td.id}>
                        <td style={{ fontWeight: 500 }}>
                          {td.name}
                          {td.description && (
                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>
                              {td.description}
                            </div>
                          )}
                        </td>
                        <td>{td.free ? 'Free' : formatCurrency(parseFloat(td.price.amount))}</td>
                        <td>
                          <span
                            className="admin-status-badge"
                            style={{
                              background: td.saleStatus === 'SALE_STARTED' ? '#10B981'
                                : td.saleStatus === 'SALE_ENDED' ? '#6B7280'
                                : '#D97706',
                            }}
                          >
                            {td.saleStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders for this event */}
      <div className="admin-card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ padding: '1rem 1.25rem 0' }}>Orders</h3>
        {ordersLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <i className="fas fa-spinner fa-spin" style={{ color: 'var(--blue-accent)' }}></i>
          </div>
        ) : orders.length === 0 ? (
          <p style={{ padding: '1.5rem 1.25rem', color: 'var(--gray-500)' }}>No orders for this event.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.orderNumber}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{order.orderNumber}</td>
                    <td style={{ fontWeight: 500 }}>{order.fullName || `${order.firstName} ${order.lastName}`.trim()}</td>
                    <td>
                      <a href={`mailto:${order.email}`} style={{ color: 'var(--blue-accent)' }}>
                        {order.email}
                      </a>
                    </td>
                    <td>{order.ticketsQuantity}</td>
                    <td style={{ fontWeight: 500 }}>
                      {parseFloat(order.totalPrice?.amount || '0') > 0
                        ? formatCurrency(parseFloat(order.totalPrice!.amount))
                        : 'Free'}
                    </td>
                    <td>
                      <span
                        className="admin-status-badge"
                        style={{
                          background: order.status === 'PAID' ? '#10B981'
                            : order.status === 'FREE' ? '#6B7280'
                            : '#EF4444',
                        }}
                      >
                        {order.status === 'NA_ORDER_STATUS' ? 'N/A' : order.status}
                      </span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>{formatDate(order.created)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

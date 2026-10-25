import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext';
import { RestaurantTable, TableSection, TableBooking } from '../../types/restaurant';
import {
  LayoutGrid,
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  BellRing,
  Sparkles,
  Phone,
  Mail,
  User,
  Check,
  Plus,
  RefreshCw,
  Utensils,
  Maximize2,
} from 'lucide-react';

export const TableManagementView: React.FC = () => {
  const {
    tables,
    bookings,
    waiterCalls,
    resolveWaiterCall,
    updateTableStatus,
    bookTable,
    customerTableNumber,
    setCustomerTableNumber,
    setCurrentView,
  } = useRestaurant();

  const [activeTab, setActiveTab] = useState<'floor' | 'booking' | 'reservations'>('floor');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Booking Form State
  const [bookingName, setBookingName] = useState('Dr. Amit Deshmukh');
  const [bookingEmail, setBookingEmail] = useState('amit.amravati@gmail.com');
  const [bookingPhone, setBookingPhone] = useState('+91 98231 44556');
  const [guestCount, setGuestCount] = useState<number>(4);
  const [bookingDate, setBookingDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState<string>('20:00');
  const [bookingSection, setBookingSection] = useState<TableSection>('Royal Courtyard');
  const [specialRequests, setSpecialRequests] = useState('Family dinner, please arrange authentic Saoji menu recommendations');
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);

  const sections: TableSection[] = [
    'AC Dining Hall',
    'Royal Courtyard',
    'Rooftop Lounge',
    'Family Cabana',
  ];

  const filteredTables = selectedSection === 'All'
    ? tables
    : tables.filter(t => t.section === selectedSection);

  // Stats
  const availableCount = tables.filter(t => t.status === 'available').length;
  const occupiedCount = tables.filter(t => t.status === 'occupied').length;
  const reservedCount = tables.filter(t => t.status === 'reserved').length;
  const billingCount = tables.filter(t => t.status === 'billing').length;

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    // Find available table in section
    const matchingTable = tables.find(
      t => t.section === bookingSection && t.status === 'available' && t.capacity >= guestCount
    ) || tables.find(t => t.status === 'available') || tables[0];

    const res = bookTable({
      customerName: bookingName,
      customerEmail: bookingEmail,
      customerPhone: bookingPhone,
      guests: guestCount,
      date: bookingDate,
      timeSlot: bookingTime,
      tableId: matchingTable.id,
      tableNumber: matchingTable.number,
      section: bookingSection,
      specialRequests,
    });

    if (res.success) {
      setBookingSuccessMsg(`Reservation Confirmed! Reference: ${res.bookingRef} assigned to Table #${matchingTable.number}`);
      setTimeout(() => {
        setBookingSuccessMsg(null);
        setActiveTab('reservations');
      }, 2500);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Live Floor Coordinator
            </span>
            <span className="text-xs text-neutral-400">
              Total Tables: {tables.length}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] tracking-tight">
            Amravati Restaurant Floor & Real-Time Booking
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Table turnaround management, waiter service calls, and live dining reservations
          </p>
        </div>

        {/* Status Counters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-neutral-400">Available:</span>
            <strong className="text-white">{availableCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-neutral-400">Occupied:</span>
            <strong className="text-white">{occupiedCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span className="text-neutral-400">Billing:</span>
            <strong className="text-white">{billingCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <span className="text-neutral-400">Reserved:</span>
            <strong className="text-white">{reservedCount}</strong>
          </div>
        </div>
      </div>

      {/* Live Server / Waiter Calls Banner (if any table pressed call button) */}
      {waiterCalls.length > 0 && (
        <div className="bg-red-950/30 border border-red-500/40 rounded-2xl p-4 shadow-lg space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400">
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>Active Server Requests ({waiterCalls.filter((c, i, a) => i === a.findIndex(x => x.id === c.id)).length})</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {waiterCalls
              .filter((c, i, a) => i === a.findIndex(x => x.id === c.id))
              .map((call, idx) => (
                <div
                  key={`${call.id}-${idx}`}
                  className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-extrabold text-white">Table #{call.tableNumber}</span>
                    <p className="text-[11px] text-amber-400 capitalize">Requested: {call.type}</p>
                    <span className="text-[10px] text-neutral-500">{call.timestamp}</span>
                  </div>
                  <button
                    onClick={() => resolveWaiterCall(call.id)}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Done</span>
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('floor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'floor'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Floor Plan & Tables</span>
          </button>

          <button
            onClick={() => setActiveTab('booking')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'booking'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Book a Table</span>
          </button>

          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'reservations'
                ? 'bg-amber-500 text-neutral-950 shadow-md'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Confirmed Bookings ({bookings.length})</span>
          </button>
        </div>

        {activeTab === 'floor' && (
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setSelectedSection('All')}
              className={`px-2.5 py-1 rounded-lg text-xs ${selectedSection === 'All' ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400'}`}
            >
              All Sections
            </button>
            {sections.map(s => (
              <button
                key={s}
                onClick={() => setSelectedSection(s)}
                className={`px-2.5 py-1 rounded-lg text-xs ${selectedSection === s ? 'bg-neutral-800 text-amber-400 font-bold' : 'text-neutral-400'}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* TAB 1: Visual Floor Plan */}
      {activeTab === 'floor' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredTables.map(tbl => {
            const isOurTable = tbl.number === customerTableNumber;
            const statusColor =
              tbl.status === 'available'
                ? 'border-emerald-500/40 bg-emerald-950/10 hover:border-emerald-500'
                : tbl.status === 'occupied'
                ? 'border-amber-500/50 bg-amber-950/15 hover:border-amber-500'
                : tbl.status === 'billing'
                ? 'border-blue-500/50 bg-blue-950/20'
                : tbl.status === 'reserved'
                ? 'border-purple-500/50 bg-purple-950/20'
                : 'border-neutral-800 bg-neutral-900';

            return (
              <div
                key={tbl.id}
                className={`rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 shadow-lg ${statusColor}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-white font-['Outfit']">
                        Table {tbl.number}
                      </span>
                      {isOurTable && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950">
                          Current Focus
                        </span>
                      )}
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                      tbl.status === 'available' ? 'bg-emerald-500/20 text-emerald-400' :
                      tbl.status === 'occupied' ? 'bg-amber-500/20 text-amber-400' :
                      tbl.status === 'billing' ? 'bg-blue-500/20 text-blue-400' :
                      tbl.status === 'reserved' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-neutral-800 text-neutral-400'
                    }`}>
                      {tbl.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-neutral-400">
                    <p className="text-neutral-300 font-medium">{tbl.section}</p>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3 h-3 text-neutral-500" />
                      <span>Capacity: {tbl.capacity} Persons</span>
                    </div>

                    {tbl.currentGuestName && (
                      <p className="text-[11px] text-amber-300">
                        Guest: <strong>{tbl.currentGuestName}</strong>
                      </p>
                    )}

                    {tbl.currentOrderId && (
                      <p className="text-[11px] font-mono text-neutral-400">
                        Order: #{tbl.currentOrderId}
                      </p>
                    )}

                    {tbl.reservationTime && (
                      <p className="text-[11px] text-purple-300">
                        Reserved for: {tbl.reservationTime}
                      </p>
                    )}
                  </div>
                </div>

                {/* Table Actions */}
                <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => {
                      setCustomerTableNumber(tbl.number);
                      setCurrentView('customer');
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition"
                    title="Switch to customer ordering for this table"
                  >
                    Open Menu
                  </button>

                  {tbl.status === 'cleaning' && (
                    <button
                      onClick={() => updateTableStatus(tbl.id, 'available')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                    >
                      Cleaned
                    </button>
                  )}

                  {tbl.status === 'occupied' && (
                    <button
                      onClick={() => updateTableStatus(tbl.id, 'billing')}
                      className="px-2 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition"
                      title="Request Bill"
                    >
                      Bill
                    </button>
                  )}

                  {(tbl.status === 'billing' || tbl.status === 'reserved') && (
                    <button
                      onClick={() => updateTableStatus(tbl.id, 'available')}
                      className="px-2 py-1.5 rounded-lg bg-neutral-750 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition"
                    >
                      Free
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Table Booking Form */}
      {activeTab === 'booking' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-7 max-w-2xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-neutral-800">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-['Outfit']">
                Real-Time Table Booking in Amravati
              </h2>
              <p className="text-xs text-neutral-400">
                Reserve prime seating at Varhad Rasoi with instant confirmation
              </p>
            </div>
          </div>

          {bookingSuccessMsg && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{bookingSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Full Name / Host
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={bookingName}
                    onChange={(e) => setBookingName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Email Address (Confirmation)
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={bookingEmail}
                    onChange={(e) => setBookingEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={bookingPhone}
                    onChange={(e) => setBookingPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Time Slot
                </label>
                <select
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="12:30">12:30 PM (Lunch)</option>
                  <option value="13:30">01:30 PM (Lunch)</option>
                  <option value="19:00">07:00 PM (Dinner)</option>
                  <option value="20:00">08:00 PM (Dinner)</option>
                  <option value="21:00">09:00 PM (Dinner)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Number of Guests
                </label>
                <div className="flex items-center gap-1.5">
                  {[2, 4, 6, 8, 10].map(num => (
                    <button
                      type="button"
                      key={num}
                      onClick={() => setGuestCount(num)}
                      className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                        guestCount === num
                          ? 'bg-amber-500 text-neutral-950'
                          : 'bg-neutral-950 border border-neutral-800 text-neutral-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold block mb-1">
                  Seating Ambience
                </label>
                <select
                  value={bookingSection}
                  onChange={(e) => setBookingSection(e.target.value as TableSection)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50"
                >
                  {sections.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-neutral-300 font-semibold block mb-1">
                Special Dining Requests
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={2}
                placeholder="Anniversary, kid chair, authentic Saoji spice level..."
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black rounded-xl text-sm shadow-xl shadow-amber-950/40 transition"
            >
              Confirm Real-Time Reservation
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Confirmed Reservations List */}
      {activeTab === 'reservations' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <h2 className="text-base font-bold text-white">Upcoming Guest Reservations</h2>
            <span className="text-xs text-neutral-400">{bookings.length} Registered</span>
          </div>

          {bookings.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              No active reservations yet. Use &quot;Book a Table&quot; to add a guest booking.
            </div>
          ) : (
            <div className="divide-y divide-neutral-800">
              {bookings.map(b => (
                <div key={b.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{b.customerName}</span>
                      <span className="font-mono text-[10px] text-amber-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                        {b.bookingRef}
                      </span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[10px] font-bold">
                        Confirmed
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-neutral-400 text-[11px] mt-1 flex-wrap">
                      <span>Table #{b.tableNumber} ({b.section})</span>
                      <span>&bull;</span>
                      <span>{b.guests} Guests</span>
                      <span>&bull;</span>
                      <span>{b.date} at {b.timeSlot}</span>
                      <span>&bull;</span>
                      <span>{b.customerPhone}</span>
                    </div>

                    {b.specialRequests && (
                      <p className="text-[11px] text-amber-300/90 italic mt-0.5">
                        Note: &ldquo;{b.specialRequests}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setCustomerTableNumber(b.tableNumber);
                        setCurrentView('customer');
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-lg text-xs transition"
                    >
                      Seat at Table #{b.tableNumber}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

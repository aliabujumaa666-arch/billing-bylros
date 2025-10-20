import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Package, Truck, Wrench } from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: string;
  type: 'order' | 'delivery' | 'installation';
  title: string;
  customer: string;
  status: string;
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<'month' | 'week'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          delivery_date,
          status,
          customers(name)
        `)
        .gte('delivery_date', startOfMonth.toISOString().split('T')[0])
        .lte('delivery_date', endOfMonth.toISOString().split('T')[0]);

      const { data: tasks } = await supabase
        .from('installation_tasks')
        .select(`
          id,
          task_title,
          scheduled_date,
          status,
          orders(
            order_number,
            customers(name)
          )
        `)
        .gte('scheduled_date', startOfMonth.toISOString().split('T')[0])
        .lte('scheduled_date', endOfMonth.toISOString().split('T')[0]);

      const calendarEvents: CalendarEvent[] = [];

      orders?.forEach(order => {
        if (order.delivery_date) {
          calendarEvents.push({
            id: order.id,
            date: order.delivery_date,
            type: 'delivery',
            title: order.order_number,
            customer: order.customers?.name || 'Unknown Customer',
            status: order.status,
          });
        }
      });

      tasks?.forEach(task => {
        if (task.scheduled_date) {
          calendarEvents.push({
            id: task.id,
            date: task.scheduled_date,
            type: 'installation',
            title: task.task_title,
            customer: task.orders?.customers?.name || 'Unknown Customer',
            status: task.status,
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-3 h-3" />;
      case 'delivery':
        return <Truck className="w-3 h-3" />;
      case 'installation':
        return <Wrench className="w-3 h-3" />;
      default:
        return <CalendarIcon className="w-3 h-3" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'delivery':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'installation':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#bb2738]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Calendar View</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === 'month' ? 'bg-[#bb2738] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                view === 'week' ? 'bg-[#bb2738] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Week
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-slate-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
          {dayNames.map(day => (
            <div key={day} className="bg-slate-50 p-3 text-center">
              <span className="text-sm font-semibold text-slate-600">{day}</span>
            </div>
          ))}

          {getDaysInMonth().map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isToday = date &&
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div
                key={index}
                className={`bg-white p-2 min-h-[120px] ${
                  date ? 'cursor-pointer hover:bg-slate-50' : ''
                } ${isToday ? 'ring-2 ring-[#bb2738] ring-inset' : ''}`}
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <>
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-[#bb2738]' : 'text-slate-900'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded border ${getEventColor(event.type)} flex items-center gap-1`}
                        >
                          {getEventIcon(event.type)}
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-slate-600 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Orders</p>
              <p className="text-xl font-bold text-slate-900">
                {events.filter(e => e.type === 'order').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Truck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Deliveries</p>
              <p className="text-xl font-bold text-slate-900">
                {events.filter(e => e.type === 'delivery').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Wrench className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Installations</p>
              <p className="text-xl font-bold text-slate-900">
                {events.filter(e => e.type === 'installation').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                Events for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h3>
            </div>

            <div className="p-6">
              {getEventsForDate(selectedDate).length === 0 ? (
                <p className="text-slate-600 text-center py-8">No events scheduled for this day</p>
              ) : (
                <div className="space-y-3">
                  {getEventsForDate(selectedDate).map(event => (
                    <div key={event.id} className={`p-4 rounded-lg border ${getEventColor(event.type)}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {getEventIcon(event.type)}
                        <span className="font-semibold">{event.title}</span>
                        <span className="ml-auto text-xs px-2 py-1 bg-white rounded">
                          {event.type}
                        </span>
                      </div>
                      <p className="text-sm">Customer: {event.customer}</p>
                      <p className="text-sm">Status: {event.status}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setSelectedDate(null)}
                className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

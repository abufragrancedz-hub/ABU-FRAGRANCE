
import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { OptimizeImage } from '../../../components/OptimizeImage';
import { Trash2, CheckCircle, Clock, Truck, ExternalLink, X, Box, FileText, FileSpreadsheet, Eye, MapPin, Phone, User, RotateCcw, Home, Building2, Search, RefreshCw, AlertTriangle, Info, CheckCheck, DollarSign } from 'lucide-react';
import { Order, DeliveryType } from '../../../types';
import { CARRIERS, getTrackingUrl, Carrier } from '../../../utils/tracking';
import { exportOrdersToPDF, exportOrdersToExcel } from '../../../utils/export';
import { formatOrderDate } from '../../../utils/date';
import { apiFetch } from '../../../lib/apiClient';
import { useShop } from '../../../context/ShopContext';

// ── Custom Themed Modal ──
interface ModalState {
    open: boolean;
    type: 'confirm' | 'alert';
    variant: 'info' | 'success' | 'warning' | 'danger';
    title: string;
    message: string;
    onConfirm?: () => void;
}

const ThemedModal: React.FC<{ state: ModalState; onClose: () => void }> = ({ state, onClose }) => {
    if (!state.open) return null;
    const variantStyles = {
        info: { icon: <Info className="w-6 h-6" />, bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', iconBg: 'bg-blue-100 dark:bg-blue-800', iconColor: 'text-blue-600 dark:text-blue-300', btn: 'bg-blue-600 hover:bg-blue-700' },
        success: { icon: <CheckCheck className="w-6 h-6" />, bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-200 dark:border-emerald-800', iconBg: 'bg-emerald-100 dark:bg-emerald-800', iconColor: 'text-emerald-600 dark:text-emerald-300', btn: 'bg-emerald-600 hover:bg-emerald-700' },
        warning: { icon: <AlertTriangle className="w-6 h-6" />, bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-800', iconColor: 'text-amber-600 dark:text-amber-300', btn: 'bg-amber-600 hover:bg-amber-700' },
        danger: { icon: <AlertTriangle className="w-6 h-6" />, bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', iconBg: 'bg-red-100 dark:bg-red-800', iconColor: 'text-red-600 dark:text-red-300', btn: 'bg-red-600 hover:bg-red-700' },
    };
    const s = variantStyles[state.variant];
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className={`${s.bg} border ${s.border} rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200`}>
                <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${s.iconBg} ${s.iconColor} flex-shrink-0`}>{s.icon}</div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{state.title}</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">{state.message}</p>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    {state.type === 'confirm' && (
                        <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-all active:scale-95">
                            Cancel
                        </button>
                    )}
                    <button
                        onClick={() => { state.onConfirm?.(); onClose(); }}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white ${s.btn} shadow-lg transition-all active:scale-95`}
                    >
                        {state.type === 'confirm' ? 'Confirm' : 'OK'}
                    </button>
                </div>
            </div>
        </div>
    , document.body);
};

interface OrdersViewProps {
    orders: Order[];
    updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
    deleteOrder: (id: string) => Promise<void>;
    refreshOrders?: () => Promise<any>;
    hasMore: boolean;
    onLoadMore: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, updateOrder, deleteOrder, refreshOrders, hasMore, onLoadMore }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
    const [ordersPerPage, setOrdersPerPage] = useState(50);
    const [modalState, setModalState] = useState<ModalState>({ open: false, type: 'alert', variant: 'info', title: '', message: '' });

    const showAlert = useCallback((title: string, message: string, variant: ModalState['variant'] = 'info') => {
        setModalState({ open: true, type: 'alert', variant, title, message });
    }, []);

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, variant: ModalState['variant'] = 'warning') => {
        setModalState({ open: true, type: 'confirm', variant, title, message, onConfirm });
    }, []);

    const closeModal = useCallback(() => setModalState(prev => ({ ...prev, open: false })), []);

    const lastManualCheckRef = React.useRef<number>(0);
    
    // Pulse: Refresh order list every 30s to catch brand new orders
    React.useEffect(() => {
        const PULSE_INTERVAL = 30 * 1000;
        const interval = setInterval(() => {
            // Only refresh if tab is active and not already syncing
            if (document.visibilityState === 'visible' && refreshOrders && !isSyncing) {
                console.log('[Pulse] Checking for new orders...');
                refreshOrders();
            }
        }, PULSE_INTERVAL);
        return () => clearInterval(interval);
    }, [refreshOrders, isSyncing]);

    // Status sync: Comprehensive check every 30 minutes
    React.useEffect(() => {
        const THIRTY_MINUTES = 30 * 60 * 1000;
        const interval = setInterval(() => {
            const now = new Date();
            const hour = now.getHours();
            const isBusinessHours = hour >= 9 && hour <= 23;
            const timeSinceManualCheck = Date.now() - lastManualCheckRef.current;
            if (isBusinessHours && timeSinceManualCheck >= THIRTY_MINUTES && !isSyncing) {
                console.log('[Auto-Refresh] Checking order statuses...');
                checkOrderStatuses();
            }
        }, THIRTY_MINUTES);
        return () => clearInterval(interval);
    }, [isSyncing]);

    const checkOrderStatuses = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        try {
            // Wait for internal status refresh
            const res = await apiFetch('/api/admin/orders/check-statuses', { method: 'POST' });
            
            // Force a refresh of the order list to see new ones
            if (refreshOrders) await refreshOrders();
            
            if (res.data?.updated > 0) {
                showAlert('Sync Complete', `Updated ${res.data.updated} statuses.`, 'success');
            } else {
                showAlert('Refreshed', 'Dashboard updated with latest orders.', 'success');
            }
        } catch (error: any) {
            console.error("Status check failed:", error);
            // Refresh anyway so we at least see new orders
            if (refreshOrders) await refreshOrders();
            showAlert('Sync Warning', 'Could not check status codes, but list was refreshed.', 'warning');
        } finally {
            setIsSyncing(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        // Contextual Search based on first character
        const firstChar = query[0];

        // 1. Search by Order ID/Number
        if (firstChar === '#') {
            const searchId = query.slice(1);
            if (!searchId) return true;
            return (
                (order.orderNumber && order.orderNumber.toString().includes(searchId)) ||
                order.id.toLowerCase().includes(searchId)
            );
        }

        // 2. Search by Phone Number (starts with digit)
        if (/[0-9]/.test(firstChar)) {
            return order.customer.phone.includes(query);
        }

        // 3. Search by Name (starts with letter)
        return order.customer.fullName.toLowerCase().startsWith(query) ||
            order.customer.fullName.toLowerCase().includes(query);
    });

    const [shippingForm, setShippingForm] = useState<{ carrier: Carrier, trackingNumber: string, deliveryType: DeliveryType }>({
        carrier: 'ecotrack',
        trackingNumber: '',
        deliveryType: 'domicile'
    });

    const openDetailsModal = (order: Order) => {
        setSelectedOrder(order);
        setDetailsModalOpen(true);
    };

    const openShippingModal = (order: Order) => {
        setSelectedOrder(order);
        setShippingForm({
            carrier: (order.carrier as Carrier) || (order.deliveryCompany === 'dhd' ? 'dhd' : 'ecotrack'),
            trackingNumber: order.trackingNumber || '',
            deliveryType: order.deliveryType || 'domicile'
        });
        setShippingModalOpen(true);
    };

    const handleAutoSync = async () => {
        if (!selectedOrder || isSyncing) return;

        if (selectedOrder.trackingNumber) {
            showAlert('Already Synced', 'This order already has a tracking number. Auto-sync is disabled to prevent duplicates.', 'warning');
            return;
        }

        setIsSyncing(true);
        try {
            const res = await apiFetch(`/api/admin/orders/${selectedOrder.id}/ship`, {
                method: 'POST',
                body: JSON.stringify({
                    carrier: shippingForm.carrier,
                    deliveryType: shippingForm.deliveryType
                })
            });

            // Optimistically update the UI
            setShippingForm(prev => ({
                ...prev,
                trackingNumber: res.data?.trackingNumber,
                deliveryType: res.data?.deliveryType || shippingForm.deliveryType
            }));

            await updateOrder(selectedOrder.id, {
                carrier: shippingForm.carrier,
                trackingNumber: res.data?.trackingNumber,
                deliveryType: res.data?.deliveryType || shippingForm.deliveryType,
                status: 'shipped'
            });

            let msg = `Tracking: ${res.data?.trackingNumber}`;
            if (res.data?.note) msg += `\n\n⚠️ ${res.data?.note}`;
            
            showAlert('Order Synced!', msg, 'success');
        } catch (error: any) {
            console.error("Sync error:", error);
            showAlert('Sync Failed', error.message || 'Failed to sync with carrier.', 'danger');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleBatchAutoSync = async () => {
        if (selectedOrders.length === 0 || isSyncing) return;
        setIsSyncing(true);
        try {
            // We only send pending or unsynced orders
            const ordersToSync = selectedOrders.filter(id => {
                const o = orders.find(ord => ord.id === id);
                return o && !o.trackingNumber;
            });

            if (ordersToSync.length === 0) {
                showAlert('No Valid Orders', 'No unsynced orders selected.', 'warning');
                setIsSyncing(false);
                return;
            }

            const res = await apiFetch('/api/admin/orders/batch-ship', {
                method: 'POST',
                body: JSON.stringify({ orderIds: ordersToSync })
            });

            showAlert('Batch Sync Complete', `Successfully synced: ${res.successfulCount}\nFailed/Skipped: ${res.failedCount}`, res.successfulCount > 0 ? 'success' : 'warning');
            setSelectedOrders([]);
            if (refreshOrders) refreshOrders();
        } catch (error: any) {
            console.error("Batch sync error:", error);
            showAlert('Batch Sync Failed', error.message || 'Failed to batch sync.', 'danger');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleShipOrder = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedOrder) {
            updateOrder(selectedOrder.id, {
                status: 'shipped',
                carrier: shippingForm.carrier,
                trackingNumber: shippingForm.trackingNumber,
                deliveryType: shippingForm.deliveryType
            });
            setShippingModalOpen(false);
        }
    };

    const handleExport = async (type: 'pdf' | 'excel') => {
        try {
            showAlert('Exporting...', 'Fetching full order history for export. Please wait.', 'info');
            const res = await apiFetch('/api/admin/orders/export');
            
            if (type === 'pdf') {
                exportOrdersToPDF(res.data);
            } else {
                exportOrdersToExcel(res.data);
            }
            closeModal();
        } catch (error: any) {
            console.error("Export error:", error);
            showAlert('Export Failed', error.message || 'Could not export orders.', 'danger');
        }
    };

    const displayedOrders = filteredOrders.slice(0, ordersPerPage);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
            {/* Themed Modal */}
            <ThemedModal state={modalState} onClose={closeModal} />

            {/* Header with Search */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Orders</h2>
                    {/* Per Page Selector */}
                    <div className="flex items-center bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                        {[10, 30, 50].map(n => (
                            <button
                                key={n}
                                onClick={() => setOrdersPerPage(n)}
                                className={`px-3 py-1 text-xs font-bold transition-all ${ordersPerPage === n
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                    <span className="text-xs text-gray-400 font-medium hidden sm:inline">{filteredOrders.length} total</span>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Name, Phone, ID, tracking..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {/* Export Buttons */}
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => handleExport('pdf')}
                            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                            title="Export PDF (All)"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            PDF
                        </button>
                        <button
                            onClick={() => handleExport('excel')}
                            className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                            title="Export All Orders to Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Excel (All)
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 hidden md:block"></div>

                    <button
                        onClick={checkOrderStatuses}
                        disabled={isSyncing}
                        className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                        title="Refresh Statuses"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Checking...' : 'Check Status'}
                    </button>
                </div>
            </div>


            {/* Batch Actions */}
            {selectedOrders.length > 0 && (
                <div className="mx-6 mb-4 p-4 bg-blue-50 dark:bg-slate-700 border border-blue-200 dark:border-slate-600 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
                    <span className="font-bold text-blue-800 dark:text-blue-200">
                        {selectedOrders.length} order(s) selected
                    </span>
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => showConfirm('Send to Delivery', `Send ${selectedOrders.length} orders to delivery via EcoTrack?`, handleBatchAutoSync, 'info')}
                            disabled={isSyncing}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                            <Truck className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Syncing...' : 'Send to Delivery'}
                        </button>
                        <button
                            onClick={() => showConfirm('Delete Orders', `Are you sure you want to delete ${selectedOrders.length} orders? This cannot be undone.`, () => {
                                selectedOrders.forEach(id => deleteOrder(id));
                                setSelectedOrders([]);
                            }, 'danger')}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-md"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Selected
                        </button>
                        <button
                            onClick={() => setSelectedOrders([])}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <X className="w-4 h-4" /> Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-slate-700">
                            <th className="px-4 py-4 w-28">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500 accent-red-600"
                                        checked={displayedOrders.length > 0 && selectedOrders.length === displayedOrders.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedOrders(displayedOrders.map(o => o.id));
                                            else setSelectedOrders([]);
                                        }}
                                    />
                                    <span className="text-red-600 text-xs font-bold uppercase tracking-wider">Select All</span>
                                </label>
                            </th>
                            <th className="px-6 py-4 font-semibold">Order ID</th>
                            <th className="px-6 py-4 font-semibold">Customer</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Total</th>
                            <th className="px-6 py-4 font-semibold">Shipping</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {displayedOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-4 py-4">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedOrders.includes(order.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedOrders([...selectedOrders, order.id]);
                                            else setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                                        }}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-bold text-slate-900 dark:text-white">
                                        {order.orderNumber?.toString().startsWith('#') ? order.orderNumber : `#${order.orderNumber || order.id.slice(0, 8)}`}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                        {formatOrderDate(order.date, order)}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 dark:text-white">{order.customer.fullName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{order.customer.phone}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">{order.customer.address}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${order.status === 'confirmed' ? 'bg-secondary/10 text-secondary/80' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                                    order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                        order.status === 'no_answer' ? 'bg-amber-100 text-amber-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                        {order.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                        {order.status === 'shipped' && <Truck className="w-3 h-3 mr-1" />}
                                        {order.status.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{order.total} DZD</td>
                                <td className="px-6 py-4">
                                    {order.trackingNumber ? (
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-slate-900 dark:text-gray-200 uppercase">{order.carrier?.replace('-', ' ')}</span>
                                            <a
                                                href={getTrackingUrl(order.carrier, order.trackingNumber) || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center mt-1"
                                            >
                                                {order.trackingNumber} <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                                                (order as any).deliveryCompany === 'dhd'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {(order as any).deliveryCompany === 'dhd' ? 'DHD' : 'Anderson'}
                                            </span>
                                            <span className="text-xs text-gray-400">No tracking</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex flex-nowrap justify-end items-center gap-1.5">
                                        <button
                                            onClick={() => openDetailsModal(order)}
                                            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex-shrink-0"
                                            title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>

                                        {order.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => showConfirm('Confirm Order', 'Are you sure you want to confirm this order?', () => updateOrder(order.id, { status: 'confirmed' }), 'info')}
                                                    className="flex items-center gap-2 px-3 py-1.5 min-h-[36px] text-xs font-bold uppercase tracking-wider text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
                                                    title="Confirm Order"
                                                >
                                                    <CheckCircle className="w-4 h-4 leading-none" />
                                                    <span>Confirm</span>
                                                </button>
                                                <button
                                                    onClick={() => showConfirm('No Answer', 'Mark this order as No Answer?', () => updateOrder(order.id, { status: 'no_answer' }), 'warning')}
                                                    className="flex items-center gap-2 px-3 py-1.5 min-h-[36px] text-xs font-bold uppercase tracking-wider text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
                                                    title="No Answer"
                                                >
                                                    <Phone className="w-4 h-4 leading-none" />
                                                    <span>No Ans</span>
                                                </button>
                                                <button
                                                    onClick={() => showConfirm('Cancel Order', 'Cancel this order?', () => updateOrder(order.id, { status: 'cancelled' }), 'danger')}
                                                    className="flex items-center gap-2 px-3 py-1.5 min-h-[36px] text-xs font-bold uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0"
                                                    title="Cancel Order"
                                                >
                                                    <X className="w-4 h-4 leading-none" />
                                                    <span>Cancel</span>
                                                </button>
                                            </>
                                        )}

                                        {(order.status === 'confirmed' || order.status === 'cancelled' || order.status === 'no_answer') && (
                                            <button
                                                onClick={() => showConfirm('Revert to Pending', `Revert this ${order.status.replace('_', ' ')} order back to PENDING?`, () => updateOrder(order.id, { status: 'pending' }), 'warning')}
                                                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors flex-shrink-0"
                                                title="Revert to Pending"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                            </button>
                                        )}

                                        {(order.status === 'confirmed' || order.status === 'shipped') && (
                                            <button
                                                onClick={() => openShippingModal(order)}
                                                className={`flex items-center gap-2 px-3 py-1.5 min-h-[36px] text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-all shadow-sm active:scale-95 flex-shrink-0
                                                    ${order.trackingNumber
                                                        ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-100'
                                                        : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                                                title={order.trackingNumber ? 'Update Shipping' : 'Send Order'}
                                            >
                                                <Truck className="w-4 h-4 leading-none" />
                                                <span>{order.trackingNumber ? 'Update' : 'Send to Delivery'}</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => showConfirm('Delete Order', 'Are you sure you want to delete this order? This cannot be undone.', () => deleteOrder(order.id), 'danger')}
                                            className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                            title="Delete Order"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Control */}
                {hasMore && (
                    <div className="p-6 border-t border-gray-100 dark:border-slate-700 flex justify-center">
                        <button
                            onClick={onLoadMore}
                            className="px-8 py-2.5 bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-gray-300 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-all active:scale-95"
                        >
                            Load More Orders
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4 bg-gray-50 dark:bg-slate-900/50">
                {displayedOrders.map((order) => (
                    <div key={order.id} className="relative bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 shadow-sm"
                                    checked={selectedOrders.includes(order.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) setSelectedOrders([...selectedOrders, order.id]);
                                        else setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                                    }}
                                />
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">Order {order.orderNumber?.toString().startsWith('#') ? order.orderNumber : `#${order.orderNumber || order.id.slice(0, 8)}`}</h3>
                                    <p className="text-[10px] font-medium text-gray-400 mt-0.5">{formatOrderDate(order.date, order)}</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                ${order.status === 'confirmed' ? 'bg-secondary/10 text-secondary' :
                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                order.status === 'no_answer' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-600'}`}>
                                {order.status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="space-y-3 mb-5 border-t border-b border-gray-50 dark:border-slate-700 py-3">
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{order.customer.fullName}</p>
                                    <p className="text-xs text-gray-500">{order.customer.wilaya}, {order.customer.commune}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <p className="text-sm text-gray-600 dark:text-gray-300 font-mono tracking-wide">{order.customer.phone}</p>
                            </div>
                            <div className="flex justify-between items-center pt-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total</span>
                                <span className="text-lg font-black text-blue-600">{order.total} DZD</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            {/* Primary Actions */}
                            {order.status === 'pending' && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                        onClick={() => showConfirm('Confirm Order', 'Are you sure you want to confirm this order?', () => updateOrder(order.id, { status: 'confirmed' }), 'info')}
                                        className="flex-[1_1_30%] bg-emerald-500 text-white py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 hover:bg-emerald-600"
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" /> Confirm
                                    </button>
                                    <button
                                        onClick={() => showConfirm('No Answer', 'Mark this order as No Answer?', () => updateOrder(order.id, { status: 'no_answer' }), 'warning')}
                                        className="flex-[1_1_30%] bg-amber-500 text-white py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 hover:bg-amber-600"
                                    >
                                        <Phone className="w-3.5 h-3.5" /> No Ans
                                    </button>
                                    <button
                                        onClick={() => showConfirm('Cancel Order', 'Cancel this order?', () => updateOrder(order.id, { status: 'cancelled' }), 'danger')}
                                        className="flex-[1_1_30%] bg-red-500 text-white py-2.5 rounded-lg text-[11px] font-bold uppercase tracking-wider flex justify-center items-center gap-1.5 hover:bg-red-600"
                                    >
                                        <X className="w-3.5 h-3.5" /> Cancel
                                    </button>
                                </div>
                            )}

                            {(order.status === 'confirmed' || order.status === 'shipped') && (
                                <button
                                    onClick={() => openShippingModal(order)}
                                    className={`flex-1 text-white py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2 transition-all
                                        ${order.trackingNumber
                                            ? 'bg-orange-500 hover:bg-orange-600'
                                            : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    <Truck className="w-4 h-4" /> {order.trackingNumber ? 'Update' : 'Send to Delivery'}
                                </button>
                            )}

                            {/* Secondary Actions Row */}
                            <div className="flex w-full gap-2 mt-2">
                                <button
                                    onClick={() => openDetailsModal(order)}
                                    className="flex-1 bg-gray-100 dark:bg-slate-700 text-slate-600 dark:text-gray-200 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex justify-center items-center gap-2 hover:bg-gray-200"
                                >
                                    <Eye className="w-4 h-4" /> View
                                </button>

                                {(order.status === 'confirmed' || order.status === 'cancelled' || order.status === 'no_answer') && (
                                    <button
                                        onClick={() => showConfirm('Revert to Pending', `Revert this ${order.status.replace('_', ' ')} order back to PENDING?`, () => updateOrder(order.id, { status: 'pending' }), 'warning')}
                                        className="w-10 h-10 flex items-center justify-center bg-orange-50 text-orange-600 rounded-lg border border-orange-100 flex-shrink-0"
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}

                                <button
                                    onClick={() => showConfirm('Delete Order', 'Are you sure you want to delete this order? This cannot be undone.', () => deleteOrder(order.id), 'danger')}
                                    className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 flex-shrink-0"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Pagination Control Mobile */}
                {hasMore && (
                    <div className="pt-2 pb-6 flex justify-center">
                        <button
                            onClick={onLoadMore}
                            className="w-full py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-300 rounded-xl text-sm font-bold border border-gray-200 dark:border-slate-700 shadow-sm active:scale-95"
                        >
                            Load More Orders
                        </button>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {detailsModalOpen && selectedOrder && (() => {
                const orderNumber = selectedOrder.orderNumber?.toString().startsWith('#')
                    ? selectedOrder.orderNumber
                    : `#${selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}`;

                return ReactDOM.createPortal(
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'stretch', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
                        <div style={{ position: 'relative', backgroundColor: '#020617', color: 'white', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }} className="md:max-w-2xl md:mx-auto md:my-auto md:rounded-3xl md:h-auto md:max-h-[88vh] shadow-2xl">

                            {/* ── Header (shrink-0 = always visible, no sticky needed) ── */}
                            <div className="shrink-0 bg-slate-900 border-b border-white/10 px-5 py-4 flex justify-between items-center md:rounded-t-3xl">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2.5 bg-primary/20 rounded-xl shrink-0">
                                        <Box className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-base font-black text-white tracking-tight uppercase leading-none truncate">
                                            Order {orderNumber}
                                        </h3>
                                        <p className="text-[11px] font-medium text-white/50 mt-0.5">
                                            {formatOrderDate(selectedOrder.date, selectedOrder)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDetailsModalOpen(false)}
                                    className="ml-3 p-3 bg-white/10 hover:bg-red-500/30 text-white rounded-xl transition-all active:scale-90 shrink-0"
                                    aria-label="Close"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* ── Scrollable Content ── */}
                            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 space-y-5" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

                                {/* Customer & Delivery Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Customer */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Customer</h4>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-500/20 rounded-lg shrink-0">
                                                <User className="w-4 h-4 text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{selectedOrder.customer.fullName}</p>
                                                <p className="text-xs text-white/40">Full name</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-green-500/20 rounded-lg shrink-0">
                                                <Phone className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{selectedOrder.customer.phone}</p>
                                                <p className="text-xs text-white/40">Phone</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-orange-500/20 rounded-lg shrink-0 mt-0.5">
                                                <MapPin className="w-4 h-4 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm">{selectedOrder.customer.address}</p>
                                                <p className="text-xs text-white/40">{selectedOrder.customer.commune}, {selectedOrder.customer.wilaya}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery */}
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Delivery</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                                                <span className="text-white/50">Company</span>
                                                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                                    (selectedOrder as any).deliveryCompany === 'dhd'
                                                        ? 'bg-purple-500/20 text-purple-300'
                                                        : 'bg-blue-500/20 text-blue-300'
                                                }`}>
                                                    {(selectedOrder as any).deliveryCompany === 'dhd' ? '📦 DHD Delivery' : '🚚 Anderson'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                                                <span className="text-white/50">Type</span>
                                                <span className="font-bold text-white capitalize">{selectedOrder.deliveryType || 'Domicile'}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                                                <span className="text-white/50">Delivery Fee</span>
                                                <div className="text-right">
                                                    <span className="font-bold text-white">{selectedOrder.deliveryFee || 0} DZD</span>
                                                    {selectedOrder.deliveryFee === 0 && (selectedOrder.actualDeliveryFee || 0) > 0 && (
                                                        <p className="text-[10px] text-amber-400 font-bold">Cost: {selectedOrder.actualDeliveryFee} DZD</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5 border-b border-white/5">
                                                <span className="text-white/50">Status</span>
                                                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                                                    selectedOrder.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    selectedOrder.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' :
                                                    selectedOrder.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-white/10 text-white/60'
                                                } uppercase`}>{selectedOrder.status.replace('_', ' ')}</span>
                                            </div>
                                            {selectedOrder.trackingNumber && (
                                                <div className="flex justify-between items-center py-1.5">
                                                    <span className="text-white/50">Tracking</span>
                                                    <span className="font-mono text-blue-400 font-bold text-xs">{selectedOrder.trackingNumber}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                                        Order Items <span className="text-white/20">({selectedOrder.items.length})</span>
                                    </h4>
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/8 transition-all">
                                            <div className="w-16 h-20 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                                <OptimizeImage
                                                    src={item.image}
                                                    alt={item.name}
                                                    width={64}
                                                    height={80}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                <p className="font-bold text-white text-sm leading-snug">{item.name}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {item.selectedSize && (
                                                        <span className="px-3 py-1.5 bg-white/15 text-white border border-white/20 text-xs font-black rounded-lg uppercase tracking-wide">
                                                            Size: {item.selectedSize}
                                                        </span>
                                                    )}
                                                    <span className="px-3 py-1.5 bg-white/10 text-white border border-white/10 text-xs font-black rounded-lg">
                                                        Qty: ×{item.quantity}
                                                    </span>
                                                </div>
                                                <div className="flex items-baseline gap-2 mt-2">
                                                    <span className="font-black text-white text-base">{item.finalPrice * item.quantity} DZD</span>
                                                    {item.quantity > 1 && (
                                                        <span className="text-[10px] text-white/30 font-bold">({item.finalPrice} each)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Grand Total */}
                                <div className="bg-primary/10 border border-primary/30 rounded-3xl p-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Grand Total</p>
                                        <p className="text-4xl font-black text-white tracking-tight">{selectedOrder.total} <span className="text-sm font-bold text-white/40">DZD</span></p>
                                    </div>
                                    <div className="p-4 bg-primary/20 rounded-2xl">
                                        <DollarSign className="w-8 h-8 text-primary" />
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                , document.body);
            })()}

            {/* Shipping Modal */}
            {shippingModalOpen && selectedOrder && ReactDOM.createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 dark:text-white rounded-xl w-full max-w-md p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center">
                                <Box className="w-5 h-5 mr-2" />
                                Ship Order {selectedOrder.orderNumber?.toString().startsWith('#') ? selectedOrder.orderNumber : `#${selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}`}
                            </h3>
                            <button onClick={() => setShippingModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleShipOrder} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Carrier</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white dark:bg-slate-700 dark:text-white"
                                    value={shippingForm.carrier}
                                    onChange={(e) => setShippingForm({ ...shippingForm, carrier: e.target.value as Carrier })}
                                >
                                    {CARRIERS.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Method</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShippingForm({ ...shippingForm, deliveryType: 'domicile' })}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border transition-all ${shippingForm.deliveryType === 'domicile' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Home className="w-4 h-4" />
                                        Domicile
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShippingForm({ ...shippingForm, deliveryType: 'office' })}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border transition-all ${shippingForm.deliveryType === 'office' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <Building2 className="w-4 h-4" />
                                        Office
                                    </button>
                                </div>
                                {shippingForm.deliveryType === 'office' && (
                                    <p className="text-[10px] text-orange-600 mt-1 font-medium italic">⚠️ Note: Some communes don't support office pickup.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking Number</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        required
                                        readOnly
                                        type="text"
                                        placeholder="Generated via Sync button"
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none bg-gray-50 cursor-not-allowed w-full"
                                        value={shippingForm.trackingNumber}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoSync}
                                        disabled={isSyncing || !!selectedOrder.trackingNumber}
                                        className={`px-4 py-2 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md w-full sm:w-auto
                                            ${(isSyncing || !!selectedOrder.trackingNumber) ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'}`}
                                        title={selectedOrder.trackingNumber ? "Order already synced" : "Generate/Sync with Carrier"}
                                    >
                                        <Truck className="w-4 h-4" />
                                        <span>Confirm Delivery</span>
                                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-100 dark:border-blue-800/30">
                                    <p className="text-[10px] text-blue-700 dark:text-blue-300 font-bold leading-relaxed">
                                        💡 <span className="uppercase">Note:</span> Click the blue sync button above to automatically create this order in <strong>{shippingForm.carrier.toUpperCase()}</strong>.
                                        This will generate a tracking number and update the order status instantly.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-gray-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setShippingModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!shippingForm.trackingNumber}
                                    className={`px-6 py-2 text-white rounded-lg font-bold transition-all active:scale-95 shadow-md 
                                        ${!shippingForm.trackingNumber
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : selectedOrder.status === 'shipped'
                                                ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                                >
                                    OK
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            , document.body)}
        </div>
    );
};

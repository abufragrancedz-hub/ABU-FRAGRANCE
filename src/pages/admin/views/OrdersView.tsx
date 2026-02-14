import React, { useState, useEffect } from 'react';
import { Trash2, CheckCircle, Clock, Truck, ExternalLink, X, Box, RefreshCw, FileText, FileSpreadsheet, Eye, MapPin, Phone, User, RotateCcw, Home, Building2 } from 'lucide-react';
import { Order, DeliveryType } from '../../../types';
import { CARRIERS, getTrackingUrl, Carrier } from '../../../utils/tracking';
import { exportOrdersToPDF, exportOrdersToExcel } from '../../../utils/export';
import { getDeliveryProvider } from '../../../services/delivery';
import { db } from '../../../lib/firebase';
import {
    collection,
    getDocs,
    query,
    where,
    limit
} from 'firebase/firestore';

interface OrdersViewProps {
    orders: Order[];
    updateOrder: (id: string, updates: Partial<Order>) => void;
    deleteOrder: (id: string) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ orders, updateOrder, deleteOrder }) => {
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [shippingModalOpen, setShippingModalOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
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
            carrier: (order.carrier as Carrier) || 'ecotrack',
            trackingNumber: order.trackingNumber || '',
            deliveryType: order.deliveryType || 'domicile'
        });
        setShippingModalOpen(true);
    };
    const checkOrderStatuses = async () => {
        setIsSyncing(true);
        const shippedOrders = orders.filter(o => o.status === 'shipped' && o.trackingNumber);

        for (const order of shippedOrders) {
            try {
                const provider = getDeliveryProvider(order.carrier || 'ecotrack');
                if (!provider) continue;

                // Fetch credentials from Firestore
                const q = query(collection(db, 'delivery_config'), where('carrier_id', '==', order.carrier), limit(1));
                const snapshot = await getDocs(q);
                const config = snapshot.empty ? null : snapshot.docs[0].data();

                const credentials = config ? { apiId: config.api_id, apiToken: config.api_token } : undefined;
                const newStatus = await provider.getOrderStatus(order.trackingNumber!, credentials);

                if (newStatus !== 'shipped' && newStatus !== 'pending') {
                    await updateOrder(order.id, { status: newStatus as any });
                }
            } catch (err) {
                console.error(`Error checking status for order ${order.id}`, err);
            }
        }
        setIsSyncing(false);
    };

    const handleAutoSync = async () => {
        if (!selectedOrder) return;

        // Prevent accidental duplicate syncing
        if (selectedOrder.trackingNumber || shippingForm.trackingNumber) {
            const proceed = window.confirm("This order already has a tracking number. Syncing again will create a duplicate in the delivery company dashboard. Do you want to proceed?");
            if (!proceed) return;
        }

        setIsSyncing(true);
        try {
            const provider = getDeliveryProvider(shippingForm.carrier);
            if (provider) {
                // Fetch credentials from Firestore
                const q = query(collection(db, 'delivery_config'), where('carrier_id', '==', shippingForm.carrier), limit(1));
                const snapshot = await getDocs(q);
                const config = snapshot.empty ? null : snapshot.docs[0].data();

                const credentials = config ? { apiId: config.api_id, apiToken: config.api_token } : undefined;

                // Use current form settings for the sync
                const orderToSync = { ...selectedOrder, deliveryType: shippingForm.deliveryType };
                const result = await provider.createOrder(orderToSync, credentials);
                setShippingForm(prev => ({ ...prev, trackingNumber: result.trackingNumber }));
                alert("Order Synced Successfully! Tracking Number: " + result.trackingNumber);
            } else {
                alert("Provider not supported for auto-sync yet.");
            }
        } catch (error: any) {
            console.error("Sync error:", error);
            alert(error.message || "Failed to sync with carrier.");
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

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Orders</h2>
                <div className="flex items-center gap-4">
                    {/* Export Buttons */}
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => exportOrdersToPDF(orders)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                            title="Export PDF"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            PDF
                        </button>
                        <button
                            onClick={() => exportOrdersToExcel(orders)}
                            className="flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-100"
                            title="Export Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Excel
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-600 hidden md:block"></div>

                    <button
                        onClick={checkOrderStatuses}
                        disabled={isSyncing}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        title="Refresh Statuses"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Checking...' : 'Check Status'}
                    </button>
                    <span className="text-sm text-gray-500">{orders.length} total</span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-slate-700">
                            <th className="px-6 py-4 font-semibold">Order ID</th>
                            <th className="px-6 py-4 font-semibold">Customer</th>
                            <th className="px-6 py-4 font-semibold">Status</th>
                            <th className="px-6 py-4 font-semibold">Total</th>
                            <th className="px-6 py-4 font-semibold">Shipping</th>
                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                        {orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">#{order.id.slice(0, 8)}</td>
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
                                                    'bg-gray-100 text-gray-800'}`}>
                                        {order.status === 'confirmed' && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                                        {order.status === 'shipped' && <Truck className="w-3 h-3 mr-1" />}
                                        {order.status.toUpperCase()}
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
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right space-x-2 flex justify-end items-center">
                                    <button
                                        onClick={() => openDetailsModal(order)}
                                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                                        title="View Details"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>

                                    {order.status === 'pending' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Are you sure you want to confirm this order?')) {
                                                    updateOrder(order.id, { status: 'confirmed' });
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-emerald-500 hover:bg-secondary rounded-lg transition-all shadow-sm active:scale-95"
                                            title="Confirm Order"
                                        >
                                            <CheckCircle className="w-4 h-4 leading-none" />
                                            <span>Confirm</span>
                                        </button>
                                    )}

                                    {order.status === 'confirmed' && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Revert order to PENDING?')) {
                                                    updateOrder(order.id, { status: 'pending' });
                                                }
                                            }}
                                            className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                                            title="Undo Confirmation (Revert to Pending)"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                        </button>
                                    )}

                                    {(order.status === 'confirmed' || order.status === 'shipped') && (
                                        <button
                                            onClick={() => openShippingModal(order)}
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-sm active:scale-95"
                                            title="Update Shipping"
                                        >
                                            <Truck className="w-4 h-4 leading-none" />
                                            <span>{order.status === 'shipped' ? 'Update' : 'Delivery'}</span>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => deleteOrder(order.id)}
                                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete Order"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Order Details Modal */}
            {detailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 dark:text-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-xl scrollbar-thin">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-slate-700 pb-4">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Box className="w-5 h-5 text-blue-600" />
                                    Order #{selectedOrder.id.slice(0, 8)}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">{new Date(selectedOrder.date).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' })}</p>
                            </div>
                            <button onClick={() => setDetailsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-8">
                            {/* Customer Info */}
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Customer Details</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <User className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.customer.fullName}</p>
                                                <p className="text-sm text-gray-500">Customer</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.customer.phone}</p>
                                                <p className="text-sm text-gray-500">Mobile</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{selectedOrder.customer.address}</p>
                                                <p className="text-sm text-gray-500">{selectedOrder.customer.commune}, {selectedOrder.customer.wilaya}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-gray-400">Delivery Info</h4>
                                    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Type</span>
                                            <span className="font-bold capitalize">{selectedOrder.deliveryType || 'Domicile'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Fee</span>
                                            <span className="font-bold">{selectedOrder.deliveryFee || 0} DZD</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Status</span>
                                            <span className="font-bold capitalize">{selectedOrder.status}</span>
                                        </div>
                                        {selectedOrder.trackingNumber && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Tracking</span>
                                                <span className="font-mono bg-white px-2 rounded border border-gray-200 text-xs py-0.5">{selectedOrder.trackingNumber}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Order Items ({selectedOrder.items.length})</h4>
                                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl overflow-hidden border border-gray-100 dark:border-slate-700">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-100 dark:bg-slate-700">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Product</th>
                                                <th className="px-4 py-3 font-semibold text-center">Size</th>
                                                <th className="px-4 py-3 font-semibold text-center">Qty</th>
                                                <th className="px-4 py-3 font-semibold text-right">Price</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                                            {selectedOrder.items.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-lg bg-white overflow-hidden flex-shrink-0 border border-gray-200">
                                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="font-medium text-slate-900 dark:text-white">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {item.selectedSize ? (
                                                            <span className="bg-white dark:bg-slate-600 px-2 py-1 rounded border border-gray-200 dark:border-slate-500 text-xs font-bold">
                                                                {item.selectedSize}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-bold">x{item.quantity}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="font-bold text-slate-900 dark:text-white">{item.finalPrice * item.quantity} DZD</div>
                                                        {item.quantity > 1 && (
                                                            <div className="text-[10px] text-gray-400 font-medium">{item.finalPrice} / unit</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Total - Large at bottom */}
                            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 uppercase tracking-widest mb-1">Total Amount</p>
                                    <p className="text-3xl font-black text-blue-600">{selectedOrder.total} DZD</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shipping Modal */}
            {shippingModalOpen && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 dark:text-white rounded-xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold flex items-center">
                                <Box className="w-5 h-5 mr-2" />
                                Ship Order #{selectedOrder.id.slice(0, 8)}
                            </h3>
                            <button onClick={() => setShippingModalOpen(false)} className="text-gray-400 hover:text-gray-600">
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
                                <div className="flex gap-2">
                                    <input
                                        required
                                        type="text"
                                        placeholder="Enter tracking code"
                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                                        value={shippingForm.trackingNumber}
                                        onChange={(e) => setShippingForm({ ...shippingForm, trackingNumber: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAutoSync}
                                        disabled={isSyncing}
                                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium flex items-center disabled:opacity-50"
                                        title="Auto-generate/sync with carrier"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Click the sync button to auto-generate tracking from {shippingForm.carrier}.</p>
                            </div>

                            <div className="pt-2 flex justify-end gap-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setShippingModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-200"
                                >
                                    Save & Ship
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

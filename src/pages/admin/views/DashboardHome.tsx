import React, { useEffect, useState } from 'react';
import { ShoppingBag, Package, DollarSign, Clock } from 'lucide-react';
import { Order, Product } from '../../../types';
import { apiFetch } from '../../../lib/apiClient';

interface DashboardHomeProps {
    orders: Order[];
    products: Product[];
}

export const DashboardHome: React.FC<DashboardHomeProps> = () => {
    const [statsData, setStatsData] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await apiFetch('/api/admin/orders/stats');
                setStatsData(res.data);
            } catch (err) {
                console.error('Error fetching stats:', err);
            }
        };
        fetchStats();
    }, []);

    const totalRevenue: number = statsData?.orders?.total_revenue || 0;
    const totalOrders: number = statsData?.orders?.total_orders || 0;
    const pendingOrders: number = statsData?.orders?.pending || 0;
    const confirmedOrders: number = statsData?.orders?.confirmed || 0;
    const shippedOrders: number = statsData?.orders?.shipped || 0;
    const productCount: number = statsData?.productCount || 0;

    const ClockIcon = Clock; // explicit alias to avoid HMR cache issues

    const stats = [
        { label: 'Gross Revenue', value: `${totalRevenue.toLocaleString()} DZD`, Icon: DollarSign, color: 'text-emerald-600', bgColor: 'bg-emerald-50', trend: '+12.5%', critical: false },
        { label: 'Total Orders', value: totalOrders, Icon: ShoppingBag, color: 'text-blue-600', bgColor: 'bg-blue-50', trend: '+5.2%', critical: false },
        { label: 'Pending', value: pendingOrders, Icon: ClockIcon, color: 'text-amber-600', bgColor: 'bg-amber-50', trend: 'Critical', critical: true },
        { label: 'Active Products', value: productCount, Icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-50', trend: 'Stable', critical: false },
    ];

    if (!statsData) {
        return (
            <div className="animate-pulse space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="bg-gray-100 dark:bg-slate-800 h-32 rounded-3xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Performance Overview</h1>
                <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Real-time business analytics</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700/50 hover:shadow-xl hover:shadow-primary/5 transition-all">
                        <div className="flex items-center justify-between mb-3 md:mb-4">
                            <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${stat.bgColor} dark:bg-slate-700 flex items-center justify-center`}>
                                <stat.Icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color} dark:text-white`} />
                            </div>
                            <span className={`text-[9px] md:text-[10px] font-black px-2 py-1 rounded-full ${stat.critical ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                        <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Pipeline Card - full width now */}
                <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                        <h4 className="text-lg md:text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Order Status Pipeline</h4>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                            <span className="w-3 h-3 rounded-full bg-blue-400"></span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 md:gap-12">
                        {[
                            { label: 'Pending', count: pendingOrders, color: 'bg-amber-400', text: 'text-amber-500' },
                            { label: 'Confirmed', count: confirmedOrders, color: 'bg-emerald-400', text: 'text-emerald-500' },
                            { label: 'Shipped', count: shippedOrders, color: 'bg-blue-400', text: 'text-blue-500' },
                        ].map(({ label, count, color, text }) => (
                            <div key={label} className="space-y-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                                <p className={`font-black text-3xl md:text-4xl ${text}`}>{count}</p>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${color} rounded-full transition-all duration-1000`}
                                        style={{ width: `${totalOrders > 0 ? Math.min((count / totalOrders) * 100, 100) : 0}%` }}
                                    />
                                </div>
                                <p className="text-[10px] font-bold text-slate-400">
                                    {totalOrders > 0 ? `${Math.round((count / totalOrders) * 100)}% of total` : '—'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

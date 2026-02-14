import React from 'react';
import { ShoppingBag, Package, DollarSign } from 'lucide-react';
import { Order, Product } from '../../../types';

interface DashboardHomeProps {
    orders: Order[];
    products: Product[];
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ orders, products }) => {
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;

    const stats = [
        { label: 'Total Revenue', value: `${totalRevenue.toLocaleString()} DZD`, icon: DollarSign, color: 'text-secondary', bgColor: 'bg-secondary/10' },
        { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-primary', bgColor: 'bg-primary/10' },
        { label: 'Products', value: products.length, icon: Package, color: 'text-amber-600', bgColor: 'bg-amber-50' },
        { label: 'Pending Orders', value: pendingOrders, icon: ShoppingBag, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-[1.5rem] shadow-sm border border-primary/5 hover:shadow-md transition-all hover:-translate-y-1">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-black text-primary dark:text-white leading-tight">{stat.value}</h3>
                            </div>
                            <div className={`p-4 rounded-2xl ${stat.bgColor} flex items-center justify-center shrink-0`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Optional: Add a recent orders or quick actions section here if needed */}
        </div>
    );
};

import { useState, useRef, FC, FormEvent, ChangeEvent } from 'react';
import { Plus, Edit, Trash2, Search, X, Upload, Percent } from 'lucide-react';
import { Product, ProductSize, QuantityDiscount } from '../../../types';
import { uploadToCloudinary } from '../../../utils/cloudinary';

interface ProductsViewProps {
    products: Product[];
    deleteProduct: (id: string) => void;
    saveProduct: (e: FormEvent, product: Partial<Product>) => Promise<void>;
    isSaving?: boolean;
}

export const ProductsView: FC<ProductsViewProps> = ({ products, deleteProduct, saveProduct, isSaving }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const initialProductState: Partial<Product> = {
        name: '', description: '', price: 0, category: '', image: '', images: [], sizes: [], isPromo: false, oldPrice: 0
    };

    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>(initialProductState);
    const [sizeInput, setSizeInput] = useState({ size: '', price: '' });
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // For editing discounts on a specific size
    const [editingSizeIndex, setEditingSizeIndex] = useState<number | null>(null);
    const [discountInput, setDiscountInput] = useState({ quantity: '', discount: '' });

    const filteredProducts = products.filter((p: Product) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setCurrentProduct(product);
        setIsFormOpen(true);
    };

    const handleSubmit = async (e: FormEvent) => {
        await saveProduct(e, currentProduct);
        setIsFormOpen(false);
        setEditingProduct(null);
        setCurrentProduct(initialProductState);
        setEditingSizeIndex(null);
    };

    const addSize = () => {
        if (sizeInput.size && sizeInput.price) {
            const newSize: ProductSize = {
                size: sizeInput.size,
                price: Number(sizeInput.price),
                discounts: []
            };
            setCurrentProduct(prev => ({
                ...prev,
                sizes: [...(prev.sizes || []), newSize]
            }));
            setSizeInput({ size: '', price: '' });
        }
    };

    const removeSize = (index: number) => {
        setCurrentProduct(prev => ({
            ...prev,
            sizes: prev.sizes?.filter((_, i) => i !== index)
        }));
        if (editingSizeIndex === index) {
            setEditingSizeIndex(null);
        }
    };

    const addDiscountToSize = (sizeIndex: number) => {
        if (discountInput.quantity && discountInput.discount) {
            const newDiscount: QuantityDiscount = {
                quantity: Number(discountInput.quantity),
                discount: Number(discountInput.discount)
            };
            setCurrentProduct(prev => {
                const newSizes = [...(prev.sizes || [])];
                if (newSizes[sizeIndex]) {
                    newSizes[sizeIndex] = {
                        ...newSizes[sizeIndex],
                        discounts: [...(newSizes[sizeIndex].discounts || []), newDiscount].sort((a, b) => a.quantity - b.quantity)
                    };
                }
                return { ...prev, sizes: newSizes };
            });
            setDiscountInput({ quantity: '', discount: '' });
        }
    };

    const removeDiscountFromSize = (sizeIndex: number, discountIndex: number) => {
        setCurrentProduct(prev => {
            const newSizes = [...(prev.sizes || [])];
            if (newSizes[sizeIndex]) {
                newSizes[sizeIndex] = {
                    ...newSizes[sizeIndex],
                    discounts: newSizes[sizeIndex].discounts?.filter((_, i) => i !== discountIndex)
                };
            }
            return { ...prev, sizes: newSizes };
        });
    };

    const addImage = (url: string) => {
        if (url) {
            setCurrentProduct(prev => ({
                ...prev,
                images: [...(prev.images || []), url],
                image: prev.images?.length === 0 ? url : prev.image
            }));
            setImageUrlInput('');
        }
    };

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const imageUrl = await uploadToCloudinary(file);
            addImage(imageUrl);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert(`Error uploading image: ${error.message}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (index: number) => {
        setCurrentProduct(prev => {
            const newImages = prev.images?.filter((_, i) => i !== index) || [];
            return {
                ...prev,
                images: newImages,
                image: newImages.length > 0 ? newImages[0] : ''
            };
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-white dark:bg-slate-800 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => {
                        setEditingProduct(null);
                        setCurrentProduct(initialProductState);
                        setEditingSizeIndex(null);
                        setIsFormOpen(true);
                    }}
                    className="btn-primary flex items-center shrink-0"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Product
                </button>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-slate-700">
                            <img
                                src={product.images?.[0] || product.image}
                                alt={product.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {product.isPromo && (
                                <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    PROMO
                                </div>
                            )}
                            {product.sizes?.some(s => s.discounts && s.discounts.length > 0) && (
                                <div className="absolute top-2 right-2 bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Percent className="w-3 h-3" />
                                    Discounts
                                </div>
                            )}
                            <div className="absolute inset-0 bg-transparent md:bg-black/40 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all flex items-start justify-end md:items-center md:justify-center p-2 md:p-0 gap-2">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="p-2 bg-white text-primary rounded-full hover:bg-primary/5 shadow-md border border-gray-100"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => deleteProduct(product.id)}
                                    className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 shadow-md border border-gray-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <h3 className="font-bold text-slate-900 dark:text-white truncate">{product.name}</h3>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400">{product.category}</span>
                                <div className="text-right">
                                    {(product.oldPrice || 0) > product.price && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 line-through block">{product.oldPrice} DZD</span>
                                    )}
                                    <span className="font-bold text-slate-900 dark:text-white">{product.price || 'N/A'} DZD</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-primary/20 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-6 shadow-2xl border-t-2 sm:border-2 border-primary/10">
                        <div className="flex justify-between items-center mb-5 border-b-2 border-primary/5 pb-4 sticky top-0 bg-white z-10 pt-2">
                            <h2 className="text-xl md:text-2xl font-black text-primary">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
                            <button onClick={() => { setIsFormOpen(false); setEditingSizeIndex(null); }} className="text-primary/60 hover:text-blue-600 transition-colors bg-primary/5 p-2 rounded-full hover:bg-primary/10">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 pb-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-primary mb-1.5">Name</label>
                                    <input
                                        required
                                        className="input-field shadow-sm py-3"
                                        value={currentProduct.name}
                                        onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-1.5">Price (DZD)</label>
                                        <input
                                            required
                                            type="number"
                                            className="input-field shadow-sm py-3"
                                            value={currentProduct.price || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, price: Number(e.target.value) })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-primary mb-1.5">Old Price</label>
                                        <input
                                            type="number"
                                            className="input-field shadow-sm py-3"
                                            placeholder="Optional"
                                            value={currentProduct.oldPrice || ''}
                                            onChange={e => setCurrentProduct({ ...currentProduct, oldPrice: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-primary/5 p-3 rounded-xl border border-primary/10">
                                <input
                                    type="checkbox"
                                    id="isPromo"
                                    className="w-5 h-5 rounded border-blue-300 text-blue-600 focus:ring-primary/50"
                                    checked={currentProduct.isPromo || false}
                                    onChange={e => setCurrentProduct({ ...currentProduct, isPromo: e.target.checked })}
                                />
                                <label htmlFor="isPromo" className="text-sm font-bold text-primary select-none cursor-pointer">
                                    Mark as "PROMO"
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-primary mb-1.5">Description</label>
                                <textarea
                                    className="input-field min-h-[80px] shadow-sm py-3"
                                    value={currentProduct.description}
                                    onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-primary mb-1.5">Category</label>
                                    <input
                                        className="input-field shadow-sm py-3"
                                        value={currentProduct.category}
                                        onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Images Section */}
                            <div className="bg-primary/5/50 p-3 md:p-4 rounded-xl border-2 border-primary/10">
                                <label className="block text-sm font-bold text-primary mb-2">Product Images</label>
                                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                    <div className="flex gap-2 w-full">
                                        <input
                                            placeholder="Image URL"
                                            className="input-field shadow-sm py-2 flex-grow min-w-0"
                                            value={imageUrlInput}
                                            onChange={e => setImageUrlInput(e.target.value)}
                                        />
                                        <button type="button" onClick={() => addImage(imageUrlInput)} className="px-3 bg-blue-200 hover:bg-blue-300 text-primary rounded-xl font-bold transition-colors flex items-center justify-center shrink-0">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="hidden sm:block w-[1px] h-10 bg-blue-200 mx-1"></div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            className="hidden"
                                            accept="image/*"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-full sm:w-auto px-4 py-2 sm:py-0 bg-primary text-white hover:bg-blue-800 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                        >
                                            {isUploading ? <span className="animate-spin">⌛</span> : <Upload className="w-4 h-4" />}
                                            Upload
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 md:gap-3">
                                    {currentProduct.images?.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group">
                                            <img src={img} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-1 right-1 p-1 bg-white text-red-600 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow-sm"
                                            >
                                                <X className="w-3 h-3 md:w-4 md:h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {(!currentProduct.images || currentProduct.images.length === 0) && (
                                        <div className="col-span-full text-center py-6 text-primary/60 text-sm font-medium border-2 border-dashed border-blue-200 rounded-xl bg-white/50">
                                            No images
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Sizes & Quantity Discounts Section */}
                            <div className="bg-primary/5/50 p-3 md:p-4 rounded-xl border-2 border-primary/10">
                                <label className="block text-sm font-bold text-primary mb-2">Sizes & Quantity Discounts</label>
                                <p className="text-xs text-blue-600 mb-3">
                                    Add sizes, then click on a size to add quantity discounts (e.g., buy 2 get 100 DZD off)
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                                    <div className="flex gap-2">
                                        <input
                                            placeholder="Size (e.g., M, L, XL)"
                                            className="input-field shadow-sm py-2 min-w-0"
                                            value={sizeInput.size}
                                            onChange={e => setSizeInput({ ...sizeInput, size: e.target.value })}
                                        />
                                        <input
                                            placeholder="Price"
                                            type="number"
                                            className="input-field shadow-sm py-2 min-w-0"
                                            value={sizeInput.price}
                                            onChange={e => setSizeInput({ ...sizeInput, price: e.target.value })}
                                        />
                                    </div>
                                    <button type="button" onClick={addSize} className="w-full sm:w-auto px-4 py-2 bg-blue-200 hover:bg-blue-300 text-primary rounded-xl font-bold transition-colors">Add Size</button>
                                </div>

                                {/* Size List with Discount Management */}
                                <div className="space-y-3">
                                    {currentProduct.sizes?.map((s, sizeIdx) => (
                                        <div key={sizeIdx} className={`bg-white border-2 rounded-xl overflow-hidden transition-all ${editingSizeIndex === sizeIdx ? 'border-emerald-400 ring-2 ring-secondary/20' : 'border-blue-200'}`}>
                                            {/* Size Header */}
                                            <div
                                                className="p-3 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors"
                                                onClick={() => setEditingSizeIndex(editingSizeIndex === sizeIdx ? null : sizeIdx)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-primary text-lg">{s.size}</span>
                                                    <span className="text-blue-600 font-medium">{s.price} DZD</span>
                                                    {s.discounts && s.discounts.length > 0 && (
                                                        <span className="bg-secondary/20 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                                            {s.discounts.length} discount{s.discounts.length > 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); removeSize(sizeIdx); }}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Discount Editor (expanded) */}
                                            {editingSizeIndex === sizeIdx && (
                                                <div className="border-t-2 border-secondary/20 bg-emerald-50/50 p-3 space-y-3">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
                                                        <Percent className="w-4 h-4" />
                                                        Quantity Discounts for size "{s.size}"
                                                    </div>

                                                    {/* Add discount form */}
                                                    <div className="flex flex-col sm:flex-row gap-2">
                                                        <input
                                                            type="number"
                                                            min="2"
                                                            placeholder="Qty (e.g., 2)"
                                                            className="input-field shadow-sm py-2 text-sm"
                                                            value={discountInput.quantity}
                                                            onChange={e => setDiscountInput({ ...discountInput, quantity: e.target.value })}
                                                        />
                                                        <input
                                                            type="number"
                                                            placeholder="Discount amount"
                                                            className="input-field shadow-sm py-2 text-sm"
                                                            value={discountInput.discount}
                                                            onChange={e => setDiscountInput({ ...discountInput, discount: e.target.value })}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => addDiscountToSize(sizeIdx)}
                                                            className="px-4 py-2 bg-emerald-500 hover:bg-secondary text-white rounded-lg font-bold text-sm transition-colors"
                                                        >
                                                            Add
                                                        </button>
                                                    </div>

                                                    {/* Existing discounts */}
                                                    {s.discounts && s.discounts.length > 0 ? (
                                                        <div className="space-y-2">
                                                            {s.discounts.map((d, dIdx) => {
                                                                const totalWithoutDiscount = s.price * d.quantity;
                                                                const totalWithDiscount = totalWithoutDiscount - d.discount;
                                                                return (
                                                                    <div key={dIdx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-emerald-200">
                                                                        <div className="flex items-center gap-2 text-sm">
                                                                            <span className="font-bold text-emerald-800">{d.quantity}x</span>
                                                                            <span className="text-gray-500 line-through">{totalWithoutDiscount} DZD</span>
                                                                            <span className="font-bold text-secondary">{totalWithDiscount} DZD</span>
                                                                            <span className="text-xs text-emerald-500">(-{d.discount} DZD)</span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeDiscountFromSize(sizeIdx, dIdx)}
                                                                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                                                        >
                                                                            <X className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="text-emerald-500 text-sm italic">No discounts configured</div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {(!currentProduct.sizes || currentProduct.sizes.length === 0) && (
                                        <div className="text-primary/60 text-sm italic py-3 text-center border-2 border-dashed border-blue-200 rounded-xl">
                                            No sizes added yet
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 md:pt-4 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t-2 border-primary/5 sticky bottom-0 bg-white pb-2 sm:pb-0 z-10">
                                <button
                                    type="button"
                                    onClick={() => { setIsFormOpen(false); setEditingSizeIndex(null); }}
                                    className="w-full sm:w-auto px-6 py-3 rounded-xl text-blue-600 hover:bg-primary/5 font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full sm:w-auto btn-primary disabled:opacity-50 px-8 py-3 rounded-xl shadow-xl shadow-blue-600/20"
                                >
                                    {isSaving ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

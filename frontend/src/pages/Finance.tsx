import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet, Loader2, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { useCurrency } from '../context/useCurrency';
import { useFinance, type Transaction } from '../hooks/useFinance';
import { format, parseISO } from 'date-fns';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { FinanceDocumentsList } from '../components/FinanceDocumentsList';

export default function Finance() {
  const { formatMoney } = useCurrency();
  const { summary, transactions, loading, error, addTransaction, deleteTransaction, updateTransaction } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'Income' | 'Expense'>('Income');
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'type'>>({
    category: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const handleOpenModal = (type: 'Income' | 'Expense', transaction?: Transaction) => {
    setTransactionType(type);
    setIsModalOpen(true);
    if (transaction) {
      setEditingId(transaction.id);
      setNewTransaction({
        category: transaction.category,
        amount: transaction.amount,
        date: transaction.date.split('T')[0],
        description: transaction.description || '',
      });
    } else {
      setEditingId(null);
      setNewTransaction({
        category: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        description: '',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await updateTransaction({
          id: editingId,
          ...newTransaction,
          type: transactionType,
        });
      } else {
        await addTransaction({
          ...newTransaction,
          type: transactionType,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = (id: string) => {
    setTransactionToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!transactionToDelete) return;
    try {
      await deleteTransaction(transactionToDelete);
      setDeleteModalOpen(false);
      setTransactionToDelete(null);
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
        Error loading financial data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Financial Pulse</h2>
        <div className="flex gap-2">
            <button 
              onClick={() => handleOpenModal('Income')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Add Income
            </button>
            <button 
              onClick={() => handleOpenModal('Expense')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Plus size={20} /> Add Expense
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400"><ArrowUpRight size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 font-medium">Income (Total)</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(summary.income)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"><ArrowDownRight size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 font-medium">Expenses (Total)</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(summary.expense)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"><Wallet size={20} /></div>
                <h3 className="text-gray-500 dark:text-gray-400 font-medium">Net Profit</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatMoney(summary.net)}</p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Recent Transactions</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No transactions recorded yet.
            </div>
          ) : (
            transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    transaction.type === 'Income' 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                  }`}>
                    {transaction.type === 'Income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{transaction.category}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{format(parseISO(transaction.date), 'MMM d, yyyy')} • {transaction.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-semibold ${
                    transaction.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {transaction.type === 'Income' ? '+' : '-'}{formatMoney(transaction.amount)}
                  </span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleOpenModal(transaction.type, transaction)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(transaction.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Documents Section */}
      <FinanceDocumentsList />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-800">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{editingId ? 'Edit' : 'Add'} {transactionType}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={e => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={newTransaction.category}
                  onChange={e => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder={transactionType === 'Income' ? "e.g., Harvest Sale, Grant" : "e.g., Seeds, Labor, Equipment"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={newTransaction.date}
                  onChange={e => setNewTransaction({ ...newTransaction, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                <textarea
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 outline-none h-24 resize-none"
                  placeholder="Additional details..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
                    transactionType === 'Income' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editingId ? 'Save Changes' : `Add ${transactionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}

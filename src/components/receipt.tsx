import React from 'react';
import { HandCoins } from 'lucide-react';
import { Payment } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

interface ReceiptProps {
  payment: Payment;
}

export const Receipt: React.FC<ReceiptProps> = ({ payment }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white text-black p-8 rounded-lg shadow-lg max-w-2xl mx-auto font-sans">
      <header className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <HandCoins className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-gray-800">Bairooha Foundation</h1>
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold uppercase text-gray-700">Receipt</h2>
          <p className="text-sm text-gray-500">#{payment.id}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-8 my-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Billed To</h3>
          <p className="text-lg font-medium text-gray-800">{payment.donorName}</p>
        </div>
        <div className="text-right">
          <h3 className="text-sm font-semibold text-gray-500 uppercase">Date of Issue</h3>
          <p className="text-lg font-medium text-gray-800">{formatDate(payment.date)}</p>
        </div>
      </section>

      <section>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-sm font-semibold text-gray-600">Donation For</th>
              <th className="p-3 text-right text-sm font-semibold text-gray-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-3">
                <p className="font-medium text-gray-800">{payment.projectName}</p>
                {payment.reason && <p className="text-sm text-gray-500">{payment.reason}</p>}
              </td>
              <td className="p-3 text-right font-medium text-gray-800">₹{payment.amount.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="flex justify-end my-6">
        <div className="w-full max-w-xs">
          <Separator className="my-2 bg-gray-200" />
          <div className="flex justify-between items-center py-2">
            <span className="font-semibold text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-800">₹{payment.amount.toLocaleString()}</span>
          </div>
          <Separator className="my-2 bg-gray-200" />
        </div>
      </section>

      <footer className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">Thank you for your generous donation!</p>
        <p className="text-xs text-gray-400 mt-2">Bairooha Foundation - 123 Giving Lane, Hopeville, USA</p>
      </footer>
    </div>
  );
};

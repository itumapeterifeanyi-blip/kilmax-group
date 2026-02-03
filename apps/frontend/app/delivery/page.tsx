'use client';

import React from 'react';
import { useForm } from 'react-hook-form';

type DeliveryFormData = {
  customer_id: string;
  quantity: number;
  address: string;
  contact_name: string;
  contact_phone: string;
  delivery_window_start: string;
};

export default function Delivery() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<DeliveryFormData>();
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState('');

  const onSubmit = async (data: DeliveryFormData) => {
    setStatus('submitting');
    setMessage('');

    // Mock pricing logic for demo purposes
    const PRICE_PER_CYLINDER = 5000;
    const gross_amount = data.quantity * PRICE_PER_CYLINDER;
    const total_amount = gross_amount; // Add tax/discount logic here if needed

    const payload = {
      ...data,
      quantity: Number(data.quantity),
      gross_amount,
      total_amount,
      currency: 'NGN',
      branch_id: null, // Optional, can be selected if we had branch context
      zone_id: null,   // Optional
    };

    try {
      const response = await fetch('http://localhost:3001/delivery-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(Array.isArray(errorData.message) ? errorData.message.join(', ') : errorData.message || 'Failed to submit request');
      }

      const result = await response.json();
      setStatus('success');
      setMessage(`Request Received! Reference: ${result.external_ref || 'N/A'}. Note: Deliveries are batch-processed and not instant.`);
      reset();
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-3xl font-bold mb-6">Request Gas Delivery</h1>

      {message && (
        <div className={`p-4 mb-4 rounded ${status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Temporary Customer ID field for testing without Auth */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer ID (UUID)</label>
          <input
            {...register('customer_id', { required: 'Customer ID is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
          />
          {errors.customer_id && <p className="text-red-500 text-xs mt-1">{errors.customer_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
          <textarea
            {...register('address', { required: 'Address is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
            rows={3}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity (Cylinders)</label>
          <input
            type="number"
            {...register('quantity', { required: 'Quantity is required', min: { value: 1, message: 'Minimum 1' } })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
          {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Name</label>
          <input
            type="text"
            {...register('contact_name', { required: 'Contact Name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
          {errors.contact_name && <p className="text-red-500 text-xs mt-1">{errors.contact_name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
          <input
            type="tel"
            {...register('contact_phone', { required: 'Contact Phone is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
          {errors.contact_phone && <p className="text-red-500 text-xs mt-1">{errors.contact_phone.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Preferred Delivery Date</label>
          <input
            type="date"
            {...register('delivery_window_start')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {status === 'submitting' ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}

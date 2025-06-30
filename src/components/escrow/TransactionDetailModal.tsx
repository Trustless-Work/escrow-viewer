// components/TransactionDetailModal.tsx
import React, { useEffect, useState } from 'react';
import { fetchTransactionDetails } from '../../lib/transactionFetcher';

interface TransactionDetailModalProps {
  txHash: string;
  onClose: () => void;
}

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ txHash, onClose }) => {
  const [details, setDetails] = useState(null);

  useEffect(() => {
    fetchTransactionDetails(txHash).then(setDetails);
  }, [txHash]);

  if (!details) return <div>Loading...</div>;

  return (
    <div className="modal">
      <button onClick={onClose}>Close</button>
      <pre>{JSON.stringify(details, null, 2)}</pre>
    </div>
  );
};

export default TransactionDetailModal;

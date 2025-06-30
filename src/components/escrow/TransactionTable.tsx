
import React from 'react';

type Transaction = {
  txHash: string;
  ledger: string | number;
  createdAt: string | number | Date;
  status: string;
};

type TransactionTableProps = {
  transactions: Transaction[];
  onRowClick: (txHash: string) => void;
};

const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onRowClick }) => {
  if (!transactions.length) return <p>No recent transactions.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Hash</th>
          <th>Ledger</th>
          <th>Timestamp</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((tx) => (
          <tr key={tx.txHash} onClick={() => onRowClick(tx.txHash)}>
            <td>{tx.txHash.slice(0, 10)}...</td>
            <td>{tx.ledger}</td>
            <td>{new Date(tx.createdAt).toLocaleString()}</td>
            <td>{tx.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TransactionTable;

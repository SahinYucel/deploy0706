import React from 'react';

const CollectionTable = ({ collections, onDelete, safes }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'cash': return 'Nakit';
      case 'card': return 'Kredi Kartı';
      case 'transfer': return 'Havale/EFT';
      default: return method;
    }
  };

  const getSafeName = (safeId) => {
    const safe = safes.find(s => s.id === safeId);
    return safe ? safe.name : '-';
  };

  return (
    <div className="card">
      <div className="card-body">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Şirket</th>
                <th>Tutar</th>
                <th>Kasa</th>
                <th>Ödeme Yöntemi</th>
                <th>Durum</th>
                <th>Açıklama</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((collection) => (
                <tr key={collection.id}>
                  <td>{formatDate(collection.date)}</td>
                  <td>{collection.companyName}</td>
                  <td>{collection.amount} ₺</td>
                  <td>{getSafeName(collection.safeId)}</td>
                  <td>{getPaymentMethodText(collection.paymentMethod)}</td>
                  <td>
                    <span className={`badge bg-${collection.status === 'completed' ? 'success' : 'warning'}`}>
                      {collection.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                    </span>
                  </td>
                  <td>{collection.description || '-'}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(collection.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollectionTable; 
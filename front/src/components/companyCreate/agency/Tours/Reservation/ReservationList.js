import React, { useState } from 'react';

function ReservationList() {
  const [reservations, setReservations] = useState([
    { id: 1, customerName: 'Ahmet Yılmaz', tourName: 'Kapadokya Turu', date: '2023-10-15', personCount: 2, status: 'Onaylandı' },
    { id: 2, customerName: 'Ayşe Demir', tourName: 'İstanbul Şehir Turu', date: '2023-10-18', personCount: 4, status: 'Onaylandı' },
    { id: 3, customerName: 'Mehmet Kaya', tourName: 'Efes Antik Kent Turu', date: '2023-10-20', personCount: 3, status: 'İptal Edildi' },
    { id: 4, customerName: 'Fatma Şahin', tourName: 'Pamukkale Turu', date: '2023-10-25', personCount: 2, status: 'Onaylandı' }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [alert, setAlert] = useState({ show: false, type: '', message: '' });
  
  const handleCancel = (id) => {
    setReservations(reservations.map(res => 
      res.id === id ? {...res, status: 'İptal Edildi'} : res
    ));
    
    setAlert({
      show: true,
      type: 'info',
      message: 'Rezervasyon iptal edildi!'
    });
    
    // Hide alert after 3 seconds
    setTimeout(() => {
      setAlert({ show: false, type: '', message: '' });
    }, 3000);
  };
  
  const filteredReservations = reservations.filter(res => 
    res.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    res.tourName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mt-4">
      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setAlert({ show: false, type: '', message: '' })}
            aria-label="Close"
          ></button>
        </div>
      )}
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Rezervasyonlar</h5>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Müşteri veya tur adı ile ara..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {filteredReservations.length === 0 ? (
            <div className="alert alert-info">
              Rezervasyon bulunamadı.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Müşteri</th>
                    <th>Tur</th>
                    <th>Tarih</th>
                    <th>Kişi Sayısı</th>
                    <th>Durum</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map(reservation => (
                    <tr key={reservation.id}>
                      <td>{reservation.customerName}</td>
                      <td>{reservation.tourName}</td>
                      <td>{reservation.date}</td>
                      <td>{reservation.personCount}</td>
                      <td>
                        <span className={`badge ${reservation.status === 'Onaylandı' ? 'bg-success' : 'bg-danger'}`}>
                          {reservation.status}
                        </span>
                      </td>
                      <td>
                        {reservation.status === 'Onaylandı' && (
                          <button 
                            className="btn btn-warning btn-sm" 
                            onClick={() => handleCancel(reservation.id)}
                          >
                            <i className="bi bi-x-circle me-1"></i> İptal Et
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReservationList; 
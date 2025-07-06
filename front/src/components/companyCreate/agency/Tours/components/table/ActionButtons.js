import React from 'react';
import { useDispatch } from 'react-redux';
import { setPickupTimeListVisibility } from '../../../../../../store/slices/pickupTimeSlice';

const ActionButtons = ({ onEdit, onDelete, onCopy }) => {
  const dispatch = useDispatch();

  const handleEdit = () => {
    // Pickup time listesini göster
    dispatch(setPickupTimeListVisibility(true));
    
    // Edit işlemini çağır
    onEdit();
    
    // Sayfayı yukarı kaydır
    window.scrollTo({
      top: 0,
      behavior: 'smooth' // Yumuşak geçiş için
    });
  };

  return (
    <>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={handleEdit}
        title="Düzenle"
      >
        <i className="bi bi-pencil-square"></i>
      </button>
      <button
        className="btn btn-sm btn-outline-success"
        onClick={onCopy}
        title="Kopyala"
      >
        <i className="bi bi-files"></i>
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={onDelete}
        title="Sil"
      >
        <i className="bi bi-trash"></i>
      </button>
    </>
  );
};

export default ActionButtons; 
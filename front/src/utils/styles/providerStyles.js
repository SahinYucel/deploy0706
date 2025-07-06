export const providerStyles = `
  .status-badge {
    cursor: pointer;
    transition: all 0.2s;
  }
  .status-badge:hover {
    transform: scale(1.05);
  }
  .status-badge.active:hover {
    opacity: 0.9;
  }
  .status-badge.inactive:hover {
    opacity: 0.7;
  }
  .status-badge.disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
  .status-badge.disabled:hover {
    transform: none;
  }

  th {
    white-space: nowrap;
    font-size: 0.9rem;
    position: sticky;
    top: 0;
    background: #f8f9fa;
    z-index: 2;
  }
  td {
    font-size: 0.9rem;
  }
  .table > :not(caption) > * > * {
    padding: 0.5rem;
  }
  td.text-center .text-truncate {
    display: block;
    text-align: center;
  }
  .table td, .table th {
    vertical-align: middle;
  }

  .pax-info {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .total-pax {
    font-weight: bold;
    font-size: 1rem;
    color: #2c3e50;
  }
  .pax-details {
    font-size: 0.8rem;
    color: #666;
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .pax-details .separator {
    color: #999;
    margin: 0 1px;
  }
  .pax-details .adult {
    color: #2980b9;
  }
  .pax-details .child {
    color: #27ae60;
  }
  .pax-details .free {
    color: #e67e22;
  }

  .table td.px-2 {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }

  /* Saat seçici stilleri */
  .form-select-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
  }
  
  .gap-1 {
    gap: 0.25rem !important;
  }
  
  .btn-sm {
    padding: 0.25rem 1rem;
    font-size: 0.875rem;
  }
  
  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }

  /* Scrollable cell styles */
  .scrollable-cell {
    max-height: 60px;
    max-width: 150px;
    overflow-y: auto;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin: 0 auto;
    padding: 5px;
  }

  .scrollable-cell::-webkit-scrollbar {
    width: 6px;
  }

  .scrollable-cell::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  .scrollable-cell::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  .scrollable-cell::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Hover effect to show full content */
  .scrollable-cell:hover {
    position: relative;
    z-index: 1;
    background-color: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
    max-height: 200px;
    transition: all 0.3s ease;
  }

  /* Fixed width for scrollable columns */
  .table td:nth-child(12), /* Rest column */
  .table td:nth-child(13), /* Opsiyon column */
  .table td:nth-child(14) { /* Not column */
    width: 150px;
    max-width: 150px;
    min-width: 150px;
  }

  /* Make sure the table doesn't break layout on small screens */
  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
`; 
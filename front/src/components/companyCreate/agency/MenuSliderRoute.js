import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Lazy load components
const DashboardHome = lazy(() => import('./DashboardHome'));
const Settings = lazy(() => import('./Settings'));
const RoleManagement = lazy(() => import('./RoleManagement'));
const Tours = lazy(() => import('./Tours/Tours'));
const TourAddToList = lazy(() => import('./Tours/TourAddToList'));
const DatabaseBackup = lazy(() => import('./DatabaseBackup'));
const Companies = lazy(() => import('./companies/Companies'));
const Safe = lazy(() => import('./safe/Safe'));
const Collection = lazy(() => import('./safe/Collection/Collection'));
const Reservations = lazy(() => import('./Tours/Reservation/Reservations'));
const Guides = lazy(() => import('./guides/Guides'));
const ReservationSend = lazy(() => import('./Tours/Reservation/ReservationSend'));
const ReservationApprove = lazy(() => import('./Tours/Reservation/ReservationApprove'));
const ReservationList = lazy(() => import('./Tours/Reservation/ReservationList'));
const ReservationTransfer = lazy(() => import('./Tours/Reservation/ReservationTransfer'));
const GuideOperations = lazy(() => import('./operations/GuideOperations'));
const TourOperations = lazy(() => import('./operations/TourOperations'));

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center p-5">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Yükleniyor...</span>
    </div>
  </div>
);

function MenuSliderRoute({ company, subscription, setIsLoggedIn }) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<DashboardHome company={company} subscription={subscription} setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="definitions">
          <Route path="companies" element={<Companies />} />
          <Route path="guides" element={<Guides />} />
          <Route path="tours">
            <Route index element={<Tours />} />
            <Route path="create" element={<Tours />} />
            <Route path="lists" element={<TourAddToList />} />
          </Route>
        </Route>
        <Route path="reservations" element={<Reservations />} />
        <Route path="reservations/list" element={<Reservations />} />
        <Route path="reservations/send" element={<ReservationSend />} />
        <Route path="reservations/approve" element={<ReservationApprove />} />
        <Route path="reservations/transfer" element={<ReservationTransfer />} />
        <Route path="reports" element={<div>Raporlar (Yakında)</div>} />
        <Route path="safe">
          <Route index element={<Safe />} />
          <Route path="collection" element={<Collection />} />
        </Route>
        <Route path="settings" element={<Settings company={company} />} />
        <Route path="role-management" element={<RoleManagement company={company} />} />
        <Route path="database-backup" element={<DatabaseBackup />} />
        <Route path="operations">
          <Route path="guide-operations" element={<GuideOperations />} />
          <Route path="tour-operations" element={<TourOperations />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default MenuSliderRoute; 
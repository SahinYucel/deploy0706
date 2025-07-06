import { configureStore } from '@reduxjs/toolkit';
import pickupTimeReducer from './slices/pickupTimeSlice';

export const store = configureStore({
  reducer: {
    pickupTime: pickupTimeReducer,
  },
});

export default store; 
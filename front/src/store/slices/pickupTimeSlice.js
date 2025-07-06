import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  showList: true,
};

const pickupTimeSlice = createSlice({
  name: 'pickupTime',
  initialState,
  reducers: {
    togglePickupTimeList: (state) => {
      state.showList = !state.showList;
    },
    setPickupTimeListVisibility: (state, action) => {
      state.showList = action.payload;
    },
  },
});

export const { togglePickupTimeList, setPickupTimeListVisibility } = pickupTimeSlice.actions;

export const selectPickupTimeListVisibility = (state) => state.pickupTime.showList;

export default pickupTimeSlice.reducer; 
export const INITIAL_TOUR_STATE = {
  tourName: '',
  main_tour_name: '',
  operator: '',
  adultPrice: '',
  childPrice: '',
  guideAdultPrice: '', // Yeni eklenen
  guideChildPrice: '', // Yeni eklenen
  selectedDays: [],
  description: '',  // Yeni açıklama alanı
  pickupTimes: [{
    hour: '',
    minute: '',
    region: '',
    area: '',
    periodActive: false,
    period: ''
  }],
  options: [],
  isActive: true,
  currency: 'EUR' // TRY'den EUR'ya değiştirildi
};

export const DAYS = [
  { id: 1, name: 'Pazartesi' },
  { id: 2, name: 'Salı' },
  { id: 3, name: 'Çarşamba' },
  { id: 4, name: 'Perşembe' },
  { id: 5, name: 'Cuma' },
  { id: 6, name: 'Cumartesi' },
  { id: 7, name: 'Pazar' }
]; 